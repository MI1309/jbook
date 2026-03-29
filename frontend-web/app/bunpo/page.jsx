'use client';

import { useState, useEffect, Suspense } from 'react';
import { getGrammarList } from '@/lib/api';
import BunpoFilter from '@/components/BunpoFilter';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function BunpoContent() {
    const searchParams = useSearchParams();
    const [data, setData] = useState({ items: [], total: 0, pages: 1 });
    const [loading, setLoading] = useState(true);

    const page = parseInt(searchParams.get('page')) || 1;
    const level = searchParams.get('level');
    const search = searchParams.get('search');
    const chapter = searchParams.get('chapter');
    const limit = 30;

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            console.info(`[jbook-client] Memulai pengambilan data Bunpo untuk Page ${page}...`);
            try {
                const result = await getGrammarList({ level, search, chapter, limit, page });
                setData(result || { items: [], total: 0, pages: 1 });
            } catch (err) {
                console.error('[jbook-client] Gagal memuat Bunpo:', err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [page, level, search, chapter]);

    const items = data.items || [];
    const totalPages = data.pages || 1;
    const hasMore = page < totalPages;
    const totalCount = data.total || 0;

    const getLevelColor = (level) => {
        switch (level) {
            case 1: return 'from-red-50 to-white hover:border-red-400 text-red-600';
            case 2: return 'from-orange-50 to-white hover:border-orange-400 text-orange-600';
            case 3: return 'from-yellow-50 to-white hover:border-yellow-400 text-yellow-600';
            case 4: return 'from-teal-50 to-white hover:border-teal-400 text-teal-600';
            case 5: return 'from-green-50 to-white hover:border-green-400 text-green-600';
            default: return 'from-gray-50 to-white hover:border-gray-400 text-gray-600';
        }
    };

    if (loading) return <div className="py-32 text-center animate-pulse">🏮 Memuat Bunpo...</div>;

    return (
        <>
            <div className="flex justify-between items-center mb-6 text-sm font-bold text-gray-400 uppercase tracking-widest">
                <span>Total: {totalCount} Pola</span>
                <span>Halaman {page} dari {totalPages}</span>
            </div>

            {items.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                    {items.map((grammar) => (
                        <Link
                            key={grammar.id}
                            href={`/bunpo/${grammar.id}`}
                            className={`group block p-6 bg-white rounded-[2rem] border-2 border-gray-100 bg-gradient-to-br ${getLevelColor(grammar.jlpt_level)} transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 active:scale-95 shadow-sm overflow-hidden relative`}
                        >
                             <div className="flex justify-between items-start mb-4">
                                <span className="bg-white/80 px-3 py-1 rounded-xl text-[10px] font-black border border-inherit shadow-sm uppercase tracking-tighter">N{grammar.jlpt_level}</span>
                                {grammar.chapter && <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Bab {grammar.chapter}</span>}
                            </div>
                            <h2 className="text-xl font-serif font-black mb-2 text-gray-900 leading-tight">{grammar.title}</h2>
                            <p className="text-xs font-bold text-gray-500 mb-4 line-clamp-2 uppercase tracking-wide opacity-70 italic">{grammar.structure}</p>
                            <p className="text-sm font-black text-gray-800 line-clamp-3 bg-white/40 p-3 rounded-2xl italic leading-relaxed">{grammar.explanation}</p>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="text-center py-32 bg-gray-50 rounded-[3rem] border-4 border-dashed border-gray-100 max-w-2xl mx-auto">
                    <div className="text-7xl mb-6">🛸</div>
                    <h2 className="text-2xl font-black text-gray-900 mb-2">Bunpo tidak ditemukan</h2>
                    <p className="text-gray-400 font-bold mb-8">Silakan coba filter atau pencarian lain.</p>
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

export default function BunpoPage() {
    return (
        <div className="container mx-auto px-6 py-12 max-w-7xl">
            <header className="mb-12 text-center md:text-left flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-100 pb-12">
                <div>
                    <h1 className="text-5xl font-black text-gray-900 tracking-tight leading-none">文法 <span className="text-red-600 ml-2">Bunpo</span></h1>
                    <p className="text-gray-400 font-bold mt-4 tracking-wide uppercase text-xs">Kuasai tata bahasa Jepang dengan mudah</p>
                </div>
                <Suspense fallback={<div className="h-12 w-full md:w-96 bg-gray-50 rounded-2xl animate-pulse" />}>
                     <BunpoFilter />
                </Suspense>
            </header>

            <Suspense fallback={<div className="py-32 text-center animate-pulse">Memuat...</div>}>
                <BunpoContent />
            </Suspense>
        </div>
    );
}