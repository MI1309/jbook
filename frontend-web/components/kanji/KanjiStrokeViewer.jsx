'use client';

import { useState, useEffect } from 'react';

export default function KanjiStrokeViewer({ svgContent, size = 80 }) {
    const [animatedSvg, setAnimatedSvg] = useState('');

    useEffect(() => {
        if (!svgContent) return;

        // Membersihkan inline style bawaan KanjiVG agar bisa kita manipulasi dengan CSS Tailwind
        let processed = svgContent
            .replace(/style="[^"]*"/g, '') 
            .replace(/stroke:[^;"]*;/g, '')
            .replace(/stroke-width:[^;"]*;/g, '');

        setAnimatedSvg(processed);
    }, [svgContent]);

    if (!svgContent) {
        return <div className="w-12 h-12 flex items-center justify-center bg-gray-100 dark:bg-zinc-800 rounded-xl text-xs font-black text-gray-400">N/A</div>;
    }

    return (
        <div 
            className="relative border border-dashed border-gray-300 dark:border-blue-950/40 rounded-xl p-1 bg-white dark:bg-zinc-900 group/stroke cursor-pointer overflow-hidden transition-all hover:border-blue-500"
            style={{ width: size, height: size }}
            title="Arahkan kursor untuk melihat urutan goresan"
        >
            {/* Grid background tradisional jepang (opsional tapi keren) */}
            <div className="absolute inset-0 pointer-events-none border-t border-b border-l border-r border-gray-100 dark:border-zinc-800/50 m-auto w-full h-full flex items-center justify-center">
                <div className="w-full h-0 border-t border-dashed border-gray-200 dark:border-zinc-800"></div>
                <div className="h-full w-0 border-l border-dashed border-gray-200 dark:border-zinc-800 absolute"></div>
            </div>

            {/* Inject SVG Mentah & Inject CSS secara dinamis untuk animasi goresan */}
            <div 
                className="w-full h-full kanjivg-render"
                dangerouslySetInnerHTML={{ __html: animatedSvg }}
            />

            <style jsx global>{`
                .kanjivg-render svg {
                    width: 100%;
                    height: 100%;
                }
                /* Mengatur warna base goresan default */
                .kanjivg-render path {
                    stroke: #9ca3af; /* Gray 400 */
                    stroke-width: 3;
                    stroke-linecap: round;
                    stroke-linejoin: round;
                    transition: stroke 0.3s;
                }
                .dark .kanjivg-render path {
                    stroke: #4b5563; /* Gray 600 */
                }
                /* Mengatur warna angka penunjuk urutan */
                .kanjivg-render text {
                    font-size: 8px;
                    fill: #3b82f6; /* Blue 500 */
                    font-weight: bold;
                    opacity: 0.4;
                    transition: opacity 0.3s;
                }
                .dark .kanjivg-render text {
                    fill: #60a5fa;
                }

                /* ANIMASI: Saat card di-hover, goresan akan menyala satu per satu sesuai urutan */
                group\/stroke:hover .kanjivg-render path {
                    stroke: #2563eb;
                }
                .dark group\/stroke:hover .kanjivg-render path {
                    stroke: #60a5fa;
                }
                group\/stroke:hover .kanjivg-render text {
                    opacity: 1;
                }

                /* Efek delay menulis interaktif menggunakan pseudo-selector ID stroke KanjiVG (s1, s2, s3...) */
                .group\/stroke:hover .kanjivg-render path[id$="-s1"] { transition-delay: 0.0s; }
                .group\/stroke:hover .kanjivg-render path[id$="-s2"] { transition-delay: 0.1s; }
                .group\/stroke:hover .kanjivg-render path[id$="-s3"] { transition-delay: 0.2s; }
                .group\/stroke:hover .kanjivg-render path[id$="-s4"] { transition-delay: 0.3s; }
                .group\/stroke:hover .kanjivg-render path[id$="-s5"] { transition-delay: 0.4s; }
                .group\/stroke:hover .kanjivg-render path[id$="-s6"] { transition-delay: 0.5s; }
                .group\/stroke:hover .kanjivg-render path[id$="-s7"] { transition-delay: 0.6s; }
                .group\/stroke:hover .kanjivg-render path[id$="-s8"] { transition-delay: 0.7s; }
                .group\/stroke:hover .kanjivg-render path[id$="-s9"] { transition-delay: 0.8s; }
                .group\/stroke:hover .kanjivg-render path[id$="-s10"] { transition-delay: 0.9s; }
                /* Antisipasi kanji kompleks hingga 20 goresan */
                .group\/stroke:hover .kanjivg-render path[id$="-s11"] { transition-delay: 1.0s; }
                .group\/stroke:hover .kanjivg-render path[id$="-s12"] { transition-delay: 1.1s; }
                .group\/stroke:hover .kanjivg-render path[id$="-s13"] { transition-delay: 1.2s; }
                .group\/stroke:hover .kanjivg-render path[id$="-s14"] { transition-delay: 1.3s; }
                .group\/stroke:hover .kanjivg-render path[id$="-s15"] { transition-delay: 1.4s; }
            `}</style>
        </div>
    );
}