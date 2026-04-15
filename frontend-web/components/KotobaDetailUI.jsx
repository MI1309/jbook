'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { hasKanji, extractKanji } from '@/lib/utils';
import { findIdByString } from '@/lib/api';
import { dbGetAll } from '@/lib/offline-db';
import { useTheme } from '@/context/ThemeContext';

export default function KotobaDetailUI({ vocab, onClose }) {
    const router = useRouter();
    const { theme, mounted } = useTheme();
    const [kanjiDetails, setKanjiDetails] = useState([]);
    
    if (!vocab) return null;

    // Dissect word into characters and identify Kanjis
    const characters = (vocab?.word || '').split('');
    const uniqueKanjis = extractKanji(vocab?.word || '');

    useEffect(() => {
        async function fetchKanjiDetails() {
            if (uniqueKanjis.length === 0) return;
            try {
                // Get all Kanjis from local DB to find meanings/readings
                const allKanjis = await dbGetAll('kanji');
                if (allKanjis && allKanjis.length > 0) {
                    const filtered = allKanjis.filter(k => uniqueKanjis.includes(k.character));
                    setKanjiDetails(filtered);
                }
            } catch (err) {
                console.warn('[jbook-vocab] Failed to fetch kanji details for dissection:', err);
            }
        }
        fetchKanjiDetails();
    }, [vocab?.word]);

    const handleKanjiClick = async (char) => {
        const id = await findIdByString('kanji', char);
        if (id) {
            router.push(`/kanji/${id}`);
        } else {
            // Fallback to search
            router.push(`/kanji?search=${encodeURIComponent(char)}`);
        }
    };

    const textColor = !mounted ? 'text-black' : (theme === 'dark' ? 'text-white' : 'text-black');
    const subTextColor = !mounted ? 'text-gray-400' : (theme === 'dark' ? 'text-gray-500' : 'text-gray-400');
    const cardBg = !mounted ? 'bg-white' : (theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-white');
    const sectionBg = !mounted ? 'bg-red-50' : (theme === 'dark' ? 'bg-red-950/10' : 'bg-red-50');
    const borderStyle = !mounted ? 'border-gray-100' : (theme === 'dark' ? 'border-red-950/20' : 'border-gray-100');

    return (
        <div className={`container mx-auto px-4 py-8 min-h-[80vh] flex flex-col items-center justify-center transition-colors duration-300`}>
            <div className="w-full max-w-2xl">
                {onClose ? (
                    <button onClick={onClose} className={`inline-flex items-center font-black transition-all mb-8 hover:text-red-600 ${subTextColor}`}>
                        &larr; Kembali ke Daftar
                    </button>
                ) : (
                    <Link href="/kotoba" className={`inline-flex items-center font-black transition-all mb-8 hover:text-red-600 ${subTextColor}`}>
                        &larr; Kembali ke Daftar
                    </Link>
                )}

                <div className={`${cardBg} rounded-[2.5rem] shadow-2xl p-6 sm:p-8 md:p-12 text-center border-t-8 border-red-600 relative overflow-hidden w-full transition-all border-b border-x ${borderStyle}`}>
                    <div className="absolute top-0 right-0 p-3 sm:p-4 opacity-5 text-7xl sm:text-9xl font-serif select-none pointer-events-none text-red-900 leading-none">
                        言
                    </div>

                    <div className={`relative z-10 text-left sm:text-center transition-colors ${textColor}`}>
                        <span className={`text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] mb-3 sm:mb-4 block text-center ${subTextColor}`}>Vocabulary</span>

                        <div className="mb-6 sm:mb-8 flex justify-center w-full px-2">
                            <ruby className={`text-3xl sm:text-4xl md:text-5xl font-black tracking-wider transition-colors ${textColor}`} style={{ rubyPosition: 'under' }}>
                                <span className="inline-flex gap-0.5">
                                    {characters.map((char, index) => (
                                        hasKanji(char) ? (
                                            <span 
                                                key={index} 
                                                onClick={() => handleKanjiClick(char)}
                                                className="hover:text-red-600 cursor-pointer transition-all duration-200 border-b-4 border-transparent hover:border-red-500 px-1 rounded-t-xl hover:bg-red-50 dark:hover:bg-red-950/30"
                                                title={`Lihat detail Kanji: ${char}`}
                                            >
                                                {char}
                                            </span>
                                        ) : (
                                            <span key={index} className="px-0.5">{char}</span>
                                        )
                                    ))}
                                </span>
                                {hasKanji(vocab?.word) && (
                                    <rt className="text-lg sm:text-xl md:text-2xl text-red-600 dark:text-red-500 font-black leading-none mt-1 sm:mt-2">{vocab?.furigana || vocab?.reading || ''}</rt>
                                )}
                            </ruby>
                        </div>

                        <div className={`${sectionBg} p-5 sm:p-6 md:p-8 rounded-2xl border ${theme === 'dark' ? 'border-red-950/30' : 'border-red-100'} shadow-inner mb-8 text-left transition-colors`}>
                            <h3 className="text-[10px] sm:text-xs font-black text-red-600 dark:text-red-400 uppercase tracking-[0.2em] mb-2 sm:mb-3">Arti / Makna</h3>
                            <p className={`text-lg sm:text-xl md:text-2xl font-black leading-relaxed tracking-tight ${textColor}`}>{vocab?.meaning || 'Tidak ada arti'}</p>
                        </div>

                        {/* Visual Dissection Section */}
                        {uniqueKanjis.length > 0 && (
                            <div className="mb-10 text-left">
                                <h3 className={`text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-2 transition-colors ${subTextColor}`}>
                                    <span className="w-2 h-2 rounded-full bg-red-600 shadow-lg shadow-red-500/20"></span>
                                    Bedah Kanji (Karakter Penyusun)
                                </h3>
                                <div className="grid grid-cols-1 gap-3">
                                    {uniqueKanjis.map((char, i) => {
                                        const detail = kanjiDetails.find(kd => kd.character === char);
                                        return (
                                            <button
                                                key={i}
                                                onClick={() => handleKanjiClick(char)}
                                                className={`group flex items-center gap-4 ${theme === 'dark' ? 'bg-red-950/10 hover:bg-red-950/20' : 'bg-gray-50 hover:bg-white'} border ${borderStyle} hover:border-red-600 p-4 rounded-2xl transition-all shadow-sm active:scale-95 text-left`}
                                            >
                                                <span className={`text-4xl font-serif group-hover:text-red-600 transition-colors w-12 text-center ${textColor}`}>{char}</span>
                                                <div className="flex-1">
                                                    <p className={`text-sm font-black leading-snug ${textColor}`}>{detail?.meaning || 'Memuat makna...'}</p>
                                                    <p className={`text-[10px] font-black uppercase tracking-tighter mt-0.5 transition-colors ${subTextColor}`}>
                                                        {detail?.onyomi?.[0] || detail?.kunyomi?.[0] || 'Reading'} \u2022 Klik untuk detail
                                                    </p>
                                                </div>
                                                <span className="text-xl text-gray-400 group-hover:text-red-400 transition-colors">\u2192</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-center gap-4 flex-wrap mt-4">
                            <span className={`px-4 py-2 ${theme === 'dark' ? 'bg-red-950/20 text-red-400' : 'bg-gray-100 text-gray-600'} rounded-full font-black text-xs uppercase tracking-widest`}>
                                JLPT N{vocab.jlpt_level}
                            </span>
                            {vocab.word_type && (
                                <span className={`px-4 py-2 ${theme === 'dark' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-600'} rounded-full font-black text-xs uppercase tracking-widest border border-red-100 dark:border-red-900/30 transition-colors shadow-sm`}>
                                    {vocab.word_type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
