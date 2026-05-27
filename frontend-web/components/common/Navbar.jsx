'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { usePractice } from '@/context/PracticeContext';
import { useTheme } from '@/context/ThemeContext';
import OfflineDownloadModal from '@/components/common/OfflineDownloadModal';
import { dbGetStats } from '@/lib/offline-download';
import { toast } from 'react-toastify';
import ConfirmationModal from '@/components/common/ConfirmationModal';

export default function Navbar() {
    const { user, logout, loading } = useAuth();
    const { isPracticing } = usePractice();
    const { theme, toggleTheme, mounted } = useTheme();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [showOfflineModal, setShowOfflineModal] = useState(false);
    const [hasOfflineData, setHasOfflineData] = useState(false);
    const [pendingNav, setPendingNav] = useState(null);
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
            ? "block px-3 py-2 rounded-md text-base font-bold transition-all duration-200"
            : "px-3 py-2 rounded-md text-sm font-bold transition-all duration-200";

        if (!mounted) return `${baseClass} text-gray-400`;

        const activeClass = theme === 'dark' 
            ? "text-accent-blue bg-accent-blue/10" 
            : "text-accent-blue bg-accent-blue/10";
        
        const inactiveClass = theme === 'dark'
            ? "text-gray-400 hover:text-accent-blue hover:bg-white/5"
            : "text-gray-600 hover:text-accent-blue hover:bg-gray-100/50";

        return `${baseClass} ${isActive(path) ? activeClass : inactiveClass}`;
    };

    const handleNavClick = (e, href) => {
        if (isPracticing) {
            e.preventDefault();
            setPendingNav(href);
            return;
        }
        setIsMenuOpen(false);
    };

    const confirmNavigation = () => {
        if (pendingNav) {
            window.location.href = pendingNav;
        }
    };

    return (
        <>
            <nav
                className={`
                    fixed top-0 left-0 right-0 z-50
                    transition-all duration-300 ease-in-out
                    ${scrolled ? 'shadow-xl' : ''}
                    ${!mounted ? 'bg-white border-b border-gray-100' : 
                      theme === 'dark' 
                        ? 'bg-[#0b0b0d]/90 backdrop-blur-md border-b border-[#212127] shadow-lg shadow-black/20' 
                        : 'bg-[#faf9f6]/90 backdrop-blur-md border-b border-[#e5e5db] shadow-sm'
                    }
                `}
            >
                <div className="container mx-auto px-4">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <Link
                                href="/"
                                className={`text-2xl font-japanese font-black tracking-widest transition-all duration-200 ${
                                    !mounted ? 'text-accent-blue' : 
                                    theme === 'dark' ? 'text-accent-blue drop-shadow-[0_0_8px_rgba(56,189,248,0.25)]' : 'text-accent-blue'
                                }`}
                                onClick={(e) => handleNavClick(e, '/')}
                            >
                                JBOOK
                            </Link>

                            {/* Desktop Nav Links */}
                            <div className="hidden lg:ml-8 lg:flex lg:space-x-1 font-japanese">
                                {[
                                    { href: '/kanji', label: 'Kanji' },
                                    { href: '/bunpo', label: 'Tata Bahasa' },
                                    { href: '/kana', label: 'Kana' },
                                    { href: '/kotoba', label: 'Kotoba' },
                                    { href: '/tts', label: 'TTS' },

                                    { href: '/about', label: 'Tentang Kami' },
                                ].map(({ href, label }) => (
                                    <Link
                                        key={href}
                                        href={href}
                                        className={getLinkClass(href)}
                                        onClick={(e) => handleNavClick(e, href)}
                                    >
                                        {label}
                                        {isActive(href) && (
                                            <span className="block h-0.5 bg-accent-blue rounded-full mt-0.5 animate-[expandWidth_0.2s_ease-out]" />
                                        )}
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Desktop Auth */}
                        <div className="hidden md:flex items-center space-x-2">
                            {/* Theme toggle disabled (forced dark mode) */}

                            {/* Offline Download Button */}
                            <button
                                onClick={() => setShowOfflineModal(true)}
                                title={hasOfflineData ? 'Data offline tersedia' : 'Unduh untuk offline'}
                                className={`relative p-2 rounded-xl transition-all duration-200 ${
                                    theme === 'dark' ? 'text-accent-blue hover:bg-accent-blue/10' : 'text-accent-blue hover:bg-accent-blue/10'
                                }`}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                {hasOfflineData && (
                                    <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full border-2 border-white dark:border-black" />
                                )}
                            </button>
                            {!loading && (
                                user ? (
                                    <div className="flex items-center space-x-2">
                                        {(user.email === 'imronm1309@gmail.com' || user.is_staff) && (
                                            <Link href="/admin" className="text-accent-blue hover:text-accent-blue/80 font-bold px-3 py-2 rounded-md text-sm transition-all duration-200 hover:bg-accent-blue/10" onClick={(e) => handleNavClick(e, '/admin')}>
                                                Admin
                                            </Link>
                                        )}
                                        <Link href="/dashboard" className={`font-bold px-3 py-2 rounded-md text-sm transition-all duration-200 ${
                                            theme === 'dark' ? 'text-gray-300 hover:text-accent-blue hover:bg-accent-blue/10' : 'text-accent-blue hover:bg-accent-blue/10'
                                        }`} onClick={(e) => handleNavClick(e, '/dashboard')}>
                                            Dashboard
                                        </Link>
                                        <span className={`text-sm font-black px-2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-300'}`}>|</span>
                                        <button
                                            onClick={() => {
                                                if (isPracticing) {
                                                    setPendingNav('logout');
                                                    return;
                                                }
                                                logout();
                                                toast.info('Kamu telah keluar akun.', { theme: theme === 'dark' ? 'dark' : 'colored' });
                                            }}
                                            className={`px-3 py-2 rounded-md text-sm font-bold transition-all duration-200 ${
                                                theme === 'dark' ? 'text-gray-400 hover:text-accent-blue hover:bg-accent-blue/10' : 'text-gray-600 hover:text-accent-blue hover:bg-accent-blue/10'
                                            }`}
                                        >
                                            Keluar
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center space-x-2">
                                        <Link href="/login" className="text-gray-700 dark:text-gray-200 hover:text-accent-blue px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 hover:bg-accent-blue/10" onClick={(e) => handleNavClick(e, '/login')}>
                                            Masuk
                                        </Link>
                                        <Link href="/register" className="bg-gradient-to-r from-accent-blue to-accent-green text-white px-4 py-2 rounded-md text-sm font-medium shadow-sm transition-all duration-200 hover:opacity-90 hover:shadow-md hover:-translate-y-px" onClick={(e) => handleNavClick(e, '/register')}>
                                            Daftar
                                        </Link>
                                    </div>
                                )
                            )}
                        </div>

                        {/* Mobile: Download + Hamburger */}
                        <div className="flex items-center gap-1 md:hidden">

                            <button
                                onClick={() => setShowOfflineModal(true)}
                                title={hasOfflineData ? 'Data offline tersedia' : 'Unduh untuk offline'}
                                className="relative p-2 rounded-md text-accent-blue hover:text-accent-blue hover:bg-accent-blue/10 transition-all duration-200"
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
                                className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent-blue/50"
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

                <div
                    className={`
                        md:hidden overflow-hidden
                        transition-all duration-300 ease-in-out
                        ${isMenuOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}
                        ${!mounted ? 'bg-white border-gray-100' : (theme === 'dark' ? 'bg-[#0b0b0d] border-[#212127]' : 'bg-[#faf9f6] border-[#e5e5db]')} border-t
                    `}
                >
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        {[
                            { href: '/kanji', label: 'Kanji' },
                            { href: '/bunpo', label: 'Tata Bahasa' },
                            { href: '/kana', label: 'Kana' },
                            { href: '/kotoba', label: 'Kotoba' },
                            { href: '/tts', label: 'TTS' },
                            { href: '/about', label: 'Tentang Kami' },
                        ].map(({ href, label }, i) => (
                            <Link
                                key={href}
                                href={href}
                                className={getLinkClass(href, true)}
                                onClick={(e) => handleNavClick(e, href)}
                                style={{ transitionDelay: isMenuOpen ? `${i * 40}ms` : '0ms' }}
                            >
                                {label}
                            </Link>
                        ))}
                    </div>

                    <div className={`pt-3 pb-4 border-t ${!mounted ? 'border-gray-100' : (theme === 'dark' ? 'border-[#212127]' : 'border-gray-100')}`}>
                        {!loading && (
                            user ? (
                                <div className="px-5 space-y-2">
                                    <div className={`flex items-center py-2`}>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${!mounted ? 'bg-gray-100' : (theme === 'dark' ? 'bg-accent-blue/10' : 'bg-gray-100')}`}>
                                            <span className={`text-sm font-bold ${!mounted ? 'text-gray-400' : (theme === 'dark' ? 'text-accent-blue' : 'text-gray-600')}`}>{user.username?.[0]?.toUpperCase()}</span>
                                        </div>
                                        <div>
                                            <div className={`text-sm font-semibold transition-colors ${!mounted ? 'text-gray-800' : (theme === 'dark' ? 'text-gray-200' : 'text-gray-900')}`}>{user.username}</div>
                                            <div className={`text-xs transition-colors ${!mounted ? 'text-gray-500' : (theme === 'dark' ? 'text-gray-500' : 'text-gray-600')}`}>{user.email}</div>
                                        </div>
                                    </div>
                                    {(user.email === 'imronm1309@gmail.com' || user.is_staff) && (
                                        <Link href="/admin" className="block px-3 py-2 rounded-md text-sm font-medium text-accent-blue hover:bg-accent-blue/10 transition-all duration-200" onClick={(e) => handleNavClick(e, '/admin')}>
                                            Admin Dashboard
                                        </Link>
                                    )}
                                    <Link href="/dashboard" className="block px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-accent-blue hover:bg-white/5 transition-all duration-200" onClick={(e) => handleNavClick(e, '/dashboard')}>
                                        Dashboard
                                    </Link>
                                    <button
                                        onClick={() => {
                                            if (isPracticing) {
                                                setPendingNav('logout');
                                                return;
                                            }
                                            logout();
                                            setIsMenuOpen(false);
                                        }}
                                        className="block w-full text-left px-3 py-2 rounded-md text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
                                    >
                                        Keluar
                                    </button>
                                </div>
                            ) : (
                                <div className="px-5 space-y-2">
                                    <Link href="/login" className={`block px-3 py-2 rounded-md text-sm font-black transition-colors ${!mounted ? 'text-gray-600' : (theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-accent-blue hover:text-accent-blue')}`} onClick={(e) => handleNavClick(e, '/login')}>
                                        Masuk
                                    </Link>
                                    <Link href="/register" className="block px-3 py-2 rounded-xl text-sm font-black text-white bg-accent-blue hover:bg-accent-blue/90 transition-all duration-200 text-center shadow-lg shadow-accent-blue/10" onClick={(e) => handleNavClick(e, '/register')}>
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

            <ConfirmationModal 
                isOpen={!!pendingNav}
                onClose={() => setPendingNav(null)}
                onConfirm={() => {
                    if (pendingNav === 'logout') {
                        logout();
                        toast.info('Kamu telah keluar akun.', { theme: theme === 'dark' ? 'dark' : 'colored' });
                        setIsMenuOpen(false);
                    } else {
                        window.location.href = pendingNav;
                    }
                    setPendingNav(null);
                }}
                title="Keluar Latihan?"
                message="Anda sedang dalam sesi latihan. Yakin ingin keluar? Progress latihan ini mungkin tidak tersimpan."
                confirmText="Ya, Keluar"
                cancelText="Batal"
            />
        </>
    );
}