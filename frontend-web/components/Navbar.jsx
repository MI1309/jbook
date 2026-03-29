'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { usePractice } from '@/context/PracticeContext';
import OfflineDownloadModal from '@/components/OfflineDownloadModal';
import { dbGetStats } from '@/lib/offline-download';

export default function Navbar() {
    const { user, logout, loading } = useAuth();
    const { isPracticing } = usePractice();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [showOfflineModal, setShowOfflineModal] = useState(false);
    const [hasOfflineData, setHasOfflineData] = useState(false);
    const pathname = usePathname();

    // Check if offline data exists
    useEffect(() => {
        dbGetStats().then(s => {
            setHasOfflineData(s.vocab > 0 || s.kanji > 0);
        }).catch(() => {});
    }, [showOfflineModal]); // recheck after modal closes

    // Detect scroll for opacity effect
    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close menu on route change
    useEffect(() => {
        setIsMenuOpen(false);
    }, [pathname]);

    const isActive = (path) => {
        if (path === '/') return pathname === '/';
        return pathname.startsWith(path);
    };

    const getLinkClass = (path, mobile = false) => {
        const baseClass = mobile
            ? "block px-3 py-2 rounded-md text-base font-medium transition-all duration-200"
            : "px-3 py-2 rounded-md text-sm font-medium transition-all duration-200";

        const activeClass = "text-red-600 font-bold bg-red-50";
        const inactiveClass = "text-gray-900 hover:text-red-600 hover:bg-gray-50";

        return `${baseClass} ${isActive(path) ? activeClass : inactiveClass}`;
    };

    const handleNavClick = (e) => {
        if (isPracticing) {
            if (!confirm('Anda sedang dalam sesi latihan. Yakin ingin keluar? Progress mungkin tidak tersimpan (tergantung browser).')) {
                e.preventDefault();
            }
        }
        setIsMenuOpen(false);
    };

    return (
        <>
            <nav
                className={`
                    fixed top-0 left-0 right-0 z-50
                    transition-all duration-300 ease-in-out
                    ${scrolled
                        ? 'bg-white/95 backdrop-blur-md shadow-md border-b border-gray-200'
                        : 'bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-100'
                    }
                `}
            >
                <div className="container mx-auto px-4">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo */}
                        <div className="flex items-center">
                            <Link
                                href="/"
                                className="text-xl font-bold text-red-600 hover:text-red-700 transition-colors duration-200"
                                onClick={handleNavClick}
                            >
                                JBook
                            </Link>

                            {/* Desktop Nav Links */}
                            <div className="hidden md:ml-10 md:flex md:space-x-1">
                                {[
                                    { href: '/kanji', label: 'Kanji' },
                                    { href: '/bunpo', label: 'Tata Bahasa' },
                                    { href: '/kana', label: 'Kana' },
                                    { href: '/kotoba', label: 'Kotoba' },
                                    ...(!user ? [{ href: '/practice', label: 'Latihan' }] : []),
                                ].map(({ href, label }) => (
                                    <Link
                                        key={href}
                                        href={href}
                                        className={getLinkClass(href)}
                                        onClick={handleNavClick}
                                    >
                                        {label}
                                        {isActive(href) && (
                                            <span className="block h-0.5 bg-red-500 rounded-full mt-0.5 animate-[expandWidth_0.2s_ease-out]" />
                                        )}
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Desktop Auth */}
                        <div className="hidden md:flex items-center space-x-2">
                            {/* Offline Download Button */}
                            <button
                                onClick={() => setShowOfflineModal(true)}
                                title={hasOfflineData ? 'Data offline tersedia' : 'Unduh untuk offline'}
                                className="relative p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-gray-100 transition-all duration-200"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                {hasOfflineData && (
                                    <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full" />
                                )}
                            </button>
                            {!loading && (
                                user ? (
                                    <div className="flex items-center space-x-2">
                                        {(user.email === 'imronm1309@gmail.com' || user.is_staff) && (
                                            <Link href="/admin" className="text-red-600 hover:text-red-800 font-bold px-3 py-2 rounded-md text-sm transition-all duration-200 hover:bg-red-50" onClick={handleNavClick}>
                                                Admin
                                            </Link>
                                        )}
                                        <Link href="/dashboard" className="text-gray-700 hover:text-red-600 font-medium px-3 py-2 rounded-md text-sm transition-all duration-200 hover:bg-gray-50" onClick={handleNavClick}>
                                            Dashboard
                                        </Link>
                                        <span className="text-sm font-medium text-gray-500 px-2">Hi, {user.username}</span>
                                        <button
                                            onClick={() => {
                                                if (isPracticing && !confirm('Lagi latihan, yakin mau keluar?')) return;
                                                logout();
                                            }}
                                            className="text-gray-700 hover:text-red-600 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 hover:bg-gray-50"
                                        >
                                            Keluar
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center space-x-2">
                                        <Link href="/login" className="text-gray-700 hover:text-red-600 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 hover:bg-gray-50" onClick={handleNavClick}>
                                            Masuk
                                        </Link>
                                        <Link href="/register" className="bg-red-600 text-white hover:bg-red-700 px-4 py-2 rounded-md text-sm font-medium shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-px" onClick={handleNavClick}>
                                            Daftar
                                        </Link>
                                    </div>
                                )
                            )}
                        </div>

                        {/* Mobile: Download icon + Hamburger */}
                        <div className="flex items-center gap-1 md:hidden">
                            <button
                                onClick={() => setShowOfflineModal(true)}
                                title={hasOfflineData ? 'Data offline tersedia' : 'Unduh untuk offline'}
                                className="relative p-2 rounded-md text-gray-500 hover:text-red-600 hover:bg-gray-100 transition-all duration-200"
                                aria-label="Mode offline"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                {hasOfflineData && (
                                    <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full" />
                                )}
                            </button>

                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                                aria-label="Toggle menu"
                            >
                                {/* Animated hamburger → X */}
                                <div className="w-5 h-4 flex flex-col justify-between">
                                    <span className={`block h-0.5 bg-current rounded-full transition-all duration-300 origin-center ${isMenuOpen ? 'rotate-45 translate-y-[7px]' : ''}`} />
                                    <span className={`block h-0.5 bg-current rounded-full transition-all duration-300 ${isMenuOpen ? 'opacity-0 scale-x-0' : ''}`} />
                                    <span className={`block h-0.5 bg-current rounded-full transition-all duration-300 origin-center ${isMenuOpen ? '-rotate-45 -translate-y-[9px]' : ''}`} />
                                </div>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu — slides down with opacity */}
                <div
                    className={`
                        md:hidden overflow-hidden
                        transition-all duration-300 ease-in-out
                        ${isMenuOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}
                    `}
                >
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-100">
                        {[
                            { href: '/kanji', label: 'Kanji' },
                            { href: '/bunpo', label: 'Tata Bahasa' },
                            { href: '/kana', label: 'Kana' },
                            { href: '/kotoba', label: 'Kotoba' },
                            ...(!user ? [{ href: '/practice', label: 'Latihan' }] : []),
                        ].map(({ href, label }, i) => (
                            <Link
                                key={href}
                                href={href}
                                className={getLinkClass(href, true)}
                                onClick={handleNavClick}
                                style={{ transitionDelay: isMenuOpen ? `${i * 40}ms` : '0ms' }}
                            >
                                {label}
                            </Link>
                        ))}
                    </div>

                    <div className="pt-3 pb-4 border-t border-gray-100">
                        {!loading && (
                            user ? (
                                <div className="px-5 space-y-2">
                                    <div className="flex items-center py-2">
                                        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center mr-3">
                                            <span className="text-sm font-bold text-red-600">{user.username?.[0]?.toUpperCase()}</span>
                                        </div>
                                        <div>
                                            <div className="text-sm font-semibold text-gray-800">{user.username}</div>
                                            <div className="text-xs text-gray-500">{user.email}</div>
                                        </div>
                                    </div>
                                    {(user.email === 'imronm1309@gmail.com' || user.is_staff) && (
                                        <Link href="/admin" className="block px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 transition-all duration-200" onClick={handleNavClick}>
                                            Admin Dashboard
                                        </Link>
                                    )}
                                    <Link href="/dashboard" className="block px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-gray-50 transition-all duration-200" onClick={handleNavClick}>
                                        Dashboard Latihan
                                    </Link>
                                    <button
                                        onClick={() => {
                                            if (isPracticing && !confirm('Lagi latihan, yakin mau keluar?')) return;
                                            logout();
                                            setIsMenuOpen(false);
                                        }}
                                        className="block w-full text-left px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-all duration-200"
                                    >
                                        Keluar
                                    </button>
                                </div>
                            ) : (
                                <div className="px-5 space-y-2">
                                    <Link href="/login" className="block px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200" onClick={handleNavClick}>
                                        Masuk
                                    </Link>
                                    <Link href="/register" className="block px-3 py-2 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-all duration-200 text-center" onClick={handleNavClick}>
                                        Daftar
                                    </Link>
                                </div>
                            )
                        )}
                    </div>
                </div>
            </nav>

            {/* Spacer so content doesn't go under fixed navbar */}
            <div className="h-16" />

            {/* Offline Download Modal */}
            <OfflineDownloadModal
                isOpen={showOfflineModal}
                onClose={() => setShowOfflineModal(false)}
            />
        </>
    );
}