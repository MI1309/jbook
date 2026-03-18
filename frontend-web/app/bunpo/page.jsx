import { getGrammarList } from '@/lib/api';
import BunpoFilter from '@/components/BunpoFilter';
import Link from 'next/link';
import { Suspense } from 'react';

const levelStyles = {
    1: { bar: 'bg-red-500',    badge: 'bg-red-100 text-red-700',    code: 'bg-red-50 border-red-100'    },
    2: { bar: 'bg-orange-400', badge: 'bg-orange-100 text-orange-700', code: 'bg-orange-50 border-orange-100' },
    3: { bar: 'bg-yellow-400', badge: 'bg-yellow-100 text-yellow-700', code: 'bg-yellow-50 border-yellow-100' },
    4: { bar: 'bg-teal-400',   badge: 'bg-teal-100 text-teal-700',   code: 'bg-teal-50 border-teal-100'   },
    5: { bar: 'bg-green-400',  badge: 'bg-green-100 text-green-700', code: 'bg-green-50 border-green-100' },
};

export default async function BunpoPage({ searchParams }) {
    const params = await searchParams;
    const page   = parseInt(params.page) || 1;
    const limit  = 24;

    const grammarList = await getGrammarList({
        level:   params.level,
        search:  params.search,
        chapter: params.chapter,
        limit,
        page,
    });

    const hasMore = grammarList.length === limit;

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="text-center mb-8">
                <h1 className="text-4xl font-extrabold text-gray-900 mb-1">
                    文法 <span className="text-red-600">Bunpo</span>
                </h1>
                <p className="text-sm text-gray-400">Ketuk kartu untuk melihat penjelasan lengkap</p>
            </div>

            <Suspense fallback={<div className="h-12 bg-gray-100 rounded-xl animate-pulse mb-6" />}>
                <BunpoFilter />
            </Suspense>

            {grammarList.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                    {grammarList.map((grammar) => {
                        const s = levelStyles[grammar.jlpt_level] ?? levelStyles[5];
                        return (
                            <Link
                                key={grammar.id}
                                href={`/bunpo/${grammar.id}`}
                                className="
                                    group relative flex flex-col gap-2.5
                                    bg-white rounded-2xl border border-gray-100
                                    px-5 pt-4 pb-4 overflow-hidden
                                    hover:shadow-lg hover:-translate-y-0.5
                                    active:scale-[0.98] active:shadow-sm
                                    transition-all duration-200
                                "
                            >
                                {/* Left color bar */}
                                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${s.bar} rounded-l-2xl`} />

                                {/* Top: chapter + level */}
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-400 font-medium">Bab {grammar.chapter}</span>
                                    <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${s.badge}`}>
                                        N{grammar.jlpt_level}
                                    </span>
                                </div>

                                {/* Title */}
                                <h3 className="text-[15px] font-bold text-gray-900 leading-snug line-clamp-2 group-hover:text-red-700 transition-colors duration-150">
                                    {grammar.title}
                                </h3>

                                {/* Structure */}
                                {grammar.structure && (
                                    <div className={`rounded-lg border px-3 py-2 ${s.code}`}>
                                        <code className="text-xs font-mono text-gray-600 break-all leading-relaxed">
                                            {grammar.structure}
                                        </code>
                                    </div>
                                )}

                                {/* Footer arrow */}
                                <div className="flex justify-end pt-0.5">
                                    <span className="text-xs text-gray-300 group-hover:text-red-400 group-hover:translate-x-1 transition-all duration-200 select-none">
                                        Lihat detail →
                                    </span>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-24 bg-gray-50 rounded-[3rem] border-4 border-dashed border-gray-100 max-w-2xl mx-auto">
                    <div className="text-7xl mb-6">📚</div>
                    <h2 className="text-2xl font-black text-gray-900 mb-2">Bunpo tidak ditemukan</h2>
                    <p className="text-gray-400 font-bold mb-8">Coba kata kunci lain atau bantu kami menambahkannya.</p>
                    <Link 
                        href="/bunpo/add"
                        className="inline-flex items-center gap-2 bg-red-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-red-200 hover:bg-red-700 transition-all active:scale-95"
                    >
                        + Tambah Tata Bahasa Baru
                    </Link>
                </div>
            )}

            {/* Pagination */}
            <div className="flex justify-center items-center gap-3">
                {page > 1 && (
                    <Link
                        href={{ pathname: '/bunpo', query: { ...params, page: page - 1 } }}
                        className="bg-white border border-gray-200 text-gray-700 px-5 py-2.5 rounded-xl hover:bg-gray-50 transition shadow-sm font-medium text-sm"
                    >
                        ← Sebelumnya
                    </Link>
                )}
                <span className="text-sm text-gray-400">Hal. {page}</span>
                {hasMore && (
                    <Link
                        href={{ pathname: '/bunpo', query: { ...params, page: page + 1 } }}
                        className="bg-red-600 text-white px-5 py-2.5 rounded-xl hover:bg-red-700 transition shadow-sm font-medium text-sm"
                    >
                        Selanjutnya →
                    </Link>
                )}
            </div>
        </div>
    );
}