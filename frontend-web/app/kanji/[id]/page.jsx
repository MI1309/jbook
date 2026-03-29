import { getKanjiDetail } from '@/lib/api';
import Link from 'next/link';
import { toHiragana, toKatakana } from 'wanakana';
import { hasKanji } from '@/lib/utils';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }) {
    const { id } = await params;
    try {
        const kanji = await getKanjiDetail(id);
        return {
            title: `Kanji ${kanji.character} (${kanji.meaning}) - JBook`,
            description: `Pelajari cara baca Onyomi: ${kanji.onyomi.join(', ')}, Kunyomi: ${kanji.kunyomi.join(', ')} untuk karakter ${kanji.character} (${kanji.meaning}).`,
        };
    } catch (e) {
        return { title: 'Kanji Detail - JBook' };
    }
}

export default async function KanjiDetailPage({ params }) {
    const { id } = await params;
    
    let kanji;
    try {
        kanji = await getKanjiDetail(id);
        if (!kanji) {
            notFound();
        }
    } catch (error) {
        notFound();
    }

    return (
        <div className="bg-white min-h-screen">
            {/* Premium Header / Hero Section */}
            <div className={`bg-gradient-to-b from-gray-50 to-white pt-12 pb-20 border-b border-gray-100`}>
                <div className="container mx-auto px-6 max-w-5xl">
                    <Link href="/kanji" className="inline-flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-red-600 transition-all mb-12 group active:scale-95">
                        <span className="group-hover:-translate-x-1 transition-transform">←</span> Kembali ke Daftar
                    </Link>

                    <div className="flex flex-col md:flex-row items-center md:items-start gap-12 lg:gap-20">
                        {/* Huge Character Card */}
                        <div className="relative group">
                            <div className="absolute inset-0 bg-red-600 rounded-[3rem] blur-2xl opacity-10 group-hover:opacity-20 transition-opacity"></div>
                            <div className="relative bg-white border-4 border-gray-50 rounded-[3rem] shadow-2xl p-12 w-[240px] h-[240px] lg:w-[320px] lg:h-[320px] flex items-center justify-center select-none overflow-hidden">
                                <span className="text-[120px] lg:text-[160px] font-serif leading-none text-gray-900 group-hover:scale-110 transition-transform duration-500">
                                    {kanji.character}
                                </span>
                                {/* Stroking count badge */}
                                <div className="absolute bottom-6 right-6 bg-gray-900 text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg">
                                    {kanji.strokes} STROKES
                                </div>
                            </div>
                        </div>

                        {/* Title & Core Info */}
                        <div className="flex-1 text-center md:text-left py-4">
                            <div className="inline-flex items-center gap-2 mb-6">
                                <span className="bg-red-600 text-white text-xs font-black px-4 py-1.5 rounded-full shadow-lg shadow-red-200">
                                    JLPT N{kanji.jlpt_level}
                                </span>
                                <span className="bg-gray-100 text-gray-400 text-[10px] font-black tracking-widest px-3 py-1.5 rounded-full uppercase">
                                    ID: {kanji.id.substring(0, 8)}
                                </span>
                            </div>
                            
                            <h1 className="text-4xl md:text-5xl lg:text-7xl font-black text-gray-900 mb-4 tracking-tight leading-tight">
                                {kanji.meaning}
                            </h1>
                            
                            <p className="text-gray-400 text-lg font-medium max-w-lg">
                                Karakter dasar penting untuk level N{kanji.jlpt_level}. Pelajari cara baca dan penggunaannya di bawah.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Detailed Info Sections */}
            <div className="container mx-auto px-6 py-20 max-w-5xl">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Read Alignments (On/Kun) */}
                    <div className="lg:col-span-1 space-y-8">
                        {/* Onyomi */}
                        <section className="bg-gray-50/50 rounded-3xl p-8 border border-gray-100">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                Onyomi (Cara Baca China)
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {kanji.onyomi.length > 0 ? (
                                    kanji.onyomi.map((reading, index) => (
                                        <div key={index} className="bg-white border border-gray-100 px-4 py-2 rounded-2xl shadow-sm text-lg font-bold text-blue-600">
                                            {toKatakana(reading.toUpperCase())}
                                        </div>
                                    ))
                                ) : (
                                    <span className="text-gray-300 font-bold italic">Bebas Onyomi</span>
                                )}
                            </div>
                        </section>

                        {/* Kunyomi */}
                        <section className="bg-gray-50/50 rounded-3xl p-8 border border-gray-100">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                Kunyomi (Cara Baca Jepang)
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {kanji.kunyomi.length > 0 ? (
                                    kanji.kunyomi.map((reading, index) => (
                                        <div key={index} className="bg-white border border-gray-100 px-4 py-2 rounded-2xl shadow-sm text-lg font-bold text-green-600">
                                            {toHiragana(reading.toLowerCase())}
                                        </div>
                                    ))
                                ) : (
                                    <span className="text-gray-300 font-bold italic">Bebas Kunyomi</span>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Examples Section */}
                    <div className="lg:col-span-2">
                        <section className="bg-white rounded-[2.5rem] border border-gray-100 p-10 shadow-xl shadow-gray-100/50 h-full">
                            <h3 className="text-2xl font-black text-gray-900 mb-10 flex items-center gap-4">
                                <span className="p-3 bg-red-50 text-red-600 rounded-2xl">🔖</span>
                                Contoh Kata (Kotoba)
                            </h3>
                            
                            <div className="space-y-6">
                                {kanji.examples.length > 0 ? (
                                    kanji.examples.map((ex, i) => (
                                        <div key={i} className="group p-6 bg-gray-50/50 hover:bg-white rounded-[2rem] border border-transparent hover:border-red-100 hover:shadow-xl hover:shadow-red-500/5 transition-all">
                                            <div className="flex justify-between items-start gap-4">
                                                <div>
                                                    <ruby className="text-3xl font-black text-gray-900 group-hover:text-red-600 transition-colors" style={{ rubyPosition: 'under' }}>
                                                        {ex.word}
                                                        {hasKanji(ex.word) && (
                                                            <rt className="text-xs text-red-400 font-bold pb-1 select-none">{ex.reading}</rt>
                                                        )}
                                                    </ruby>
                                                    <p className="mt-3 text-lg font-medium text-gray-500">{ex.meaning}</p>
                                                </div>
                                                <button className="opacity-0 group-hover:opacity-100 p-3 bg-red-600 text-white rounded-xl transition-opacity active:scale-95 shadow-lg shadow-red-200">
                                                    🔊
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-16 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100">
                                        <p className="text-gray-400 font-bold italic">Belum tersedia contoh kata.</p>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>
                </div>
            </div>
            
            {/* Action Footer */}
            <footer className="container mx-auto px-6 py-12 max-w-5xl border-t border-gray-50 text-center">
                <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-6">Siap untuk berlatih?</p>
                <Link href="/practice" className="inline-flex items-center gap-3 bg-gray-900 text-white px-10 py-5 rounded-2xl font-black hover:bg-red-600 transition-all shadow-xl active:scale-95">
                    Mulai Latihan Kanji <span className="text-lg">🎯</span>
                </Link>
            </footer>
        </div>
    );
}
