'use client';

import { useState, useEffect } from 'react';
import { getDoukaiPassage } from '@/lib/api';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';

export default function DoukaiDetailPage() {
    const { id } = useParams();
    const { theme, mounted } = useTheme();
    const router = useRouter();
    
    const [passage, setPassage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showTranslation, setShowTranslation] = useState(false);
    
    // Quiz state
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({}); // { questionId: { selected: bool, isCorrect: bool } }
    const [finished, setFinished] = useState(false);

    useEffect(() => {
        if (id) {
            getDoukaiPassage(id).then(data => {
                setPassage(data);
                setLoading(false);
            }).catch(err => {
                console.error('[doukai-detail] Gagal memuat:', err);
                setLoading(false);
            });
        }
    }, [id]);

    if (loading) return <div className="py-32 text-center animate-pulse font-black text-gray-400">🏮 Memuat Cerita...</div>;

    if (!passage) {
        return (
            <div className="container mx-auto px-4 py-16 text-center uppercase tracking-widest font-black">
                <div className="text-6xl mb-6">📜</div>
                <h1 className="text-2xl text-gray-800 mb-4 dark:text-gray-200">Konten Tidak Ditemukan</h1>
                <Link href="/doukai" className="text-blue-500 hover:underline">Kembali ke Daftar</Link>
            </div>
        );
    }

    const questions = passage.questions || [];
    const currentQuestion = questions[currentQuestionIndex];
    const totalQuestions = questions.length;

    const handleAnswer = (selectedBool) => {
        const isCorrect = selectedBool === currentQuestion.is_correct;
        setAnswers(prev => ({
            ...prev,
            [currentQuestion.id]: { selected: selectedBool, isCorrect }
        }));

        // Move to next or finish
        if (currentQuestionIndex < totalQuestions - 1) {
            setTimeout(() => setCurrentQuestionIndex(prev => prev + 1), 600);
        } else {
            setTimeout(() => setFinished(true), 600);
        }
    };

    const textColor = !mounted ? 'text-black' : (theme === 'dark' ? 'text-white' : 'text-black');
    const subTextColor = !mounted ? 'text-gray-400' : (theme === 'dark' ? 'text-gray-500' : 'text-gray-500');
    const cardBg = !mounted ? 'bg-white' : (theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-white');

    const score = Object.values(answers).filter(a => a.isCorrect).length;

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl transition-colors duration-300">
            {/* Header */}
            <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <Link href="/doukai" className="text-xs font-black uppercase tracking-widest text-blue-500 hover:text-blue-600 transition-colors flex items-center gap-1 mb-2">
                        ← Kembali ke Daftar
                    </Link>
                    <h1 className={`text-3xl font-black transition-colors ${textColor}`}>{passage.title}</h1>
                    <div className="flex gap-2 mt-2">
                        {passage.book && <span className="px-2 py-0.5 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-tighter">Minna {passage.book}</span>}
                        {passage.chapter && <span className="px-2 py-0.5 rounded-lg bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 text-[10px] font-black uppercase tracking-tighter">Bab {passage.chapter}</span>}
                        {passage.jlpt_level && <span className="px-2 py-0.5 rounded-lg bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 text-[10px] font-black uppercase tracking-tighter">N{passage.jlpt_level}</span>}
                    </div>
                </div>
                
                <button 
                    onClick={() => setShowTranslation(!showTranslation)}
                    className={`px-4 py-2 rounded-xl border-2 font-black text-xs uppercase tracking-widest transition-all ${
                        showTranslation 
                        ? 'bg-blue-500 border-blue-500 text-white shadow-lg shadow-blue-500/20' 
                        : 'border-[var(--border-color)] hover:border-blue-500 text-gray-500'
                    }`}
                >
                    {showTranslation ? 'Sembunyikan Terjemahan' : 'Tampilkan Terjemahan'}
                </button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Passage Text */}
                <div className={`p-8 rounded-[2.5rem] border border-[var(--border-color)] ${cardBg} shadow-sm overflow-hidden relative`}>
                    <div className="absolute top-0 right-0 p-6 opacity-5 text-8xl font-serif select-none pointer-events-none">文</div>
                    
                    <div className="relative z-10">
                        <div className="text-lg md:text-xl font-japanese leading-[2.5] md:leading-[3] whitespace-pre-wrap mb-8 transition-colors text-foreground">
                            {passage.text_jp}
                        </div>

                        {showTranslation && passage.text_id && (
                            <div className="mt-8 pt-8 border-t border-[var(--border-color)] border-dashed">
                                <h3 className={`text-[10px] font-black uppercase tracking-[0.2em] mb-4 ${subTextColor}`}>Terjemahan Indonesia</h3>
                                <p className="text-sm italic leading-relaxed text-foreground opacity-80">
                                    {passage.text_id}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Quiz Section */}
                <div className="flex flex-col gap-6">
                    {!finished ? (
                        <div className={`p-8 rounded-[2.5rem] border-2 border-blue-500/20 bg-blue-500/[0.02] relative overflow-hidden`}>
                            <div className="flex justify-between items-center mb-8">
                                <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">Soal {currentQuestionIndex + 1} / {totalQuestions}</span>
                                <div className="flex gap-1">
                                    {questions.map((_, i) => (
                                        <div 
                                            key={i} 
                                            className={`h-1.5 w-6 rounded-full transition-all ${
                                                i === currentQuestionIndex ? 'bg-blue-500 w-10' : (answers[questions[i].id] ? 'bg-blue-500/30' : 'bg-gray-200 dark:bg-gray-800')
                                            }`} 
                                        />
                                    ))}
                                </div>
                            </div>

                            {currentQuestion && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <h2 className="text-xl md:text-2xl font-bold leading-relaxed text-foreground">
                                        {currentQuestion.question_text}
                                    </h2>

                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            onClick={() => handleAnswer(true)}
                                            className="group flex flex-col items-center justify-center p-6 rounded-3xl border-2 border-[var(--border-color)] hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-950/20 transition-all duration-300 active:scale-95"
                                        >
                                            <span className="text-4xl mb-2 group-hover:scale-110 transition-transform">⭕</span>
                                            <span className="font-black uppercase tracking-widest text-xs text-green-600 dark:text-green-400">BENAR</span>
                                            <span className="text-[10px] font-medium text-gray-400 mt-1 italic">(Maru)</span>
                                        </button>

                                        <button
                                            onClick={() => handleAnswer(false)}
                                            className="group flex flex-col items-center justify-center p-6 rounded-3xl border-2 border-[var(--border-color)] hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-300 active:scale-95"
                                        >
                                            <span className="text-4xl mb-2 group-hover:scale-110 transition-transform">❌</span>
                                            <span className="font-black uppercase tracking-widest text-xs text-red-600 dark:text-red-400">SALAH</span>
                                            <span className="text-[10px] font-medium text-gray-400 mt-1 italic">(Batsu)</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className={`p-10 rounded-[2.5rem] border-2 border-accent-blue bg-accent-blue/[0.03] text-center animate-in zoom-in duration-500`}>
                            <div className="text-6xl mb-6">🏆</div>
                            <h2 className={`text-3xl font-black mb-2 transition-colors ${textColor}`}>Latihan Selesai!</h2>
                            <p className={`font-bold mb-8 transition-colors ${subTextColor}`}>Skor kamu: <span className="text-blue-500 text-2xl ml-1">{score} / {totalQuestions}</span></p>
                            
                            <div className="space-y-4 mb-10">
                                {questions.map((q, i) => (
                                    <div key={q.id} className="p-4 rounded-2xl bg-white dark:bg-black/20 border border-[var(--border-color)] text-left">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${answers[q.id]?.isCorrect ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                                {answers[q.id]?.isCorrect ? '✓' : '✗'}
                                            </span>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Soal {i + 1}</span>
                                        </div>
                                        <p className="text-sm font-bold mb-2">{q.question_text}</p>
                                        <p className="text-[10px] font-medium opacity-60 italic">{q.explanation}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="flex flex-col gap-3">
                                <button 
                                    onClick={() => {
                                        setFinished(false);
                                        setCurrentQuestionIndex(0);
                                        setAnswers({});
                                    }}
                                    className="w-full py-4 rounded-2xl bg-blue-500 text-white font-black text-sm uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition-all active:scale-95"
                                >
                                    Ulangi Latihan
                                </button>
                                <Link 
                                    href="/doukai"
                                    className="w-full py-4 rounded-2xl border-2 border-[var(--border-color)] text-gray-500 font-black text-sm uppercase tracking-widest hover:border-blue-500 transition-all active:scale-95 block"
                                >
                                    Pilih Cerita Lain
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* Quick Info */}
                    {!finished && (
                        <div className={`p-6 rounded-[2rem] border border-[var(--border-color)] ${cardBg} transition-all`}>
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-3">💡 Tips Doukai</h3>
                            <p className={`text-xs leading-relaxed font-medium transition-colors ${subTextColor}`}>
                                Baca teks dengan teliti. Perhatikan kata ganti (ko-so-a-do) dan partikel untuk memahami siapa melakukan apa. 
                                Jika sulit, gunakan tombol "Tampilkan Terjemahan" untuk membantu pemahaman awal.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
