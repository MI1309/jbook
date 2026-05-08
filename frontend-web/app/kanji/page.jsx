'use client';

import { useState, useEffect, Suspense } from 'react';
import { getKanjiList } from '@/lib/api';
import KanjiFilter from '@/components/KanjiFilter';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import KanjiDetailModal from '@/components/KanjiDetailModal';

const levelStyles = {
    1: { border: 'border-red-200 dark:border-red-900/30', badge: 'bg-red-500 text-white border-red-500', glow: 'hover:border-red-400 hover:shadow-red-500/10 dark:hover:shadow-red-500/5', char: 'text-black dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400', bg: 'from-red-50/50 to-white dark:from-red-900/20 dark:to-card' },
    2: { border: 'border-orange-200 dark:border-orange-900/30', badge: 'bg-orange-500 text-white border-orange-500', glow: 'hover:border-orange-400 hover:shadow-orange-500/10 dark:hover:shadow-orange-500/5', char: 'text-black dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400', bg: 'from-orange-50/50 to-white dark:from-orange-900/20 dark:to-card' },
    3: { border: 'border-yellow-200 dark:border-yellow-900/30', badge: 'bg-yellow-500 text-white border-yellow-500', glow: 'hover:border-yellow-400 hover:shadow-yellow-500/10 dark:hover:shadow-yellow-500/5', char: 'text-black dark:text-white group-hover:text-yellow-600 dark:group-hover:text-yellow-400', bg: 'from-yellow-50/50 to-white dark:from-yellow-900/20 dark:to-card' },
    4: { border: 'border-teal-200 dark:border-teal-900/30', badge: 'bg-teal-500 text-white border-teal-500', glow: 'hover:border-teal-400 hover:shadow-teal-500/10 dark:hover:shadow-teal-500/5', char: 'text-black dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400', bg: 'from-teal-50/50 to-white dark:from-teal-900/20 dark:to-card' },
    5: { border: 'border-green-200 dark:border-green-900/30', badge: 'bg-green-500 text-white border-green-500', glow: 'hover:border-green-400 hover:shadow-green-500/10 dark:hover:shadow-green-500/5', char: 'text-black dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400', bg: 'from-green-50/50 to-white dark:from-green-900/20 dark:to-card' },
};

import { getScriptTypes } from '@/lib/utils';

function HighlightText({ text, query, active = true }) {
    if (!query || !active) return <span>{text}</span>;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
        <span>
            {parts.map((part, i) => 
                part.toLowerCase() === query.toLowerCase() ? 
                <mark key={i} className="bg-yellow-200 dark:bg-yellow-900/50 text-gray-900 dark:text-yellow-200 rounded-px px-0.5 no-underline">{part}</mark> : 
                part
            )}
        </span>
    );
}

import { useTheme } from '@/context/ThemeContext';

