'use client';

import { useTheme } from '@/context/ThemeContext';
import Link from 'next/link';

export default function Footer() {
    const { theme, mounted } = useTheme();

    const currentYear = new Date().getFullYear();
    const borderStyle = !mounted ? 'border-gray-100' : (theme === 'dark' ? 'border-red-950/30' : 'border-red-600');
    const footerBg = !mounted ? 'bg-white' : (theme === 'dark' ? 'bg-black' : 'bg-white');
    const textColor = !mounted ? 'text-gray-500' : (theme === 'dark' ? 'text-gray-500' : 'text-gray-900');

    return (
        <footer className={`${footerBg} border-t-4 ${borderStyle} transition-colors duration-500`}>
            <div className="container mx-auto px-6 py-12">
                <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                    {/* Brand Section */}
                    <div className="text-center md:text-left">
                        <Link href="/" className="inline-flex items-center gap-2 group">
                            <span className="text-2xl">🏮</span>
                            <span className={`text-xl font-black tracking-tighter transition-colors ${!mounted ? 'text-black' : (theme === 'dark' ? 'text-white' : 'text-black')}`}>
                                J<span className="text-red-600">BOOK</span>
                            </span>
                        </Link>
                        <p className={`mt-3 text-xs font-bold uppercase tracking-[0.2em] transition-colors ${textColor}`}>
                            Belajar Bahasa Jepang Lebih Premium
                        </p>
                    </div>

                    {/* Links Section */}
                    <div className="flex gap-8 text-xs font-black uppercase tracking-widest">
                        <Link href="/kanji" className={`hover:text-red-600 transition-colors ${textColor}`}>Kanji</Link>
                        <Link href="/kotoba" className={`hover:text-red-600 transition-colors ${textColor}`}>Kotoba</Link>
                        <Link href="/bunpo" className={`hover:text-red-600 transition-colors ${textColor}`}>Bunpo</Link>
                        <Link href="/practice" className={`hover:text-red-600 transition-colors ${textColor}`}>Latihan</Link>
                    </div>

                    {/* Copyright Section */}
                    <div className="text-center md:text-right">
                        <p className={`text-[10px] font-black tracking-widest transition-colors ${textColor}`}>
                            &copy; {currentYear} JBOOK INDONESIA.
                        </p>
                        <div className="mt-2 flex items-center justify-center md:justify-end gap-1">
                            <div className="w-4 h-2 bg-red-600 rounded-sm shadow-sm shadow-red-500/20"></div>
                            <div className="w-4 h-2 bg-white border border-gray-100 rounded-sm"></div>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
