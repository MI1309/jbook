'use client';

import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function Footer() {
    const { mounted } = useTheme();
    const { user } = useAuth();
    const currentYear = new Date().getFullYear();

    if (!mounted) return null;

    return (
        <footer className="w-full bg-[var(--card-bg)] border-t border-[var(--border-color)] transition-colors duration-500">
            <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-7 px-4 py-8 sm:grid-cols-2 sm:px-6 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:gap-10 lg:px-8">
                    {/* Brand Section */}
                    <div className="min-w-0 text-center sm:text-left">
                        <Link href="/" className="inline-flex items-center group">
                            <span className="text-xl font-black text-foreground font-japanese">
                                J<span className="text-accent-blue">BOOK</span>
                            </span>
                        </Link>
                        <p className="mt-2 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                            Kamus & Latihan Bahasa Jepang
                        </p>
                    </div>

                    {/* Links Section */}
                    <nav aria-label="Navigasi footer" className="grid grid-cols-2 justify-items-center gap-x-6 gap-y-4 text-sm font-bold uppercase text-gray-500 dark:text-gray-400 font-japanese sm:col-span-2 sm:flex sm:flex-wrap sm:gap-x-6 sm:gap-y-3 lg:col-span-1">
                        <Link href="/kanji" className="hover:text-accent-blue transition-colors">Kanji</Link>
                        <Link href="/kotoba" className="hover:text-accent-blue transition-colors">Kotoba</Link>
                        <Link href="/bunpo" className="hover:text-accent-blue transition-colors">Bunpo</Link>
                        <Link href={user ? '/dashboard' : '/practice'} className="hover:text-accent-blue transition-colors">
                            {user ? 'Dashboard' : 'Latihan'}
                        </Link>
                    </nav>

                    {/* Copyright Section */}
                    <div className="text-center text-xs font-semibold text-gray-500 dark:text-gray-400 sm:col-span-2 lg:col-span-1 lg:text-right">
                        <p>
                            &copy; {currentYear} JBOOK.
                        </p>
                    </div>
            </div>
        </footer>
    );
}

