'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { getUserAnalytics } from '@/lib/api';
import { getGuestAnalytics } from '@/lib/local-analytics';
import Link from 'next/link';

export default function KakitoriStatsPage() {
    const { user, loading } = useAuth();
    const { theme, mounted } = useTheme();
    const [analytics, setAnalytics] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchAnalytics = async () => {
        setIsLoading(true);
        try {
            if (user) {
                const data = await getUserAnalytics();
                setAnalytics(data);
            } else {
                const data = getGuestAnalytics();
                setAnalytics(data);
            }
        } catch (err) {
            console.error("Error fetching analytics:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!loading) {
            fetchAnalytics();
        }
    }, [user, loading]);

    if (loading || (isLoading && !analytics)) {
        return (
            <div className={`flex flex-col items-center justify-center min-h-[40vh] gap-4 ${!mounted ? 'bg-white' : (theme === 'dark' ? 'bg-black' : 'bg-white')}`}>
                <svg className="animate-spin h-14 w-14 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                <p className="text-sm font-bold text-blue-600 animate-pulse">Memuat Analisis Dikte...</p>
            </div>
        );
    }

    const kakitoriStats = analytics?.kakitori_stats || null;
    const hasKakitoriData = kakitoriStats &&
        (kakitoriStats.total_attempts > 0 || kakitoriStats.total_questions > 0);

    const tc = (dark, light) => !mounted ? light : (theme === 'dark' ? dark : light);
    const textPrimary = tc('text-white', 'text-gray-900');
    const textSecondary = tc('text-gray-400', 'text-gray-600');
    const textMuted = tc('text-gray-500', 'text-gray-400');
    const cardBase = tc('bg-[#0a0a0a] border-blue-900/20', 'bg-white border-gray-100');

    return (
        <div className="animate-in fade-in duration-500 space-y-8">
            <div className="flex items-center gap-2 mb-2">
                <span className="bg-blue-600 text-white p-1.5 rounded-xl shadow-sm shadow-blue-500/20">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.414 1.414m0 0a9 9 0 01-1.414-1.414m11.314-11.314a9 9 0 00-12.728 0" />
                    </svg>
                </span>
                <h2 className={`text-xl font-black transition-colors ${textPrimary}`}>
                    Analisis Kakitori (Latihan Dikte)
                    {!user && (
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ml-2 ${tc('bg-blue-900/40 text-blue-400', 'bg-blue-100 text-blue-700')}`}>
                            Mode Tamu
                        </span>
                    )}
                </h2>
            </div>

            {hasKakitoriData ? (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Statistik Umum */}
                        <div className={`rounded-2xl border-2 p-6 transition-colors ${cardBase}`}>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center">
                                    <span className="text-xl">🎧</span>
                                </div>
                                <div>
                                    <div className={`font-black text-sm transition-colors ${textPrimary}`}>Total Latihan Dikte</div>
                                    <div className="text-2xl font-black text-blue-600">
                                        {kakitoriStats.total_attempts || 0} sesi
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className={`text-[10px] font-black uppercase tracking-widest transition-colors ${textMuted}`}>Total Soal</div>
                                    <div className={`text-2xl font-black transition-colors ${textPrimary}`}>
                                        {kakitoriStats.total_questions || 0}
                                    </div>
                                </div>
                                <div>
                                    <div className={`text-[10px] font-black uppercase tracking-widest transition-colors ${textMuted}`}>Akurasi</div>
                                    <div className={`text-2xl font-black ${(kakitoriStats.accuracy || 0) >= 70 ? 'text-green-500' : 'text-blue-500'}`}>
                                        {Math.round(kakitoriStats.accuracy || 0)}%
                                    </div>
                                </div>
                            </div>
                            <div className={`w-full rounded-full h-2 mt-4 ${tc('bg-gray-800', 'bg-gray-100')}`}>
                                <div
                                    className={`h-2 rounded-full transition-all duration-700 ${(kakitoriStats.accuracy || 0) >= 70 ? 'bg-green-500' : 'bg-blue-500'}`}
                                    style={{ width: `${Math.min(kakitoriStats.accuracy || 0, 100)}%` }}
                                />
                            </div>
                            <div className={`text-[10px] font-black uppercase tracking-widest mt-2 transition-colors ${textMuted}`}>
                                {kakitoriStats.correct || 0} benar dari {kakitoriStats.total_questions || 0} soal
                            </div>
                        </div>

                        {/* Tips Kakitori */}
                        <div className={`rounded-2xl border-2 p-6 transition-colors ${cardBase}`}>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center">
                                    <span className="text-xl">💡</span>
                                </div>
                                <div className={`font-black transition-colors ${textPrimary}`}>Tips Meningkatkan Dikte</div>
                            </div>
                            <ul className="space-y-2 text-sm">
                                <li className="flex items-start gap-2">
                                    <span className="text-blue-500 mt-0.5">•</span>
                                    <span className={`transition-colors ${textSecondary}`}>Dengarkan audio beberapa kali sebelum menjawab</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-blue-500 mt-0.5">•</span>
                                    <span className={`transition-colors ${textSecondary}`}>Perhatikan panjang pendek bunyi (つ vs っ, う vs お)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-blue-500 mt-0.5">•</span>
                                    <span className={`transition-colors ${textSecondary}`}>Latihan menulis sambil mendengar memperkuat memori</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-blue-500 mt-0.5">•</span>
                                    <span className={`transition-colors ${textSecondary}`}>Ulangi sesi dengan level lebih rendah jika akurasi di bawah 50%</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Detail per Level */}
                    {kakitoriStats.level_breakdown && kakitoriStats.level_breakdown.length > 0 && (
                        <div className={`rounded-2xl border-2 p-6 transition-colors ${cardBase}`}>
                            <h3 className={`font-black text-sm mb-4 flex items-center gap-2 transition-colors ${tc('text-gray-300', 'text-gray-700')}`}>
                                <span>📊</span> Akurasi Dikte per Level
                            </h3>
                            <div className="space-y-3">
                                {kakitoriStats.level_breakdown.map(level => (
                                    <div key={level.level}>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className={`font-black transition-colors ${textSecondary}`}>
                                                JLPT N{level.level}
                                            </span>
                                            <span className={`font-black ${level.accuracy >= 70 ? 'text-green-500' : 'text-blue-500'}`}>
                                                {Math.round(level.accuracy)}% ({level.correct}/{level.total})
                                            </span>
                                        </div>
                                        <div className={`w-full rounded-full h-2 ${tc('bg-gray-800', 'bg-gray-100')}`}>
                                            <div
                                                className={`h-2 rounded-full transition-all duration-700 ${level.accuracy >= 70 ? 'bg-green-500' : 'bg-blue-500'}`}
                                                style={{ width: `${level.accuracy}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className={`rounded-2xl border-2 p-8 flex flex-col md:flex-row items-center justify-between gap-6 transition-colors ${cardBase}`}>
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-blue-600/10 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">🎧</div>
                        <div>
                            <h3 className={`font-black text-lg transition-colors ${textPrimary}`}>Belum Ada Data Kakitori</h3>
                            <p className={`text-sm transition-colors ${textSecondary}`}>
                                Coba mode Kakitori (Latihan Dikte) untuk melihat analisis kemampuan mendengar kamu di sini.
                            </p>
                        </div>
                    </div>
                    <Link
                        href="/practice?mode=kakitori"
                        className="flex-shrink-0 bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-sm hover:bg-blue-700 hover:scale-[1.03] transition-all shadow-lg shadow-blue-500/20"
                    >
                        Coba Kakitori →
                    </Link>
                </div>
            )}
        </div>
    );
}
