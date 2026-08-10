'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { getUserAnalytics } from '@/lib/api';
import { getGuestAnalytics } from '@/lib/local-analytics';
import Link from 'next/link';

export default function DashboardOverviewPage() {
    const { user, loading } = useAuth();
    const { theme, mounted } = useTheme();
    const [analytics, setAnalytics] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

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
            setError("Gagal memuat data latihan. Coba lagi nanti.");
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
        <div className={`flex items-center justify-center min-h-[40vh] ${!mounted ? 'bg-white' : (theme === 'dark' ? 'bg-black' : 'bg-white')}`}>
            <svg className="animate-spin h-12 w-12 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
        </div>
    );
}

    // continue after loading check

    const totalExercises = analytics?.total_attempts || 0;
    const accuracy = analytics?.accuracy || 0.0;
    const levelStats = analytics?.level_stats || [];
    const weakestLevel = levelStats.length > 0 && totalExercises > 10
        ? [...levelStats].filter(l => l.total > 2).sort((a, b) => a.accuracy - b.accuracy)[0]
        : null;

    const rawMistakes = analytics?.wrong_stats || [];
    const groupedMap = new Map();
    rawMistakes.forEach(m => {
        const type = m.type === 'bunpo' ? 'grammar' : (m.type === 'kotoba' ? 'vocab' : m.type);
        const key = `${type}|${m.character}`;
        if (groupedMap.has(key)) {
            const existing = groupedMap.get(key);
            existing.count += (m.count || 1);
        } else {
            groupedMap.set(key, { ...m, type, count: m.count || 1 });
        }
    });
    const topMistakes = Array.from(groupedMap.values()).sort((a, b) => b.count - a.count);

    const tc = (dark, light) => !mounted ? light : (theme === 'dark' ? dark : light);
    const textPrimary = tc('text-white', 'text-gray-900');
    const textSecondary = tc('text-gray-400', 'text-gray-600');
    const textMuted = tc('text-gray-500', 'text-gray-400');
    const cardBase = tc('bg-[#0a0a0a] border-blue-900/20', 'bg-white border-gray-100');

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {!user && (
                <div className="bg-blue-600/10 border-2 border-blue-600/20 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4 text-center md:text-left">
                        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg shadow-blue-500/20">
                            👤
                        </div>
                        <div>
                            <h3 className={`font-black ${textPrimary}`}>Mode Tamu (Guest)</h3>
                            <p className="text-xs text-blue-600/80 font-bold uppercase tracking-wider">Data hanya tersimpan di browser ini</p>
                        </div>
                    </div>
                    <Link
                        href="/login"
                        className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-sm hover:scale-[1.05] active:scale-[0.95] transition-all shadow-lg shadow-blue-500/20"
                    >
                        Pindahkan Data ke Akun →
                    </Link>
                </div>
            )}

            {error && (
                <div className="bg-blue-50 text-blue-700 p-4 rounded-lg" role="alert">
                    {error}
                </div>
            )}

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Attempts */}
                <div className={`rounded-2xl border-2 p-6 flex flex-col justify-center items-center transition-colors ${cardBase}`}>
                    <div className="w-12 h-12 bg-blue-600/10 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                    </div>
                    <div className={`text-4xl font-black mb-1 transition-colors ${textPrimary}`}>{totalExercises}</div>
                    <div className={`text-xs font-black uppercase tracking-widest transition-colors ${textMuted}`}>Total Soal</div>
                    <p className={`text-xs mt-2 text-center transition-colors ${textMuted}`}>soal yang sudah dikerjakan</p>
                </div>

                {/* Overall Accuracy */}
                {analytics ? (
                        <div className={`rounded-2xl border-2 p-6 flex flex-col justify-center items-center transition-colors ${cardBase}`}>
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${accuracy >= 80 ? 'bg-green-500/10 text-green-500' : accuracy >= 50 ? 'bg-blue-500/10 text-blue-500' : 'bg-blue-600/10 text-blue-600'}`}>
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                            </div>
                            <div className={`text-4xl font-black mb-1 ${accuracy >= 80 ? 'text-green-500' : accuracy >= 50 ? 'text-blue-500' : 'text-blue-500'}`}>{accuracy}%</div>
                            <div className={`text-sm font-black mb-2 ${accuracy === 100 ? 'text-blue-500' : accuracy >= 90 ? 'text-green-500' : accuracy >= 80 ? 'text-blue-500' : accuracy >= 50 ? 'text-blue-500' : 'text-blue-500'}`}>
                                {accuracy === 100 ? 'Sangat Baik' : accuracy >= 90 ? 'Baik Sekali' : accuracy >= 80 ? 'Baik' : accuracy >= 50 ? 'Cukup Baik' : 'Perbaiki Lagi'}
                            </div>
                            <div className={`text-xs font-black uppercase tracking-widest mb-3 transition-colors ${textMuted}`}>Akurasi</div>
                            <div className={`w-full rounded-full h-2 ${tc('bg-gray-800', 'bg-gray-100')}`}>
                                <div className={`h-2 rounded-full transition-all duration-700 ${accuracy >= 80 ? 'bg-green-500' : accuracy >= 50 ? 'bg-blue-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(Math.max(accuracy, 0), 100)}%` }} />
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-32">
                            <svg className="animate-spin h-12 w-12 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
                        </div>
                    )}

                {/* CTA Card */}
                <div className={`rounded-2xl border-2 p-6 flex flex-col justify-center items-center text-center transition-colors ${tc('bg-blue-600/10 border-blue-600/20', 'bg-blue-50 border-blue-100')}`}>
                    <div className="text-3xl mb-3">🎯</div>
                    <div className={`text-lg font-black mb-2 transition-colors ${tc('text-blue-300', 'text-blue-800')}`}>Tingkatkan Terus!</div>
                    <p className={`text-sm mb-4 transition-colors ${tc('text-blue-400', 'text-blue-600')}`}>Konsisten berlatih adalah kunci menguasai Bahasa Jepang.</p>
                    <Link href="/practice" className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-black hover:bg-blue-700 hover:scale-[1.03] transition-all shadow-lg shadow-blue-500/20">
                        Mulai Latihan →
                    </Link>
                </div>
            </div>

            {/* Insights & Learning Recommendations */}
            <div className="space-y-6">
                <h2 className={`text-2xl font-black flex items-center gap-3 transition-colors ${textPrimary}`}>
                    <span className="bg-sky-600 text-white p-2 rounded-2xl shadow-lg shadow-sky-500/20">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </span>
                    Saran Belajar & Insight
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className={`p-6 rounded-[2rem] border-2 shadow-sm transition-all hover:shadow-md group ${tc('bg-[#0a0a0a]/60 border-white/5', 'bg-white border-gray-100')}`}>
                        <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-950/30 flex items-center justify-center text-orange-600 mb-4 group-hover:scale-110 transition-transform">
                            <span className="font-black text-xl">N</span>
                        </div>
                        <h3 className={`font-black text-lg mb-2 transition-colors ${textPrimary}`}>
                            {weakestLevel ? `Fokus JLPT N${weakestLevel.level}` : 'Siap Latihan?'}
                        </h3>
                        <p className={`text-sm leading-relaxed transition-colors ${textSecondary}`}>
                            {weakestLevel
                                ? `Akurasi kamu di N${weakestLevel.level} masih ${Math.round(weakestLevel.accuracy)}%. Cobalah fokus pada kosa kata dasar di level ini untuk meningkatkan skor.`
                                : 'Belum ada data yang cukup. Mulailah latihan untuk mendapatkan rekomendasi belajar yang akurat.'}
                        </p>
                    </div>

                    <div className={`p-6 rounded-[2rem] border-2 shadow-sm transition-all hover:shadow-md group ${tc('bg-[#0a0a0a]/60 border-white/5', 'bg-white border-gray-100')}`}>
                        <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition-transform">
                            <span className="font-black text-xl">あ</span>
                        </div>
                        <h3 className={`font-black text-lg mb-2 transition-colors ${textPrimary}`}>
                            {topMistakes[0] ? `Perbaiki "${topMistakes[0].character}"` : 'Huruf & Kana'}
                        </h3>
                        <p className={`text-sm leading-relaxed transition-colors ${textSecondary}`}>
                            {topMistakes[0]
                                ? `Kamu sering salah pada "${topMistakes[0].character}" (${topMistakes[0].count} kali). ${topMistakes[0].type === 'kanji' ? 'Review radikal dan cara baca onyomi-nya.' : 'Pelajari kembali konteks penggunaan kata ini.'}`
                                : 'Latihan rutin akan membantu mengidentifikasi huruf atau kana yang sulit bagi kamu.'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Quick Link Navigation */}
            <div className={`p-6 rounded-2xl border-2 transition-colors ${cardBase}`}>
                <h3 className={`font-black text-lg mb-4 transition-colors ${textPrimary}`}>Menu Detail Analisis</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Link href="/dashboard/levels" className="p-4 rounded-xl border border-gray-200 dark:border-blue-900/30 text-center hover:bg-blue-600/10 transition-colors">
                        📊 Akurasi Level
                    </Link>
                    <Link href="/dashboard/kakitori" className="p-4 rounded-xl border border-gray-200 dark:border-blue-900/30 text-center hover:bg-blue-600/10 transition-colors">
                        🎧 Analisis Dikte
                    </Link>
                    <Link href="/dashboard/mistakes" className="p-4 rounded-xl border border-gray-200 dark:border-blue-900/30 text-center hover:bg-blue-600/10 transition-colors">
                        ⚠️ Daftar Kesalahan
                    </Link>
                    <Link href="/dashboard/data" className="p-4 rounded-xl border border-gray-200 dark:border-blue-900/30 text-center hover:bg-blue-600/10 transition-colors">
                        ⚙️ Manajemen Data
                    </Link>
                </div>
            </div>
        </div>
    );
}