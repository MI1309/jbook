'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { usePractice } from '@/context/PracticeContext';
import { saveGuestResults } from '@/lib/local-analytics';
import { submitPracticeResults, getPracticeQuestions } from '@/lib/api';

function PracticeContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { setIsPracticing } = usePractice();
    const { user } = useAuth(); // Get user auth state
    const isLoggingOut = useRef(false);

    // Get config from URL
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')) : 10;
    const level = searchParams.get('level') ? parseInt(searchParams.get('level')) : null;
    const type = searchParams.get('type') || 'kanji';
    const initialTimer = searchParams.get('timer') ? parseInt(searchParams.get('timer')) * 60 : null;

    const [questions, setQuestions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [score, setScore] = useState(0);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [results, setResults] = useState([]); // Store attempt data to submit
    const [finished, setFinished] = useState(false);
    const [timeLeft, setTimeLeft] = useState(initialTimer);

    // Timer logic
    const handleFinish = useCallback(async (finalResultsOverride) => {
        if (submitting || finished) return;

        setSubmitting(true);
        const resultsToSubmit = finalResultsOverride || results;

        try {
            if (user) {
                // Logged in: Submit to API
                await submitPracticeResults(resultsToSubmit);
            } else {
                // Guest: Save to Local Storage
                saveGuestResults(resultsToSubmit);
            }

            setFinished(true);
            sessionStorage.removeItem('guest_practice_session'); // Clear cache on finish
        } catch (error) {
            console.error('Failed to submit results:', error);
            alert('Gagal menyimpan hasil latihan.');
        } finally {
            setSubmitting(false);
        }
    }, [results, submitting, finished, user]);

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
                alert('Gagal memuat pertanyaan. Silakan coba lagi.');
            } finally {
                setLoading(false);
            }
        }

        // DOUBLE CHECK: Ensure localStorage is wiped, in case context cleanup missed it
        localStorage.removeItem('guest_practice_session');

        const savedSession = sessionStorage.getItem('guest_practice_session');
        if (savedSession) {
            try {
                const session = JSON.parse(savedSession);
                const now = Date.now();
                // Check if session is valid (less than 1 hour old)
                if (now - session.timestamp < 3600 * 1000 && !session.finished) {
                    setQuestions(session.questions);
                    setCurrentIndex(session.currentIndex);
                    setScore(session.score);
                    setResults(session.results);
                    if (session.timeLeft !== null) setTimeLeft(session.timeLeft);
                    setLoading(false);
                    return; // Return early, don't load new questions
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
        // Check isLoggingOut ref to prevent saving if user logged out
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

    // Listen for logout event to prevent re-saving session
    useEffect(() => {
        const handleLogout = () => {
            isLoggingOut.current = true;
        };
        window.addEventListener('auth:logout', handleLogout);
        return () => window.removeEventListener('auth:logout', handleLogout);
    }, []);

    // Prevent accidental close/refresh
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (!finished) {
                e.preventDefault();
                e.returnValue = '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [finished]);

    const nextTimeoutRef = useRef(null);

    const handleNext = () => {
        if (nextTimeoutRef.current) {
            clearTimeout(nextTimeoutRef.current);
            nextTimeoutRef.current = null;
        }

        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setSelectedOption(null);
            setIsAnswered(false);
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

        // Record attempt
        const currentQ = questions[currentIndex];
        const attempt = {
            question_id: currentQ.id || currentQ.kanji_id, // Fallback for old cached data
            type: currentQ.type || 'kanji',
            character: currentQ.character, // Critical for guest analytics
            is_correct: isCorrect,
            answer_given: option.text
        };

        const newResults = [...results, attempt];
        setResults(newResults);

        // Auto-advance logic
        const delay = isCorrect ? 1500 : 5000; // 1.5s if correct, 5s if wrong

        nextTimeoutRef.current = setTimeout(() => {
            if (currentIndex < questions.length - 1) {
                setCurrentIndex(prev => prev + 1);
                setSelectedOption(null);
                setIsAnswered(false);
            } else {
                handleFinish(newResults); // Pass fresh results to finish
            }
            nextTimeoutRef.current = null;
        }, delay);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-red-600 mb-4"></div>
                <div className="text-xl text-gray-600 font-medium animate-pulse">Memuat pertanyaan...</div>
            </div>
        );
    }

    if (finished) {
        return (
            <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[60vh]">
                <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center border border-red-100 relative overflow-hidden">
                    <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-red-500 via-red-600 to-red-500"></div>

                    <div className="mb-6">
                        <div className="text-6xl mb-2">🎉</div>
                        <h2 className="text-3xl font-black text-gray-800 mb-1">Latihan Selesai!</h2>
                        <p className="text-gray-500 text-sm">Kerja bagus hari ini!</p>
                    </div>

                    <div className="bg-red-50 rounded-2xl p-6 mb-8 border border-red-100">
                        <div className="text-sm text-red-600 font-bold uppercase tracking-wider mb-2">Skor Akhir</div>
                        <div className="text-7xl font-black text-red-600 leading-none mb-2">
                            {score}<span className="text-3xl text-red-300">/{questions.length}</span>
                        </div>
                        {initialTimer && timeLeft <= 0 && (
                            <div className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold mt-2">
                                <span>⏰</span> Waktu Habis
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => router.push(user ? '/dashboard' : '/practice')}
                        className="w-full bg-gray-900 hover:bg-black text-white px-6 py-4 rounded-xl font-bold transition-all transform hover:scale-[1.02] shadow-xl"
                    >
                        Kembali ke {user ? 'Dashboard' : 'Halaman Latihan'}
                    </button>
                </div>
            </div>
        );
    }

    if (questions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
                <div className="text-6xl mb-4 grayscale opacity-30">📭</div>
                <h3 className="text-2xl font-bold text-gray-700 mb-2">Tidak ada soal ditemukan</h3>
                <p className="text-gray-500 mb-6">Coba ubah filter level atau jumlah soal.</p>
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
                    <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Progress</span>
                    <div className="flex items-center gap-3">
                        {initialTimer !== null && (
                            <span className={`font-mono font-bold text-lg flex items-center gap-2 ${timeLeft < 30 ? 'text-red-600 animate-pulse' : 'text-gray-600'}`}>
                                <span>⏱️</span> {formatTime(timeLeft)}
                            </span>
                        )}
                        <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold">
                            {currentIndex + 1} / {questions.length}
                        </span>
                    </div>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-red-500 to-red-600 transition-all duration-500 ease-out"
                        style={{ width: `${progressPercent}%` }}
                    ></div>
                </div>
            </div>

            {/* Question Card */}
            <div className="bg-white rounded-3xl shadow-xl p-8 mb-8 text-center border border-gray-100 relative flex-grow flex flex-col justify-center">
                <div className="mb-8 relative p-4 flex flex-col items-center">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">
                        {currentQuestion.type === 'kanji' ? 'Kanji' : currentQuestion.type === 'vocab' ? 'Kosakata' : 'Tata Bahasa'}
                    </span>
                    <div className={`${currentQuestion.type === 'grammar' ? 'text-4xl md:text-5xl' : 'text-8xl md:text-[8rem]'} leading-none font-medium text-gray-800 select-none pb-2`}>
                        {currentQuestion.character}
                    </div>
                    {currentQuestion.type === 'kanji' && currentQuestion.reading && (
                        <div className="text-2xl text-gray-500 font-serif mt-2">
                            {currentQuestion.reading}
                        </div>
                    )}
                </div>

                {isAnswered && (currentQuestion.reading || currentQuestion.meaning) && (
                    <div className="mb-6 animate-fade-in-up">
                        {currentQuestion.reading && (
                            <div className="text-2xl text-red-500 font-serif mb-1">{currentQuestion.reading}</div>
                        )}
                        {currentQuestion.meaning && (
                            <div className="text-lg text-gray-600 font-medium">{currentQuestion.meaning}</div>
                        )}
                    </div>
                )}

                <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
                    {currentQuestion.options.map((option, idx) => {
                        let btnClass = "p-4 text-lg font-medium border-2 rounded-xl transition-all relative overflow-hidden ";

                        if (isAnswered) {
                            if (option.is_correct) {
                                btnClass += "bg-green-50 border-green-500 text-green-700 shadow-sm";
                            } else if (selectedOption === option && !option.is_correct) {
                                btnClass += "bg-red-50 border-red-500 text-red-700";
                            } else {
                                btnClass += "bg-gray-50 border-gray-100 text-gray-300 opacity-60";
                            }
                        } else {
                            btnClass += "bg-white border-gray-100 text-gray-700 hover:border-red-300 hover:bg-red-50/50 hover:text-red-700 cursor-pointer hover:shadow-md transform hover:-translate-y-0.5";
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
            </div>

            {/* Next Button / Feedback */}
            <div className="h-24 flex items-center justify-center">
                {isAnswered && (
                    <div className="animate-fade-in-up w-full max-w-sm px-4">
                        <button
                            onClick={handleNext}
                            className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all transform hover:scale-105 ${selectedOption?.is_correct
                                ? "bg-green-500 hover:bg-green-600 shadow-green-200"
                                : "bg-red-500 hover:bg-red-600 shadow-red-200"
                                }`}
                        >
                            {currentIndex < questions.length - 1 ? "Lanjut (Klik untuk skip)" : "Lihat Hasil"}
                        </button>
                        {!selectedOption?.is_correct && (
                            <p className="text-center text-xs text-gray-400 mt-2">Otomatis lanjut dalam 5 detik...</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function PracticeStartPage() {
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
