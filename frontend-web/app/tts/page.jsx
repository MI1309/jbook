'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import TTSGrid from '@/components/TTSGrid';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

export default function TTSPage() {
    const { theme } = useTheme();
    const { user, token } = useAuth();
    const [gameData, setGameData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [level, setLevel] = useState(5);
    const [isFinished, setIsFinished] = useState(false);
    const [time, setTime] = useState(0);

    const fetchQuiz = async (jlptLevel = level) => {
        setLoading(true);
        setError(null);
        setIsFinished(false);
        setTime(0);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/learning/tts/generate?level=${jlptLevel}`);
            if (!res.ok) throw new Error('Gagal memuat kuis');
            const data = await res.json();
            if (!data.clues || data.clues.length === 0) {
                throw new Error('Tidak cukup kata untuk membuat TTS di level ini.');
            }
            setGameData(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuiz();
    }, []);

    useEffect(() => {
        let timer;
        if (gameData && !isFinished && !loading) {
            timer = setInterval(() => {
                setTime(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [gameData, isFinished, loading]);

    const handleComplete = async () => {
        setIsFinished(true);
        if (user && token) {
            try {
                // Prepare results for submission
                const results = gameData.clues.map(clue => ({
                    question_id: clue.id,
                    type: 'vocab',
                    is_correct: true,
                    answer_given: clue.word
                }));

                await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/learning/practice/submit`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ results })
                });
            } catch (err) {
                console.error('Failed to save progress:', err);
            }
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const textColor = theme === 'dark' ? 'text-white' : 'text-black';
    const subTextColor = theme === 'dark' ? 'text-gray-400' : 'text-gray-500';

    return (
        <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-gray-50'} transition-colors duration-300`}>
            <Navbar />
            
            <main className="container mx-auto px-6 py-12 max-w-6xl">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
                    <div>
                        <h1 className={`text-4xl md:text-5xl font-black mb-4 tracking-tighter ${textColor}`}>
                            Teka-Teki <span className="text-red-600">Silang</span>
                        </h1>
                        <p className={`${subTextColor} font-bold text-lg`}>
                            Asah ingatan kosakata JLPT N{level} kamu di sini.
                        </p>
                    </div>

                    <div className="flex items-center gap-4 bg-white dark:bg-gray-900 p-4 rounded-3xl shadow-xl border border-gray-100 dark:border-red-950/20">
                        <div className="text-center px-4 border-r border-gray-100 dark:border-gray-800">
                            <p className="text-[10px] font-black uppercase opacity-50 mb-1">Level</p>
                            <select 
                                value={level} 
                                onChange={(e) => {
                                    const newLevel = parseInt(e.target.value);
                                    setLevel(newLevel);
                                    fetchQuiz(newLevel);
                                }}
                                className="bg-transparent font-black text-xl outline-none text-red-600"
                            >
                                {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>N{n}</option>)}
                            </select>
                        </div>
                        <div className="text-center px-4">
                            <p className="text-[10px] font-black uppercase opacity-50 mb-1">Waktu</p>
                            <p className="font-black text-xl font-mono">{formatTime(time)}</p>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-6">
                        <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                        <p className={`font-black uppercase tracking-widest ${subTextColor}`}>Menyusun Grid...</p>
                    </div>
                ) : error ? (
                    <div className="text-center py-20 bg-red-50 dark:bg-red-950/10 rounded-[3rem] border-2 border-dashed border-red-200 dark:border-red-900/30">
                        <p className="text-red-600 font-black text-xl mb-6">⚠️ {error}</p>
                        <button 
                            onClick={() => fetchQuiz()}
                            className="bg-red-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-red-700 transition-all shadow-xl shadow-red-500/20 active:scale-95"
                        >
                            Coba Lagi
                        </button>
                    </div>
                ) : (
                    <div className="relative">
                        <TTSGrid 
                            gridData={gameData.grid} 
                            clues={gameData.clues} 
                            onComplete={handleComplete} 
                        />

                        {isFinished && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-6">
                                <div className="bg-white dark:bg-gray-900 w-full max-w-md p-10 rounded-[3rem] shadow-2xl text-center border-b-8 border-green-500 transform animate-in fade-in zoom-in duration-300">
                                    <div className="text-6xl mb-6">🎉</div>
                                    <h2 className={`text-3xl font-black mb-2 ${textColor}`}>Omedetou!</h2>
                                    <p className={`${subTextColor} font-bold mb-8`}>
                                        Kamu menyelesaikan kuis N{level} dalam waktu <span className="text-green-500">{formatTime(time)}</span>.
                                    </p>
                                    
                                    {!user && (
                                        <div className="bg-yellow-50 dark:bg-yellow-950/20 p-4 rounded-2xl mb-8 text-xs font-bold text-yellow-700 dark:text-yellow-500 border border-yellow-100 dark:border-yellow-900/30">
                                            Login untuk menyimpan progres dan bersaing di leaderboard!
                                        </div>
                                    )}

                                    <div className="flex flex-col gap-3">
                                        <button 
                                            onClick={() => fetchQuiz()}
                                            className="bg-red-600 text-white w-full py-5 rounded-3xl font-black hover:bg-red-700 transition-all shadow-2xl shadow-red-500/20 active:scale-95"
                                        >
                                            Main Lagi 🔄
                                        </button>
                                        <Link 
                                            href="/kotoba"
                                            className={`w-full py-5 rounded-3xl font-black transition-all border ${theme === 'dark' ? 'border-gray-800 hover:bg-gray-800' : 'border-gray-100 hover:bg-gray-50'} ${textColor}`}
                                        >
                                            Kembali ke Kotoba
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
