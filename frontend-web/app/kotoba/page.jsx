import { getVocabList } from '@/lib/api';
import Link from 'next/link';
import KotobaFilter from '@/components/KotobaFilter';
import { hasKanji } from '@/lib/utils';

export default async function KotobaPage({ searchParams }) {
    const params = await searchParams;
    const page = parseInt(params.page) || 1;
    const search = params.search || '';
    const level = params.level ? parseInt(params.level) : null;
    const limit = 50;

    const vocabList = await getVocabList({
        level,
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
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 mb-8">
                    {vocabList.map((vocab) => (
                        <Link href={`/kotoba/${vocab.id}`} key={vocab.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5 hover:shadow-md hover:border-red-300 hover:ring-2 hover:ring-red-100 hover:-translate-y-1 transition-all duration-300 relative group flex flex-col items-center justify-between min-h-[110px] sm:min-h-[130px]">
                            <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-gray-50 text-[9px] sm:text-[10px] font-bold text-gray-400 rounded group-hover:bg-red-50 group-hover:text-red-500 transition-colors">
                                N{vocab.jlpt_level}
                            </div>
                            <div className="flex-1 flex flex-col justify-center items-center w-full mt-3 sm:mt-2">
                                <ruby className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 tracking-wide text-center break-words max-w-full" style={{ rubyPosition: 'under' }}>
                                    {vocab.word}
                                    {hasKanji(vocab.word) && (
                                        <rt className="text-[10px] sm:text-xs md:text-sm text-red-500 font-bold leading-none mt-1 opacity-90">{vocab.furigana || vocab.reading}</rt>
                                    )}
                                </ruby>
                            </div>
                            <div className="w-full text-center text-gray-500 text-xs sm:text-sm border-t border-gray-50 pt-2 sm:pt-3 mt-2 sm:mt-3 font-medium line-clamp-2">
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
