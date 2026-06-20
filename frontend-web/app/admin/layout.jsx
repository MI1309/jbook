'use client';

import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const navItems = [
    { href: '/admin', label: 'Dashboard', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
    )},
    { href: '/admin/blog', label: 'Blog', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
    )},
    { href: '/admin/kanji', label: 'Kanji', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
    )},
    { href: '/admin/bunpo', label: 'Bunpo', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
    )},
    { href: '/admin/kotoba', label: 'Kotoba', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
    )},
    { href: '/admin/custom-modules', label: 'Latihan Kustom', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
    )},
];

function Sidebar({ onClose }) {
    const pathname = usePathname();
    const { user } = useAuth();
    const { theme, setTheme } = useTheme();

    const isActive = (href) => {
        if (href === '/admin') return pathname === '/admin';
        return pathname.startsWith(href);
    };

    return (
        <div className={`flex flex-col h-full transition-colors duration-500 ${theme === 'dark' ? 'bg-[#050505] text-white' : 'bg-gray-50 text-gray-900'}`}>
            {/* Logo */}
            <div className={`p-8 border-b ${theme === 'dark' ? 'border-white/5' : 'border-gray-200'}`}>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/20">
                        <span className="text-xl font-black text-white">J</span>
                    </div>
                    <div>
                        <h1 className={`text-xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>JBook Admin</h1>
                        <p className={`text-[10px] font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-neutral-600' : 'text-gray-400'}`}>Control Panel</p>
                    </div>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className={`absolute top-8 right-6 p-2 rounded-xl md:hidden ${theme === 'dark' ? 'text-neutral-500 hover:bg-white/5' : 'text-gray-400 hover:bg-gray-100'}`}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
                {navItems.map((item) => {
                    const active = isActive(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={onClose}
                            className={`
                                flex items-center gap-4 px-4 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all group
                                ${active 
                                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' 
                                    : theme === 'dark'
                                        ? 'text-neutral-500 hover:text-white hover:bg-white/5'
                                        : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                                }
                            `}
                        >
                            <span className={`transition-transform group-hover:scale-110 ${active ? 'text-white' : ''}`}>
                                {item.icon}
                            </span>
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            {/* User Info & Bottom */}
            <div className={`p-6 border-t space-y-2 ${theme === 'dark' ? 'border-white/5' : 'border-gray-200'}`}>
                <div className={`px-4 py-3 rounded-2xl flex items-center gap-3 mb-2 ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'}`}>
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center border border-white/10">
                        <span className="text-xs font-black text-white">{user?.username?.[0]?.toUpperCase() ?? 'A'}</span>
                    </div>
                    <div className="min-w-0">
                        <p className={`text-[10px] font-black truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{user?.username}</p>
                        <p className="text-[8px] font-bold text-neutral-600 uppercase">Administrator</p>
                    </div>
                </div>
                
                <button
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all group border ${
                        theme === 'dark'
                        ? 'text-neutral-500 hover:text-white hover:bg-white/5 border-transparent'
                        : 'text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 border-gray-200'
                    }`}
                >
                    <div className="w-5 h-5 flex items-center justify-center transition-transform group-hover:rotate-12">
                        {theme === 'dark' ? (
                            <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" /></svg>
                        ) : (
                            <svg className="w-5 h-5 text-indigo-400" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" /></svg>
                        )}
                    </div>
                    {theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
                </button>

                <Link
                    href="/"
                    onClick={onClose}
                    className={`flex items-center gap-4 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        theme === 'dark' ? 'text-neutral-600 hover:text-red-500 hover:bg-red-500/5' : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                    }`}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Kembali ke Situs
                </Link>
            </div>
        </div>
    );
}

export default function AdminLayout({ children }) {
    const { user, loading } = useAuth();
    const { theme } = useTheme();
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push('/login');
            } else if (user.email !== 'imronm1309@gmail.com' && !user.is_staff) {
                router.push('/');
            } else {
                setIsAuthorized(true);
            }
        }
    }, [user, loading, router]);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) setIsSidebarOpen(false);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (loading || !isAuthorized) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-black' : 'bg-gray-50'}`}>
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-red-600/20 border-t-red-600 rounded-full animate-spin mx-auto"></div>
                    <p className={`mt-4 text-[10px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-neutral-600' : 'text-gray-400'}`}>Otorisasi...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`flex h-screen overflow-hidden transition-colors duration-500 ${theme === 'dark' ? 'bg-[#020202] text-neutral-200' : 'bg-white text-gray-900'}`}>

            {/* ── Desktop Sidebar ── */}
            <aside className={`hidden md:flex md:flex-col w-72 border-r flex-shrink-0 z-20 ${theme === 'dark' ? 'border-white/5' : 'border-gray-200'}`}>
                <Sidebar />
            </aside>

            {/* ── Mobile: Backdrop ── */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-30 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* ── Mobile: Slide-out Drawer ── */}
            <aside
                className={`
                    fixed top-0 left-0 h-full w-80 shadow-2xl z-40 flex flex-col
                    transform transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) md:hidden
                    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                    ${theme === 'dark' ? 'bg-[#050505]' : 'bg-white'}
                `}
            >
                <Sidebar onClose={() => setIsSidebarOpen(false)} />
            </aside>

            {/* ── Main Content ── */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

                {/* Mobile Top Bar */}
                <header className={`md:hidden flex items-center justify-between px-6 py-4 border-b shadow-sm flex-shrink-0 ${
                    theme === 'dark' ? 'bg-[#050505] border-white/5' : 'bg-white border-gray-100'
                }`}>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className={`p-2.5 rounded-xl transition-all active:scale-95 border ${
                                theme === 'dark' 
                                ? 'bg-white/5 text-neutral-400 border-white/5 hover:text-red-500' 
                                : 'bg-gray-50 text-gray-600 border-gray-100 hover:bg-red-50 hover:text-red-600'
                            }`}
                            aria-label="Buka menu"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                        <div>
                            <span className={`text-xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                <span className="text-red-600">J</span>Book
                            </span>
                            <span className="ml-1 text-[10px] font-bold px-1.5 py-0.5 bg-red-100 text-red-600 rounded uppercase tracking-wider">Admin</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                            <p className={`text-xs font-bold leading-none ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{user?.username}</p>
                            <p className="text-[10px] text-gray-400 mt-1">Administrator</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-700 p-[2px] shadow-lg shadow-red-200">
                            <div className={`w-full h-full rounded-[10px] flex items-center justify-center ${theme === 'dark' ? 'bg-[#050505]' : 'bg-white'}`}>
                                <span className="text-sm font-black text-red-600">
                                    {user?.username?.[0]?.toUpperCase() ?? 'A'}
                                </span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-4 md:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}