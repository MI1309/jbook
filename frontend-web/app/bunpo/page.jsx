
import { getGrammarList } from '@/lib/api';
import GrammarCard from '@/components/GrammarCard';
import BunpoFilter from '@/components/BunpoFilter';
import Link from 'next/link';
import { Suspense } from 'react';

export default async function BunpoPage({ searchParams }) {
    const params = await searchParams;
    const page = parseInt(params.page) || 1;
    const limit = 24; // Items per page

    // Fetch data with filters
    const grammarList = await getGrammarList({
        level: params.level,
        search: params.search,
        chapter: params.chapter,
        limit,
        page
    });

    const hasMore = grammarList.length === limit;

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6 text-center text-red-600">Daftar Bunpo (文法)</h1>

            <Suspense fallback={<div>Loading filter...</div>}>
                <BunpoFilter />
            </Suspense>

            {grammarList.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {grammarList.map((grammar) => (
                        <GrammarCard
                            key={grammar.id}
                            id={grammar.id}
                            title={grammar.title}
                            structure={grammar.structure}
                            level={grammar.jlpt_level}
                            chapter={grammar.chapter}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-gray-50 rounded-lg">
                    <p className="text-xl text-gray-500">Tidak ada Bunpo yang ditemukan.</p>
                    <p className="text-sm text-gray-400 mt-2">Coba kata kunci lain atau hapus filter.</p>
                </div>
            )}

            {/* Pagination Controls */}
            <div className="flex justify-center gap-4 mt-8">
                {page > 1 && (
                    <Link
                        href={{
                            pathname: '/bunpo',
                            query: { ...params, page: page - 1 }
                        }}
                        className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition shadow-sm font-medium"
                    >
                        &larr; Sebelumnya
                    </Link>
                )}

                {hasMore && (
                    <Link
                        href={{
                            pathname: '/bunpo',
                            query: { ...params, page: page + 1 }
                        }}
                        className="bg-red-600 border border-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition shadow-md font-medium"
                    >
                        Selanjutnya &rarr;
                    </Link>
                )}
            </div>
        </div>
    );
}
