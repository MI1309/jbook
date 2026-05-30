'use client';

import { useState, useEffect } from 'react';
import KanjiStrokeViewer from './KanjiStrokeViewer';

export default function KanaStrokeCard({ char, romaji, isDark, textColor, activeTab }) {
    const [isAnimating, setIsAnimating] = useState(false);
    const [svgData, setSvgData] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isAnimating && !svgData) {
            setLoading(true);
            const unicodeHex = char.charCodeAt(0).toString(16).padStart(5, '0');
            const url = `https://raw.githubusercontent.com/KanjiVG/kanjivg/master/kanji/${unicodeHex}.svg`;

            fetch(url)
                .then(res => {
                    if (res.ok) return res.text();
                    throw new Error("SVG not found");
                })
                .then(text => {
                    setSvgData(text);
                    setLoading(false);
                })
                .catch(err => {
                    console.warn(`[kana-stroke] Failed to fetch for ${char}:`, err.message);
                    setLoading(false);
                    setIsAnimating(false);
                });
        }
    }, [isAnimating, char, svgData]);

    return (
        <div
            onClick={() => setIsAnimating(!isAnimating)}
            className={`
                flex flex-col items-center justify-center p-2 sm:p-4 rounded-2xl border transition-all duration-300 cursor-pointer
                ${char
                    ? isDark
                        ? 'bg-[#131317] border-[#212127] hover:border-accent-blue/50 hover:shadow-lg hover:shadow-accent-blue/5 hover:-translate-y-1'
                        : 'bg-white shadow-sm hover:shadow-md hover:border-accent-blue/40 border-gray-100 hover:-translate-y-1'
                    : 'bg-transparent border-transparent'}
                min-h-[60px] sm:min-h-[80px] md:min-h-[100px] relative overflow-hidden group
            `}
        >
            {char && (
                <>
                    {isAnimating && (svgData || loading) ? (
                        <div className="w-full h-full flex items-center justify-center">
                            {loading ? (
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent-blue"></div>
                            ) : (
                                <KanjiStrokeViewer svgContent={svgData} size={60} isAnimating={true} />
                            )}
                        </div>
                    ) : (
                        <>
                            <span className={`text-2xl sm:text-4xl md:text-5xl font-japanese leading-none mb-1 sm:mb-2 transition-colors ${textColor}`}>
                                {char}
                            </span>
                            <span className={`text-[10px] sm:text-xs font-bold tracking-wider uppercase transition-colors ${
                                activeTab === 'hiragana'
                                    ? 'text-accent-blue'
                                    : 'text-accent-green'
                            }`}>
                                {romaji}
                            </span>
                        </>
                    )}
                    
                    {/* Hover indicator */}
                    <div className="absolute inset-0 bg-accent-blue/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </>
            )}
        </div>
    );
}
