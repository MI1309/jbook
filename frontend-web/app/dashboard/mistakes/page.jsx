'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { getUserAnalytics, resolveContentId } from '@/lib/api';
import { getGuestAnalytics } from '@/lib/local-analytics';
import KanjiDetailModal from '@/components/kanji/KanjiDetailModal';
import KotobaDetailModal from '@/components/kotoba/KotobaDetailModal';
import BunpoDetailModal from '@/components/bunpo/BunpoDetailModal';
import { toast } from 'react-toastify';
import Link from 'next/link';

export default function MistakesPage() {
    const { user, loading } = useAuth();
    const { theme, mounted } = useTheme();
    const [analytics, setAnalytics] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
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
                <p className="text-sm font-bold text-blue-600 animate-pulse">Memuat Daftar Kesalahan...</p>
            </div>
        );
    }

    // Deduplicate wrong_stats
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

    const tc = (dark, light) => !mounted ? light : (theme === 'dark' ? dark : light);
    const textPrimary = tc('text-white', 'text-gray-900');
    const textSecondary = tc('text-gray-400', 'text-gray-600');
    const textMuted = tc('text-gray-500', 'text-gray-400');
    const cardBase = tc('bg-[#0a0a0a] border-blue-900/20', 'bg-white border-gray-100');
    const cardHeaderBase = tc('bg-black/40 border-blue-900/20', 'bg-gray-50 border-gray-100');

    return (
        <div className="animate-in fade-in duration-500 space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Sering Salah */}
                <div className={`rounded-2xl border-2 overflow-hidden transition-colors ${cardBase}`}>
                    <div className={`border-b px-6 py-4 flex items-center justify-between transition-colors ${cardHeaderBase}`}>
                        <h2 className={`text-lg font-black flex items-center gap-2 transition-colors ${textPrimary}`}>
                            <span className="bg-blue-600 text-white p-1.5 rounded-xl shadow-sm shadow-blue-500/20">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            </span>
                            Sering Salah
                        </h2>
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

                {/* Statistik Kategori */}
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

            {/* Detail View Overlay Modal */}
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
