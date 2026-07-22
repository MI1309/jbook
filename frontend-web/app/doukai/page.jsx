'use client';

import { useState, useEffect, Suspense } from 'react';
import { getDoukaiPassages } from '@/lib/api';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';

function DoukaiContent() {
    const { theme, mounted } = useTheme();
    const searchParams = useSearchParams();
    const [passages, setPassages] = useState([]);
    const [loading, setLoading] = useState(true);

    const book = searchParams.get('book');
    const chapter = searchParams.get('chapter');

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const result = await getDoukaiPassages({ book, chapter });
                setPassages(result || []);
            } catch (err) {
                console.error('[doukai-page] Gagal memuat Doukai:', err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [book, chapter]);

    if (loading) return <div className="py-32 text-center animate-pulse text-gray-400 dark:text-gray-600 font-black">🏮 Memuat Doukai...</div>;

    const textColor = !mounted ? 'text-black' : (theme === 'dark' ? 'text-white' : 'text-black');
    const subTextColor = !mounted ? 'text-gray-400' : (theme === 'dark' ? 'text-gray-500' : 'text-gray-500');

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16 px-1 transition-all">
            {passages.length > 0 ? (
                passages.map((passage) => (
                    <Link
                        key={passage.id}
                        href={`/doukai/${passage.id}`}
                        className="group block p-6 bg-[var(--card-bg)] rounded-[2.5rem] border border-[var(--border-color)] transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 hover:border-blue-500/30 hover:-translate-y-2 active:scale-95 overflow-hidden relative"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <span className="px-3 py-1 rounded-xl text-[10px] font-black border border-[var(--border-color)] bg-[var(--background)] uppercase tracking-tighter text-gray-500">
                                {passage.jlpt_level ? `N${passage.jlpt_level}` : 'Umum'}
                            </span>
                            {passage.chapter && (
                                <span className={`text-[10px] font-black uppercase tracking-widest leading-none group-hover:text-blue-500 transition-colors ${subTextColor}`}>
                                    Bab {passage.chapter}
                                </span>
                            )}
                        </div>
                        <h2 className={`text-xl font-serif font-black mb-2 group-hover:text-blue-500 leading-tight transition-all text-foreground`}>
                            {passage.title}
                        </h2>
                        <div className="flex items-center gap-2 mt-4 text-[10px] font-bold uppercase tracking-widest text-blue-500 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                            Mulai Latihan <span>→</span>
                        </div>
                        
                        <div className="absolute -bottom-2 -right-2 text-6xl opacity-5 group-hover:opacity-10 transition-all rotate-12 group-hover:rotate-0">
                            📖
                        </div>
                    </Link>
                ))
            ) : (
                <div className="col-span-full text-center py-32 rounded-[3rem] border-4 border-dashed bg-[var(--card-bg)] border-[var(--border-color)]">
                    <div className="text-7xl mb-6 opacity-20 transition-opacity">📖</div>
                    <h2 className={`text-2xl font-black mb-2 transition-colors ${textColor}`}>Belum ada teks Doukai</h2>
                    <p className={`font-bold transition-colors ${subTextColor}`}>Admin belum menambahkan materi reading.</p>
                </div>
            )}
        </div>
    );
}

export default function DoukaiPage() {
    const { theme, mounted } = useTheme();
    const textColor = !mounted ? 'text-black' : (theme === 'dark' ? 'text-white' : 'text-black');
    const subTextColor = !mounted ? 'text-black/50' : (theme === 'dark' ? 'text-white/50' : 'text-black/50');

    return (
        <div className="container mx-auto px-6 py-12 max-w-7xl transition-colors duration-300">
            <header className="mb-12 text-center md:text-left flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-100 dark:border-[var(--border-color)] pb-12 transition-colors">
                <div>
                    <h1 className={`text-5xl font-japanese font-black tracking-tight leading-none transition-colors ${textColor}`}>
                        読解 <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-sky-500 ml-2">Doukai</span>
                    </h1>
                    <div className="h-1 w-16 bg-gradient-to-r from-blue-600 to-sky-500 rounded-full mt-3 mb-1 mx-auto md:mx-0" />
                    <p className={`font-black mt-2 tracking-wide uppercase text-xs transition-colors ${subTextColor}`}>
                        Latihan Pemahaman Bacaan (Reading Comprehension)
                    </p>
                </div>
                <div className="flex gap-2">
                    <Link href="/practice" className="px-6 py-3 rounded-2xl bg-[var(--card-bg)] border border-[var(--border-color)] font-black text-sm hover:border-blue-500 transition-all active:scale-95">
                        ← Kembali
                    </Link>
                </div>
            </header>

            <Suspense fallback={<div className="py-32 text-center animate-pulse">Memuat...</div>}>
                <DoukaiContent />
            </Suspense>
        </div>
    );
}
