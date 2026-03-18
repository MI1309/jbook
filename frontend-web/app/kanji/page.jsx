import { getKanjiList } from '@/lib/api';
import KanjiFilter from '@/components/KanjiFilter';
import Link from 'next/link';
import { Suspense } from 'react';

export const metadata = {
    title: 'Daftar Kanji JLPT N5 - N1 - JBook',
    description: 'Latihan dan pelajari ribuan karakter Kanji Jepang dari level N5 hingga N1 dengan mudah dan interaktif.',
};

const levelStyles = {
    1: { 
        border: 'border-red-100',   
        badge: 'bg-red-50 text-red-600 border-red-100',    
        glow: 'hover:border-red-400 hover:shadow-red-500/10',   
        char: 'text-gray-900 group-hover:text-red-600',
        bg: 'from-red-50/50 to-white'
    },
    2: { 
        border: 'border-orange-100', 
        badge: 'bg-orange-50 text-orange-600 border-orange-100', 
        glow: 'hover:border-orange-400 hover:shadow-orange-500/10', 
        char: 'text-gray-900 group-hover:text-orange-600',
        bg: 'from-orange-50/50 to-white'
    },
    3: { 
        border: 'border-yellow-100', 
        badge: 'bg-yellow-50 text-yellow-600 border-yellow-100', 
        glow: 'hover:border-yellow-400 hover:shadow-yellow-500/10', 
        char: 'text-gray-900 group-hover:text-yellow-600',
        bg: 'from-yellow-50/50 to-white'
    },
    4: { 
        border: 'border-teal-100',  
        badge: 'bg-teal-50 text-teal-600 border-teal-100',   
        glow: 'hover:border-teal-400 hover:shadow-teal-500/10',  
        char: 'text-gray-900 group-hover:text-teal-600',
        bg: 'from-teal-50/50 to-white'
    },
    5: { 
        border: 'border-green-100', 
        badge: 'bg-green-50 text-green-600 border-green-100', 
        glow: 'hover:border-green-400 hover:shadow-green-500/10', 
        char: 'text-gray-900 group-hover:text-green-600',
        bg: 'from-green-50/50 to-white'
    },
};

export default async function KanjiPage({ searchParams }) {
    const params = await searchParams;
    const page   = parseInt(params.page) || 1;
    const limit  = 30; // Increased for better grid fill

    const kanjiList = await getKanjiList({
        level:   params.level,
        search:  params.search,
        radical: params.radical,
        limit,
        page,
    });

    const hasMore = kanjiList.length === limit;

    return (
        <div className="container mx-auto px-6 py-12 max-w-7xl">
            {/* Header */}
            <header className="mb-12 text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-100 pb-12">
                <div>
                    <h1 className="text-5xl font-black text-gray-900 tracking-tight leading-none">
                        漢字 <span className="text-red-600 ml-2">Kanji</span>
                    </h1>
                    <p className="text-gray-400 font-bold mt-4 tracking-wide uppercase text-xs">Jelajahi karakter Jepang & maknanya</p>
                </div>
                
                <Suspense fallback={<div className="h-12 w-full md:w-96 bg-gray-50 rounded-2xl animate-pulse" />}>
                    <div className="w-full md:w-auto">
                        <KanjiFilter />
                    </div>
                </Suspense>
            </header>

            {kanjiList.length > 0 ? (
                <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4 mb-16">
                    {kanjiList.map((kanji) => {
                        const s = levelStyles[kanji.jlpt_level] ?? levelStyles[5];
                        return (
                            <Link
                                key={kanji.id}
                                href={`/kanji/${kanji.id}`}
                                className={`
                                    group flex flex-col items-center justify-between
                                    bg-white rounded-[2rem] border-2 ${s.border} ${s.glow}
                                    px-4 pt-4 pb-6 min-h-[160px]
                                    hover:shadow-2xl hover:-translate-y-2
                                    active:scale-95 active:shadow-sm
                                    transition-all duration-300 ease-out
                                    relative overflow-hidden
                                `}
                            >
                                {/* Decorative BG */}
                                <div className={`absolute inset-0 bg-gradient-to-b ${s.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                                
                                {/* Level badge */}
                                <span className={`relative z-10 self-end text-[10px] font-black px-2.5 py-1 rounded-xl border ${s.badge} shadow-sm`}>
                                    N{kanji.jlpt_level}
                                </span>

                                {/* Character */}
                                <span className={`relative z-10 text-6xl font-serif leading-none ${s.char} transition-all duration-300 drop-shadow-sm`}>
                                    {kanji.character}
                                </span>

                                {/* Info */}
                                <div className="relative z-10 w-full text-center mt-3">
                                    <div className="text-sm font-black text-gray-800 truncate px-1">
                                        {kanji.meaning}
                                    </div>
                                    <div className="text-[10px] font-bold text-gray-400 mt-0.5 tracking-tight group-hover:text-gray-500 transition-colors">
                                        {kanji.onyomi?.[0] || kanji.kunyomi?.[0] || '-'}
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-32 bg-gray-50 rounded-[3rem] border-4 border-dashed border-gray-100 max-w-2xl mx-auto">
                    <div className="text-7xl mb-6">🛰️</div>
                    <h2 className="text-2xl font-black text-gray-900 mb-2">Kanji tidak ditemukan</h2>
                    <p className="text-gray-400 font-bold mb-8">Bantu pengembangan JBook dengan menambahkan karakter ini.</p>
                    <Link 
                        href="/kanji/add"
                        className="inline-flex items-center gap-2 bg-red-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-red-200 hover:bg-red-700 transition-all active:scale-95"
                    >
                        + Tambah Kanji Baru
                    </Link>
                </div>
            )}

            {/* Premium Pagination */}
            <div className="flex justify-center items-center gap-6 mt-8">
                {page > 1 && (
                    <Link
                        href={{ pathname: '/kanji', query: { ...params, page: page - 1 } }}
                        className="group flex items-center gap-2 bg-white border-2 border-gray-100 text-gray-500 hover:text-red-600 hover:border-red-100 px-6 py-3 rounded-2xl transition-all shadow-sm font-black text-sm active:scale-95"
                    >
                        <span className="group-hover:-translate-x-1 transition-transform">←</span> Prev
                    </Link>
                )}
                
                <div className="flex items-center gap-2">
                    <span className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center font-black text-sm shadow-lg shadow-red-200">
                        {page}
                    </span>
                </div>
                
                {hasMore && (
                    <Link
                        href={{ pathname: '/kanji', query: { ...params, page: page + 1 } }}
                        className="group flex items-center gap-2 bg-red-600 text-white border-2 border-red-600 hover:bg-red-700 hover:border-red-700 px-6 py-3 rounded-2xl transition-all shadow-xl shadow-red-100 font-black text-sm active:scale-95"
                    >
                        Next <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </Link>
                )}
            </div>
        </div>
    );
}