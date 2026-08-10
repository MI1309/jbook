'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { getUserAnalytics } from '@/lib/api';
import { getGuestAnalytics } from '@/lib/local-analytics';
import Link from 'next/link';

export default function LevelStatsPage() {
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
                <p className="text-sm font-bold text-blue-600 animate-pulse">Memuat Akurasi Level...</p>
            </div>
        );
    }

    const levelStats = analytics?.level_stats || [];

    const tc = (dark, light) => !mounted ? light : (theme === 'dark' ? dark : light);
    const textPrimary = tc('text-white', 'text-gray-900');
    const textSecondary = tc('text-gray-400', 'text-gray-600');
    const textMuted = tc('text-gray-500', 'text-gray-400');
    const cardBase = tc('bg-[#0a0a0a] border-blue-900/20', 'bg-white border-gray-100');

    return (
        <div className="animate-in fade-in duration-500 space-y-6">
            <div className="flex items-center gap-2 mb-4">
                <span className="bg-blue-600 text-white p-1.5 rounded-xl shadow-sm shadow-blue-500/20">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
                    </svg>
                </span>
                <h2 className={`text-xl font-black transition-colors ${textPrimary}`}>
                    Akurasi per Level JLPT
                </h2>
            </div>

            {levelStats.length > 0 ? (
                <div
                    className={`${
                        levelStats.length === 2
                            ? 'flex flex-wrap justify-center gap-6'
                            : levelStats.length === 3
                                ? 'flex flex-wrap justify-center gap-5'
                                : levelStats.length === 4
                                    ? 'grid grid-cols-2 md:grid-cols-4 gap-5'
                                    : 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4'
                    } items-start`}
                >
                    {levelStats.map(stat => (
                        <div
                            key={stat.level}
                            className={`p-6 rounded-3xl border-2 transition-all hover:scale-[1.03] flex flex-col w-full ${tc('bg-black/20 border-blue-900/20', 'bg-white border-gray-100')}`}
                        >
                            <div className={`text-xs font-black uppercase tracking-widest mb-3 ${textMuted}`}>JLPT N{stat.level}</div>
                            <div className={`text-4xl font-black mb-2 ${stat.accuracy >= 80 ? 'text-green-500' : stat.accuracy >= 50 ? 'text-yellow-500' : 'text-blue-500'}`}>
                                {Math.round(stat.accuracy)}%
                            </div>
                            <div className={`text-xs font-bold uppercase tracking-tight transition-colors mt-auto pt-3 ${textMuted}`}>{stat.total} Soal</div>
                            <div className={`w-full rounded-full h-2 mt-3 ${tc('bg-gray-800', 'bg-gray-100')}`}>
                                <div className={`h-2 rounded-full ${stat.accuracy >= 80 ? 'bg-green-500' : stat.accuracy >= 50 ? 'bg-yellow-500' : 'bg-blue-500'}`} style={{ width: `${stat.accuracy}%` }} />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className={`rounded-2xl border-2 p-8 flex flex-col items-center justify-center gap-3 transition-colors ${cardBase}`}>
                    <div className="text-4xl">📊</div>
                    <h3 className={`font-black text-lg transition-colors ${textPrimary}`}>Belum Ada Data Level</h3>
                    <p className={`text-sm text-center transition-colors ${textSecondary}`}>
                        Selesaikan beberapa soal latihan untuk melihat akurasi per level JLPT kamu.
                    </p>
                    <Link href="/practice" className="mt-2 bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20">
                        Mulai Latihan
                    </Link>
                </div>
            )}
        </div>
    );
}
