
import { getGrammarDetail } from '@/lib/api';
import Link from 'next/link';

export default async function BunpoDetailPage({ params }) {
    const { id } = await params;
    const grammar = await getGrammarDetail(id);

    return (
        <div className="container mx-auto px-4 py-8">
            <Link href="/bunpo" className="text-blue-500 hover:underline mb-4 inline-block">&larr; Kembali ke Daftar</Link>

            <div className="bg-white shadow-md rounded-lg p-8 max-w-2xl mx-auto">
                <div className="mb-6 border-b pb-4">
                    <div className="flex justify-between items-center mb-2">
                        <h1 className="text-3xl font-bold text-gray-800">{grammar.title}</h1>
                        <span className="bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded-full">N{grammar.jlpt_level}</span>
                    </div>
                    <p className="text-xl text-gray-600 font-mono bg-gray-100 p-2 rounded">{grammar.structure}</p>
                </div>

                <div className="mb-8">
                    <h2 className="text-xl font-bold mb-3 text-gray-700">Penjelasan</h2>
                    <div className="text-lg text-gray-600 leading-relaxed whitespace-pre-wrap">
                        {grammar.explanation}
                    </div>
                </div>

                <div>
                    <h2 className="text-xl font-bold mb-3 text-gray-700">Contoh Kalimat</h2>
                    <div className="space-y-4">
                        {grammar.sentences.length > 0 ? (
                            grammar.sentences.map((sent, i) => (
                                <div key={i} className="p-4 bg-gray-50 rounded-lg border-l-4 border-blue-400">
                                    <p className="text-lg font-medium mb-1">{sent.japanese}</p>
                                    <p className="text-gray-600 italic">{sent.indonesian}</p>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 italic">Belum ada contoh kalimat.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
