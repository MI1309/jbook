'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { usePractice } from '@/context/PracticeContext';
import { useTheme } from '@/context/ThemeContext';
import { appToast as toast } from '@/components/common/AppMessage';
import ConfirmationModal from '@/components/common/ConfirmationModal';
import Image from 'next/image';
import { ChevronDown, LayoutDashboard, LogOut, Menu, X } from 'lucide-react';

const baseNavItems = [
    { href: '/kanji', label: 'Kanji' },
    { href: '/bunpo', label: 'Bunpo' },
    { href: '/kotoba', label: 'Kotoba' },
    { href: '/kana', label: 'Kana' },
    { href: '/tts', label: 'TTS' },
    { href: '/about', label: 'Tentang Kami' },
];

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
    const { theme, mounted } = useTheme();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [pendingNav, setPendingNav] = useState(null);
    const profileMenuRef = useRef(null);
    const pathname = usePathname();
    const navItems = !loading && !user
        ? [...baseNavItems, { href: '/practice', label: 'Latihan' }]
        : baseNavItems;

    // Detect scroll for opacity effect
    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        if (!isProfileMenuOpen) return undefined;

        const closeOnOutsideClick = (event) => {
            if (!profileMenuRef.current?.contains(event.target)) {
                setIsProfileMenuOpen(false);
            }
        };
        const closeOnEscape = (event) => {
            if (event.key === 'Escape') setIsProfileMenuOpen(false);
        };

        document.addEventListener('pointerdown', closeOnOutsideClick);
        document.addEventListener('keydown', closeOnEscape);
        return () => {
            document.removeEventListener('pointerdown', closeOnOutsideClick);
            document.removeEventListener('keydown', closeOnEscape);
        };
    }, [isProfileMenuOpen]);

    const isActive = (path) => {
        if (path === '/') return pathname === '/';
        return pathname.startsWith(path);
    };

    const getLinkClass = (path, mobile = false) => {
        const baseClass = mobile
            ? 'block rounded-lg px-3 py-2.5 text-[15px] font-semibold transition-colors duration-200'
            : 'rounded-lg px-2.5 py-2 text-sm font-semibold transition-colors duration-200';

        if (!mounted) return `${baseClass} text-gray-400`;

        const activeClass = 'text-accent-blue bg-accent-blue/10';
        
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

    const handleLogout = () => {
        setIsProfileMenuOpen(false);
        if (isPracticing) {
            setPendingNav('logout');
            return;
        }
        logout();
        setIsMenuOpen(false);
        toast.info('Kamu telah keluar akun.', { theme: theme === 'dark' ? 'dark' : 'colored' });
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
                    <div className="flex h-16 items-center justify-between gap-3">
                        <div className="flex items-center">
                            <Link
                                href="/"
                                className={`flex shrink-0 items-center gap-2.5 text-xl font-japanese font-black transition-colors duration-200 sm:text-2xl ${
                                    !mounted ? 'text-accent-blue' : 
                                    theme === 'dark' ? 'text-accent-blue drop-shadow-[0_0_8px_rgba(56,189,248,0.25)]' : 'text-accent-blue'
                                }`}
                                onClick={(e) => handleNavClick(e, '/')}
                            >
                                <Image
                                    src="/icon-192.png"
                                    alt="Logo JBook" 
                                    width={40}
                                    height={40}
                                    priority
                                    className="h-10 w-10 shrink-0 rounded-xl object-cover transition-transform duration-300 group-hover:rotate-[-4deg] group-hover:scale-105 motion-reduce:transition-none motion-reduce:transform-none"
                                />
                                JBOOK
                            </Link>

                        </div>

                        {/* Desktop Nav Links */}
                        <div className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 font-japanese xl:flex">
                            {navItems.map(({ href, label }) => (
                                <Link
                                    key={href}
                                    href={href}
                                    className={`${getLinkClass(href)} group relative transition-transform hover:-translate-y-0.5 motion-reduce:transform-none`}
                                    onClick={(e) => handleNavClick(e, href)}
                                >
                                    {label}
                                    <span
                                        aria-hidden="true"
                                        className={`absolute bottom-1 left-1/2 h-0.5 w-[calc(100%-1.25rem)] -translate-x-1/2 origin-center rounded-full bg-accent-blue transition-transform duration-300 ease-out motion-reduce:transition-none ${isActive(href) ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100 group-focus-visible:scale-x-100'}`}
                                    />
                                </Link>
                            ))}
                        </div>

                        {/* Desktop Auth */}
                        <div className="hidden shrink-0 items-center gap-1.5 xl:flex">
                            {/* Theme toggle disabled (forced dark mode) */}

                            {!loading && (
                                user ? (
                                    <div className="flex items-center gap-1">
                                        {user.is_staff && (
                                            <Link href="/admin" className={`rounded-lg px-2.5 py-2 text-sm font-semibold transition-colors hover:bg-accent-blue/10 ${theme === 'dark' ? 'text-accent-blue' : 'text-accent-blue'}`} onClick={(e) => handleNavClick(e, '/admin')}>
                                                Admin
                                            </Link>
                                        )}
                                        <div className="relative" ref={profileMenuRef}>
                                            <button
                                                type="button"
                                                onClick={() => setIsProfileMenuOpen((open) => !open)}
                                                className={`flex min-w-0 items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/60 ${theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}
                                                aria-label={`Menu akun ${user.username}`}
                                                aria-haspopup="menu"
                                                aria-expanded={isProfileMenuOpen}
                                                aria-controls="profile-account-menu"
                                                title="Menu akun"
                                            >
                                                <ProfileAvatar user={user} />
                                                <span className={`max-w-28 truncate text-sm font-bold ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>{user.username}</span>
                                                <ChevronDown size={15} aria-hidden="true" className={`shrink-0 transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
                                            </button>
                                            {isProfileMenuOpen && (
                                                <div
                                                    id="profile-account-menu"
                                                    role="menu"
                                                    aria-label="Menu akun"
                                                    className={`absolute right-0 top-full z-[60] mt-2 w-64 overflow-hidden rounded-xl border py-1 shadow-xl animate-in fade-in slide-in-from-top-2 zoom-in-95 duration-150 motion-reduce:animate-none ${theme === 'dark' ? 'border-white/10 bg-[#151519] text-gray-100 shadow-black/40' : 'border-gray-200 bg-white text-gray-900 shadow-black/10'}`}
                                                >
                                                    <div className={`border-b px-4 py-3 ${theme === 'dark' ? 'border-white/10' : 'border-gray-100'}`}>
                                                        <p className="truncate text-sm font-bold">{user.username}</p>
                                                        <p className={`truncate text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{user.email}</p>
                                                    </div>
                                                    <Link
                                                        href="/dashboard"
                                                        role="menuitem"
                                                        onClick={(event) => {
                                                            handleNavClick(event, '/dashboard');
                                                            setIsProfileMenuOpen(false);
                                                        }}
                                                        className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-colors ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}
                                                    >
                                                        <LayoutDashboard size={17} aria-hidden="true" className="text-accent-blue" />
                                                        Dashboard
                                                    </Link>
                                                    <button
                                                        type="button"
                                                        role="menuitem"
                                                        onClick={handleLogout}
                                                        className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold transition-colors ${theme === 'dark' ? 'text-red-300 hover:bg-red-400/10' : 'text-red-700 hover:bg-red-50'}`}
                                                    >
                                                        <LogOut size={17} aria-hidden="true" />
                                                        Sign out
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <Link href="/login" onClick={(e) => handleNavClick(e, '/login')} className={getLinkClass('/login')}>
                                            Masuk
                                        </Link>
                                        <Link href="/register" onClick={(e) => handleNavClick(e, '/register')} className="rounded-lg bg-accent-blue px-3.5 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-accent-blue/90">
                                            Daftar
                                        </Link>
                                    </div>
                                )
                            )}
                        </div>

                        {/* Mobile navigation toggle */}
                        <div className="flex items-center gap-1 xl:hidden">
                            <button
                                onClick={() => setIsMenuOpen((open) => !open)}
                                className={`group relative inline-flex h-10 w-10 items-center justify-center rounded-xl transition-[background-color,color,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/60 ${theme === 'dark' ? 'text-gray-300 hover:bg-white/10' : 'text-gray-700 hover:bg-black/5'} ${isMenuOpen ? 'bg-accent-blue/10 text-accent-blue' : ''}`}
                                aria-label={isMenuOpen ? 'Tutup menu' : 'Buka menu'}
                                aria-expanded={isMenuOpen}
                                aria-controls="mobile-navigation"
                                title={isMenuOpen ? 'Tutup menu' : 'Buka menu'}
                            >
                                <Menu
                                    size={21}
                                    aria-hidden="true"
                                    className={`absolute transition-[transform,opacity] duration-300 ease-out motion-reduce:transition-none ${isMenuOpen ? 'rotate-[-90deg] scale-50 opacity-0' : 'rotate-0 scale-100 opacity-100'}`}
                                />
                                <X
                                    size={21}
                                    aria-hidden="true"
                                    className={`absolute transition-[transform,opacity] duration-300 ease-out motion-reduce:transition-none ${isMenuOpen ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-50 opacity-0'}`}
                                />
                            </button>
                        </div>
                    </div>
                </div>

                <div
                    id="mobile-navigation"
                    inert={!isMenuOpen}
                    aria-hidden={!isMenuOpen}
                    className={`
                        xl:hidden overflow-y-auto overscroll-contain origin-top transition-[max-height,opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none
                        ${isMenuOpen ? 'visible max-h-[calc(100dvh-4rem)] translate-y-0 opacity-100' : 'invisible max-h-0 -translate-y-2 opacity-0'}
                        ${!mounted ? 'bg-white border-gray-100' : (theme === 'dark' ? 'bg-[#0b0b0d] border-[#212127]' : 'bg-[#faf9f6] border-[#e5e5db]')} ${isMenuOpen ? 'border-t' : ''}
                    `}
                >
                    <div className="space-y-1 px-3 pb-3 pt-2 sm:px-5">
                        {navItems.map(({ href, label }, i) => (
                            <Link
                                key={href}
                                href={href}
                                className={`${getLinkClass(href, true)} transition-[opacity,transform,background-color,color] duration-200 motion-reduce:transition-none`}
                                onClick={(e) => handleNavClick(e, href)}
                                style={{
                                    transitionDelay: isMenuOpen ? `${Math.min(i, 5) * 25}ms` : '0ms',
                                    opacity: isMenuOpen ? 1 : 0,
                                    transform: isMenuOpen ? 'translateY(0)' : 'translateY(-4px)',
                                }}
                            >
                                {label}
                            </Link>
                        ))}
                    </div>

                    {!loading && user && (
                        <div className={`pt-3 pb-4 border-t ${!mounted ? 'border-gray-100' : (theme === 'dark' ? 'border-[#212127]' : 'border-gray-100')}`}>
                            <div className="space-y-1 px-4 pb-4 sm:px-6">
                                    <div className="flex min-w-0 items-center gap-3 py-2">
                                        <Link href="/profile" aria-label="Buka profil" onClick={(event) => handleNavClick(event, '/profile')}>
                                            <ProfileAvatar user={user} size="mobile" />
                                        </Link>
                                        <div className="min-w-0">
                                            <div className={`truncate text-sm font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>{user.username}</div>
                                            <div className={`truncate text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{user.email}</div>
                                        </div>
                                    </div>
                                    <Link href="/profile" className={getLinkClass('/profile', true)} onClick={(e) => handleNavClick(e, '/profile')}>
                                        Profil
                                    </Link>
                                    {user.is_staff && (
                                        <Link href="/admin" className={getLinkClass('/admin', true)} onClick={(e) => handleNavClick(e, '/admin')}>
                                            Admin Dashboard
                                        </Link>
                                    )}
                                    <Link href="/dashboard" className={getLinkClass('/dashboard', true)} onClick={(e) => handleNavClick(e, '/dashboard')}>
                                        Dashboard
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className={`block w-full rounded-lg px-3 py-2.5 text-left text-[15px] font-semibold transition-colors ${theme === 'dark' ? 'text-gray-400 hover:bg-white/5 hover:text-gray-100' : 'text-gray-600 hover:bg-black/5 hover:text-gray-900'}`}
                                    >
                                        Keluar
                                    </button>
                            </div>
                        </div>
                    )}
                    {!loading && !user && (
                        <div className={`grid grid-cols-2 gap-2 border-t px-4 py-4 sm:px-6 ${theme === 'dark' ? 'border-[#212127]' : 'border-gray-200'}`}>
                            <Link href="/login" onClick={(e) => handleNavClick(e, '/login')} className={`rounded-lg border px-4 py-2.5 text-center text-sm font-bold transition-colors ${theme === 'dark' ? 'border-white/10 text-gray-200 hover:bg-white/5' : 'border-gray-200 text-gray-800 hover:bg-black/5'}`}>
                                Masuk
                            </Link>
                            <Link href="/register" onClick={(e) => handleNavClick(e, '/register')} className="rounded-lg bg-accent-blue px-4 py-2.5 text-center text-sm font-bold text-white transition-colors hover:bg-accent-blue/90">
                                Daftar
                            </Link>
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