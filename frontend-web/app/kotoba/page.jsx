'use client';

import { useState, useEffect, Suspense } from 'react';
import { getVocabList } from '@/lib/api';
import KotobaFilter from '@/components/KotobaFilter';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import KotobaDetailModal from '@/components/KotobaDetailModal';

import { getScriptTypes } from '@/lib/utils';
import { useTheme } from '@/context/ThemeContext';

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

function KotobaContent() {
    const { theme, mounted } = useTheme();
    const searchParams = useSearchParams();
    const router = useRouter();
    const detailId = searchParams.get('detail');
    const [data, setData] = useState({ items: [], total: 0, pages: 1 });
    const [loading, setLoading] = useState(true);

    const page = parseInt(searchParams.get('page')) || 1;
    const level = searchParams.get('level');
    const search = searchParams.get('search');
    const word_type = searchParams.get('word_type');
    const limit = 30;

    const scriptTypes = getScriptTypes(search);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const result = await getVocabList({ level, search, word_type, limit, page });
                setData(result || { items: [], total: 0, pages: 1 });
            } catch (err) {
                console.error('[jbook-client] Gagal memuat Kotoba:', err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [page, level, search, word_type]);

    const items = data.items || [];
    const totalPages = data.pages || 1;
    const hasMore = page < totalPages;
    const totalCount = data.total || 0;

    const getLevelColor = (level) => {
        switch (level) {
            case 1: return 'from-rose-50/50 to-white dark:from-rose-900/10 dark:to-card text-rose-600 dark:text-rose-400';
            case 2: return 'from-amber-50/50 to-white dark:from-amber-900/10 dark:to-card text-amber-600 dark:text-amber-400';
            case 3: return 'from-yellow-50/50 to-white dark:from-yellow-900/10 dark:to-card text-yellow-600 dark:text-yellow-400';
            case 4: return 'from-cyan-50/50 to-white dark:from-cyan-900/10 dark:to-card text-cyan-600 dark:text-cyan-400';
            case 5: return 'from-emerald-50/50 to-white dark:from-emerald-900/10 dark:to-card text-emerald-600 dark:text-emerald-400';
            default: return 'from-gray-50/50 to-white dark:from-gray-800 dark:to-card text-gray-600 dark:text-gray-400';
        }
    };

    if (loading) return <div className="py-32 text-center animate-pulse text-gray-400 dark:text-gray-600 font-black transition-colors">🏮 MEMUAT KOTOBA...</div>;

    const textColor = !mounted ? 'text-black' : (theme === 'dark' ? 'text-white' : 'text-black');
    const subTextColor = !mounted ? 'text-gray-400' : (theme === 'dark' ? 'text-gray-500' : 'text-gray-500');
    const cardBg = !mounted ? 'bg-white' : (theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-white');

    return (
        <>
            {detailId && <KotobaDetailModal id={detailId} />}
            <div className={`flex justify-between items-center mb-6 text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${subTextColor}`}>
                <span>Total: {totalCount} Kata</span>
                <span>Halaman {page} dari {totalPages}</span>
            </div>

            {items.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-16 px-1 transition-all">
                    {items.map((vocab) => (
                        <Link
                            key={vocab.id}
                            href={`/kotoba/${vocab.id}`}
                            onClick={(e) => {
                                if (typeof navigator !== 'undefined' && !navigator.onLine) {
                                    e.preventDefault();
                                    const params = new URLSearchParams(searchParams.toString());
                                    params.set('detail', vocab.id);
                                    router.push(`?${params.toString()}`);
                                }
                            }}
                            className={`group flex flex-col p-6 ${cardBg} ${theme === 'dark' ? 'card-texture' : ''} rounded-[2.5rem] border-2 ${theme === 'dark' ? 'border-red-950/20' : 'border-gray-100'} bg-gradient-to-br ${getLevelColor(vocab.jlpt_level)} transition-all duration-300 hover:shadow-2xl hover:shadow-brand/10 dark:hover:shadow-black/60 hover:-translate-y-2 active:scale-95 shadow-sm relative overflow-hidden`}
                        >
                            <div className="flex justify-between items-center mb-6 transition-colors">
                                <span className={`px-3 py-1 rounded-xl text-[9px] font-black border shadow-md uppercase tracking-tighter scale-110 ${
                                    vocab.jlpt_level === 1 ? 'bg-red-500 text-white border-red-500' :
                                    vocab.jlpt_level === 2 ? 'bg-orange-500 text-white border-orange-500' :
                                    vocab.jlpt_level === 3 ? 'bg-yellow-500 text-white border-yellow-500' :
                                    vocab.jlpt_level === 4 ? 'bg-teal-500 text-white border-teal-500' :
                                    'bg-green-500 text-white border-green-500'
                                }`}>N{vocab.jlpt_level}</span>
                                
                                <div className="flex gap-1">
                                    {scriptTypes.map(type => (
                                        <span key={type} className={`text-[7px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-tighter transition-colors ${theme === 'dark' ? 'bg-gray-800 text-gray-300' : 'bg-white border border-gray-200 text-gray-500'}`}>
                                            {type}
                                        </span>
                                    ))}
                                    {vocab.word_type && <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg border uppercase tracking-widest leading-none transition-colors ${theme === 'dark' ? 'bg-black/20 border-gray-700 text-gray-500' : 'bg-white border-gray-200 text-gray-400'}`}>{vocab.word_type}</span>}
                                </div>
                            </div>

                            <div className="text-center mb-6">
                                <h2 className={`text-3xl font-serif font-black leading-none mb-2 tracking-tighter group-hover:scale-110 group-hover:text-brand transition-all duration-300 ${textColor}`}>
                                    <HighlightText text={vocab.word} query={search} active={vocab._matchTarget === 'word'} />
                                </h2>
                                <p className={`text-[10px] font-bold uppercase tracking-[0.2em] opacity-80 transition-colors group-hover:text-brand/60 ${subTextColor}`}>
                                    <HighlightText text={vocab.reading || ''} query={search} active={vocab._matchTarget === 'reading'} />
                                </p>
                            </div>
                            
                            <div className="mt-auto min-h-[4rem] flex flex-col items-center justify-center p-3 rounded-2xl bg-white/30 dark:bg-black/20 italic text-center text-sm font-black leading-relaxed transition-colors border border-transparent group-hover:border-brand/10 group-hover:bg-brand-light/20 transition-all">
                                <p className={`truncate-multiline ${textColor}`}>
                                    <HighlightText text={vocab.meaning} query={search} active={vocab._matchTarget === 'meaning'} />
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className={`text-center py-32 rounded-[3rem] border-4 border-dashed max-w-2xl mx-auto shadow-inner transition-colors ${cardBg} ${theme === 'dark' ? 'border-red-950/20' : 'border-gray-100'}`}>
                    <div className="text-7xl mb-6 grayscale opacity-20 dark:opacity-40 transition-opacity">🪐</div>
                    <h2 className={`text-2xl font-black mb-2 transition-colors ${textColor}`}>Kosakata Tidak Ditemukan</h2>
                    <p className={`font-bold mb-8 uppercase text-[10px] tracking-widest transition-colors ${subTextColor}`}>Coba kata kunci lain atau ubah filter level.</p>
                </div>
            )}

            <div className="flex justify-center items-center gap-6 mt-8">
                {page > 1 && <Link href={`?page=${page - 1}`} className="bg-white dark:bg-card border-2 border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 px-6 py-3 rounded-2xl font-black text-sm transition-all shadow-sm active:scale-95">\u2190 Prev</Link>}
                <span className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center font-black text-sm shadow-lg shadow-red-200 dark:shadow-red-900/40 transition-colors">{page}</span>
                {hasMore && <Link href={`?page=${page + 1}`} className="bg-red-600 text-white border-2 border-red-600 hover:bg-red-700 px-6 py-3 rounded-2xl font-black text-sm transition-all shadow-xl shadow-red-200 dark:shadow-red-900/40 active:scale-95">Next \u2192</Link>}
            </div>
        </>
    );
}

export default function KotobaPage() {
    const { theme, mounted } = useTheme();
    const textColor = !mounted ? 'text-black' : (theme === 'dark' ? 'text-white' : 'text-black');
    const subTextColor = !mounted ? 'text-black/50' : (theme === 'dark' ? 'text-white/50' : 'text-black/50');

    return (
        <div className="container mx-auto px-6 py-12 max-w-7xl transition-colors duration-300">
            <header className="mb-12 text-center md:text-left flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-100 dark:border-gray-800 pb-12 transition-colors">
                <div>
                     <h1 className={`text-5xl font-black tracking-tight leading-none transition-colors ${textColor}`}>言葉 <span className="text-red-600 dark:text-red-500 ml-2">Kotoba</span></h1>
                     <p className={`font-black mt-4 tracking-wide uppercase text-xs transition-colors ${subTextColor}`}>Perdalam kosa kata bahasa Jepang Anda</p>
                </div>
                <Suspense fallback={<div className="h-12 w-full md:w-96 bg-gray-50 dark:bg-gray-800 rounded-2xl animate-pulse" />}>
                     <KotobaFilter />
                </Suspense>
            </header>

            <Suspense fallback={<div className="py-32 text-center animate-pulse">Memuat...</div>}>
                <KotobaContent />
            </Suspense>
        </div>
    );
}
