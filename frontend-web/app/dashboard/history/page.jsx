'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'next/navigation';
import { getUserAnalytics, resolveContentId } from '@/lib/api';
import Link from 'next/link';
import KanjiDetailModal from '@/components/kanji/KanjiDetailModal';
import KotobaDetailModal from '@/components/kotoba/KotobaDetailModal';
import BunpoDetailModal from '@/components/bunpo/BunpoDetailModal';
import { toast } from 'react-toastify';

export default function HistoryPage() {
    const { user, loading } = useAuth();
    const { theme, mounted } = useTheme();
    const router = useRouter();
    const [analytics, setAnalytics] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [detailView, setDetailView] = useState(null);
    const [filterType, setFilterType] = useState('all');
    const [sortBy, setSortBy] = useState('count'); // 'count' | 'alpha'

    // Resolve character → ID (online: from API, offline: from IndexedDB)
    const handleOpenMistake = async (mistake) => {
        try {
            const id = await resolveContentId(mistake.type, mistake.character);
            if (id) {
                setDetailView({ id, type: mistake.type });
            } else {
                toast.error(`Detail untuk "${mistake.character}" tidak ditemukan. Jika offline, pastikan kamu sudah mengunduh materi.`, {
                    position: "bottom-center",
                    theme: theme === 'dark' ? 'dark' : 'colored'
                });
            }
        } catch (err) {
            console.error('[jbook] handleOpenMistake error:', err);
        }
    };

    useEffect(() => {
        if (!user && !loading) {
            router.push('/login');
            return;
        }
        if (user) {
            getUserAnalytics().then(data => {
                setAnalytics(data);
            }).catch(console.error).finally(() => setIsLoading(false));
        }
    }, [user, loading]);

    const textColor = !mounted ? 'text-black' : (theme === 'dark' ? 'text-white' : 'text-black');
    const subTextColor = !mounted ? 'text-gray-400' : (theme === 'dark' ? 'text-gray-500' : 'text-gray-400');
    const cardBg = !mounted ? 'bg-white' : (theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-white');
    const borderStyle = !mounted ? 'border-gray-100' : (theme === 'dark' ? 'border-red-950/20' : 'border-gray-100');
    const pageBg = !mounted ? 'bg-gray-50' : (theme === 'dark' ? 'bg-black' : 'bg-gray-50');

    const getMistakeTypeLabel = (type) => {
        switch (type) {
            case 'kanji': return 'Kanji';
            case 'vocab':
            case 'kotoba': return 'Kotoba';
            case 'grammar':
            case 'bunpo': return 'Bunpo';
            default: return 'Lainnya';
        }
    };

    const rawMistakes = analytics?.wrong_stats || [];
    
    // Satukan data yang sama (karakter & tipe sama) agar tidak double
    const groupedMistakes = rawMistakes.reduce((acc, current) => {
        // Konsistensi tipe: pastikan 'bunpo' diperlakukan sebagai 'grammar'
        const type = current.type === 'bunpo' ? 'grammar' : current.type;
        const key = `${type}-${current.character}`;
        
        if (!acc[key]) {
            acc[key] = { ...current, type, count: current.count || 0 };
        } else {
            acc[key].count += (current.count || 0);
            // Opsional: Jika status terbaru adalah 'Perbaiki', gunakan itu
            if (current.status === 'Perbaiki') acc[key].status = 'Perbaiki';
        }
        return acc;
    }, {});

    const allMistakes = Object.values(groupedMistakes);
    const totalSalah = allMistakes.reduce((sum, m) => sum + (m.count || 0), 0);
    const filtered = filterType === 'all'
        ? allMistakes
        : allMistakes.filter(m => {
            if (filterType === 'grammar') return m.type === 'grammar' || m.type === 'bunpo';
            if (filterType === 'vocab') return m.type === 'vocab' || m.type === 'kotoba';
            return m.type === filterType;
        });
    const sorted = [...filtered].sort((a, b) =>
        sortBy === 'count' ? b.count - a.count : a.character.localeCompare(b.character)
    );

    if (loading || isLoading) {
        return (
            <div className={`min-h-screen ${pageBg} flex items-center justify-center`}>
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin w-10 h-10 rounded-full border-4 border-red-600 border-t-transparent"></div>
                    <p className={`text-xs font-black uppercase tracking-widest animate-pulse ${subTextColor}`}>Memuat histori...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen ${pageBg}`}>
            <div className="container mx-auto px-4 py-12 max-w-4xl">

                {/* Header */}
                <div className="mb-10">
                    <Link
                        href="/dashboard"
                        className={`inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest mb-6 hover:text-red-600 transition-colors ${subTextColor}`}
                    >
                        ← Kembali ke Dashboard
                    </Link>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <h1 className={`text-4xl font-black tracking-tight transition-colors ${textColor}`}>
                                Histori <span className="text-red-600">Kesalahan</span>
                            </h1>
                            <p className={`mt-2 font-bold transition-colors ${subTextColor}`}>
                                {allMistakes.length > 0
                                    ? `${allMistakes.length} materi yang pernah salah kamu jawab`
                                    : 'Belum ada riwayat kesalahan'}
                            </p>
                        </div>

                        {/* Stats badges */}
                        <div className="flex gap-3 flex-wrap">
                            <div className={`px-4 py-2 rounded-2xl border ${cardBg} ${borderStyle} text-center min-w-[80px]`}>
                                <div className="text-2xl font-black text-red-600">{analytics?.total_attempts || 0}</div>
                                <div className={`text-[9px] font-black uppercase tracking-widest ${subTextColor}`}>Total Soal</div>
                            </div>
                            <div className={`px-4 py-2 rounded-2xl border ${cardBg} ${borderStyle} text-center min-w-[80px]`}>
                                <div className="text-2xl font-black text-red-600">{analytics?.accuracy || 0}%</div>
                                <div className={`text-[9px] font-black uppercase tracking-widest ${subTextColor}`}>Akurasi</div>
                            </div>
                            <div className={`px-4 py-2 rounded-2xl border ${cardBg} ${borderStyle} text-center min-w-[80px]`}>
                                <div className="text-2xl font-black text-red-600">{totalSalah}</div>
                                <div className={`text-[9px] font-black uppercase tracking-widest ${subTextColor}`}>Total Salah</div>
                            </div>
                            <div className={`px-4 py-2 rounded-2xl border ${cardBg} ${borderStyle} text-center min-w-[80px]`}>
                                <div className="text-2xl font-black text-red-600">{allMistakes.length}</div>
                                <div className={`text-[9px] font-black uppercase tracking-widest ${subTextColor}`}>Materi Salah</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Export Action */}
                {allMistakes.length > 0 && (
                    <div className="flex justify-end mb-4">
                        <button
                            onClick={() => {
                                const csvLines = ['Karakter/Materi,Tipe,Jumlah Salah,Status'];
                                sorted.forEach(m => {
                                    const typeLabel = getMistakeTypeLabel(m.type === 'bunpo' ? 'grammar' : m.type);
                                    csvLines.push(`"${m.character}","${typeLabel}",${m.count},"${m.status || ''}"`);
                                });
                                const blob = new Blob([csvLines.join('\n')], { type: 'text/csv' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `histori_kesalahan_${new Date().toISOString().split('T')[0]}.csv`;
                                a.click();
                            }}
                            className={`flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl transition-all ${
                                theme === 'dark' ? 'bg-red-950/20 text-red-400 hover:bg-red-950/40' : 'bg-red-50 text-red-600 hover:bg-red-100'
                            }`}
                        >
                            <span>📥</span> Ekspor Csv Histori
                        </button>
                    </div>
                )}

                {/* Filter & Sort Controls */}
                {allMistakes.length > 0 && (
                    <div className={`${cardBg} border ${borderStyle} rounded-2xl p-4 mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between transition-colors`}>
                        {/* Type Filter */}
                        <div className="flex gap-2 flex-wrap">
                            {[
                                { id: 'all', label: 'Semua' },
                                { id: 'kanji', label: 'Kanji' },
                                { id: 'vocab', label: 'Kotoba' },
                                { id: 'grammar', label: 'Bunpo' },
                            ].map(f => (
                                <button
                                    key={f.id}
                                    onClick={() => setFilterType(f.id)}
                                    className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                        filterType === f.id
                                            ? 'bg-red-600 text-white shadow-md shadow-red-500/20'
                                            : `${theme === 'dark' ? 'bg-red-950/10 text-gray-400 hover:text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`
                                    }`}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>

                        {/* Sort */}
                        <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-black uppercase tracking-widest ${subTextColor}`}>Urutkan:</span>
                            <button
                                onClick={() => setSortBy('count')}
                                className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${sortBy === 'count' ? 'bg-red-600 text-white' : `${subTextColor} hover:text-red-600`}`}
                            >
                                Terbanyak
                            </button>
                            <button
                                onClick={() => setSortBy('alpha')}
                                className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${sortBy === 'alpha' ? 'bg-red-600 text-white' : `${subTextColor} hover:text-red-600`}`}
                            >
                                A–Z
                            </button>
                        </div>
                    </div>
                )}

                {/* Mistake List */}
                {sorted.length > 0 ? (
                    <div className="space-y-3">
                        {sorted.map((mistake, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleOpenMistake(mistake)}
                                className={`w-full flex items-center justify-between group p-3 sm:p-5 rounded-2xl border-2 transition-all hover:border-red-500 hover:scale-[1.005] cursor-pointer text-left ${!mounted ? 'bg-white border-gray-100' : (theme === 'dark' ? 'bg-[#0a0a0a] border-red-950/20 hover:bg-red-950/10' : 'bg-white border-gray-100 hover:bg-red-50/40')}`}
                            >
                                <div className="flex items-center gap-2 sm:gap-5 min-w-0 flex-1 mr-2 sm:mr-4">
                                    {/* Rank badge - hidden on very small screens to save space */}
                                    <div className={`hidden xs:flex w-6 h-6 sm:w-7 sm:h-7 rounded-full items-center justify-center text-[9px] sm:text-[10px] font-black flex-shrink-0 ${idx === 0 ? 'bg-red-600 text-white shadow-md shadow-red-500/20' : idx === 1 ? 'bg-orange-500 text-white' : idx === 2 ? 'bg-yellow-500 text-white' : (theme === 'dark' ? 'bg-red-950/20 text-gray-600' : 'bg-gray-100 text-gray-400')}`}>
                                        {idx + 1}
                                    </div>
                                    
                                    {/* Character icon - dynamic width */}
                                    <div className={`h-10 sm:h-12 px-2 min-w-[2.5rem] sm:min-w-[3rem] rounded-xl sm:rounded-2xl bg-red-600 text-white flex items-center justify-center font-black flex-shrink-0 shadow-md shadow-red-500/20 group-hover:rotate-3 transition-transform ${
                                        (mistake.character?.length || 0) > 4 ? 'text-xs' : (mistake.character?.length || 0) > 2 ? 'text-sm' : 'text-lg'
                                    }`}>
                                        {mistake.character || '?'}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <h3 className={`font-black text-base sm:text-xl leading-none mb-1 truncate transition-colors ${textColor}`}>{mistake.character}</h3>
                                        <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-1 sm:mt-2">
                                            <span className={`text-[8px] sm:text-[9px] font-black uppercase tracking-widest px-1.5 sm:px-2 py-0.5 rounded-full ${theme === 'dark' ? 'bg-red-950/20 text-red-400' : 'bg-red-50 text-red-600'}`}>
                                                {getMistakeTypeLabel(mistake.type)}
                                            </span>
                                            {mistake.status && (
                                                <span className={`text-[8px] sm:text-[9px] font-black uppercase tracking-widest px-1.5 sm:px-2 py-0.5 rounded-full flex items-center gap-1 ${
                                                    mistake.status === 'Perbaiki' 
                                                        ? 'bg-red-600 text-white' 
                                                        : mistake.status === 'Cukup'
                                                                ? 'bg-orange-500 text-white'
                                                                : 'bg-emerald-500 text-white'
                                                }`}>
                                                    {mistake.status}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                                    <div className="flex flex-col items-end">
                                        <div className="text-lg sm:text-2xl font-black text-red-600 leading-none">{mistake.count}x</div>
                                        <div className={`text-[8px] sm:text-[10px] font-black uppercase tracking-widest ${subTextColor}`}>salah</div>
                                    </div>
                                    <span className={`text-sm sm:text-xl transition-colors group-hover:text-red-500 group-hover:translate-x-1 transform transition-transform ${subTextColor}`}>→</span>
                                </div>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className={`${cardBg} border-2 border-dashed ${borderStyle} rounded-3xl py-24 text-center transition-colors`}>
                        <div className="text-6xl mb-6">🎉</div>
                        <h2 className={`text-2xl font-black mb-2 transition-colors ${textColor}`}>
                            {filterType === 'all' ? 'Belum ada kesalahan!' : `Tidak ada kesalahan di ${getMistakeTypeLabel(filterType)}`}
                        </h2>
                        <p className={`text-sm font-bold transition-colors ${subTextColor}`}>
                            {filterType === 'all' ? 'Ayo mulai latihan untuk melihat analisisnya.' : 'Coba filter lain atau mulai latihan baru.'}
                        </p>
                        <Link href="/practice" className="inline-block mt-6 bg-red-600 hover:bg-red-700 text-white font-black px-8 py-3 rounded-xl transition-all shadow-lg shadow-red-500/20">
                            Mulai Latihan
                        </Link>
                    </div>
                )}

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
        </div>
    );
}
