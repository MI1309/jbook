import { getKanjiList } from '@/lib/api';
import KanjiFilter from '@/components/KanjiFilter';
import Link from 'next/link';
import { Suspense } from 'react';

const levelStyles = {
    1: { border: 'border-red-200',   badge: 'bg-red-100 text-red-700',    glow: 'hover:border-red-300',   char: 'text-red-900'   },
    2: { border: 'border-orange-200', badge: 'bg-orange-100 text-orange-700', glow: 'hover:border-orange-300', char: 'text-orange-900' },
    3: { border: 'border-yellow-200', badge: 'bg-yellow-100 text-yellow-700', glow: 'hover:border-yellow-300', char: 'text-yellow-900' },
    4: { border: 'border-teal-200',  badge: 'bg-teal-100 text-teal-700',   glow: 'hover:border-teal-300',  char: 'text-teal-900'  },
    5: { border: 'border-green-200', badge: 'bg-green-100 text-green-700', glow: 'hover:border-green-300', char: 'text-green-900' },
};

export default async function KanjiPage({ searchParams }) {
    const params = await searchParams;
    const page   = parseInt(params.page) || 1;
    const limit  = 24;

    const kanjiList = await getKanjiList({
        level:   params.level,
        search:  params.search,
        radical: params.radical,
        limit,
        page,
    });

    const hasMore = kanjiList.length === limit;

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="text-center mb-8">
                <h1 className="text-4xl font-extrabold text-gray-900 mb-1">
                    漢字 <span className="text-red-600">Kanji</span>
                </h1>
                <p className="text-sm text-gray-400">Ketuk kartu untuk melihat detail</p>
            </div>

            <Suspense fallback={<div className="h-12 bg-gray-100 rounded-xl animate-pulse mb-6" />}>
                <KanjiFilter />
            </Suspense>

            {kanjiList.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-8">
                    {kanjiList.map((kanji) => {
                        const s = levelStyles[kanji.jlpt_level] ?? levelStyles[5];
                        return (
                            <Link
                                key={kanji.id}
                                href={`/kanji/${kanji.id}`}
                                className={`
                                    group flex flex-col items-center justify-between
                                    bg-white rounded-2xl border-2 ${s.border} ${s.glow}
                                    px-3 pt-2 pb-3 min-h-[130px]
                                    hover:shadow-lg hover:-translate-y-1
                                    active:scale-95 active:shadow-sm
                                    transition-all duration-200
                                `}
                            >
                                {/* Level badge */}
                                <span className={`self-end text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${s.badge}`}>
                                    N{kanji.jlpt_level}
                                </span>

                                {/* Big character */}
                                <span className={`text-5xl font-serif leading-none ${s.char} group-hover:scale-110 transition-transform duration-200`}>
                                    {kanji.character}
                                </span>

                                {/* Meaning + reading */}
                                <div className="w-full text-center mt-1.5 space-y-0.5">
                                    <div className="text-xs font-semibold text-gray-700 truncate leading-tight">
                                        {kanji.meaning}
                                    </div>
                                    {kanji.onyomi?.length > 0 && (
                                        <div className="text-[10px] text-gray-400 truncate">
                                            {kanji.onyomi[0]}
                                        </div>
                                    )}
                                </div>
                            </Link>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-20 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="text-5xl mb-4">🔍</div>
                    <p className="text-lg font-semibold text-gray-600">Tidak ada Kanji ditemukan</p>
                    <p className="text-sm text-gray-400 mt-1">Coba kata kunci lain atau hapus filter.</p>
                </div>
            )}

            {/* Pagination */}
            <div className="flex justify-center items-center gap-3">
                {page > 1 && (
                    <Link
                        href={{ pathname: '/kanji', query: { ...params, page: page - 1 } }}
                        className="bg-white border border-gray-200 text-gray-700 px-5 py-2.5 rounded-xl hover:bg-gray-50 transition shadow-sm font-medium text-sm"
                    >
                        ← Sebelumnya
                    </Link>
                )}
                <span className="text-sm text-gray-400">Hal. {page}</span>
                {hasMore && (
                    <Link
                        href={{ pathname: '/kanji', query: { ...params, page: page + 1 } }}
                        className="bg-red-600 text-white px-5 py-2.5 rounded-xl hover:bg-red-700 transition shadow-sm font-medium text-sm"
                    >
                        Selanjutnya →
                    </Link>
                )}
            </div>
        </div>
    );
}