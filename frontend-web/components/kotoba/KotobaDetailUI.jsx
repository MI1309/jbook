'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { hasKanji, extractKanji } from '@/lib/utils';
import { findIdByString } from '@/lib/api';
import { dbGetAll } from '@/lib/offline-db';
import { useTheme } from '@/context/ThemeContext';
import { Volume2 } from 'lucide-react';

export default function KotobaDetailUI({ vocab, onClose }) {
    const router = useRouter();
    const { theme, mounted } = useTheme();
    const [kanjiDetails, setKanjiDetails] = useState([]);
    const [playing, setPlaying] = useState(false);
    
    const playAudio = () => {
        if (!vocab || playing) return;
        setPlaying(true);
        
        // 1. Try our custom backend API first
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const audioUrl = `${baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl}/api/content/vocab/${vocab.id}/audio`;
        
        const audio = new Audio(audioUrl);
        audio.onended = () => setPlaying(false);
        audio.onerror = () => {
            // Fallback to browser's Web Speech API if API fails
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
                let cleanWord = vocab.word.split(' ')[0].split('(')[0].split('（')[0];
                let textToSpeak = vocab.reading || cleanWord;
                const utterance = new SpeechSynthesisUtterance(textToSpeak);
                utterance.lang = 'ja-JP';
                utterance.rate = 0.8;
                utterance.onend = () => setPlaying(false);
                utterance.onerror = () => setPlaying(false);
                window.speechSynthesis.speak(utterance);
            } else {
                setPlaying(false);
            }
        };
        audio.play().catch((err) => {
            // Play failed, trigger Speech fallback
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
                let cleanWord = vocab.word.split(' ')[0].split('(')[0].split('（')[0];
                let textToSpeak = vocab.reading || cleanWord;
                const utterance = new SpeechSynthesisUtterance(textToSpeak);
                utterance.lang = 'ja-JP';
                utterance.rate = 0.8;
                utterance.onend = () => setPlaying(false);
                utterance.onerror = () => setPlaying(false);
                window.speechSynthesis.speak(utterance);
            } else {
                setPlaying(false);
            }
        });
    };
    
    if (!vocab) return null;

    // Dissect word into characters and identify Kanjis
    const characters = (vocab?.word || '').split('');
    const uniqueKanjis = extractKanji(vocab?.word || '');

    useEffect(() => {
        async function fetchKanjiDetails() {
            if (uniqueKanjis.length === 0) return;
            try {
                // 1. Try local DB first
                const allKanjis = await dbGetAll('kanji');
                let foundKanjis = [];
                if (allKanjis && allKanjis.length > 0) {
                    foundKanjis = allKanjis.filter(k => uniqueKanjis.includes(k.character));
                }

                // 2. If not all kanjis found locally, fetch from API
                if (foundKanjis.length < uniqueKanjis.length) {
                    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                    const fetchPromises = uniqueKanjis
                        .filter(char => !foundKanjis.some(fk => fk.character === char))
                        .map(async (char) => {
                            try {
                                // Find ID first
                                const id = await findIdByString('kanji', char);
                                if (!id) return null;
                                const res = await fetch(`${baseUrl}/api/content/kanji/${id}`);
                                if (res.ok) return await res.json();
                            } catch (e) { return null; }
                            return null;
                        });
                    
                    const apiResults = (await Promise.all(fetchPromises)).filter(Boolean);
                    foundKanjis = [...foundKanjis, ...apiResults];
                }

                setKanjiDetails(foundKanjis);
            } catch (err) {
                console.warn('[jbook-vocab] Failed to fetch kanji details:', err);
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
    const sectionBg = !mounted ? 'bg-blue-50' : (theme === 'dark' ? 'bg-blue-950/10' : 'bg-blue-50');
    const borderStyle = !mounted ? 'border-gray-100' : (theme === 'dark' ? 'border-blue-950/20' : 'border-gray-100');

    return (
        <div className={`${cardBg} min-h-screen py-8 flex flex-col items-center justify-center transition-colors duration-300`}>
            <div className="container mx-auto px-4 w-full max-w-2xl">
                {onClose ? (
                    <button onClick={onClose} className={`inline-flex items-center font-black transition-all mb-8 hover:text-blue-600 ${subTextColor}`}>
                        &larr; Kembali ke Daftar
                    </button>
                ) : (
                    <Link href="/kotoba" className={`inline-flex items-center font-black transition-all mb-8 hover:text-blue-600 ${subTextColor}`}>
                        &larr; Kembali ke Daftar
                    </Link>
                )}

                <div className={`${cardBg} rounded-[2.5rem] shadow-2xl p-6 sm:p-8 md:p-12 text-center border-t-8 border-blue-600 relative overflow-hidden w-full transition-all border-b border-x ${borderStyle}`}>
                    <div className="absolute top-0 right-0 p-3 sm:p-4 opacity-5 text-7xl sm:text-9xl font-serif select-none pointer-events-none text-blue-900 leading-none">
                        言
                    </div>

                    <div className={`relative z-10 text-left sm:text-center transition-colors ${textColor}`}>
                        <span className={`text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] mb-3 sm:mb-4 block text-center ${subTextColor}`}>Vocabulary</span>

                        <div className="mb-6 sm:mb-8 flex items-center justify-center gap-4 w-full px-2 pt-6 flex-wrap">
                            <ruby className={`text-3xl sm:text-4xl md:text-5xl font-black tracking-wider transition-colors ${textColor}`}>
                                {characters.map((char, index) => (
                                    hasKanji(char) ? (
                                        <span 
                                            key={index} 
                                            onClick={() => handleKanjiClick(char)}
                                            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-white cursor-pointer transition-all duration-200 border-b-4 border-transparent hover:border-blue-600 dark:hover:border-white px-1 rounded-t-xl"
                                        >
                                            {char}
                                        </span>
                                    ) : (
                                        <span key={index} className="px-0.5">{char}</span>
                                    )
                                ))}
                                {hasKanji(vocab?.word) && (
                                    <rt className="text-base sm:text-lg md:text-xl text-gray-900 dark:text-white font-black leading-none">
                                        {vocab?.furigana || vocab?.reading || ''}
                                    </rt>
                                )}
                            </ruby>
                            <button
                                onClick={playAudio}
                                className={`p-3 rounded-2xl transition-all duration-300 ${
                                    playing 
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-95 animate-pulse' 
                                        : `${theme === 'dark' ? 'bg-blue-950/20 text-blue-300 hover:bg-blue-950/40 hover:text-blue-200' : 'bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800'} hover:scale-110 active:scale-95`
                                } flex items-center justify-center cursor-pointer shadow-sm`}
                                title="Putar Suara"
                            >
                                <Volume2 className={`w-6 h-6 ${playing ? 'scale-110' : ''}`} />
                            </button>
                        </div>

                        <div className={`${sectionBg} p-5 sm:p-6 md:p-8 rounded-2xl border ${theme === 'dark' ? 'border-blue-950/30' : 'border-blue-100'} shadow-inner mb-8 text-left transition-colors`}>
                            <h3 className="text-[10px] sm:text-xs font-black text-blue-600 dark:text-blue-300 uppercase tracking-[0.2em] mb-2 sm:mb-3">Arti / Makna</h3>
                            <p className={`text-lg sm:text-xl md:text-2xl font-black leading-relaxed tracking-tight ${textColor}`}>{vocab?.meaning || 'Tidak ada arti'}</p>
                        </div>

                        {/* Visual Dissection Section */}
                        {uniqueKanjis.length > 0 && (
                            <div className="mb-10 text-left">
                                <h3 className={`text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-2 transition-colors ${subTextColor}`}>
                                    <span className="w-2 h-2 rounded-full bg-blue-600 shadow-lg shadow-blue-500/20"></span>
                                    Bedah Kanji (Karakter Penyusun)
                                </h3>
                                <div className="grid grid-cols-1 gap-3">
                                    {uniqueKanjis.map((char, i) => {
                                        const detail = kanjiDetails.find(kd => kd.character === char);
                                        return (
                                            <button
                                                key={i}
                                                onClick={() => handleKanjiClick(char)}
                                                className={`group flex items-center gap-4 ${theme === 'dark' ? 'bg-blue-950/10 hover:bg-blue-950/20' : 'bg-gray-50 hover:bg-white'} border ${borderStyle} hover:border-blue-600 p-4 rounded-2xl transition-all shadow-sm active:scale-95 text-left`}
                                            >
                                                <span className={`text-4xl font-serif group-hover:text-blue-600 transition-colors w-12 text-center ${textColor}`}>{char}</span>
                                                <div className="flex-1">
                                                    <p className={`text-sm font-black leading-snug ${textColor}`}>{detail?.meaning || 'Memuat makna...'}</p>
                                                    <p className={`text-[10px] font-black uppercase tracking-tighter mt-0.5 transition-colors ${subTextColor}`}>
                                                        {detail ? (detail.onyomi?.[0] || detail.kunyomi?.[0] || 'N/A') : 'Sedang memuat...'} • Klik untuk detail
                                                    </p>
                                                </div>
                                                <span className="text-xl text-gray-400 group-hover:text-blue-400 transition-colors">→</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-center gap-4 flex-wrap mt-4">
                            <span className={`px-4 py-2 ${theme === 'dark' ? 'bg-blue-950/20 text-blue-300' : 'bg-gray-100 text-gray-600'} rounded-full font-black text-xs uppercase tracking-widest`}>
                                JLPT N{vocab.jlpt_level}
                            </span>
                            {vocab.word_type && (
                                <span className={`px-4 py-2 ${theme === 'dark' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700'} rounded-full font-black text-xs uppercase tracking-widest border border-blue-100 dark:border-blue-900/30 transition-colors shadow-sm`}>
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
