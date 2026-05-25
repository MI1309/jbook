'use client';

import { useState, useEffect, Suspense } from 'react';
import { getKanjiList } from '@/lib/api';
import KanjiFilter from '@/components/kanji/KanjiFilter';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import KanjiDetailModal from '@/components/kanji/KanjiDetailModal';

// JBook-themed level styles using CSS variables
const levelStyles = {
    1: { badge: 'bg-rose-500 text-white', accent: 'from-rose-500/10 to-transparent', border: 'hover:border-rose-400/40' },
    2: { badge: 'bg-amber-500 text-white', accent: 'from-amber-500/10 to-transparent', border: 'hover:border-amber-400/40' },
    3: { badge: 'bg-yellow-500 text-white', accent: 'from-yellow-500/10 to-transparent', border: 'hover:border-yellow-400/40' },
    4: { badge: 'bg-cyan-500 text-white', accent: 'from-cyan-500/10 to-transparent', border: 'hover:border-cyan-400/40' },
    5: { badge: 'bg-emerald-500 text-white', accent: 'from-emerald-500/10 to-transparent', border: 'hover:border-emerald-400/40' },
};

import { getScriptTypes } from '@/lib/utils';

function HighlightText({ text, query, active = true }) {
    if (!query || !active) return <span>{text}</span>;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
        <span>
            {parts.map((part, i) =>
                part.toLowerCase() === query.toLowerCase() ?
                <mark key={i} className="bg-accent-gold/30 dark:bg-accent-gold/20 text-gray-900 dark:text-accent-gold rounded px-0.5 no-underline">{part}</mark> :
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
            <div className="flex flex-col items-center justify-center py-32 text-gray-400 dark:text-gray-600 font-black">
                <div className="text-6xl mb-4 animate-bounce">漢</div>
                <p className="tracking-widest uppercase text-sm animate-pulse">Sedang memuat Kanji...</p>
            </div>
        );
    }

    return (
        <>
            {detailId && <KanjiDetailModal id={detailId} />}
            <div className="flex justify-between items-center mb-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 dark:text-gray-500">
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
                                className={`group flex flex-col items-center justify-start bg-[var(--card-bg)] rounded-[2rem] border-2 border-[var(--border-color)] ${s.border} px-4 pt-3 pb-5 min-h-[220px] shadow-sm hover:shadow-2xl hover:shadow-accent-blue/10 dark:hover:shadow-black/60 hover:-translate-y-2 active:scale-95 transition-all duration-300 ease-out relative overflow-hidden`}
                            >
                                {/* Level accent glow */}
                                <div className={`absolute inset-0 bg-gradient-to-b ${s.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`} />

                                {/* Top badges */}
                                <div className="relative z-10 self-end flex gap-1 items-center mb-1">
                                    {scriptTypes.map(type => (
                                        <span key={type} className="text-[7px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-tighter bg-[var(--background)] border border-[var(--border-color)] text-gray-500">
                                            {type}
                                        </span>
                                    ))}
                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-xl ${s.badge} shadow-sm`}>N{kanji.jlpt_level}</span>
                                </div>

                                {/* Main character */}
                                <span className="relative z-10 text-6xl font-serif leading-none group-hover:scale-110 transition-all duration-300 -mt-0.5 text-[var(--foreground)]">
                                    <HighlightText text={kanji.character} query={search} active={kanji._matchTarget === 'word'} />
                                </span>

                                {/* Meaning & reading */}
                                <div className="relative z-10 w-full text-center mt-auto">
                                    <div className="text-sm font-black px-1 leading-tight text-[var(--foreground)]">
                                        {kanji._isSmartMatch ? (
                                            <div className="text-[10px] text-accent-blue bg-accent-blue/10 border border-accent-blue/20 rounded-lg py-1 px-2 mb-1 inline-block">
                                                ★ <HighlightText text={kanji._smartContext} query={search} />
                                            </div>
                                        ) : (
                                            <HighlightText text={kanji.meaning} query={search} active={kanji._matchTarget === 'meaning'} />
                                        )}
                                    </div>
                                    <div className="text-[10px] font-bold mt-1 tracking-tight uppercase text-gray-500 dark:text-gray-500 group-hover:text-accent-blue/70 transition-colors">
                                        <HighlightText text={kanji.onyomi?.[0] || kanji.kunyomi?.[0] || '-'} query={search} active={kanji._matchTarget === 'reading'} />
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-32 bg-[var(--card-bg)] rounded-[3rem] border-4 border-dashed border-[var(--border-color)] max-w-2xl mx-auto shadow-inner">
                    <div className="text-7xl mb-6 grayscale opacity-20 dark:opacity-40">📡</div>
                    <h2 className="text-2xl font-black mb-2 text-[var(--foreground)]">Kanji Tidak Ditemukan</h2>
                    <p className="font-bold mb-8 uppercase text-[10px] tracking-widest leading-loose text-gray-500">Data tidak ditemukan di database lokal maupun API.<br/>Gunakan kata kunci bahasa Indonesia, Romaji, atau Kanji.</p>
                </div>
            )}

            <div className="flex justify-center items-center gap-6 mt-8">
                {page > 1 && (
                    <Link href={`?page=${page - 1}${level ? `&level=${level}` : ''}`} className="group flex items-center gap-2 bg-[var(--card-bg)] border-2 border-[var(--border-color)] text-gray-500 dark:text-gray-400 hover:text-accent-blue hover:border-accent-blue/30 px-6 py-3 rounded-2xl transition-all shadow-sm font-black text-sm active:scale-95">← Prev</Link>
                )}
                <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-blue to-accent-green text-white flex items-center justify-center font-black text-sm shadow-lg shadow-accent-blue/20 dark:shadow-accent-blue/10">{page}</span>
                {hasMore && (
                    <Link href={`?page=${page + 1}${level ? `&level=${level}` : ''}`} className="group flex items-center gap-2 bg-gradient-to-r from-accent-blue to-accent-green text-white border-2 border-accent-blue/50 hover:opacity-90 px-6 py-3 rounded-2xl transition-all shadow-xl shadow-accent-blue/20 dark:shadow-accent-blue/10 font-black text-sm active:scale-95">Next →</Link>
                )}
            </div>
        </>
    );
}

export default function KanjiPage() {
    const { theme, mounted } = useTheme();

    return (
        <div className="relative min-h-screen bg-[var(--background)] overflow-hidden transition-colors duration-300">
            {/* Sakura petals background - same as homepage */}
            <div className="absolute inset-0 pointer-events-none z-0">
                <div className="sakura-petal w-3 h-3" style={{ top: '8%', left: '5%', animation: 'sakura-fall 12s linear infinite', animationDelay: '0s' }}></div>
                <div className="sakura-petal w-2 h-4" style={{ top: '3%', left: '35%', animation: 'sakura-fall 15s linear infinite', animationDelay: '3s' }}></div>
                <div className="sakura-petal w-4 h-3" style={{ top: '12%', left: '70%', animation: 'sakura-fall 10s linear infinite', animationDelay: '6s' }}></div>
                <div className="sakura-petal w-3 h-2" style={{ top: '20%', left: '88%', animation: 'sakura-fall 18s linear infinite', animationDelay: '1s' }}></div>
                <div className="sakura-petal w-2.5 h-3" style={{ top: '6%', left: '55%', animation: 'sakura-fall 14s linear infinite', animationDelay: '4s' }}></div>
            </div>

            {/* Side calligraphy - same as homepage */}
            <div className="hidden xl:flex flex-col absolute left-8 top-1/4 space-y-8 select-none text-[#212127]/20 dark:text-[#f2f2f7]/5 font-japanese text-3xl font-black tracking-widest pointer-events-none z-0">
                <span>漢字学習</span>
                <span className="text-xl">一文字</span>
            </div>
            <div className="hidden xl:flex flex-col absolute right-8 top-1/4 space-y-8 select-none text-[#212127]/20 dark:text-[#f2f2f7]/5 font-japanese text-3xl font-black tracking-widest pointer-events-none z-0">
                <span>書き方</span>
                <span className="text-xl">読み方</span>
            </div>

            <div className="container mx-auto px-6 py-12 max-w-7xl relative z-10">
                <header className="mb-12 text-center md:text-left flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[var(--border-color)] pb-12">
                    <div>
                        <h1 className="text-5xl font-japanese font-black tracking-tight leading-none text-[var(--foreground)]">漢字 <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-blue to-accent-green ml-2">Kanji</span></h1>
                        <div className="h-1 w-16 bg-gradient-to-r from-accent-blue to-accent-green rounded-full mt-3 mb-1" />
                        <p className="font-black mt-2 tracking-wide uppercase text-xs text-gray-500 dark:text-gray-500">Jelajahi karakter Jepang & maknanya</p>
                    </div>
                    <Suspense fallback={<div className="h-12 w-full md:w-96 bg-[var(--card-bg)] rounded-2xl animate-pulse" />}>
                        <KanjiFilter />
                    </Suspense>
                </header>

                <Suspense fallback={<div className="py-32 text-center animate-pulse text-gray-500">Memuat...</div>}>
                    <KanjiContent />
                </Suspense>
            </div>
        </div>
    );
}