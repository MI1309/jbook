'use client';

export default function KanjiStrokeViewer({ svgContent, size = 80, isAnimating = false }) {
    if (!svgContent) {
        return <div className="w-12 h-12 flex items-center justify-center bg-gray-100 dark:bg-zinc-800 rounded-xl text-xs font-black text-gray-400">N/A</div>;
    }

    // Ambil hanya bagian <svg>...</svg> jika ada tag XML/metadata
    const svgMatch = svgContent.match(/<svg[\s\S]*<\/svg>/);
    const cleanSvg = svgMatch ? svgMatch[0] : svgContent;

    // Membersihkan inline style bawaan KanjiVG agar bisa kita manipulasi dengan CSS Tailwind
    const animatedSvg = cleanSvg
        .replace(/style="[^"]*"/g, '') 
        .replace(/stroke:[^;"]*;/g, '')
        .replace(/stroke-width:[^;"]*;/g, '');

    return (
        <div 
            className={`relative border border-dashed border-gray-300 dark:border-blue-950/40 rounded-xl p-1 bg-white dark:bg-zinc-900 group/stroke cursor-pointer overflow-hidden transition-all hover:border-blue-500 ${isAnimating ? 'is-active' : ''}`}
            style={{ width: size, height: size }}
            title="Klik atau arahkan kursor untuk melihat urutan goresan"
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
                    fill: none;
                    stroke: #9ca3af; /* Gray 400 */
                    stroke-width: 3;
                    stroke-linecap: round;
                    stroke-linejoin: round;
                    transition: stroke 0.3s;                    /* Efek Menulis: Awalnya kosong */
                    stroke-dasharray: 300;
                    stroke-dashoffset: 300;
                }
                .dark .kanjivg-render path {
                    stroke: #4b5563; /* Gray 600 */
                }

                /* Mengatur warna angka penunjuk urutan */
                .kanjivg-render text {
                    font-size: 8px;
                    fill: #3b82f6; /* Blue 500 */
                    font-weight: bold;
                    opacity: 0;
                    transition: opacity 0.3s;
                }
                .dark .kanjivg-render text {
                    fill: #60a5fa;
                }

                /* ANIMASI UTAMA: Efek Menulis */
                @keyframes drawStroke {
                    to {
                        stroke-dashoffset: 0;
                    }
                }

                /* Saat card di-hover atau aktif, jalankan animasi menulis satu per satu */
                .group\/stroke:hover .kanjivg-render path,
                .is-active .kanjivg-render path {
                    stroke: #2563eb;
                    animation: drawStroke 0.6s ease-out forwards;
                }
                .dark .group\/stroke:hover .kanjivg-render path,
                .dark .is-active .kanjivg-render path {
                    stroke: #60a5fa;
                }
                .group\/stroke:hover .kanjivg-render text,
                .is-active .kanjivg-render text {
                    opacity: 1;
                    transition: opacity 0.5s;
                }

                /* Efek delay menulis interaktif menggunakan pseudo-selector ID stroke KanjiVG (s1, s2, s3...) */
                .group\/stroke:hover .kanjivg-render path[id$="-s1"], .is-active .kanjivg-render path[id$="-s1"] { animation-delay: 0.0s; transition-delay: 0.0s; }
                .group\/stroke:hover .kanjivg-render path[id$="-s2"], .is-active .kanjivg-render path[id$="-s2"] { animation-delay: 0.5s; transition-delay: 0.5s; }
                .group\/stroke:hover .kanjivg-render path[id$="-s3"], .is-active .kanjivg-render path[id$="-s3"] { animation-delay: 1.0s; transition-delay: 1.0s; }
                .group\/stroke:hover .kanjivg-render path[id$="-s4"], .is-active .kanjivg-render path[id$="-s4"] { animation-delay: 1.5s; transition-delay: 1.5s; }
                .group\/stroke:hover .kanjivg-render path[id$="-s5"], .is-active .kanjivg-render path[id$="-s5"] { animation-delay: 2.0s; transition-delay: 2.0s; }
                .group\/stroke:hover .kanjivg-render path[id$="-s6"], .is-active .kanjivg-render path[id$="-s6"] { animation-delay: 2.5s; transition-delay: 2.5s; }
                .group\/stroke:hover .kanjivg-render path[id$="-s7"], .is-active .kanjivg-render path[id$="-s7"] { animation-delay: 3.0s; transition-delay: 3.0s; }
                .group\/stroke:hover .kanjivg-render path[id$="-s8"], .is-active .kanjivg-render path[id$="-s8"] { animation-delay: 3.5s; transition-delay: 3.5s; }
                .group\/stroke:hover .kanjivg-render path[id$="-s9"], .is-active .kanjivg-render path[id$="-s9"] { animation-delay: 4.0s; transition-delay: 4.0s; }
                .group\/stroke:hover .kanjivg-render path[id$="-s10"], .is-active .kanjivg-render path[id$="-s10"] { animation-delay: 4.5s; transition-delay: 4.5s; }
                .group\/stroke:hover .kanjivg-render path[id$="-s11"], .is-active .kanjivg-render path[id$="-s11"] { animation-delay: 5.0s; transition-delay: 5.0s; }
                .group\/stroke:hover .kanjivg-render path[id$="-s12"], .is-active .kanjivg-render path[id$="-s12"] { animation-delay: 5.5s; transition-delay: 5.5s; }
                .group\/stroke:hover .kanjivg-render path[id$="-s13"], .is-active .kanjivg-render path[id$="-s13"] { animation-delay: 6.0s; transition-delay: 6.0s; }
                .group\/stroke:hover .kanjivg-render path[id$="-s14"], .is-active .kanjivg-render path[id$="-s14"] { animation-delay: 6.5s; transition-delay: 6.5s; }
                .group\/stroke:hover .kanjivg-render path[id$="-s15"], .is-active .kanjivg-render path[id$="-s15"] { animation-delay: 7.0s; transition-delay: 7.0s; }
                .group\/stroke:hover .kanjivg-render path[id$="-s16"], .is-active .kanjivg-render path[id$="-s16"] { animation-delay: 7.5s; transition-delay: 7.5s; }
                .group\/stroke:hover .kanjivg-render path[id$="-s17"], .is-active .kanjivg-render path[id$="-s17"] { animation-delay: 8.0s; transition-delay: 8.0s; }
                .group\/stroke:hover .kanjivg-render path[id$="-s18"], .is-active .kanjivg-render path[id$="-s18"] { animation-delay: 8.5s; transition-delay: 8.5s; }
                .group\/stroke:hover .kanjivg-render path[id$="-s19"], .is-active .kanjivg-render path[id$="-s19"] { animation-delay: 9.0s; transition-delay: 9.0s; }
                .group\/stroke:hover .kanjivg-render path[id$="-s20"], .is-active .kanjivg-render path[id$="-s20"] { animation-delay: 9.5s; transition-delay: 9.5s; }
                .group\/stroke:hover .kanjivg-render path[id$="-s21"], .is-active .kanjivg-render path[id$="-s21"] { animation-delay: 10.0s; transition-delay: 10.0s; }
                .group\/stroke:hover .kanjivg-render path[id$="-s22"], .is-active .kanjivg-render path[id$="-s22"] { animation-delay: 10.5s; transition-delay: 10.5s; }
                .group\/stroke:hover .kanjivg-render path[id$="-s23"], .is-active .kanjivg-render path[id$="-s23"] { animation-delay: 11.0s; transition-delay: 11.0s; }
                .group\/stroke:hover .kanjivg-render path[id$="-s24"], .is-active .kanjivg-render path[id$="-s24"] { animation-delay: 11.5s; transition-delay: 11.5s; }
                .group\/stroke:hover .kanjivg-render path[id$="-s25"], .is-active .kanjivg-render path[id$="-s25"] { animation-delay: 12.0s; transition-delay: 12.0s; }
                .group\/stroke:hover .kanjivg-render path[id$="-s26"], .is-active .kanjivg-render path[id$="-s26"] { animation-delay: 12.5s; transition-delay: 12.5s; }
                .group\/stroke:hover .kanjivg-render path[id$="-s27"], .is-active .kanjivg-render path[id$="-s27"] { animation-delay: 13.0s; transition-delay: 13.0s; }
                .group\/stroke:hover .kanjivg-render path[id$="-s28"], .is-active .kanjivg-render path[id$="-s28"] { animation-delay: 13.5s; transition-delay: 13.5s; }
                .group\/stroke:hover .kanjivg-render path[id$="-s29"], .is-active .kanjivg-render path[id$="-s29"] { animation-delay: 14.0s; transition-delay: 14.0s; }
                .group\/stroke:hover .kanjivg-render path[id$="-s30"], .is-active .kanjivg-render path[id$="-s30"] { animation-delay: 14.5s; transition-delay: 14.5s; }
            `}</style>
        </div>
    );
}
