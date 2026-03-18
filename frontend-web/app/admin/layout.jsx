'use client';

import { useAuth } from '@/context/AuthContext';
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
];

function Sidebar({ onClose }) {
    const pathname = usePathname();

    const isActive = (href) => {
        if (href === '/admin') return pathname === '/admin';
        return pathname.startsWith(href);
    };

    return (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-red-600">JBook Admin</h1>
                    <p className="text-xs text-gray-400 mt-0.5">v1.0.0</p>
                </div>
                {/* Close button - mobile only */}
                {onClose && (
                    <button
                        onClick={onClose}
                        className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Nav */}
            <nav className="flex-1 mt-4 px-3 space-y-1 overflow-y-auto">
                {navItems.map(({ href, label, icon }) => (
                    <Link
                        key={href}
                        href={href}
                        onClick={onClose}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                            isActive(href)
                                ? 'bg-red-50 text-red-700 shadow-sm'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                    >
                        <span className={isActive(href) ? 'text-red-500' : 'text-gray-400'}>
                            {icon}
                        </span>
                        {label}
                        {isActive(href) && (
                            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-red-500"></span>
                        )}
                    </Link>
                ))}
            </nav>

            {/* Bottom */}
            <div className="p-4 border-t border-gray-100">
                <Link
                    href="/"
                    onClick={onClose}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-all"
                >
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Kembali ke Situs
                </Link>
            </div>
        </div>
    );
}

export default function AdminLayout({ children }) {
    const { user, loading } = useAuth();
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

    // Close sidebar on route change (handled by Link onClick)
    // Also close on resize to desktop
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) setIsSidebarOpen(false);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (loading || !isAuthorized) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600 mx-auto"></div>
                    <p className="mt-4 text-sm text-gray-500">Memuat...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">

            {/* ── Desktop Sidebar ── */}
            <aside className="hidden md:flex md:flex-col w-64 bg-white shadow-sm border-r border-gray-100 flex-shrink-0 z-20">
                <Sidebar />
            </aside>

            {/* ── Mobile: Backdrop ── */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-30 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* ── Mobile: Slide-out Drawer ── */}
            <aside
                className={`
                    fixed top-0 left-0 h-full w-72 bg-white shadow-xl z-40 flex flex-col
                    transform transition-transform duration-300 ease-in-out md:hidden
                    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                `}
            >
                <Sidebar onClose={() => setIsSidebarOpen(false)} />
            </aside>

            {/* ── Main Content ── */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

                {/* Mobile Top Bar */}
                <header className="md:hidden flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100 shadow-sm flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2.5 rounded-xl bg-gray-50 text-gray-600 hover:text-red-600 hover:bg-red-50 transition-all active:scale-95 border border-gray-100"
                            aria-label="Buka menu"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                        <div>
                            <span className="text-xl font-black tracking-tight text-gray-900">
                                <span className="text-red-600">J</span>Book
                            </span>
                            <span className="ml-1 text-[10px] font-bold px-1.5 py-0.5 bg-red-100 text-red-600 rounded uppercase tracking-wider">Admin</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                            <p className="text-xs font-bold text-gray-900 leading-none">{user?.username}</p>
                            <p className="text-[10px] text-gray-400 mt-1">Administrator</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-700 p-[2px] shadow-lg shadow-red-200">
                            <div className="w-full h-full rounded-[10px] bg-white flex items-center justify-center">
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