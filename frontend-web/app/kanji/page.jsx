'use client';

import { useState, useEffect, Suspense } from 'react';
import { getKanjiList } from '@/lib/api';
import KanjiFilter from '@/components/KanjiFilter';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

const levelStyles = {
    1: { border: 'border-red-100', badge: 'bg-red-50 text-red-600 border-red-100', glow: 'hover:border-red-400 hover:shadow-red-500/10', char: 'text-gray-900 group-hover:text-red-600', bg: 'from-red-50/50 to-white' },
    2: { border: 'border-orange-100', badge: 'bg-orange-50 text-orange-600 border-orange-100', glow: 'hover:border-orange-400 hover:shadow-orange-500/10', char: 'text-gray-900 group-hover:text-orange-600', bg: 'from-orange-50/50 to-white' },
    3: { border: 'border-yellow-100', badge: 'bg-yellow-50 text-yellow-600 border-yellow-100', glow: 'hover:border-yellow-400 hover:shadow-yellow-500/10', char: 'text-gray-900 group-hover:text-yellow-600', bg: 'from-yellow-50/50 to-white' },
    4: { border: 'border-teal-100', badge: 'bg-teal-50 text-teal-600 border-teal-100', glow: 'hover:border-teal-400 hover:shadow-teal-500/10', char: 'text-gray-900 group-hover:text-teal-600', bg: 'from-teal-50/50 to-white' },
    5: { border: 'border-green-100', badge: 'bg-green-50 text-green-600 border-green-100', glow: 'hover:border-green-400 hover:shadow-green-500/10', char: 'text-gray-900 group-hover:text-green-600', bg: 'from-green-50/50 to-white' },
};

function KanjiContent() {
    const searchParams = useSearchParams();
    const [data, setData] = useState({ items: [], total: 0, pages: 1 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const page = parseInt(searchParams.get('page')) || 1;
    const level = searchParams.get('level');
    const search = searchParams.get('search');
    const radical = searchParams.get('radical');
    const limit = 30;

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            console.info(`[jbook-client] Memulai pengambilan data Kanji untuk Page ${page}...`);
            try {
                const result = await getKanjiList({ level, search, radical, limit, page });
                setData(result || { items: [], total: 0, pages: 1 });
                console.info(`[jbook-client] Berhasil memuat ${result?.items?.length || 0} data Kanji.`);
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
            <div className="flex flex-col items-center justify-center py-32 animate-pulse">
                <div className="text-6xl mb-4">🏮</div>
                <p className="text-gray-400 font-black tracking-widest uppercase text-sm">Sedang memuat Kanji...</p>
            </div>
        );
    }

    return (
        <>
            <div className="flex justify-between items-center mb-6 text-sm font-bold text-gray-400 uppercase tracking-widest">
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
                                className={`group flex flex-col items-center justify-start bg-white rounded-[2rem] border-2 ${s.border} ${s.glow} px-4 pt-3 pb-5 min-h-[170px] hover:shadow-2xl hover:-translate-y-2 active:scale-95 active:shadow-sm transition-all duration-300 ease-out relative overflow-hidden`}
                            >
                                <div className={`absolute inset-0 bg-gradient-to-b ${s.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                                <div className="relative z-10 self-end flex gap-1.5 items-center mb-1">
                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-xl border ${s.badge} shadow-sm`}>N{kanji.jlpt_level}</span>
                                </div>
                                <span className={`relative z-10 text-6xl font-serif leading-none ${s.char} transition-all duration-300 drop-shadow-sm -mt-0.5`}>{kanji.character}</span>
                                <div className="relative z-10 w-full text-center mt-auto">
                                    <div className="text-sm font-black text-gray-800 truncate px-1">{kanji.meaning}</div>
                                    <div className="text-[10px] font-bold text-gray-400 mt-0.5 tracking-tight group-hover:text-gray-500 transition-colors">{kanji.onyomi?.[0] || kanji.kunyomi?.[0] || '-'}</div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-32 bg-gray-50 rounded-[3rem] border-4 border-dashed border-gray-100 max-w-2xl mx-auto">
                    <div className="text-7xl mb-6">🛰️</div>
                    <h2 className="text-2xl font-black text-gray-900 mb-2">Kanji tidak ditemukan</h2>
                    <p className="text-gray-400 font-bold mb-8">Data tidak ditemukan di database lokal maupun API.</p>
                </div>
            )}

            <div className="flex justify-center items-center gap-6 mt-8">
                {page > 1 && (
                    <Link href={`?page=${page - 1}${level ? `&level=${level}` : ''}`} className="group flex items-center gap-2 bg-white border-2 border-gray-100 text-gray-500 hover:text-red-600 hover:border-red-100 px-6 py-3 rounded-2xl transition-all shadow-sm font-black text-sm active:scale-95">← Prev</Link>
                )}
                <span className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center font-black text-sm shadow-lg shadow-red-200">{page}</span>
                {hasMore && (
                    <Link href={`?page=${page + 1}${level ? `&level=${level}` : ''}`} className="group flex items-center gap-2 bg-red-600 text-white border-2 border-red-600 hover:bg-red-700 hover:border-red-700 px-6 py-3 rounded-2xl transition-all shadow-xl shadow-red-100 font-black text-sm active:scale-95">Next →</Link>
                )}
            </div>
        </>
    );
}

export default function KanjiPage() {
    return (
        <div className="container mx-auto px-6 py-12 max-w-7xl">
            <header className="mb-12 text-center md:text-left flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-100 pb-12">
                <div>
                    <h1 className="text-5xl font-black text-gray-900 tracking-tight leading-none">漢字 <span className="text-red-600 ml-2">Kanji</span></h1>
                    <p className="text-gray-400 font-bold mt-4 tracking-wide uppercase text-xs">Jelajahi karakter Jepang & maknanya</p>
                </div>
                <Suspense fallback={<div className="h-12 w-full md:w-96 bg-gray-50 rounded-2xl animate-pulse" />}>
                    <KanjiFilter />
                </Suspense>
            </header>

            <Suspense fallback={<div className="py-32 text-center animate-pulse">Memuat...</div>}>
                <KanjiContent />
            </Suspense>
        </div>
    );
}