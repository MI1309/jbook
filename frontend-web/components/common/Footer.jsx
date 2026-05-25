'use client';

import { useTheme } from '@/context/ThemeContext';
import Link from 'next/link';

export default function Footer() {
    const { mounted } = useTheme();
    const currentYear = new Date().getFullYear();

    if (!mounted) return null;

    return (
        <footer className="bg-[var(--card-bg)] border-t-4 border-t-[var(--border-color)] transition-colors duration-500">
            <div className="container mx-auto px-6 py-12 max-w-5xl">
                <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                    {/* Brand Section */}
                    <div className="text-center md:text-left">
                        <Link href="/" className="inline-flex items-center gap-2 group">
                            <span className="text-2xl">🏮</span>
                            <span className="text-xl font-black tracking-tighter transition-colors text-foreground font-japanese">
                                J<span className="text-accent-blue">BOOK</span>
                            </span>
                        </Link>
                        <p className="mt-3 text-xs font-bold uppercase tracking-[0.2em] transition-colors text-gray-500 dark:text-gray-400">
                            Kamus & Referensi Bahasa Jepang
                        </p>
                    </div>

                    {/* Links Section */}
                    <div className="flex gap-8 text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 font-japanese">
                        <Link href="/kanji" className="hover:text-accent-blue transition-colors">Kanji</Link>
                        <Link href="/kotoba" className="hover:text-accent-blue transition-colors">Kotoba</Link>
                        <Link href="/bunpo" className="hover:text-accent-blue transition-colors">Bunpo</Link>
                        <Link href="/practice" className="hover:text-accent-blue transition-colors">Latihan</Link>
                    </div>

                    {/* Copyright Section */}
                    <div className="text-center md:text-right">
                        <p className="text-[10px] font-black tracking-widest transition-colors text-gray-500 dark:text-gray-400">
                            &copy; {currentYear} JBOOK INDONESIA.
                        </p>
                        <div className="mt-2 flex items-center justify-center md:justify-end gap-1">
                            <div className="w-4 h-2 bg-accent-blue rounded-sm shadow-sm shadow-accent-blue/20"></div>
                            <div className="w-4 h-2 bg-[var(--background)] border border-[var(--border-color)] rounded-sm"></div>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}

