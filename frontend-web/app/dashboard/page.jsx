'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'next/navigation';
import { getUserAnalytics, exportPracticeData, importPracticeData, resolveContentId } from '@/lib/api';
import { getGuestAnalytics } from '@/lib/local-analytics';
import Link from 'next/link';
import KanjiDetailModal from '@/components/kanji/KanjiDetailModal';
import KotobaDetailModal from '@/components/kotoba/KotobaDetailModal';
import BunpoDetailModal from '@/components/bunpo/BunpoDetailModal';
import { toast } from 'react-toastify';

export default function DashboardPage() {
    const { user, loading } = useAuth();
    const { theme, mounted } = useTheme();
    const router = useRouter();
    const [analytics, setAnalytics] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [error, setError] = useState(null);
    const [actionError, setActionError] = useState(null);
    const [detailView, setDetailView] = useState(null);

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

    const handleOpenMistake = async (mistake) => {
        try {
            const id = await resolveContentId(mistake.type, mistake.character);
            if (id) {
                setDetailView({ id, type: mistake.type });
            } else {
                toast.error(`Detail untuk "${mistake.character}" tidak ditemukan.`, {
                    theme: theme === 'dark' ? 'dark' : 'colored'
                });
            }
        } catch (err) {
            console.error('[jbook] handleOpenMistake error:', err);
        }
    };

    const handleExport = async () => {
        setIsExporting(true);
        setActionError(null);
        try {
            let exportData;
            if (user) {
                // Login: export dari server
                exportData = await exportPracticeData();
            } else {
                // Guest: export dari localStorage (termasuk kakitori_stats)
                exportData = getGuestAnalytics();
                exportData._exported_at = new Date().toISOString();
                exportData._source = 'guest';
            }
            const blob = new Blob([JSON.stringify(exportData)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `jbook_practice_data_${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            setActionError(`Ekspor gagal: ${err.message}`);
        } finally {
            setIsExporting(false);
        }
    };

    const handleImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsImporting(true);
        setActionError(null);
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const data = JSON.parse(event.target.result);

                if (user) {
                    // Login: import ke server
                    const result = await importPracticeData(data);
                    if (result.skipped > 0 && result.imported === 0) {
                        toast.info(`Semua data sudah ada (${result.skipped} data dilewati).`, { theme: theme === 'dark' ? 'dark' : 'colored' });
                    } else if (result.skipped > 0) {
                        toast.success(`Berhasil mengimpor ${result.imported} data baru.`, { theme: theme === 'dark' ? 'dark' : 'colored' });
                    } else {
                        toast.success(`Data berhasil diimpor!`, { theme: theme === 'dark' ? 'dark' : 'colored' });
                    }
                } else {
                    // Guest: import langsung ke localStorage
                    // Validasi struktur minimal
                    if (typeof data.total_attempts === 'undefined') {
                        throw new Error('Format file tidak valid untuk data guest.');
                    }
                    // Pastikan kakitori_stats ada (migrasi file lama)
                    if (!data.kakitori_stats) {
                        data.kakitori_stats = {
                            total_attempts: 0,
                            total_questions: 0,
                            correct: 0,
                            accuracy: 0,
                            level_breakdown: []
                        };
                    }
                    // Hapus metadata ekspor sebelum simpan
                    delete data._exported_at;
                    delete data._source;
                    localStorage.setItem('guest_practice_analytics', JSON.stringify(data));
                    toast.success('Data berhasil diimpor ke mode guest!', { theme: theme === 'dark' ? 'dark' : 'colored' });
                }

                fetchAnalytics();
            } catch (err) {
                console.error("Import error:", err);
                const msg = err instanceof SyntaxError
                    ? "Format file tidak valid. Pastikan file adalah JSON."
                    : err.message;
                setActionError(`Impor gagal: ${msg}`);
            } finally {
                setIsImporting(false);
                e.target.value = '';
            }
        };
        reader.readAsText(file);
    };

    useEffect(() => {
        if (!loading) {
            fetchAnalytics();
        }
    }, [user, loading]);

    if (loading || (isLoading && !analytics)) {
        return (
            <div className={`flex justify-center items-center min-h-[60vh] ${!mounted ? 'bg-white' : (theme === 'dark' ? 'bg-black' : 'bg-white')}`}>
                <div className="animate-pulse space-y-4">
                    <div className="h-8 w-64 bg-gray-200 rounded"></div>
                    <div className="h-32 w-full max-w-2xl bg-gray-200 rounded"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="h-48 w-full bg-gray-200 rounded"></div>
                        <div className="h-48 w-full bg-gray-200 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    // Prepare data
    const totalExercises = analytics?.total_attempts || 0;
    const accuracy = analytics?.accuracy || 0.0;

    // Deduplikasi wrong_stats
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

    // Level analytics
    const levelStats = analytics?.level_stats || [];
    const weakestLevel = levelStats.length > 0 && totalExercises > 10
        ? [...levelStats].filter(l => l.total > 2).sort((a, b) => a.accuracy - b.accuracy)[0]
        : null;

    // Kakitori stats (support guest + logged-in)
    const kakitoriStats = analytics?.kakitori_stats || null;
    const hasKakitoriData = kakitoriStats &&
        (kakitoriStats.total_attempts > 0 || kakitoriStats.total_questions > 0);

    const getMistakeTypeLabel = (type) => {
        switch (type) {
            case 'kanji': return 'Kanji';
            case 'vocab':
            case 'kotoba': return 'Kotoba';
            case 'grammar':
            case 'bunpo': return 'Tata Bahasa';
            default: return 'Lainnya';
        }
    };

    // Helper theme classes
    const tc = (dark, light) => !mounted ? light : (theme === 'dark' ? dark : light);
    const textPrimary = tc('text-white', 'text-gray-900');
    const textSecondary = tc('text-gray-400', 'text-gray-600');
    const textMuted = tc('text-gray-500', 'text-gray-400');
    const cardBase = tc('bg-[#0a0a0a] border-blue-900/20', 'bg-white border-gray-100');
    const cardHeaderBase = tc('bg-black/40 border-blue-900/20', 'bg-gray-50 border-gray-100');

    return (
        <div className="container mx-auto px-4 py-8 max-w-5xl">
            <h1 className={`text-3xl font-black mb-2 transition-colors ${textPrimary}`}>Dashboard</h1>
            <p className={`mb-8 transition-colors ${textSecondary}`}>Statistik dan analisis dari latihan kamu sejauh ini.</p>

            {!user && (
                <div className="bg-blue-600/10 border-2 border-blue-600/20 rounded-2xl p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
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
                <div className="bg-blue-50 text-blue-700 p-4 rounded-lg mb-4" role="alert">
                    {error}
                </div>
            )}

            {actionError && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-lg mb-4 flex items-start gap-3" role="alert">
                    <span className="text-xl">⚠️</span>
                    <div>
                        <div className="font-bold">Terjadi Kendala</div>
                        <div className="text-sm">{actionError}</div>
                    </div>
                    <button onClick={() => setActionError(null)} className="ml-auto text-amber-500 hover:text-amber-700">&times;</button>
                </div>
            )}

            {/* ── Overview Cards ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
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
                <div className={`rounded-2xl border-2 p-6 flex flex-col justify-center items-center transition-colors ${cardBase}`}>
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${accuracy >= 80 ? 'bg-green-500/10 text-green-500' : accuracy >= 50 ? 'bg-yellow-500/10 text-yellow-500' : 'bg-blue-600/10 text-blue-600'}`}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                    </div>
                    <div className={`text-4xl font-black mb-1 ${accuracy >= 80 ? 'text-green-500' : accuracy >= 50 ? 'text-yellow-500' : 'text-blue-500'}`}>{accuracy}%</div>
                    <div className={`text-sm font-black mb-2 ${accuracy === 100 ? 'text-purple-500' : accuracy >= 90 ? 'text-green-500' : accuracy >= 80 ? 'text-blue-500' : accuracy >= 50 ? 'text-yellow-500' : 'text-blue-500'}`}>
                        {accuracy === 100 ? 'Sangat Baik' : accuracy >= 90 ? 'Baik Sekali' : accuracy >= 80 ? 'Baik' : accuracy >= 50 ? 'Cukup Baik' : 'Perbaiki Lagi'}
                    </div>
                    <div className={`text-xs font-black uppercase tracking-widest mb-3 transition-colors ${textMuted}`}>Akurasi</div>
                    <div className={`w-full rounded-full h-2 ${tc('bg-gray-800', 'bg-gray-100')}`}>
                        <div className={`h-2 rounded-full transition-all duration-700 ${accuracy >= 80 ? 'bg-green-500' : accuracy >= 50 ? 'bg-yellow-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(Math.max(accuracy, 0), 100)}%` }} />
                    </div>
                </div>

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

            {/* ── Level Accuracy ── */}
            {levelStats.length > 0 ? (
                <div className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <h2 className={`text-xl font-black mb-4 flex items-center gap-2 transition-colors ${levelStats.length <= 3 ? 'justify-center' : ''} ${textPrimary}`}>
                        <span className="bg-blue-600 text-white p-1.5 rounded-xl shadow-sm shadow-blue-500/20">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
                            </svg>
                        </span>
                        Akurasi per Level JLPT
                    </h2>
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
                                className={`p-6 rounded-3xl border-2 transition-all hover:scale-[1.03] flex flex-col ${
                                    levelStats.length === 2
                                        ? 'w-[18rem] sm:w-[20rem]'
                                        : levelStats.length === 3
                                            ? 'w-56 sm:w-60'
                                            : levelStats.length === 4
                                                ? 'w-full'
                                                : ''
                                } ${tc('bg-black/20 border-blue-900/20', 'bg-white border-gray-100')}`}
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
                </div>
            ) : (
                <div className={`mb-10 rounded-2xl border-2 p-8 flex flex-col items-center justify-center gap-3 transition-colors ${cardBase}`}>
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

            {/* ── Analisis Kakitori (Latihan Dikte) ── */}
            {/* Tampil untuk semua user (guest & login) selama ada data kakitori */}
            {hasKakitoriData ? (
                <div className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <h2 className={`text-xl font-black mb-4 flex items-center gap-2 transition-colors ${textPrimary}`}>
                        <span className="bg-purple-600 text-white p-1.5 rounded-xl shadow-sm shadow-purple-500/20">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.414 1.414m0 0a9 9 0 01-1.414-1.414m11.314-11.314a9 9 0 00-12.728 0" />
                            </svg>
                        </span>
                        Analisis Kakitori (Latihan Dikte)
                        {!user && (
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ml-2 ${tc('bg-purple-900/40 text-purple-400', 'bg-purple-100 text-purple-700')}`}>
                                Mode Tamu
                            </span>
                        )}
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Card 1: Statistik Umum */}
                        <div className={`rounded-2xl border-2 p-6 transition-colors ${tc('bg-[#0a0a0a] border-purple-900/20', 'bg-white border-gray-100')}`}>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-purple-600/10 flex items-center justify-center">
                                    <span className="text-xl">🎧</span>
                                </div>
                                <div>
                                    <div className={`font-black text-sm transition-colors ${textPrimary}`}>Total Latihan Dikte</div>
                                    <div className="text-2xl font-black text-purple-600">
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
                                    <div className={`text-2xl font-black ${(kakitoriStats.accuracy || 0) >= 70 ? 'text-green-500' : (kakitoriStats.accuracy || 0) >= 40 ? 'text-yellow-500' : 'text-purple-500'}`}>
                                        {Math.round(kakitoriStats.accuracy || 0)}%
                                    </div>
                                </div>
                            </div>
                            {/* Progress bar akurasi kakitori */}
                            <div className={`w-full rounded-full h-2 mt-4 ${tc('bg-gray-800', 'bg-gray-100')}`}>
                                <div
                                    className={`h-2 rounded-full transition-all duration-700 ${(kakitoriStats.accuracy || 0) >= 70 ? 'bg-green-500' : (kakitoriStats.accuracy || 0) >= 40 ? 'bg-yellow-500' : 'bg-purple-500'}`}
                                    style={{ width: `${Math.min(kakitoriStats.accuracy || 0, 100)}%` }}
                                />
                            </div>
                            <div className={`text-[10px] font-black uppercase tracking-widest mt-2 transition-colors ${textMuted}`}>
                                {kakitoriStats.correct || 0} benar dari {kakitoriStats.total_questions || 0} soal
                            </div>
                        </div>

                        {/* Card 2: Tips Kakitori */}
                        <div className={`rounded-2xl border-2 p-6 transition-colors ${tc('bg-[#0a0a0a] border-purple-900/20', 'bg-white border-gray-100')}`}>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-purple-600/10 flex items-center justify-center">
                                    <span className="text-xl">💡</span>
                                </div>
                                <div className={`font-black transition-colors ${textPrimary}`}>Tips Meningkatkan Dikte</div>
                            </div>
                            <ul className="space-y-2 text-sm">
                                <li className="flex items-start gap-2">
                                    <span className="text-purple-500 mt-0.5">•</span>
                                    <span className={`transition-colors ${textSecondary}`}>Dengarkan audio beberapa kali sebelum menjawab</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-purple-500 mt-0.5">•</span>
                                    <span className={`transition-colors ${textSecondary}`}>Perhatikan panjang pendek bunyi (つ vs っ, う vs お)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-purple-500 mt-0.5">•</span>
                                    <span className={`transition-colors ${textSecondary}`}>Latihan menulis sambil mendengar memperkuat memori</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-purple-500 mt-0.5">•</span>
                                    <span className={`transition-colors ${textSecondary}`}>Ulangi sesi dengan level lebih rendah jika akurasi di bawah 50%</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Card 3: Detail per Level (jika ada data breakdown) */}
                    {kakitoriStats.level_breakdown && kakitoriStats.level_breakdown.length > 0 && (
                        <div className={`mt-6 rounded-2xl border-2 p-6 transition-colors ${tc('bg-[#0a0a0a] border-purple-900/20', 'bg-white border-gray-100')}`}>
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
                                            <span className={`font-black ${level.accuracy >= 70 ? 'text-green-500' : level.accuracy >= 40 ? 'text-yellow-500' : 'text-purple-500'}`}>
                                                {Math.round(level.accuracy)}% ({level.correct}/{level.total})
                                            </span>
                                        </div>
                                        <div className={`w-full rounded-full h-2 ${tc('bg-gray-800', 'bg-gray-100')}`}>
                                            <div
                                                className={`h-2 rounded-full transition-all duration-700 ${level.accuracy >= 70 ? 'bg-green-500' : level.accuracy >= 40 ? 'bg-yellow-500' : 'bg-purple-500'}`}
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
                /* Jika belum ada data kakitori: tampilkan CTA kakitori */
                <div className={`mb-10 rounded-2xl border-2 p-8 flex flex-col md:flex-row items-center justify-between gap-6 transition-colors ${tc('bg-[#0a0a0a] border-purple-900/20', 'bg-white border-gray-100')}`}>
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-purple-600/10 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">🎧</div>
                        <div>
                            <h3 className={`font-black text-lg transition-colors ${textPrimary}`}>Belum Ada Data Kakitori</h3>
                            <p className={`text-sm transition-colors ${textSecondary}`}>
                                Coba mode Kakitori (Latihan Dikte) untuk melihat analisis kemampuan mendengar kamu di sini.
                            </p>
                        </div>
                    </div>
                    <Link
                        href="/practice?mode=kakitori"
                        className="flex-shrink-0 bg-purple-600 text-white px-6 py-3 rounded-2xl font-black text-sm hover:bg-purple-700 hover:scale-[1.03] transition-all shadow-lg shadow-purple-500/20"
                    >
                        Coba Kakitori →
                    </Link>
                </div>
            )}

            {/* ── Analysis: Sering Salah + Statistik Kategori ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">

                {/* Left: Top Mistakes */}
                <div className={`rounded-2xl border-2 overflow-hidden transition-colors ${cardBase}`}>
                    <div className={`border-b px-6 py-4 flex items-center justify-between transition-colors ${cardHeaderBase}`}>
                        <h2 className={`text-lg font-black flex items-center gap-2 transition-colors ${textPrimary}`}>
                            <span className="bg-blue-600 text-white p-1.5 rounded-xl shadow-sm shadow-blue-500/20">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            </span>
                            Sering Salah
                        </h2>
                        <Link href="/dashboard/history" className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-500 flex items-center gap-1 transition-colors">
                            Lihat Semua →
                        </Link>
                    </div>
                    <div className="p-6">
                        {topMistakes.length > 0 ? (
                            <div className="space-y-3">
                                {topMistakes.slice(0, 5).map((mistake, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleOpenMistake(mistake)}
                                        className={`w-full flex items-center justify-between group cursor-pointer p-3 rounded-xl border-2 transition-all hover:border-blue-500 hover:scale-[1.01] active:scale-[0.99] text-left ${tc('bg-black/20 border-blue-900/20 hover:bg-blue-900/10', 'bg-white border-gray-100 hover:bg-blue-50/50')}`}
                                    >
                                        <div className="flex items-center gap-3 min-w-0 flex-1 mr-4">
                                            <div className={`h-10 px-2 min-w-[2.5rem] rounded-xl bg-blue-600 text-white flex items-center justify-center font-black shadow-sm shadow-blue-500/20 group-hover:rotate-3 transition-transform flex-shrink-0 ${(mistake.character?.length || 0) > 4 ? 'text-xs' : (mistake.character?.length || 0) > 2 ? 'text-sm' : 'text-lg'}`}>
                                                {mistake.character || '?'}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className={`font-black truncate transition-colors ${textPrimary}`} title={mistake.character}>{mistake.character}</div>
                                                <div className={`text-[10px] font-black uppercase tracking-widest transition-colors ${textMuted}`}>{getMistakeTypeLabel(mistake.type)}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 flex-shrink-0">
                                            <div className="text-right">
                                                <div className="font-black text-blue-600 text-lg leading-none">{mistake.count}x</div>
                                                <div className={`text-[10px] font-bold ${textMuted}`}>salah</div>
                                            </div>
                                            <span className={`transition-colors text-lg ${tc('text-gray-700 group-hover:text-blue-500', 'text-gray-300 group-hover:text-blue-500')}`}>→</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10 flex flex-col items-center gap-3">
                                <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center">
                                    <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                </div>
                                <p className={`font-black transition-colors ${textPrimary}`}>Belum ada kesalahan tercatat.</p>
                                <p className={`text-sm transition-colors ${textMuted}`}>Terus berlatih untuk melihat analisis kesalahanmu di sini.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Category Stats */}
                <div className={`rounded-2xl border-2 overflow-hidden transition-colors ${cardBase}`}>
                    <div className={`border-b px-6 py-4 flex items-center justify-between transition-colors ${cardHeaderBase}`}>
                        <h2 className={`text-lg font-black flex items-center gap-2 transition-colors ${textPrimary}`}>
                            <span className="bg-blue-600 text-white p-1.5 rounded-xl shadow-sm shadow-blue-500/20">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"/></svg>
                            </span>
                            Statistik Kategori
                        </h2>
                    </div>
                    <div className="p-6 space-y-5">
                        {(() => {
                            const kanjiCount   = topMistakes.filter(m => m.type === 'kanji').reduce((s, m) => s + m.count, 0);
                            const kotobaCount  = topMistakes.filter(m => m.type === 'vocab' || m.type === 'kotoba').reduce((s, m) => s + m.count, 0);
                            const grammarCount = topMistakes.filter(m => m.type === 'grammar' || m.type === 'bunpo').reduce((s, m) => s + m.count, 0);
                            const total        = kanjiCount + kotobaCount + grammarCount;
                            const categories   = [
                                { label: 'Kanji',       icon: '語', count: kanjiCount,   pct: total ? Math.round(kanjiCount   / total * 100) : 0, color: 'bg-blue-500',   href: '/kanji'  },
                                { label: 'Kotoba',      icon: '文', count: kotobaCount,  pct: total ? Math.round(kotobaCount  / total * 100) : 0, color: 'bg-indigo-500', href: '/kotoba' },
                                { label: 'Tata Bahasa', icon: '法', count: grammarCount, pct: total ? Math.round(grammarCount / total * 100) : 0, color: 'bg-sky-500',    href: '/bunpo'  },
                            ];
                            if (!total) {
                                return (
                                    <div className="flex flex-col items-center justify-center py-6 gap-3">
                                        <div className="text-4xl">📚</div>
                                        <p className={`font-black text-lg transition-colors ${textPrimary}`}>Belum Ada Data Kategori</p>
                                        <p className={`text-sm text-center transition-colors ${textMuted}`}>Statistik per kategori muncul setelah kamu mulai berlatih.</p>
                                        <div className="grid grid-cols-3 gap-3 w-full mt-4">
                                            {[
                                                { label: 'Kanji',       icon: '語', href: '/kanji',  color: 'bg-blue-500/10 text-blue-600' },
                                                { label: 'Kotoba',      icon: '文', href: '/kotoba', color: 'bg-indigo-500/10 text-indigo-600' },
                                                { label: 'Tata Bahasa', icon: '法', href: '/bunpo',  color: 'bg-sky-500/10 text-sky-600' },
                                            ].map(c => (
                                                <Link key={c.label} href={c.href} className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 hover:scale-[1.03] transition-all ${tc('border-blue-900/20', 'border-gray-100')}`}>
                                                    <span className={`text-2xl font-black rounded-xl px-2 py-1 ${c.color}`}>{c.icon}</span>
                                                    <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${textMuted}`}>{c.label}</span>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                );
                            }
                            return categories.map(cat => (
                                <div key={cat.label}>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className={`w-7 h-7 rounded-lg ${cat.color} text-white flex items-center justify-center text-xs font-black`}>{cat.icon}</span>
                                            <span className={`font-black text-sm transition-colors ${tc('text-gray-200', 'text-gray-800')}`}>{cat.label}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${textMuted}`}>{cat.count} salah</span>
                                            <span className="font-black text-sm text-blue-500">{cat.pct}%</span>
                                        </div>
                                    </div>
                                    <div className={`w-full rounded-full h-2.5 ${tc('bg-gray-800', 'bg-gray-100')}`}>
                                        <div className={`h-2.5 rounded-full ${cat.color} transition-all duration-700`} style={{ width: `${cat.pct || 0}%` }} />
                                    </div>
                                </div>
                            ));
                        })()}
                    </div>
                </div>
            </div>

            {/* ── Insights + Sidebar ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
                <div className="lg:col-span-2 space-y-6">
                    <h2 className={`text-2xl font-black flex items-center gap-3 transition-colors ${textPrimary}`}>
                        <span className="bg-sky-600 text-white p-2 rounded-2xl shadow-lg shadow-sky-500/20">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        </span>
                        Saran Belajar & Insight
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                        {/* Insight Kakitori jika ada data */}
                        {hasKakitoriData && (
                            <div className={`p-6 rounded-[2rem] border-2 shadow-sm transition-all hover:shadow-md group sm:col-span-2 ${tc('bg-[#0a0a0a]/60 border-purple-900/20', 'bg-white border-purple-100')}`}>
                                <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/30 flex items-center justify-center text-purple-600 mb-4 group-hover:scale-110 transition-transform">
                                    <span className="text-xl">🎧</span>
                                </div>
                                <h3 className={`font-black text-lg mb-2 transition-colors ${textPrimary}`}>
                                    {(kakitoriStats.accuracy || 0) < 50
                                        ? 'Tingkatkan Kemampuan Mendengar'
                                        : (kakitoriStats.accuracy || 0) < 75
                                        ? 'Progres Kakitori Bagus!'
                                        : 'Kemampuan Dikte Sangat Baik!'}
                                </h3>
                                <p className={`text-sm leading-relaxed transition-colors ${textSecondary}`}>
                                    {(kakitoriStats.accuracy || 0) < 50
                                        ? `Akurasi dikte kamu saat ini ${Math.round(kakitoriStats.accuracy || 0)}%. Coba latihan di level yang lebih rendah dulu, dan dengarkan audio berulang kali sebelum menjawab.`
                                        : (kakitoriStats.accuracy || 0) < 75
                                        ? `Akurasi dikte kamu ${Math.round(kakitoriStats.accuracy || 0)}%. Terus berlatih dan perhatikan pola kosakata yang sering salah.`
                                        : `Akurasi dikte kamu mencapai ${Math.round(kakitoriStats.accuracy || 0)}%! Coba tantang dirimu dengan level yang lebih tinggi.`}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Quick Tips */}
                    <div className={`p-8 rounded-[2.5rem] border-2 transition-colors ${tc('bg-black/20 border-white/5', 'bg-white border-gray-100')}`}>
                        <h4 className={`text-sm font-black uppercase tracking-widest mb-6 transition-colors ${textMuted}`}>💡 Tips Cepat</h4>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-4">
                                <div className="w-2 h-2 rounded-full bg-green-500 mt-2 shrink-0" />
                                <p className={`text-sm italic transition-colors ${textSecondary}`}>"Istirahat sejenak setelah 15–20 menit belajar membantu otak memproses informasi lebih baik."</p>
                            </li>
                            <li className="flex items-start gap-4">
                                <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 shrink-0" />
                                <p className={`text-sm italic transition-colors ${textSecondary}`}>"Belajar sedikit setiap hari jauh lebih efektif daripada belajar banyak dalam satu sesi marathon."</p>
                            </li>
                            {accuracy < 70 && (
                                <li className="flex items-start gap-4">
                                    <div className="w-2 h-2 rounded-full bg-yellow-500 mt-2 shrink-0" />
                                    <p className={`text-sm italic transition-colors ${textSecondary}`}>"Jangan terburu-buru. Membaca soal dengan teliti bisa meningkatkan akurasi hingga 30%."</p>
                                </li>
                            )}
                            {topMistakes.some(m => m.type === 'particle') && (
                                <li className="flex items-start gap-4">
                                    <div className="w-2 h-2 rounded-full bg-pink-500 mt-2 shrink-0" />
                                    <p className={`text-sm italic transition-colors ${textSecondary}`}>"Partikel seperti は dan が sering membingungkan. Fokus pada konteks kalimat untuk membedakannya."</p>
                                </li>
                            )}
                            {hasKakitoriData && (kakitoriStats.accuracy || 0) < 60 && (
                                <li className="flex items-start gap-4">
                                    <div className="w-2 h-2 rounded-full bg-purple-500 mt-2 shrink-0" />
                                    <p className={`text-sm italic transition-colors ${textSecondary}`}>"Untuk Kakitori, coba putar audio minimal 2–3 kali sambil memvisualisasikan tulisan kana-nya di kepala."</p>
                                </li>
                            )}
                            <li className="flex items-start gap-4">
                                <div className="w-2 h-2 rounded-full bg-orange-500 mt-2 shrink-0" />
                                <p className={`text-sm italic transition-colors ${textSecondary}`}>"Ulangi materi yang sudah kamu pelajari secara berkala — teknik spaced repetition terbukti efektif."</p>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Sidebar: Quick Actions */}
                <div className="space-y-5">
                    <h2 className={`text-2xl font-black transition-colors ${textPrimary}`}>Aksi Cepat</h2>
                    <div className="space-y-4">
                        <button
                            onClick={() => router.push('/practice')}
                            className="w-full p-6 rounded-[2rem] bg-gradient-to-br from-blue-600 to-sky-500 text-white text-left shadow-lg shadow-blue-600/20 hover:scale-[1.02] transition-all group overflow-hidden relative"
                        >
                            <div className="relative z-10">
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Rekomendasi</span>
                                <h4 className="text-xl font-black mt-1">Latihan N{weakestLevel?.level || 5}</h4>
                                <p className="text-xs mt-2 opacity-80">10 menit untuk meningkatkan akurasi level terlemahmu.</p>
                            </div>
                            <div className="absolute right-[-10%] bottom-[-20%] text-white/10 text-8xl font-black select-none group-hover:rotate-12 transition-transform">N</div>
                        </button>

                        {/* CTA Kakitori di sidebar */}
                        <button
                            onClick={() => router.push('/practice?mode=kakitori')}
                            className="w-full p-6 rounded-[2rem] bg-gradient-to-br from-purple-600 to-purple-500 text-white text-left shadow-lg shadow-purple-600/20 hover:scale-[1.02] transition-all group overflow-hidden relative"
                        >
                            <div className="relative z-10">
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Latihan Dikte</span>
                                <h4 className="text-xl font-black mt-1">Kakitori</h4>
                                <p className="text-xs mt-2 opacity-80">
                                    {hasKakitoriData
                                        ? `Akurasi kamu: ${Math.round(kakitoriStats.accuracy || 0)}% — terus tingkatkan!`
                                        : 'Latih kemampuan mendengar dan menulis kana.'}
                                </p>
                            </div>
                            <div className="absolute right-[-10%] bottom-[-20%] text-white/10 text-8xl font-black select-none group-hover:rotate-12 transition-transform">🎧</div>
                        </button>

                        <Link
                            href="/dashboard/history"
                            className={`w-full p-6 rounded-[2rem] border-2 text-left hover:border-blue-500/50 transition-all group flex flex-col ${tc('bg-[#0a0a0a] border-white/10', 'bg-white border-gray-100')}`}
                        >
                            <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${tc('text-blue-400', 'text-blue-600')}`}>Riwayat</span>
                            <h4 className={`text-xl font-black mt-1 transition-colors ${textPrimary}`}>Lihat Semua Jawaban</h4>
                            <p className={`text-xs mt-2 transition-colors ${textMuted}`}>Review semua soal yang pernah kamu jawab sebelumnya.</p>
                        </Link>
                    </div>
                </div>
            </div>

            {/* ── Management Section ── */}
            <div className={`rounded-2xl border-2 overflow-hidden transition-colors ${cardBase}`}>
                <div className={`border-b px-6 py-4 flex items-center gap-3 transition-colors ${cardHeaderBase}`}>
                    <span className={`p-1.5 rounded-xl transition-colors ${tc('bg-gray-800 text-gray-400', 'bg-gray-200 text-gray-600')}`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </span>
                    <h2 className={`text-lg font-black transition-colors ${textPrimary}`}>Manajemen Data</h2>
                    {!user && (
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ml-auto ${tc('bg-blue-900/40 text-blue-400', 'bg-blue-100 text-blue-700')}`}>
                            Termasuk data Kakitori
                        </span>
                    )}
                </div>
                <div className="p-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <button
                            onClick={handleExport}
                            disabled={isExporting}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-black transition-all hover:border-blue-500/50 disabled:opacity-50 ${tc('bg-black/20 border-white/10 text-gray-300 hover:text-white', 'bg-white border-gray-200 text-gray-700 hover:text-gray-900')}`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            {isExporting ? 'Mengekspor...' : 'Export Data (.json)'}
                        </button>
                        <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-black transition-all hover:border-blue-500/50 cursor-pointer ${isImporting ? 'opacity-50 pointer-events-none' : ''} ${tc('bg-black/20 border-white/10 text-gray-300 hover:text-white', 'bg-white border-gray-200 text-gray-700 hover:text-gray-900')}`}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                            {isImporting ? 'Mengimpor...' : 'Import Data (.json)'}
                            <input type="file" accept=".json" className="sr-only" onChange={handleImport} disabled={isImporting} />
                        </label>
                    </div>
                    <p className={`mt-4 text-xs text-center transition-colors ${textMuted}`}>
                        Cadangkan atau pindahkan riwayat latihan kamu ke perangkat lain. Data kakitori ikut tersimpan dalam file yang sama.
                    </p>
                </div>
            </div>

            {/* Detail View Overlay */}
            {detailView && (
                <div className="fixed inset-0 z-[110]">
                    {detailView.type === 'kanji' && (
                        <KanjiDetailModal id={detailView.id} onClose={() => setDetailView(null)} />
                    )}
                    {(detailView.type === 'vocab' || detailView.type === 'kotoba') && (
                        <KotobaDetailModal id={detailView.id} onClose={() => setDetailView(null)} />
                    )}
                    {(detailView.type === 'grammar' || detailView.type === 'bunpo') && (
                        <BunpoDetailModal id={detailView.id} onClose={() => setDetailView(null)} />
                    )}
                </div>
            )}
        </div>
    );
}