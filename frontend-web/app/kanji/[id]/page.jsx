
import { getKanjiDetail } from '@/lib/api';
import Link from 'next/link';

import { toHiragana, toKatakana } from 'wanakana';

export default async function KanjiDetailPage({ params }) {
    const { id } = await params;
    const kanji = await getKanjiDetail(id);

    return (
        <div className="container mx-auto px-4 py-8">
            <Link href="/kanji" className="text-blue-500 hover:underline mb-4 inline-block">&larr; Kembali ke Daftar</Link>

            <div className="bg-white shadow-md rounded-lg p-8 max-w-2xl mx-auto">
                <div className="text-center mb-8">
                    <div className="text-9xl font-bold text-gray-800 mb-4">{kanji.character}</div>
                    <h1 className="text-3xl font-semibold text-gray-700">{kanji.meaning}</h1>
                    <div className="mt-2 inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                        JLPT N{kanji.jlpt_level}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div>
                        <h2 className="text-xl font-bold mb-2 border-b pb-1">Onyomi (Cara Baca China)</h2>
                        <ul className="list-disc list-inside text-lg text-gray-600">
                            {kanji.onyomi.length > 0 ? (
                                kanji.onyomi.map((reading, index) => (
                                    <li key={index}>{toKatakana(reading.toUpperCase())}</li>
                                ))
                            ) : (
                                <li>-</li>
                            )}
                        </ul>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold mb-2 border-b pb-1">Kunyomi (Cara Baca Jepang)</h2>
                        <ul className="list-disc list-inside text-lg text-gray-600">
                            {kanji.kunyomi.length > 0 ? (
                                kanji.kunyomi.map((reading, index) => (
                                    <li key={index}>{toHiragana(reading.toLowerCase())}</li>
                                ))
                            ) : (
                                <li>-</li>
                            )}
                        </ul>
                    </div>
                </div>

                <div>
                    <h2 className="text-xl font-bold mb-2 border-b pb-1">Contoh Kata</h2>
                    <div className="space-y-2">
                        {kanji.examples.length > 0 ? (
                            kanji.examples.map((ex, i) => (
                                <div key={i} className="p-2 bg-gray-50 rounded">
                                    <p className="font-bold mb-1">
                                        <ruby className="text-lg" style={{ rubyPosition: 'under' }}>
                                            {ex.word}
                                            <rt className="text-sm text-red-500 font-normal">{ex.reading}</rt>
                                        </ruby>
                                    </p>
                                    <p className="text-gray-600">{ex.meaning}</p>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 italic">Belum ada contoh kata.</p>
                        )}
                    </div>
                </div>

                <div className="mt-8 text-center text-sm text-gray-400">
                    Strokes: {kanji.strokes}
                </div>
            </div>
        </div>
    );
}
