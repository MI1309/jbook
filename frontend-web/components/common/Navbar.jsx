'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { usePractice } from '@/context/PracticeContext';
import { useTheme } from '@/context/ThemeContext';
import { appToast as toast } from '@/components/common/AppMessage';
import ConfirmationModal from '@/components/common/ConfirmationModal';
import Image from 'next/image';

const avatarKana = ['あ', 'き', 'す', 'ね', 'ふ', 'ま', 'ゆ', 'り', 'を', 'ん'];
const avatarStyles = [
    'bg-rose-100 text-rose-700',
    'bg-amber-100 text-amber-800',
    'bg-emerald-100 text-emerald-800',
    'bg-cyan-100 text-cyan-800',
    'bg-pink-100 text-pink-800',
    'bg-lime-100 text-lime-800',
    'bg-orange-100 text-orange-800',
    'bg-teal-100 text-teal-800',
    'bg-yellow-100 text-yellow-800',
    'bg-sky-100 text-sky-800',
];

function ProfileAvatar({ user, size = 'desktop' }) {
    const seed = String(user.id || user.username || 'jbook');
    const hash = Array.from(seed).reduce((value, character) => (value * 31 + character.charCodeAt(0)) >>> 0, 7);
    const avatarIndex = hash % avatarKana.length;
    const dimensions = size === 'mobile' ? 'h-9 w-9 text-lg' : 'h-10 w-10 text-xl';

    return (
        <span className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full ring-2 ring-white/70 dark:ring-white/10 ${dimensions} ${!user.profile_image ? avatarStyles[avatarIndex] : 'bg-gray-100'}`}>
            {user.profile_image ? (
                <Image src={user.profile_image} alt="" fill sizes={size === 'mobile' ? '36px' : '40px'} unoptimized className="object-cover" />
            ) : (
                <span aria-hidden="true" className="font-japanese font-black leading-none">{avatarKana[avatarIndex]}</span>
            )}
        </span>
    );
}

export default function Navbar() {
    const { user, logout, loading } = useAuth();
    const { isPracticing } = usePractice();
    const { theme, toggleTheme, mounted } = useTheme();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [pendingNav, setPendingNav] = useState(null);
    const pathname = usePathname();

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
            : "px-3 py-2 rounded-md text-base font-bold transition-all duration-200";

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
                                className={`flex items-center gap-3 text-2xl font-japanese font-black tracking-widest transition-all duration-200 ${
                                    !mounted ? 'text-accent-blue' : 
                                    theme === 'dark' ? 'text-accent-blue drop-shadow-[0_0_8px_rgba(56,189,248,0.25)]' : 'text-accent-blue'
                                }`}
                                onClick={(e) => handleNavClick(e, '/')}
                            >
                                {/* Logo dari file icon-32.png di public */}
                                <img 
                                    src="/icon-192.png" 
                                    alt="Logo JBook" 
                                    width="48" 
                                    height="48" 
                                    className="flex-shrink-0 rounded-2xl w-12 h-12 object-cover"
                                />
                                JBOOK
                            </Link>

                            {/* Desktop Nav Links */}
                            <div className="hidden xl:ml-8 xl:flex xl:space-x-1 font-japanese">
                                {[
                                    { href: '/kanji', label: 'Kanji' },
                                    { href: '/bunpo', label: 'Bunpo' },
                                    { href: '/kana', label: 'Kana' },
                                    { href: '/kotoba', label: 'Kotoba' },
                                    { href: '/tts', label: 'TTS' },

                                    { href: '/about', label: 'Tentang Kami' },
                                    ...(!loading && !user ? [{ href: '/practice', label: 'Latihan' }] : [])
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
                        <div className="hidden xl:flex items-center space-x-2">
                            {/* Theme toggle disabled (forced dark mode) */}

                            {!loading && (
                                user ? (
                                    <div className="flex items-center space-x-2">
                                        {(user.email === 'imronm1309@gmail.com' || user.is_staff) && (
                                            <Link href="/admin" className="text-accent-blue hover:text-accent-blue/80 font-bold px-3 py-2 rounded-md text-base transition-all duration-200 hover:bg-accent-blue/10" onClick={(e) => handleNavClick(e, '/admin')}>
                                                Admin
                                            </Link>
                                        )}
                                        <Link href="/dashboard" className={`font-bold px-3 py-2 rounded-md text-base transition-all duration-200 ${
                                            theme === 'dark' ? 'text-gray-300 hover:text-accent-blue hover:bg-accent-blue/10' : 'text-accent-blue hover:bg-accent-blue/10'
                                        }`} onClick={(e) => handleNavClick(e, '/dashboard')}>
                                            Dashboard
                                        </Link>
                                        <Link
                                            href="/profile"
                                            onClick={(event) => handleNavClick(event, '/profile')}
                                            className="flex min-w-0 items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-blue-600/10"
                                            aria-label={`Profil ${user.username}`}
                                        >
                                            <ProfileAvatar user={user} />
                                            <span className={`max-w-28 truncate text-sm font-bold ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>{user.username}</span>
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
                                            className={`px-3 py-2 rounded-md text-base font-bold transition-all duration-200 ${
                                                theme === 'dark' ? 'text-gray-400 hover:text-accent-blue hover:bg-accent-blue/10' : 'text-gray-600 hover:text-accent-blue hover:bg-accent-blue/10'
                                            }`}
                                        >
                                            Keluar
                                        </button>
                                    </div>
                                ) : (
                                    null
                                )
                            )}
                        </div>

                        {/* Mobile navigation toggle */}
                        <div className="flex items-center gap-1 xl:hidden">
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
                        xl:hidden overflow-y-auto overscroll-contain
                        transition-all duration-300 ease-in-out
                        ${isMenuOpen ? 'max-h-[calc(100dvh-4rem)] opacity-100' : 'max-h-0 opacity-0'}
                        ${!mounted ? 'bg-white border-gray-100' : (theme === 'dark' ? 'bg-[#0b0b0d] border-[#212127]' : 'bg-[#faf9f6] border-[#e5e5db]')} ${user ? 'border-t' : ''}
                    `}
                >
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        {[
                            { href: '/kanji', label: 'Kanji' },
                            { href: '/bunpo', label: 'Bunpo' },
                            { href: '/kana', label: 'Kana' },
                            { href: '/kotoba', label: 'Kotoba' },
                            { href: '/tts', label: 'TTS' },
                            { href: '/about', label: 'Tentang Kami' },
                            ...(!loading && !user ? [{ href: '/practice', label: 'Latihan' }] : []),
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

                    {!loading && user && (
                        <div className={`pt-3 pb-4 border-t ${!mounted ? 'border-gray-100' : (theme === 'dark' ? 'border-[#212127]' : 'border-gray-100')}`}>
                            <div className="px-5 space-y-2">
                                    <div className={`flex items-center py-2`}>
                                        <Link href="/profile" className="mr-3" aria-label="Buka profil" onClick={(event) => handleNavClick(event, '/profile')}>
                                            <ProfileAvatar user={user} size="mobile" />
                                        </Link>
                                        <div>
                                            <div className={`text-sm font-semibold transition-colors ${!mounted ? 'text-gray-800' : (theme === 'dark' ? 'text-gray-200' : 'text-gray-900')}`}>{user.username}</div>
                                            <div className={`text-xs transition-colors ${!mounted ? 'text-gray-500' : (theme === 'dark' ? 'text-gray-500' : 'text-gray-600')}`}>{user.email}</div>
                                        </div>
                                    </div>
                                    <Link href="/profile" className="block px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-accent-blue hover:bg-white/5 transition-all duration-200" onClick={(e) => handleNavClick(e, '/profile')}>
                                        Profil
                                    </Link>
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
                        </div>
                    )}
                </div>
            </nav>

            {/* Spacer so content doesn't go under fixed navbar */}
            <div className="h-16" />

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