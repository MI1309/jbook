import { getVocabDetail } from '@/lib/api';
import Link from 'next/link';
import { hasKanji } from '@/lib/utils';

export default async function KotobaDetailPage({ params }) {
    const { id } = await params;
    const vocab = await getVocabDetail(id);

    return (
        <div className="container mx-auto px-4 py-8 min-h-[80vh] flex flex-col items-center justify-center">
            <div className="w-full max-w-2xl">
                <Link href="/kotoba" className="inline-flex items-center text-red-600 font-bold hover:underline mb-8">
                    &larr; Kembali ke Daftar
                </Link>

                <div className="bg-white rounded-[2rem] shadow-xl p-6 sm:p-8 md:p-12 text-center border-t-8 border-red-500 relative overflow-hidden w-full">
                    <div className="absolute top-0 right-0 p-3 sm:p-4 opacity-5 text-7xl sm:text-9xl font-serif select-none pointer-events-none text-red-900">
                        言
                    </div>

                    <div className="relative z-10">
                        <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 sm:mb-4 block">Vocabulary</span>

                        <div className="mb-6 sm:mb-8 flex justify-center w-full overflow-hidden px-2">
                            <ruby className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 tracking-wider select-all break-words max-w-full leading-snug" style={{ rubyPosition: 'under' }}>
                                {vocab.word}
                                {hasKanji(vocab.word) && (
                                    <rt className="text-lg sm:text-xl md:text-2xl text-red-500 font-bold leading-none mt-1 sm:mt-2 opacity-90">{vocab.furigana || vocab.reading}</rt>
                                )}
                            </ruby>
                        </div>

                        <div className="bg-gradient-to-br from-red-50 to-white p-5 sm:p-6 md:p-8 rounded-2xl border border-red-100 shadow-sm mb-6 sm:mb-8">
                            <h3 className="text-[10px] sm:text-xs font-bold text-red-400 uppercase tracking-[0.2em] mb-2 sm:mb-3">Arti / Makna</h3>
                            <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 leading-relaxed">{vocab.meaning}</p>
                        </div>

                        <div className="flex justify-center gap-4">
                            <span className="px-4 py-2 bg-gray-100 rounded-full text-gray-600 font-bold text-sm">
                                JLPT N{vocab.jlpt_level}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