function KanjiContent() {
    const { theme, mounted } = useTheme();
    const searchParams = useSearchParams();
    const router = useRouter();
    const detailId = searchParams.get('detail');
    const [data, setData] = useState({ items: [], total: 0, pages: 1 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const page = parseInt(searchParams.get('page')) || 1;
    const level = searchParams.get('level');
    const search = searchParams.get('search');
    const radical = searchParams.get('radical');
    const limit = 30;

    const scriptTypes = getScriptTypes(search);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const result = await getKanjiList({ level, search, radical, limit, page });
                setData(result || { items: [], total: 0, pages: 1 });
            } catch (err) {
                console.error('[jbook-client] Gagal memuat data:', err.message);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [page, level, search, radical]);

    const kanjiList = data.items || [];
    const totalPages = data.pages || 1;
    const hasMore = page < totalPages;
    const totalCount = data.total || 0;

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-32 animate-pulse text-gray-400 dark:text-gray-600 font-black">
                <div className="text-6xl mb-4">🏮</div>
                <p className="tracking-widest uppercase text-sm">Sedang memuat Kanji...</p>
            </div>
        );
    }

    const textColor = !mounted ? 'text-black' : (theme === 'dark' ? 'text-white' : 'text-black');
    const subTextColor = !mounted ? 'text-gray-400' : (theme === 'dark' ? 'text-gray-500' : 'text-gray-500');
    const cardBg = !mounted ? 'bg-white' : (theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-white');

    return (
        <>
            {detailId && <KanjiDetailModal id={detailId} />}
            <div className={`flex justify-between items-center mb-6 text-[10px] font-black uppercase tracking-[0.2em] px-1 ${subTextColor}`}>
                <span>Total: {totalCount} Kanji</span>
                <span>Halaman {page} dari {totalPages}</span>
            </div>

            {kanjiList.length > 0 ? (
                <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4 mb-16">
                    {kanjiList.map((kanji) => {
                        const s = levelStyles[kanji.jlpt_level] ?? levelStyles[5];
                        return (
                            <Link
                                key={kanji.id}
                                href={`/kanji/${kanji.id}`}
                                onClick={(e) => {
                                    if (typeof navigator !== 'undefined' && !navigator.onLine) {
                                        e.preventDefault();
                                        const params = new URLSearchParams(searchParams.toString());
                                        params.set('detail', kanji.id);
                                        router.push(`?${params.toString()}`);
                                    }
                                }}
                                className={`group flex flex-col items-center justify-start ${cardBg} ${theme === 'dark' ? 'card-texture' : ''} rounded-[2.5rem] border-2 ${theme === 'dark' ? 'border-red-950/20' : s.border} ${s.glow} px-4 pt-3 pb-5 min-h-[220px] shadow-sm hover:shadow-2xl hover:shadow-brand/10 dark:hover:shadow-black/60 hover:-translate-y-2 active:scale-95 transition-all duration-300 ease-out relative overflow-hidden`}
                            >
                                <div className={`absolute inset-0 bg-gradient-to-b ${s.bg} opacity-10 group-hover:opacity-30 transition-opacity duration-300`} />
                                <div className="relative z-10 self-end flex gap-1 items-center mb-1">
                                    {scriptTypes.map(type => (
                                        <span key={type} className={`text-[7px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-tighter shadow-sm transition-colors ${theme === 'dark' ? 'bg-gray-800 text-gray-300' : 'bg-white border border-gray-200 text-gray-500'}`}>
                                            {type}
                                        </span>
                                    ))}
                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-xl border ${s.badge} shadow-md transition-colors scale-110`}>N{kanji.jlpt_level}</span>
                                </div>
                                <span className={`relative z-10 text-6xl font-serif leading-none group-hover:text-brand transition-all duration-300 -mt-0.5 ${textColor}`}>
                                    <HighlightText text={kanji.character} query={search} active={kanji._matchTarget === 'word'} />
                                </span>
                                <div className="relative z-10 w-full text-center mt-auto">
                                    <div className={`text-sm font-black px-1 leading-tight transition-colors ${textColor}`}>
                                        {kanji._isSmartMatch ? (
                                            <div className="text-[10px] text-brand bg-brand-light border border-brand/10 rounded-lg py-1 px-2 mb-1 inline-block transition-colors">
                                                ★ <HighlightText text={kanji._smartContext} query={search} />
                                            </div>
                                        ) : (
                                            <HighlightText text={kanji.meaning} query={search} active={kanji._matchTarget === 'meaning'} />
                                        )}
                                    </div>
                                    <div className={`text-[10px] font-bold mt-1 tracking-tight group-hover:text-brand/60 transition-colors uppercase ${subTextColor}`}>
                                        <HighlightText text={kanji.onyomi?.[0] || kanji.kunyomi?.[0] || '-'} query={search} active={kanji._matchTarget === 'reading'} />
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-32 bg-gray-50 dark:bg-card rounded-[3rem] border-4 border-dashed border-gray-100 dark:border-gray-800 max-w-2xl mx-auto shadow-inner transition-colors">
                    <div className="text-7xl mb-6 grayscale opacity-20 dark:opacity-40">📡</div>
                    <h2 className={`text-2xl font-black mb-2 transition-colors ${textColor}`}>Kanji Tidak Ditemukan</h2>
                    <p className={`font-bold mb-8 uppercase text-[10px] tracking-widest leading-loose transition-colors ${subTextColor}`}>Data tidak ditemukan di database lokal maupun API.<br/>Gunakan kata kunci bahasa Indonesia, Romaji, atau Kanji.</p>
                </div>
            )}

            <div className="flex justify-center items-center gap-6 mt-8">
                {page > 1 && (
                    <Link href={`?page=${page - 1}${level ? `&level=${level}` : ''}`} className="group flex items-center gap-2 bg-white dark:bg-card border-2 border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:border-red-100 dark:hover:border-red-900/30 px-6 py-3 rounded-2xl transition-all shadow-sm font-black text-sm active:scale-95">← Prev</Link>
                )}
                <span className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center font-black text-sm shadow-lg shadow-red-200 dark:shadow-red-900/40 transition-shadow transition-colors">{page}</span>
                {hasMore && (
                    <Link href={`?page=${page + 1}${level ? `&level=${level}` : ''}`} className="group flex items-center gap-2 bg-red-600 dark:bg-red-600 text-white border-2 border-red-600 dark:border-red-600 hover:bg-red-700 dark:hover:bg-red-700 hover:border-red-700 dark:hover:border-red-700 px-6 py-3 rounded-2xl transition-all shadow-xl shadow-red-200 dark:shadow-red-900/40 font-black text-sm active:scale-95">Next →</Link>
                )}
            </div>
        </>
    );
}

export default function KanjiPage() {
    const { theme, mounted } = useTheme();
    const textColor = !mounted ? 'text-black' : (theme === 'dark' ? 'text-white' : 'text-black');
    const subTextColor = !mounted ? 'text-black/50' : (theme === 'dark' ? 'text-white/50' : 'text-black/50');

    return (
        <div className="container mx-auto px-6 py-12 max-w-7xl transition-colors duration-300">
            <header className="mb-12 text-center md:text-left flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-100 dark:border-gray-800 pb-12 transition-colors">
                <div>
                    <h1 className={`text-5xl font-black tracking-tight leading-none transition-colors ${textColor}`}>漢字 <span className="text-red-600 dark:text-red-500 ml-2">Kanji</span></h1>
                    <p className={`font-black mt-4 tracking-wide uppercase text-xs transition-colors ${subTextColor}`}>Jelajahi karakter Jepang & maknanya</p>
                </div>
                <Suspense fallback={<div className="h-12 w-full md:w-96 bg-gray-50 dark:bg-gray-800 rounded-2xl animate-pulse" />}>
                    <KanjiFilter />
                </Suspense>
            </header>

            <Suspense fallback={<div className="py-32 text-center animate-pulse">Memuat...</div>}>
                <KanjiContent />
            </Suspense>
        </div>
    );
}