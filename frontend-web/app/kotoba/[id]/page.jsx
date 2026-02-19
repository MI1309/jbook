import { getVocabDetail } from '@/lib/api';
import Link from 'next/link';

export default async function KotobaDetailPage({ params }) {
    const { id } = await params;
    const vocab = await getVocabDetail(id);

    return (
        <div className="container mx-auto px-4 py-8 min-h-[80vh] flex flex-col items-center justify-center">
            <div className="w-full max-w-2xl">
                <Link href="/kotoba" className="inline-flex items-center text-red-600 font-bold hover:underline mb-8">
                    &larr; Kembali ke Daftar
                </Link>

                <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 text-center border-t-8 border-red-500 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 text-9xl font-serif select-none pointer-events-none text-red-900">
                        言
                    </div>

                    <div className="relative z-10">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 block">Vocabulary</span>

                        <div className="mb-8">
                            <div className="text-6xl md:text-8xl font-medium text-gray-800 select-all mb-2">
                                {vocab.word}
                            </div>
                            <div className="text-3xl text-red-500 font-serif">
                                {vocab.reading}
                            </div>
                        </div>

                        <div className="bg-red-50 p-6 rounded-2xl border border-red-100 mb-8">
                            <h3 className="text-sm font-bold text-red-400 uppercase tracking-widest mb-2">Arti / Makna</h3>
                            <p className="text-2xl font-bold text-gray-800">{vocab.meaning}</p>
                        </div>

                        {vocab.examples && vocab.examples.length > 0 && (
                            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 mb-8 text-left">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Contoh Kalimat</h3>
                                <div className="space-y-4">
                                    {vocab.examples.map((ex, idx) => {
                                        // Simple highlighter for the main word
                                        // Note: matches exact word. If conjugated (e.g. Tabemasu vs Taberu), this might miss.
                                        // But for N5/N4 simple examples it's a good start.
                                        const sentence = ex.sentence;
                                        const parts = sentence.split(vocab.word);

                                        return (
                                            <div key={idx} className="border-b border-gray-200 last:border-0 pb-3 last:pb-0">
                                                <p className="text-lg font-medium text-gray-800 mb-1 leading-loose">
                                                    {parts.map((part, i) => (
                                                        <span key={i}>
                                                            {part}
                                                            {i < parts.length - 1 && (
                                                                <ruby style={{ rubyPosition: 'under' }} className="mx-1">
                                                                    {vocab.word}
                                                                    <rt className="text-xs text-red-500 font-normal">{vocab.reading}</rt>
                                                                </ruby>
                                                            )}
                                                        </span>
                                                    ))}
                                                </p>
                                                <p className="text-gray-600 italic">{ex.meaning}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

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
