'use client';

import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { Instagram, Facebook } from 'lucide-react';

// TODO: ganti URL di bawah dengan akun resmi JBook
const SOCIAL_LINKS = [
    {
        name: 'Instagram',
        href: 'https://instagram.com/jbook', // TODO: ganti URL
        label: 'Instagram JBook',
        icon: (props) => <Instagram {...props} />,
    },
    {
        name: 'TikTok',
        href: 'https://tiktok.com/@jbook', // TODO: ganti URL
        label: 'TikTok JBook',
        icon: (props) => (
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
                <path d="M16.5 3a5.5 5.5 0 0 0 4.5 4.5v3a8.5 8.5 0 0 1-4.5-1.4v6.4a5.5 5.5 0 1 1-5.5-5.5c.34 0 .67.03 1 .1v3.13a2.5 2.5 0 1 0 1.75 2.38V3h2.75Z" />
            </svg>
        ),
    },
    {
        name: 'Saweria',
        href: 'https://saweria.co/jbook', // TODO: ganti URL
        label: 'Saweria JBook',
        icon: (props) => (
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
                <path d="M12 21s-7-4.35-7-10a4 4 0 0 1 7-2.65A4 4 0 0 1 19 11c0 5.65-7 10-7 10Z" />
            </svg>
        ),
    },
    {
        name: 'WhatsApp Komunitas',
        href: 'https://chat.whatsapp.com/XXXXXXXXXXXXXXX', // TODO: ganti URL invite
        label: 'Grup WhatsApp Komunitas JBook',
        icon: (props) => (
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
                <path d="M20.5 3.5A11 11 0 0 0 3.2 17l-1.2 4.4 4.5-1.2A11 11 0 1 0 20.5 3.5Zm-8.5 17a9 9 0 0 1-4.6-1.3l-.3-.2-2.7.7.7-2.6-.2-.3A9 9 0 1 1 12 20.5Zm5-6.7c-.3-.1-1.6-.8-1.9-.9-.3-.1-.5-.1-.7.2s-.8 1-1 1.2c-.2.2-.4.3-.7.1a7.4 7.4 0 0 1-3.7-3.2c-.3-.5.3-.5.8-1.5.1-.2 0-.4 0-.5s-.7-1.6-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6a1.2 1.2 0 0 0-.9.4 3.5 3.5 0 0 0-1.1 2.6 6.1 6.1 0 0 0 1.3 3.2 13.9 13.9 0 0 0 5.3 4.7c.8.3 1.4.5 1.9.7a4.5 4.5 0 0 0 2.1.1 3.4 3.4 0 0 0 2.2-1.6 2.7 2.7 0 0 0 .2-1.6c-.1-.1-.3-.2-.6-.4Z" />
            </svg>
        ),
    },
    {
        name: 'Facebook',
        href: 'https://facebook.com/jbook', // TODO: ganti URL
        label: 'Facebook JBook',
        icon: (props) => <Facebook {...props} />,
    },
    {
        name: 'Medium',
        href: 'https://medium.com/@jbook', // TODO: ganti URL
        label: 'Medium JBook',
        icon: (props) => (
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
                <path d="M3 5.5A2.5 2.5 0 1 0 3 10.5a2.5 2.5 0 0 0 0-5Zm5.5.5v12c0 .5.4.9.9.9H21.6a.9.9 0 0 0 .9-.9V6H8.5Zm-1 0v12c0 1.4-1.1 2.5-2.5 2.5S2.5 19.4 2.5 18V6H7.5Z" />
            </svg>
        ),
    },
];

const focusRing =
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue';

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

            {/* Social Media Section */}
            <div className="border-t border-[var(--border-color)]">
                <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:px-8">
                    <p className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Ikuti Kami
                    </p>
                    <ul className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                        {SOCIAL_LINKS.map(({ name, href, label, icon: Icon }) => (
                            <li key={name}>
                                <a
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={label}
                                    title={name}
                                    className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-color)] text-gray-500 dark:text-gray-400 transition-colors hover:border-accent-blue hover:text-accent-blue ${focusRing}`}
                                >
                                    <Icon className="h-4 w-4" />
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </footer>
    );
}