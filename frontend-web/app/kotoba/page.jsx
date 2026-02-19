import { getVocabList } from '@/lib/api';
import Link from 'next/link';
import KotobaFilter from '@/components/KotobaFilter';

export default async function KotobaPage({ searchParams }) {
    const params = await searchParams;
    const page = parseInt(params.page) || 1;
    const search = params.search || '';
    const limit = 50;

    const vocabList = await getVocabList({
        search,
        limit,
        page
    });

    const hasMore = vocabList.length === limit;

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6 text-center text-red-600">Daftar Kosakata (言葉)</h1>

            {/* Live Search Filter */}
            <KotobaFilter />

            {vocabList.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
                    {vocabList.map((vocab) => (
                        <Link href={`/kotoba/${vocab.id}`} key={vocab.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition relative group overflow-hidden block">
                            <div className="absolute top-0 right-0 px-2 py-1 bg-gray-50 text-xs font-bold text-gray-400 rounded-bl-lg">
                                N{vocab.jlpt_level}
                            </div>
                            <div className="mb-2">
                                <div className="text-2xl font-bold text-gray-800">{vocab.word}</div>
                                <div className="text-lg text-red-500 font-medium mb-1">{vocab.reading}</div>
                            </div>
                            <div className="text-gray-600 text-sm border-t border-gray-100 pt-2 mt-2">
                                {vocab.meaning}
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-gray-50 rounded-lg">
                    <p className="text-xl text-gray-500">Tidak ada kosakata yang ditemukan.</p>
                </div>
            )}

            {/* Pagination Controls */}
            <div className="flex justify-center gap-4 mt-8">
                {page > 1 && (
                    <Link
                        href={{
                            pathname: '/kotoba',
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
                            pathname: '/kotoba',
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
