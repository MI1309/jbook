'use client';

import { useState, useEffect, Suspense } from 'react';
import { getGrammarList } from '@/lib/api';
import BunpoFilter from '@/components/bunpo/BunpoFilter';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import BunpoDetailModal from '@/components/bunpo/BunpoDetailModal';
import Pagination from '@/components/common/Pagination';
import { useTheme } from '@/context/ThemeContext';

function BunpoContent() {
    const { theme, mounted } = useTheme();
    const searchParams = useSearchParams();
    const router = useRouter();
    const detailId = searchParams.get('detail');
    const [data, setData] = useState({ items: [], total: 0, pages: 1 });
    const [loading, setLoading] = useState(true);

    const page = parseInt(searchParams.get('page')) || 1;
    const level = searchParams.get('level');
    const search = searchParams.get('search');
    const limit = 30;

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            console.info(`[jbook-client] Memulai pengambilan data Bunpo untuk Page ${page}...`);
            try {
                const result = await getGrammarList({ level, search, limit, page });
                setData(result || { items: [], total: 0, pages: 1 });
            } catch (err) {
                console.error('[jbook-client] Gagal memuat Bunpo:', err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [page, level, search]);

    const items = data.items || [];
    const totalPages = data.pages || 1;
    const totalCount = data.total || 0;

    if (loading) return <div className="py-32 text-center animate-pulse text-gray-400 dark:text-gray-600 font-black transition-colors">🏮 Memuat Bunpo...</div>;

    const textColor = !mounted ? 'text-black' : (theme === 'dark' ? 'text-white' : 'text-black');
    const subTextColor = !mounted ? 'text-gray-400' : (theme === 'dark' ? 'text-gray-500' : 'text-gray-500');

    return (
        <>
            {detailId && <BunpoDetailModal id={detailId} />}
            <div className={`flex justify-between items-center mb-6 text-sm font-bold uppercase tracking-widest transition-colors ${subTextColor}`}>
                <span>Total: {totalCount} Pola</span>
                <span>Halaman {page} dari {totalPages}</span>
            </div>

            {items.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16 px-1 transition-all">
                    {items.map((grammar) => (
                        <Link
                            key={grammar.id}
                            href={`/bunpo/${grammar.id}`}
                            onClick={(e) => {
                                if (typeof navigator !== 'undefined' && !navigator.onLine) {
                                    e.preventDefault();
                                    const params = new URLSearchParams(searchParams.toString());
                                    params.set('detail', grammar.id);
                                    router.push(`?${params.toString()}`);
                                }
                            }}
                            className="group block p-6 bg-[var(--card-bg)] rounded-[2.5rem] border border-[var(--border-color)] transition-all duration-300 hover:shadow-xl hover:shadow-accent-blue/10 hover:border-accent-blue/30 hover:-translate-y-2 active:scale-95 overflow-hidden relative"
                        >
                             <div className="flex justify-between items-start mb-4 transition-colors">
                                <span className="px-3 py-1 rounded-xl text-[10px] font-black border border-[var(--border-color)] bg-[var(--background)] uppercase tracking-tighter text-gray-500">N{grammar.jlpt_level}</span>
                                {grammar.chapter && <span className={`text-[10px] font-black uppercase tracking-widest leading-none group-hover:text-accent-blue transition-colors ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>Bab {grammar.chapter}</span>}
                            </div>
                            <h2 className={`text-xl font-serif font-black mb-2 group-hover:text-accent-blue leading-tight transition-all text-foreground`}>{grammar.title}</h2>
                            <p className={`text-xs font-bold mb-4 uppercase tracking-wide opacity-70 italic transition-colors ${subTextColor}`}>{grammar.structure}</p>
                            <p className={`text-sm font-semibold bg-[var(--background)]/50 p-4 rounded-2xl italic leading-relaxed transition-all border border-[var(--border-color)]/50 group-hover:border-accent-blue/20 text-foreground`}>{grammar.explanation}</p>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className={`text-center py-32 rounded-[3rem] border-4 border-dashed max-w-2xl mx-auto shadow-inner transition-colors bg-[var(--card-bg)] border-[var(--border-color)]`}>
                    <div className="text-7xl mb-6 grayscale opacity-20 dark:opacity-40 transition-opacity">🛸</div>
                    <h2 className={`text-2xl font-black mb-2 transition-colors ${textColor}`}>Bunpo tidak ditemukan</h2>
                    <p className={`font-bold mb-8 transition-colors ${subTextColor}`}>Silakan coba filter atau pencarian lain.</p>
                </div>
            )}

            <div className="mt-8">
                <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    getHref={(targetPage) => {
                        const params = new URLSearchParams(searchParams.toString());
                        params.set('page', String(targetPage));
                        return `?${params.toString()}`;
                    }}
                />
            </div>
        </>
    );
}

export default function BunpoPage() {
    const { theme, mounted } = useTheme();
    const textColor = !mounted ? 'text-black' : (theme === 'dark' ? 'text-white' : 'text-black');
    const subTextColor = !mounted ? 'text-black/50' : (theme === 'dark' ? 'text-white/50' : 'text-black/50');

    return (
        <div className="container mx-auto max-w-7xl px-4 py-6 transition-colors duration-300 sm:px-6 sm:py-12">
            <header className="mb-6 flex min-w-0 flex-col justify-between gap-5 border-b border-[var(--border-color)] pb-6 text-center transition-colors sm:mb-12 sm:gap-8 sm:pb-12 2xl:flex-row 2xl:items-center 2xl:text-left">
                <div className="shrink-0 2xl:max-w-xs">
                    <h1 className={`text-5xl font-japanese font-black tracking-tight leading-none transition-colors ${textColor}`}>文法 <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-blue to-accent-green ml-2">Bunpo</span></h1>
                    <div className="h-1 w-16 bg-gradient-to-r from-accent-blue to-accent-green rounded-full mt-3 mb-1 mx-auto lg:mx-0" />
                    <p className={`font-black mt-2 tracking-wide uppercase text-xs transition-colors ${subTextColor}`}>Kuasai tata bahasa Jepang dengan mudah</p>
                </div>
                <div className="w-full min-w-0 flex-1">
                    <Suspense fallback={<div className="h-28 w-full bg-[var(--card-bg)] rounded-[2.5rem] animate-pulse" />}>
                         <BunpoFilter />
                    </Suspense>
                </div>
            </header>

            <Suspense fallback={<div className="py-32 text-center animate-pulse">Memuat...</div>}>
                <BunpoContent />
            </Suspense>
        </div>
    );
}