
import { getKanjiList } from '@/lib/api';
import KanjiCard from '@/components/KanjiCard';
import KanjiFilter from '@/components/KanjiFilter';
import Link from 'next/link';
import { Suspense } from 'react';

export default async function KanjiPage({ searchParams }) {
    const params = await searchParams;
    const page = parseInt(params.page) || 1;
    const limit = 24; // Show more items per page

    // Fetch data with filters
    const kanjiList = await getKanjiList({
        level: params.level,
        search: params.search,
        radical: params.radical,
        limit,
        page
    });

    const hasMore = kanjiList.length === limit;

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6 text-center text-red-600">Daftar Kanji (漢字)</h1>

            <Suspense fallback={<div>Loading filter...</div>}>
                <KanjiFilter />
            </Suspense>

            {kanjiList.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
                    {kanjiList.map((kanji) => (
                        <KanjiCard
                            key={kanji.id}
                            id={kanji.id}
                            character={kanji.character}
                            meaning={kanji.meaning}
                            onyomi={kanji.onyomi}
                            kunyomi={kanji.kunyomi}
                            level={kanji.jlpt_level}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-gray-50 rounded-lg">
                    <p className="text-xl text-gray-500">Tidak ada Kanji yang ditemukan.</p>
                    <p className="text-sm text-gray-400 mt-2">Coba kata kunci lain atau hapus filter.</p>
                </div>
            )}

            {/* Pagination Controls */}
            <div className="flex justify-center gap-4 mt-8">
                {page > 1 && (
                    <Link
                        href={{
                            pathname: '/kanji',
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
                            pathname: '/kanji',
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
