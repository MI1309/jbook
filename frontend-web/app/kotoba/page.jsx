'use client';

import { useState, useEffect, Suspense } from 'react';
import { getVocabList } from '@/lib/api';
import KotobaFilter from '@/components/KotobaFilter';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function KotobaContent() {
    const searchParams = useSearchParams();
    const [data, setData] = useState({ items: [], total: 0, pages: 1 });
    const [loading, setLoading] = useState(true);

    const page = parseInt(searchParams.get('page')) || 1;
    const level = searchParams.get('level');
    const search = searchParams.get('search');
    const word_type = searchParams.get('word_type');
    const limit = 30;

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            console.info(`[jbook-client] Memulai pengambilan data Kotoba untuk Page ${page}...`);
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
            case 1: return 'from-rose-50 to-white hover:border-rose-400 text-rose-600';
            case 2: return 'from-amber-50 to-white hover:border-amber-400 text-amber-600';
            case 3: return 'from-yellow-50 to-white hover:border-yellow-400 text-yellow-600';
            case 4: return 'from-cyan-50 to-white hover:border-cyan-400 text-cyan-600';
            case 5: return 'from-emerald-50 to-white hover:border-emerald-400 text-emerald-600';
            default: return 'from-gray-50 to-white hover:border-gray-400 text-gray-600';
        }
    };

    if (loading) return <div className="py-32 text-center animate-pulse">🏮 Memuat Kotoba...</div>;

    return (
        <>
            <div className="flex justify-between items-center mb-6 text-sm font-bold text-gray-400 uppercase tracking-widest">
                <span>Total: {totalCount} Kata</span>
                <span>Halaman {page} dari {totalPages}</span>
            </div>

            {items.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-16 px-1">
                    {items.map((vocab) => (
                        <Link
                            key={vocab.id}
                            href={`/kotoba/${vocab.id}`}
                            className={`group flex flex-col p-6 bg-white rounded-[2.5rem] border-2 border-gray-100 bg-gradient-to-br ${getLevelColor(vocab.jlpt_level)} transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 active:scale-95 shadow-sm relative overflow-hidden`}
                        >
                            <div className="flex justify-between items-start mb-6">
                                <span className="bg-white/80 px-3 py-1 rounded-xl text-[9px] font-black border border-inherit shadow-sm uppercase tracking-tighter">N{vocab.jlpt_level}</span>
                                {vocab.word_type && <span className="text-[9px] font-black px-2 py-0.5 rounded-lg bg-white/50 border border-gray-200 uppercase tracking-widest leading-none text-gray-400">{vocab.word_type}</span>}
                            </div>

                            <div className="text-center mb-6">
                                <h2 className="text-3xl font-serif font-black text-gray-900 leading-none mb-2 tracking-tighter group-hover:scale-110 transition-transform duration-300">
                                    {vocab.word}
                                </h2>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] opacity-80">{vocab.reading || 'No Reading'}</p>
                            </div>
                            
                            <div className="mt-auto h-16 flex flex-col items-center justify-center p-3 rounded-2xl bg-white/30 italic text-center text-sm font-black text-gray-700 leading-relaxed overflow-hidden">
                                <p className="line-clamp-2 truncate-multiline">{vocab.meaning}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="text-center py-32 bg-gray-50 rounded-[3rem] border-4 border-dashed border-gray-100 max-w-2xl mx-auto">
                    <div className="text-7xl mb-6">🛸</div>
                    <h2 className="text-2xl font-black text-gray-900 mb-2">Kotoba tidak ditemukan</h2>
                    <p className="text-gray-400 font-bold mb-8">Coba ganti kata kunci atau level JLPT.</p>
                </div>
            )}

            <div className="flex justify-center items-center gap-6 mt-8">
                {page > 1 && <Link href={`?page=${page - 1}`} className="bg-white border-2 border-gray-100 text-gray-500 hover:text-red-600 px-6 py-3 rounded-2xl font-black text-sm transition-all shadow-sm">← Prev</Link>}
                <span className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center font-black text-sm shadow-lg">{page}</span>
                {hasMore && <Link href={`?page=${page + 1}`} className="bg-red-600 text-white border-2 border-red-600 hover:bg-red-700 px-6 py-3 rounded-2xl font-black text-sm transition-all shadow-xl shadow-red-100">Next →</Link>}
            </div>
        </>
    );
}

export default function KotobaPage() {
    return (
        <div className="container mx-auto px-6 py-12 max-w-7xl">
            <header className="mb-12 text-center md:text-left flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-100 pb-12">
                <div>
                     <h1 className="text-5xl font-black text-gray-900 tracking-tight leading-none">言葉 <span className="text-red-600 ml-2">Kotoba</span></h1>
                     <p className="text-gray-400 font-bold mt-4 tracking-wide uppercase text-xs">Perdalam kosa kata bahasa Jepang Anda</p>
                </div>
                <Suspense fallback={<div className="h-12 w-full md:w-96 bg-gray-50 rounded-2xl animate-pulse" />}>
                     <KotobaFilter />
                </Suspense>
            </header>

            <Suspense fallback={<div className="py-32 text-center animate-pulse">Memuat...</div>}>
                <KotobaContent />
            </Suspense>
        </div>
    );
}
