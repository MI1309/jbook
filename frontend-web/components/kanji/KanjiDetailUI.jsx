'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toHiragana, toKatakana } from 'wanakana';
import { hasKanji } from '@/lib/utils';
import { findIdByString, resolveContentId } from '@/lib/api';
import { useTheme } from '@/context/ThemeContext';
import KanjiStrokeViewer from './KanjiStrokeViewer'; // Pastikan file KanjiStrokeViewer.jsx ada di folder yang sama

export default function KanjiDetailUI({ kanji, onClose }) {
    const router = useRouter();
    const { theme, mounted } = useTheme();

    // Ambil string data SVG dari database backend kamu
    // GANTI SEMENTARA UNTUK TES FRONTEND:
const kanjiSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="109" height="109" viewBox="0 0 109 109">
<g id="kvg:StrokePaths_04e43" style="fill:none;stroke:#000;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;">
<path id="kvg:04e43-s1" d="M33.25,19.25c2.25,1.25,4.54,1.21,6.75,0.75c13.75-2.88,27.25-5.38,36.25-6.75c5-0.76,6.5,1.5,5.25,5.5C75,39,63.25,69.5,39,87.75"/>
<path id="kvg:04e43-s2" d="M36.75,37c4.75,1.25,12,13.5,19.25,24.5c8.73,13.25,19.46,24.62,28,29c4.25,2.19,6.75,0.75,6-5"/>
</g>
<g id="kvg:StrokeNumbers_04e43" style="font-size:8;fill:#808080">
<text transform="matrix(1 0 0 1 26.5 19.5)">1</text>
<text transform="matrix(1 0 0 1 31.5 37.5)">2</text>
</g>
</svg>`;
    // Handle klik pada contoh kata (Kotoba)
    const handleExampleClick = async (word) => {
        const id = await resolveContentId('vocab', word);
        if (id) {
            router.push(`/kotoba/${id}`);
        } else {
            router.push(`/kotoba?search=${encodeURIComponent(word)}`);
        }
    };

    // Logger untuk mengecek interaksi klik pada kartu kanji besar
    const handleHugeKanjiClick = () => {
        console.log(`[jbook-debug] Kanji "${kanji?.character}" ditekan! Memicu interaksi.`);
    };

    // Tema & Styling Tokit (dari blueprint aslimu)
    const textColor = !mounted ? 'text-black' : (theme === 'dark' ? 'text-white' : 'text-black');
    const subTextColor = !mounted ? 'text-gray-400' : (theme === 'dark' ? 'text-gray-500' : 'text-gray-400');
    const cardBg = !mounted ? 'bg-white' : (theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-white');
    const sectionBg = !mounted ? 'bg-blue-50' : (theme === 'dark' ? 'bg-blue-950/10' : 'bg-blue-50');
    const borderStyle = !mounted ? 'border-gray-100' : (theme === 'dark' ? 'border-blue-950/20' : 'border-gray-100');

    return (
        <div className={`${cardBg} min-h-screen transition-colors duration-300`}>
            {/* Premium Header / Hero Section */}
            <div className={`bg-gradient-to-b ${theme === 'dark' ? 'from-black to-[#0a0a0a]' : 'from-gray-50 to-white'} pt-12 pb-20 border-b ${borderStyle}`}>
                <div className="container mx-auto px-6 max-w-5xl">
                    <button onClick={() => onClose ? onClose() : router.back()} className={`inline-flex items-center gap-2 text-sm font-black transition-all mb-12 group active:scale-95 ${subTextColor} hover:text-blue-600`}>
                        <span className="group-hover:-translate-x-1 transition-transform">←</span> Kembali
                    </button>

                    <div className="flex flex-col md:flex-row items-center md:items-start gap-12 lg:gap-20">
                        {/* Huge Character Card */}
                        <div 
                            className="relative group flex flex-col items-center gap-4 cursor-pointer"
                            onClick={handleHugeKanjiClick}
                        >
                            <div className="absolute inset-x-0 bottom-0 top-12 bg-blue-600 rounded-[3rem] blur-3xl opacity-10 group-hover:opacity-20 transition-opacity"></div>
                            <div className={`relative ${cardBg} border-4 ${borderStyle} rounded-[3rem] shadow-2xl p-12 w-[240px] h-[240px] lg:w-[320px] lg:h-[320px] flex items-center justify-center select-none overflow-hidden transition-colors duration-300 ${textColor}`}>
                                <span className="text-[120px] lg:text-[160px] font-serif leading-none group-hover:scale-110 transition-transform duration-500">
                                    {kanji.character}
                                </span>
                                {/* Stroking count badge */}
                                <div className="absolute bottom-6 right-6 bg-blue-600 text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg">
                                    {kanji.strokes || 0} STROKES
                                </div>
                            </div>
                        </div>

                        {/* ================= VISUALISASI KANJIVG STROKE VIEWER ================= */}
                        {kanjiSvg && (
                            <div className="flex flex-col items-center gap-2">
                                <KanjiStrokeViewer svgContent={kanjiSvg} size={180} />
                                <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">
                                    Urutan Goresan
                                </span>
                            </div>
                        )}
                        {/* =========================================================================== */}

                        {/* Title & Core Info */}
                        <div className="flex-1 text-center md:text-left py-4">
                             <div className="inline-flex items-center gap-2 mb-6">
                                <span className="bg-blue-600 text-white text-xs font-black px-4 py-1.5 rounded-full shadow-lg shadow-blue-500/10">
                                    JLPT N{kanji.jlpt_level}
                                </span>
                             </div>
                            
                            <h1 className={`text-4xl md:text-5xl lg:text-7xl font-black mb-4 tracking-tight leading-tight transition-colors ${textColor}`}>
                                {kanji.meaning}
                            </h1>
                            
                            <p className={`${subTextColor} text-lg font-bold max-w-lg transition-colors`}>
                                Karakter dasar penting untuk level N{kanji.jlpt_level}. Pelajari cara baca dan penggunaannya di bawah.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Detailed Info Sections */}
            <div className={`container mx-auto px-6 py-20 max-w-5xl transition-colors ${textColor}`}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Read Alignments (On/Kun) */}
                    <div className="lg:col-span-1 space-y-8">
                        {/* Onyomi */}
                        <section className={`${sectionBg} rounded-3xl p-8 border ${borderStyle}`}>
                            <h3 className={`text-xs font-black uppercase tracking-widest mb-6 flex items-center gap-2 ${subTextColor}`}>
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                                Onyomi (Cara Baca China)
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {kanji.onyomi && kanji.onyomi.length > 0 ? (
                                    kanji.onyomi.map((reading, index) => (
                                        <div key={index} className={`${cardBg} ${borderStyle} border px-4 py-2 rounded-2xl shadow-sm text-lg font-black text-blue-600 dark:text-blue-400`}>
                                            {toKatakana(reading.toUpperCase())}
                                        </div>
                                    ))
                                ) : (
                                    <span className={`font-bold italic ${subTextColor}`}>Bebas Onyomi</span>
                                )}
                            </div>
                        </section>
 
                        {/* Kunyomi */}
                        <section className={`${sectionBg} rounded-3xl p-8 border ${borderStyle}`}>
                            <h3 className={`text-xs font-black uppercase tracking-widest mb-6 flex items-center gap-2 ${subTextColor}`}>
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                                Kunyomi (Cara Baca Jepang)
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {kanji.kunyomi && kanji.kunyomi.length > 0 ? (
                                    kanji.kunyomi.map((reading, index) => (
                                        <div key={index} className={`${cardBg} ${borderStyle} border px-4 py-2 rounded-2xl shadow-sm text-lg font-black ${textColor}`}>
                                            {toHiragana(reading.toLowerCase())}
                                        </div>
                                    ))
                                ) : (
                                    <span className={`font-bold italic ${subTextColor}`}>Bebas Kunyomi</span>
                                )}
                            </div>
                        </section>
                    </div>
 
                    {/* Examples Section */}
                    <div className="lg:col-span-2">
                        <section className={`${cardBg} rounded-[2.5rem] border ${borderStyle} p-10 shadow-2xl shadow-blue-500/5 h-full transition-colors`}>
                            <h3 className={`text-2xl font-black mb-10 flex items-center gap-4 transition-colors ${textColor}`}>
                                <span className="p-3 bg-blue-600 text-white rounded-2xl">🔖</span>
                                Contoh Kata (Kotoba)
                            </h3>
                            
                            <div className="space-y-6">
                                {kanji.examples && kanji.examples.length > 0 ? (
                                    kanji.examples.map((ex, i) => (
                                        <div 
                                            key={i} 
                                            onClick={() => handleExampleClick(ex.word)}
                                            className={`group p-6 ${sectionBg} hover:${cardBg} rounded-[2rem] border ${theme === 'dark' ? 'border-blue-950/20' : 'border-gray-100'} hover:border-blue-600 transition-all cursor-pointer`}
                                        >
                                            <div className="flex justify-between items-start gap-4">
                                                <div>
                                                    <ruby className={`text-3xl font-black transition-colors ${textColor} group-hover:text-blue-600`}>
                                                        {ex.word}
                                                        {hasKanji(ex.word) && (
                                                            <rt className={`text-xs font-black pb-1 select-none ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>{ex.reading}</rt>
                                                        )}
                                                    </ruby>
                                                    <p className={`mt-3 text-lg font-bold ${subTextColor}`}>{ex.meaning}</p>
                                                </div>
                                                <div className="opacity-0 group-hover:opacity-100 p-3 bg-blue-600 text-white rounded-xl transition-opacity active:scale-95 shadow-xl shadow-blue-500/20 font-black text-xs">
                                                    Detail →
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className={`text-center py-16 ${sectionBg} rounded-3xl border-2 border-dashed ${borderStyle}`}>
                                        <p className={`font-bold italic ${subTextColor}`}>Belum tersedia contoh kata.</p>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>
                </div>
            </div>
            
            {/* Action Footer */}
            <footer className={`container mx-auto px-6 py-12 max-w-5xl border-t ${borderStyle} text-center transition-colors`}>
                <p className={`text-[10px] font-black uppercase tracking-widest mb-6 ${subTextColor}`}>Siap untuk berlatih?</p>
                <Link href="/practice" className="inline-flex items-center gap-3 bg-blue-600 text-white px-10 py-5 rounded-3xl font-black hover:bg-blue-700 transition-all shadow-2xl shadow-blue-500/20 active:scale-95">
                    Mulai Latihan Kanji <span className="text-lg">🎯</span>
                </Link>
            </footer>
        </div>
    );
}