'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { usePractice } from '@/context/PracticeContext';
import { useTheme } from '@/context/ThemeContext';
import { saveGuestResults } from '@/lib/local-analytics';
import { submitPracticeResults, getPracticeQuestions } from '@/lib/api';
import { enqueueResults, syncPendingResults, pendingCount } from '@/lib/offline-queue';
import KanjiDetailModal from '@/components/kanji/KanjiDetailModal';
import KotobaDetailModal from '@/components/kotoba/KotobaDetailModal';
import BunpoDetailModal from '@/components/bunpo/BunpoDetailModal';
import { hasKanji } from '@/lib/utils';
import * as wanakana from 'wanakana';
import { toast } from 'react-toastify';
import { Volume2 } from 'lucide-react';

/**
 * Sanitizes reading text to ensure it's Japanese Kana.
 * Fixes common issues like Romaji or accidental Korean characters from OCR/input errors.
 */
const sanitizeReading = (text) => {
    if (!text) return '';
    // 1. Convert Romaji to Hiragana (Wanakana handles this well)
    let clean = wanakana.toHiragana(text);

    // 2. Special fix for the common '가' (Korean) vs 'が' (Japanese) issue
    clean = clean.replace(/가/g, 'が');

    return clean;
};

function PracticeContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { setIsPracticing } = usePractice();
    const { user } = useAuth();
    const { theme, mounted } = useTheme();
    const isLoggingOut = useRef(false);

    // Get config from URL
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')) : 10;
    const level = searchParams.get('level') || null;
    const type = searchParams.get('type') || 'kanji';
    const mode = searchParams.get('mode') || 'choice';
    const initialTimer = searchParams.get('timer') ? parseInt(searchParams.get('timer')) * 60 : null;
    const [timeLeft, setTimeLeft] = useState(initialTimer);

    const [questions, setQuestions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState(null);
    const [typedAnswer, setTypedAnswer] = useState('');
    const [isAnswered, setIsAnswered] = useState(false);
    const [score, setScore] = useState(0);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [results, setResults] = useState([]);
    const [finished, setFinished] = useState(false);
    const [error, setError] = useState(null);
    const [detailView, setDetailView] = useState(null);
    const [showReadingManual, setShowReadingManual] = useState(false);
    const [audioPlaying, setAudioPlaying] = useState(false);
    const audioPlayingRef = useRef(false);
    const lastAutoplayedIndex = useRef(-1);

    const [pendingSyncs, setPendingSyncs] = useState(0);

    const setAudioPlayingState = (val) => {
        audioPlayingRef.current = val;
        setAudioPlaying(val);
    };

    const playLocalSpeech = (currentQ) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();

            let textToSpeak = '';
            if (currentQ.type === 'kana') {
                textToSpeak = currentQ.character;
            } else {
                let cleanWord = (currentQ.character || '').split(' ')[0].split('(')[0].split('（')[0];
                textToSpeak = currentQ.reading || cleanWord;
            }

            const utterance = new SpeechSynthesisUtterance(textToSpeak);
            utterance.lang = 'ja-JP';
            utterance.rate = 0.75;
            utterance.onend = () => setAudioPlayingState(false);
            utterance.onerror = () => setAudioPlayingState(false);
            window.speechSynthesis.speak(utterance);
        } else {
            setAudioPlayingState(false);
        }
    };

    const playQuestionAudio = useCallback((currentQ) => {
        if (!currentQ || audioPlayingRef.current) return;
        setAudioPlayingState(true);

        const isKana = currentQ.type === 'kana';
        const vocabId = currentQ.id;

        if (!isKana && vocabId && !vocabId.startsWith('kana-')) {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const audioUrl = `${baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl}/api/content/vocab/${vocabId}/audio`;

            const audio = new Audio(audioUrl);
            audio.onended = () => setAudioPlayingState(false);
            audio.onerror = () => {
                playLocalSpeech(currentQ);
            };
            audio.play().catch(() => {
                playLocalSpeech(currentQ);
            });
        } else {
            playLocalSpeech(currentQ);
        }
    }, []);

    // Autoplay audio on question change in Kakitori mode
    useEffect(() => {
        if (mode === 'kakitori' && questions.length > 0 && !finished && !loading) {
            if (lastAutoplayedIndex.current === currentIndex) return;
            lastAutoplayedIndex.current = currentIndex;

            const timer = setTimeout(() => {
                if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                setAudioPlayingState(false);
                playQuestionAudio(questions[currentIndex]);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [currentIndex, questions, loading, finished, mode, playQuestionAudio]);

    // Sync offline queue when back online
    useEffect(() => {
        const handleOnline = async () => {
            if (!user) return;
            const count = await syncPendingResults(submitPracticeResults);
            if (count > 0) {
                setPendingSyncs(0);
                console.log(`[offline-queue] Synced ${count} pending result batch(es).`);
            }
        };
        window.addEventListener('online', handleOnline);
        if (navigator.onLine && user) handleOnline();
        return () => window.removeEventListener('online', handleOnline);
    }, [user]);

    // Show pending count badge
    useEffect(() => {
        setPendingSyncs(pendingCount());
    }, []);

    const handleFinish = useCallback(async (finalResultsOverride) => {
        if (submitting || finished) return;

        setSubmitting(true);
        setError(null);
        const resultsToSubmit = finalResultsOverride || results;

        try {
            if (user) {
                if (!navigator.onLine) {
                    enqueueResults(resultsToSubmit);
                    setPendingSyncs(pendingCount());
                    console.log('[offline-queue] Results queued for later sync.');
                } else {
                    try {
                        await submitPracticeResults(resultsToSubmit);
                    } catch (submitErr) {
                        enqueueResults(resultsToSubmit);
                        setPendingSyncs(pendingCount());
                        console.warn('[offline-queue] Submit failed, queued:', submitErr.message);
                    }
                }
            } else {
                saveGuestResults(resultsToSubmit);
            }

            setFinished(true);
            sessionStorage.removeItem('guest_practice_session');
            toast.success('Latihan selesai! Hasil telah disimpan.', {
                theme: theme === 'dark' ? 'dark' : 'colored'
            });
        } catch (error) {
            console.error('Failed to finish session:', error);
            setError(`Gagal menyimpan hasil latihan: ${error.message}`);
        } finally {
            setSubmitting(false);
        }
    }, [results, submitting, finished, user, theme]);

    // Timer logic
    useEffect(() => {
        if (initialTimer === null || finished || loading) return;

        if (timeLeft <= 0) {
            handleFinish();
            return;
        }

        const timerId = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(timerId);
    }, [timeLeft, initialTimer, finished, loading, handleFinish]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Load questions or restore session
    useEffect(() => {
        async function loadQuestions() {
            try {
                const data = await getPracticeQuestions({ limit, level, type });
                setQuestions(data);
            } catch (error) {
                console.error('Failed to load questions:', error);
                setError(`Gagal memuat pertanyaan: ${error.message}`);
            } finally {
                setLoading(false);
            }
        }

        localStorage.removeItem('guest_practice_session');

        const cacheVersion = 'v1.2';
        if (sessionStorage.getItem('practice_cache_version') !== cacheVersion) {
            sessionStorage.removeItem('guest_practice_session');
            sessionStorage.setItem('practice_cache_version', cacheVersion);
        }

        const savedSession = sessionStorage.getItem('guest_practice_session');
        if (savedSession) {
            try {
                const session = JSON.parse(savedSession);
                const now = Date.now();
                if (now - session.timestamp < 3600 * 1000 && !session.finished) {
                    setQuestions(session.questions);
                    setCurrentIndex(session.currentIndex);
                    setScore(session.score);
                    setResults(session.results);
                    if (session.timeLeft !== null) setTimeLeft(session.timeLeft);
                    setLoading(false);
                    return;
                } else {
                    sessionStorage.removeItem('guest_practice_session');
                }
            } catch (e) {
                console.error("Failed to parse saved session", e);
                sessionStorage.removeItem('guest_practice_session');
            }
        }

        loadQuestions();
    }, [limit, level, type]);

    // Save session state
    useEffect(() => {
        if (!loading && questions.length > 0 && !finished && !isLoggingOut.current) {
            const session = {
                questions,
                currentIndex,
                score,
                results,
                timeLeft,
                timestamp: Date.now(),
                finished: false
            };
            sessionStorage.setItem('guest_practice_session', JSON.stringify(session));
        }
    }, [questions, currentIndex, score, results, timeLeft, loading, finished]);

    // Set practice state on mount
    useEffect(() => {
        setIsPracticing(true);
        return () => setIsPracticing(false);
    }, [setIsPracticing]);

    // Listen for logout event
    useEffect(() => {
        const handleLogout = () => {
            isLoggingOut.current = true;
        };
        window.addEventListener('auth:logout', handleLogout);
        return () => window.removeEventListener('auth:logout', handleLogout);
    }, []);

    useEffect(() => {
        // Navigation guard handled by Navbar's ConfirmationModal
    }, [finished]);

    const nextTimeoutRef = useRef(null);

    const handleTypedAnswerChange = (val) => {
        const kanaVal = wanakana.toKana(val);
        setTypedAnswer(kanaVal);
    };

    const submitTypedAnswer = () => {
        if (isAnswered || !typedAnswer.trim()) return;

        setIsAnswered(true);

        const currentQ = questions[currentIndex];
        const userAns = typedAnswer.trim().toLowerCase();

        let correctAnswers = [];
        if (currentQ.type === 'kana') {
            correctAnswers = [
                currentQ.character.trim().toLowerCase(),
                currentQ.reading ? currentQ.reading.trim().toLowerCase() : ''
            ].filter(Boolean);
        } else {
            const baseReading = currentQ.reading ? currentQ.reading.trim().toLowerCase() : '';
            const rawCharacter = currentQ.character ? currentQ.character.trim().toLowerCase() : '';

            correctAnswers = [
                baseReading,
                wanakana.toHiragana(baseReading),
                wanakana.toKatakana(baseReading),
                rawCharacter,
                wanakana.toHiragana(rawCharacter),
                wanakana.toKatakana(rawCharacter)
            ].filter(Boolean);
        }

        const uniqueCorrectAnswers = Array.from(new Set(correctAnswers));
        const isCorrect = uniqueCorrectAnswers.some(ans => {
            return ans === userAns || wanakana.toHiragana(ans) === wanakana.toHiragana(userAns);
        });

        if (isCorrect) {
            setScore(score + 1);
        }

        // ── Attempt object: menyertakan 'mode' untuk pemisahan statistik ──
        const attempt = {
            question_id: currentQ.id || currentQ.kanji_id,
            type: currentQ.type === 'bunpo' ? 'grammar' : (currentQ.type || 'kanji'),
            character: currentQ.character || currentQ.word || currentQ.title,
            is_correct: isCorrect,
            answer_given: typedAnswer.trim(),
            correct_meaning: currentQ.meaning,
            correct_answer: currentQ.type === 'kana'
                ? `${currentQ.character} (${currentQ.reading})`
                : (currentQ.reading ? sanitizeReading(currentQ.reading) : currentQ.character),
            level: currentQ.level,
            mode: mode  // 'kakitori' atau 'choice'
        };

        const newResults = [...results, attempt];
        setResults(newResults);

        const delay = 2500;
        nextTimeoutRef.current = setTimeout(() => {
            if (currentIndex < questions.length - 1) {
                setCurrentIndex(prev => prev + 1);
                setSelectedOption(null);
                setTypedAnswer('');
                setIsAnswered(false);
                setShowReadingManual(false);
            } else {
                handleFinish(newResults);
            }
        }, delay);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            submitTypedAnswer();
        }
    };

    const handleNext = () => {
        if (nextTimeoutRef.current) {
            clearTimeout(nextTimeoutRef.current);
            nextTimeoutRef.current = null;
        }

        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setSelectedOption(null);
            setTypedAnswer('');
            setIsAnswered(false);
            setShowReadingManual(false);
        } else {
            handleFinish();
        }
    };

    const handleOptionSelect = (option) => {
        if (isAnswered) return;

        setSelectedOption(option);
        setIsAnswered(true);

        const isCorrect = option.is_correct;
        if (isCorrect) {
            setScore(score + 1);
        }

        const currentQ = questions[currentIndex];

        // ── Attempt object: menyertakan 'mode' untuk pemisahan statistik ──
        const attempt = {
            question_id: currentQ.id || currentQ.kanji_id,
            type: currentQ.type === 'bunpo' ? 'grammar' : (currentQ.type || 'kanji'),
            character: currentQ.character || currentQ.word || currentQ.title,
            is_correct: isCorrect,
            answer_given: option.text,
            correct_meaning: currentQ.meaning,
            correct_answer: currentQ.options.find(o => o.is_correct)?.text,
            level: currentQ.level,
            mode: mode  // 'kakitori' atau 'choice'
        };

        const newResults = [...results, attempt];
        setResults(newResults);

        const delay = 2500;
        nextTimeoutRef.current = setTimeout(() => {
            if (currentIndex < questions.length - 1) {
                setCurrentIndex(prev => prev + 1);
                setSelectedOption(null);
                setIsAnswered(false);
                setShowReadingManual(false);
            } else {
                handleFinish(newResults);
            }
        }, delay);
    };

    const textColor = !mounted ? 'text-black' : (theme === 'dark' ? 'text-white' : 'text-black');
    const subTextColor = !mounted ? 'text-gray-400' : (theme === 'dark' ? 'text-gray-500' : 'text-gray-400');
    const cardBg = !mounted ? 'bg-white' : (theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-white');
    const inputBg = !mounted ? 'bg-gray-50' : (theme === 'dark' ? 'bg-black/40' : 'bg-gray-50');
    const borderStyle = !mounted ? 'border-gray-100' : (theme === 'dark' ? 'border-red-950/30' : 'border-gray-100');

    if (error && !finished) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
                <div className="text-6xl mb-4">⚠️</div>
                <h3 className={`text-2xl font-bold mb-2 transition-colors ${textColor}`}>Terjadi Kesalahan</h3>
                <p className={`mb-6 max-w-md transition-colors ${subTextColor}`}>{error}</p>
                <div className="flex gap-4">
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-red-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-500/20"
                    >
                        Coba Lagi
                    </button>
                    <button
                        onClick={() => router.push('/practice')}
                        className={`font-bold hover:underline transition-colors ${subTextColor}`}
                    >
                        Kembali
                    </button>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-red-600 mb-6"></div>
                <div className={`text-xl font-black uppercase tracking-[0.2em] animate-pulse transition-colors ${subTextColor}`}>Memuat pertanyaan...</div>
            </div>
        );
    }

    if (finished) {
        return (
            <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[60vh] relative z-10">
                <div className={`${theme === 'dark' ? 'bg-[#0a0a0a]/80' : 'bg-white/80'} backdrop-blur-2xl rounded-[3rem] shadow-[0_8px_40px_rgb(0,0,0,0.12)] p-4 md:p-8 max-w-md w-full text-center border ${theme === 'dark' ? 'border-white/5' : 'border-white/60'} relative overflow-hidden transition-colors`}>
                    <div className="absolute top-0 inset-x-0 h-2 bg-red-600"></div>

                    <div className="mb-6">
                        <div className="text-6xl mb-2">🎉</div>
                        <h2 className={`text-3xl font-black mb-1 transition-colors ${textColor}`}>Latihan Selesai!</h2>
                        <p className={`text-sm transition-colors ${subTextColor}`}>Kerja bagus hari ini!</p>
                        {mode === 'kakitori' && (
                            <div className={`mt-3 text-xs px-3 py-2 rounded-lg font-bold ${theme === 'dark' ? 'bg-purple-950/30 border border-purple-900/40 text-purple-400' : 'bg-purple-50 border border-purple-100 text-purple-700'}`}>
                                🎧 Sesi Kakitori telah dicatat ke statistik dikte kamu.
                            </div>
                        )}
                        {pendingSyncs > 0 && (
                            <div className="mt-3 bg-brand/10 border border-brand/20 text-brand text-xs px-3 py-2 rounded-lg font-bold">
                                ⏳ {pendingSyncs} sesi latihan menunggu sinkronisasi ke server.
                            </div>
                        )}
                    </div>

                    <div className={`${theme === 'dark' ? 'bg-red-950/20 border-red-900/40' : 'bg-red-50 border-red-100'} rounded-2xl p-6 mb-6 border`}>
                        <div className="text-[10px] text-red-600 dark:text-red-400 font-black uppercase tracking-widest mb-2">Skor Akhir</div>
                        <div className="text-7xl font-black text-red-600 dark:text-red-500 leading-none mb-2">
                            {score}<span className="text-3xl text-red-300 dark:text-red-800">/{questions.length}</span>
                        </div>
                    </div>

                    <div className="mb-8 text-left">
                        <h3 className={`text-lg font-black mb-4 flex items-center gap-2 transition-colors ${textColor}`}>
                            <span>📋</span> Ringkasan Jawaban
                        </h3>
                        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                            {results.map((res, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => setDetailView({ id: res.question_id, type: res.type })}
                                    className={`p-4 rounded-xl border cursor-pointer hover:scale-[1.01] transition-all transform group border-2 ${res.is_correct ? (theme === 'dark' ? 'bg-green-950/20 border-green-900/40' : 'bg-green-50 border-green-100') : (theme === 'dark' ? 'bg-red-950/20 border-red-900/40' : 'bg-red-50 border-red-100')} transition-all break-words whitespace-normal`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-3">
                                            <span className={`text-2xl font-black ${textColor}`}>{res.character}</span>
                                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase ${res.is_correct ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                                                {res.is_correct ? 'Benar' : 'Salah'}
                                            </span>
                                        </div>
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${subTextColor}`}>{res.type}</span>
                                    </div>
                                    <div className="text-sm space-y-1">
                                        <div className={`transition-colors ${textColor}`}>
                                            Jawaban: <span className={`font-black ${res.is_correct ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{res.answer_given}</span>
                                        </div>
                                        {!res.is_correct && (
                                            <div className={`transition-colors ${textColor}`}>
                                                Benar: <span className="font-black text-green-600 dark:text-green-400">{res.correct_answer}</span>
                                            </div>
                                        )}
                                        <div className={`italic text-xs pt-1 border-t border-dashed transition-colors ${theme === 'dark' ? 'border-gray-800 text-gray-500' : 'border-gray-200 text-gray-400'}`}>
                                            Arti: {res.correct_meaning}
                                        </div>
                                        <div className="mt-3 pt-2 border-t border-dashed border-gray-200 dark:border-gray-800">
                                            <span className="text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                                Pelajari Materi <span className="text-sm">→</span>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={() => router.push(user ? '/dashboard' : '/practice')}
                        className="w-full bg-gray-900 hover:bg-black text-white px-6 py-4 rounded-xl font-bold transition-all transform hover:scale-[1.02] shadow-xl"
                    >
                        Kembali ke {user ? 'Dashboard' : 'Halaman Latihan'}
                    </button>
                </div>

                {/* Detail View Overlay */}
                {detailView && (
                    <div className="fixed inset-0 z-[110] animate-in fade-in zoom-in duration-300">
                        {detailView.type === 'kanji' && (
                            <KanjiDetailModal
                                id={detailView.id}
                                onClose={() => setDetailView(null)}
                            />
                        )}
                        {(detailView.type === 'vocab' || detailView.type === 'kotoba') && (
                            <KotobaDetailModal
                                id={detailView.id}
                                onClose={() => setDetailView(null)}
                            />
                        )}
                        {detailView.type === 'grammar' && (
                            <BunpoDetailModal
                                id={detailView.id}
                                onClose={() => setDetailView(null)}
                            />
                        )}
                    </div>
                )}
            </div>
        );
    }

    if (questions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
                <div className="text-6xl mb-4 grayscale opacity-30">📭</div>
                <h3 className={`text-2xl font-black mb-2 transition-colors ${textColor}`}>Tidak ada soal ditemukan</h3>
                <p className={`mb-6 transition-colors ${subTextColor}`}>Coba ubah filter level atau materi latihan.</p>
                <button
                    onClick={() => router.push('/practice')}
                    className="text-red-600 font-bold hover:underline"
                >
                    &larr; Kembali
                </button>
            </div>
        );
    }

    const currentQuestion = questions[currentIndex];
    const progressPercent = ((currentIndex + 1) / questions.length) * 100;

    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl min-h-screen flex flex-col">
            {/* Header / Progress */}
            <div className="mb-8">
                <div className="flex justify-between items-end mb-2">
                    <span className={`text-xs font-black uppercase tracking-widest transition-colors ${subTextColor}`}>Progress Latihan</span>
                    <div className="flex items-center gap-3">
                        {initialTimer !== null && (
                            <span className={`font-mono font-black text-lg flex items-center gap-2 ${timeLeft < 30 ? 'text-red-600 animate-pulse' : textColor}`}>
                                <span>⏱️</span> {formatTime(timeLeft)}
                            </span>
                        )}
                        <span className="bg-red-600 text-white px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-tighter">
                            {currentIndex + 1} / {questions.length}
                        </span>
                    </div>
                </div>
                <div className={`h-3 rounded-full overflow-hidden transition-colors shadow-inner ${theme === 'dark' ? 'bg-black/40 border border-white/5' : 'bg-gray-100 border border-gray-200'}`}>
                    <div
                        className="h-full bg-gradient-to-r from-red-600 to-rose-500 transition-all duration-500 ease-out relative"
                        style={{ width: `${progressPercent}%` }}
                    >
                        <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                    </div>
                </div>
            </div>

            {/* Question Card */}
            <div className={`${theme === 'dark' ? 'bg-[#0a0a0a]/70' : 'bg-white/70'} backdrop-blur-2xl rounded-[3rem] shadow-[0_8px_30px_rgb(0,0,0,0.08)] p-4 md:p-8 mb-8 text-center border ${theme === 'dark' ? 'border-white/5' : 'border-white/60'} relative flex-grow flex flex-col justify-center transition-all`}>
                {mode === 'kakitori' ? (
                    <div className="mb-8 relative p-4 flex flex-col items-center group transition-all duration-300">
                        <span className={`text-[10px] font-black uppercase tracking-[0.2em] mb-4 block transition-colors ${subTextColor}`}>
                            Kakitori (Latihan Dikte) • N{currentQuestion.level || '5'}
                        </span>

                        <div className="flex flex-col items-center justify-center p-6 bg-red-500/5 rounded-3xl border border-dashed border-red-500/20 max-w-sm mx-auto mb-4 w-full">
                            <button
                                onClick={() => playQuestionAudio(currentQuestion)}
                                className={`p-6 rounded-[2rem] transition-all duration-300 ${
                                    audioPlaying
                                        ? 'bg-red-600 text-white animate-pulse shadow-lg shadow-red-500/30'
                                        : 'bg-[var(--card-bg)] border-2 border-red-500 text-red-500 hover:bg-red-50 hover:text-white shadow-md active:scale-95'
                                } cursor-pointer`}
                                title="Putar Ulang Audio"
                            >
                                <Volume2 className="w-12 h-12" />
                            </button>
                            <span className={`text-xs font-black uppercase tracking-wider mt-4 ${textColor}`}>
                                {audioPlaying ? 'Sedang Memutar Suara...' : 'Klik untuk Putar Ulang'}
                            </span>
                            {currentQuestion.meaning && (
                                <div className={`mt-4 text-xs font-bold ${theme === 'dark' ? 'text-gray-400 bg-red-950/20' : 'text-gray-500 bg-red-50'} px-4 py-2 rounded-xl`}>
                                    Petunjuk Arti: <span className={`font-black ${textColor}`}>{currentQuestion.meaning}</span>
                                </div>
                            )}
                        </div>

                        {isAnswered && (
                            <div className="mt-6 animate-fade-in-up">
                                <div className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-1">Jawaban Yang Benar</div>
                                <div className={`text-4xl font-japanese font-black ${textColor}`}>{currentQuestion.character}</div>
                                {currentQuestion.reading && (
                                    <div className="text-xl text-brand font-black mt-1">{sanitizeReading(currentQuestion.reading)}</div>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <div
                        onClick={() => !isAnswered && setShowReadingManual(!showReadingManual)}
                        className={`mb-8 relative p-4 flex flex-col items-center group transition-all duration-300 ${!isAnswered ? 'cursor-pointer hover:bg-red-500/5 rounded-3xl' : ''}`}
                    >
                        <span className={`text-[10px] font-black uppercase tracking-[0.2em] mb-4 block transition-colors ${subTextColor}`}>
                            {currentQuestion.type === 'kanji' ? 'Kanji' : currentQuestion.type === 'vocab' ? 'Kosakata' : currentQuestion.type === 'kana' ? 'Kana' : 'Tata Bahasa'}
                        </span>
                        <div className={`${
                            (currentQuestion.character?.length || 0) > 50 ? 'text-sm md:text-lg' :
                            (currentQuestion.character?.length || 0) > 20 ? 'text-base md:text-xl' :
                            (currentQuestion.character?.length || 0) > 10 ? 'text-lg md:text-2xl' :
                            (currentQuestion.character?.length || 0) > 5 ? 'text-xl md:text-3xl' :
                            currentQuestion.type === 'grammar' || currentQuestion.type === 'particle' ? 'text-2xl md:text-4xl' :
                            'text-4xl md:text-[6rem]'
                        } leading-tight font-black select-none pb-2 break-words transition-colors ${textColor}`}>
                            <ruby className="transition-colors">
                                {currentQuestion.character}
                                {(currentQuestion.type === 'kanji' || currentQuestion.type === 'vocab') &&
                                 currentQuestion.reading &&
                                 hasKanji(currentQuestion.character) && (
                                    <rt className={`text-sm md:text-xl font-bold transition-all duration-300 ${isAnswered || showReadingManual ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 group-hover:opacity-100 group-hover:translate-y-0'} ${theme === 'dark' ? 'text-red-500' : 'text-red-600'}`}>
                                        {sanitizeReading(currentQuestion.reading)}
                                    </rt>
                                 )}
                            </ruby>
                        </div>
                        {!isAnswered && (currentQuestion.type === 'kanji' || currentQuestion.type === 'vocab') &&
                         currentQuestion.reading && hasKanji(currentQuestion.character) && (
                            <div className={`text-[9px] mt-4 font-black uppercase tracking-[0.2em] transition-all duration-500 ${showReadingManual ? 'opacity-0' : 'opacity-40 animate-pulse'}`}>
                                {showReadingManual ? '' : 'Klik untuk bantuan bacaan'}
                            </div>
                        )}
                    </div>
                )}

                {/* Answer Input or Options */}
                {mode === 'kakitori' ? (
                    <div className="w-full max-w-md mx-auto">
                        {!isAnswered ? (
                            <div className="space-y-4">
                                <input
                                    type="text"
                                    value={typedAnswer}
                                    onChange={(e) => handleTypedAnswerChange(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Ketik Hiragana / Katakana..."
                                    disabled={isAnswered}
                                    autoFocus
                                    className={`w-full text-center py-4 px-6 text-xl font-bold border-2 ${borderStyle} rounded-2xl outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/20 transition-all ${inputBg} ${textColor}`}
                                />
                                <button
                                    onClick={submitTypedAnswer}
                                    disabled={isAnswered || !typedAnswer.trim()}
                                    className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black py-4 rounded-2xl text-lg shadow-lg shadow-red-500/20 hover:shadow-xl active:scale-98 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    Kirim Jawaban (Enter)
                                </button>
                            </div>
                        ) : (
                            <div className={`w-full max-w-md mx-auto p-6 rounded-3xl border-2 border-dashed ${results[currentIndex]?.is_correct ? (theme === 'dark' ? 'bg-green-950/20 border-green-900/40 text-green-400' : 'bg-green-50 border-green-200 text-green-800') : (theme === 'dark' ? 'bg-red-950/20 border-red-900/40 text-red-400' : 'bg-red-50 border-red-200 text-red-800')} flex flex-col items-center justify-center transition-all animate-fade-in-up`}>
                                {results[currentIndex]?.is_correct ? (
                                    <div className="text-center">
                                        <span className="text-5xl block mb-2">🎉</span>
                                        <span className="text-lg font-black uppercase tracking-wider">Benar!</span>
                                        <p className={`text-sm mt-1 font-bold ${textColor}`}>Ketikan Anda: <span className="font-black text-green-600 dark:text-green-400">{results[currentIndex]?.answer_given}</span></p>
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <span className="text-5xl block mb-2">😢</span>
                                        <span className="text-lg font-black uppercase tracking-wider">Kurang Tepat</span>
                                        <p className={`text-sm mt-1 font-bold ${textColor}`}>Ketikan Anda: <span className="font-black text-red-600 dark:text-red-400">{results[currentIndex]?.answer_given || '(kosong)'}</span></p>
                                        <p className={`text-xs mt-2 ${subTextColor}`}>Jawaban benar: <span className="font-black text-green-600 dark:text-green-400">{results[currentIndex]?.correct_answer}</span></p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        {isAnswered && (currentQuestion.reading || currentQuestion.meaning) && (
                            <div className="mb-6 animate-fade-in-up">
                                {currentQuestion.reading && hasKanji(currentQuestion.character) && (
                                    <div className="text-2xl text-brand font-serif font-black mb-1 break-words">{sanitizeReading(currentQuestion.reading)}</div>
                                )}
                                {currentQuestion.meaning && (
                                    <div className={`text-lg font-black italic transition-colors ${textColor}`}>{currentQuestion.meaning}</div>
                                )}
                            </div>
                        )}

                        <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
                            {currentQuestion.options.map((option, idx) => {
                                let btnClass = "p-4 text-base md:text-lg font-black border-2 rounded-2xl transition-all duration-300 relative break-words ";

                                if (isAnswered) {
                                    if (option.is_correct) {
                                        btnClass += theme === 'dark' ? "bg-green-900/30 border-green-500 text-green-400 shadow-[0_0_20px_rgba(34,197,94,0.2)] scale-[1.02]" : "bg-green-50 border-green-500 text-green-700 shadow-[0_0_20px_rgba(34,197,94,0.3)] scale-[1.02]";
                                    } else if (selectedOption === option && !option.is_correct) {
                                        btnClass += theme === 'dark' ? "bg-red-950/40 border-red-500 text-red-400 shadow-lg shadow-red-500/10" : "bg-red-50 border-red-500 text-red-700";
                                    } else {
                                        btnClass += theme === 'dark' ? "bg-black/20 border-gray-900 text-gray-600 opacity-40" : "bg-gray-50 border-gray-100 text-gray-300 opacity-60";
                                    }
                                } else {
                                    btnClass += `${theme === 'dark' ? 'bg-[#0a0a0a]/50' : 'bg-white/50'} ${borderStyle} ${textColor} hover:border-rose-400 dark:hover:border-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer hover:shadow-lg transform hover:-translate-y-1 active:scale-95`;
                                }

                                return (
                                    <button
                                        key={idx}
                                        disabled={isAnswered}
                                        onClick={() => handleOptionSelect(option)}
                                        className={btnClass}
                                    >
                                        <span className="relative z-10">{option.text}</span>
                                        {isAnswered && option.is_correct && (
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 text-xl">✓</span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>

            {/* Next Button / Feedback */}
            <div className="h-24 flex items-center justify-center">
                {isAnswered && (
                    <div className="animate-fade-in-up w-full max-w-sm px-4">
                        <button
                            onClick={handleNext}
                            className={`w-full py-4 rounded-xl font-bold text-white shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group ${
                                (mode === 'kakitori' ? results[currentIndex]?.is_correct : selectedOption?.is_correct)
                                    ? "bg-gradient-to-r from-green-500 to-emerald-600 shadow-green-500/30"
                                    : "bg-gradient-to-r from-red-500 to-rose-600 shadow-red-500/30"
                            }`}
                        >
                            <span className="relative z-10">{currentIndex < questions.length - 1 ? "Lanjut (Klik untuk skip)" : "Lihat Hasil"}</span>
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-0"></div>
                        </button>
                        {!(mode === 'kakitori' ? results[currentIndex]?.is_correct : selectedOption?.is_correct) && (
                            <p className={`text-center text-[10px] font-black uppercase tracking-widest mt-4 transition-colors ${subTextColor}`}>Otomatis lanjut dalam 2,5 detik...</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function PracticeRunner() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-red-600 mb-4"></div>
                <div className="text-xl text-gray-600 font-medium animate-pulse">Memuat latihan...</div>
            </div>
        }>
            <PracticeContent />
        </Suspense>
    );
}