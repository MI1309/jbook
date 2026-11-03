'use client';

import { useState, useEffect } from 'react';
import { Volume2 } from 'lucide-react';
import KanjiStrokeViewer from './KanjiStrokeViewer';

const kanaNotes = {
    'を': 'Hanya dipakai sebagai partikel objek.',
    'ん': 'Tidak pernah memulai kata.',
    'ゐ': 'Huruf kuno, jarang dipakai.',
    'ゑ': 'Huruf kuno, jarang dipakai.',
};

export default function KanaStrokeCard({ char, romaji, isDark, textColor, activeTab, isYoon = false }) {
    const [isAnimating, setIsAnimating] = useState(false);
    const [svgData, setSvgData] = useState(null);
    const loading = isAnimating && !svgData;
    const canSpeak = typeof window !== 'undefined'
        && 'speechSynthesis' in window
        && typeof window.SpeechSynthesisUtterance !== 'undefined';

    useEffect(() => {
        if (isAnimating && !svgData) {
            const unicodeHex = char.charCodeAt(0).toString(16).padStart(5, '0');
            const url = `https://raw.githubusercontent.com/KanjiVG/kanjivg/master/kanji/${unicodeHex}.svg`;

            fetch(url)
                .then(res => {
                    if (res.ok) return res.text();
                    throw new Error("SVG not found");
                })
                .then(text => {
                    setSvgData(text);
                })
                .catch(err => {
                    console.warn(`[kana-stroke] Failed to fetch for ${char}:`, err.message);
                    setIsAnimating(false);
                });
        }
    }, [isAnimating, char, svgData]);

    const speakKana = () => {
        if (!canSpeak) return;
        window.speechSynthesis.cancel();
        const utterance = new window.SpeechSynthesisUtterance(char);
        utterance.lang = 'ja-JP';
        utterance.rate = 0.8;
        window.speechSynthesis.speak(utterance);
    };

    if (!char) {
        return <div aria-hidden="true" className="min-h-[60px] sm:min-h-[80px] md:min-h-[100px]" />;
    }

    return (
        <article className={`group relative flex min-w-0 flex-col items-center overflow-hidden rounded-xl border transition-all duration-300 ${
            isDark
                ? 'border-[#212127] bg-[#131317] hover:border-accent-blue/50 hover:shadow-lg hover:shadow-accent-blue/5'
                : 'border-gray-100 bg-white shadow-sm hover:border-accent-blue/40 hover:shadow-md'
        }`}>
            <button
                type="button"
                onClick={() => setIsAnimating((current) => !current)}
                aria-label={`${isAnimating ? 'Sembunyikan' : 'Lihat'} animasi goresan ${char}`}
                aria-expanded={isAnimating}
                title="Klik untuk melihat atau menyembunyikan animasi goresan"
                className={`relative flex min-h-[60px] w-full flex-col items-center justify-center p-2 focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent-blue sm:min-h-[80px] sm:p-3 md:min-h-[100px] ${isAnimating ? 'min-h-[76px]' : ''}`}
            >
                {isAnimating && (svgData || loading) ? (
                    <div className="flex h-[60px] w-full items-center justify-center">
                        {loading ? (
                            <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-accent-blue" />
                        ) : (
                            <KanjiStrokeViewer svgContent={svgData} size={60} isAnimating />
                        )}
                    </div>
                ) : (
                    <>
                        <span className={`mb-1 inline-flex items-baseline whitespace-nowrap font-japanese leading-none transition-colors sm:mb-2 ${char.length > 1 ? 'text-2xl sm:text-3xl md:text-4xl' : 'text-2xl sm:text-4xl md:text-5xl'} ${textColor}`}>
                            {isYoon && char.length > 1 ? (
                                <>
                                    <span>{char[0]}</span>
                                    <span className="relative top-[0.12em] text-[0.68em]">{char.slice(1)}</span>
                                </>
                            ) : char}
                        </span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors sm:text-xs ${activeTab === 'hiragana' ? 'text-accent-blue' : 'text-accent-green'}`}>
                            {romaji}
                        </span>
                    </>
                )}
                <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-accent-blue/5 opacity-0 transition-opacity group-hover:opacity-100" />
            </button>

            {isAnimating && (canSpeak || kanaNotes[char]) && (
                <div className="flex w-full flex-col items-center gap-1 border-t border-[var(--border-color)] px-1.5 py-2 text-center">
                    {kanaNotes[char] && <p className="text-[10px] leading-tight text-gray-600 dark:text-gray-300">{kanaNotes[char]}</p>}
                    {canSpeak && (
                        <button
                            type="button"
                            onClick={speakKana}
                            aria-label={`Dengarkan pelafalan ${char}`}
                            className="inline-flex min-h-8 items-center gap-1 rounded-md px-2 text-xs font-bold text-accent-blue transition-colors hover:bg-accent-blue/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue"
                        >
                            <Volume2 aria-hidden="true" className="h-4 w-4" />
                        </button>
                    )}
                </div>
            )}
        </article>
    );
}
