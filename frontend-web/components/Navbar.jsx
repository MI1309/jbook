'use client';


import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { usePractice } from '@/context/PracticeContext';

export default function Navbar() {
    const { user, logout, loading } = useAuth();
    const { isPracticing } = usePractice();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleNavClick = (e) => {
        if (isPracticing) {
            if (!confirm('Anda sedang dalam sesi latihan. Yakin ingin keluar? Progress mungkin tidak tersimpan (tergantung browser).')) {
                e.preventDefault();
                // Close menu if open to avoid confusion? No, keep it open or just do nothing.
                if (isMenuOpen) setIsMenuOpen(false);
            } else {
                // User confirmed exit
                if (isMenuOpen) setIsMenuOpen(false);
            }
        } else {
            if (isMenuOpen) setIsMenuOpen(false);
        }
    };

    return (
        <nav className="bg-white shadow-sm border-b border-gray-200 relative z-50">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center">
                        <Link href="/" className="text-xl font-bold text-red-600" onClick={handleNavClick}>
                            JBook
                        </Link>
                        <div className="hidden md:ml-10 md:flex md:space-x-8">
                            <Link href="/kanji" className="text-gray-900 hover:text-red-600 px-3 py-2 rounded-md text-sm font-medium" onClick={handleNavClick}>
                                Kanji
                            </Link>
                            <Link href="/bunpo" className="text-gray-900 hover:text-red-600 px-3 py-2 rounded-md text-sm font-medium" onClick={handleNavClick}>
                                Tata Bahasa
                            </Link>
                            <Link href="/kotoba" className="text-gray-900 hover:text-red-600 px-3 py-2 rounded-md text-sm font-medium" onClick={handleNavClick}>
                                Kotoba
                            </Link>
                            <Link href="/practice" className="text-gray-900 hover:text-red-600 px-3 py-2 rounded-md text-sm font-medium" onClick={handleNavClick}>
                                Latihan
                            </Link>
                        </div>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center space-x-4">
                        {!loading && (
                            user ? (
                                <div className="flex items-center space-x-4">
                                    {(user.email === 'imronm1309@gmail.com' || user.is_staff) && (
                                        <Link href="/admin" className="text-red-600 hover:text-red-800 font-bold px-3 py-2 rounded-md text-sm" onClick={handleNavClick}>
                                            Admin
                                        </Link>
                                    )}
                                    <span className="text-sm font-medium text-gray-700">Hi, {user.username}</span>
                                    <button
                                        onClick={() => {
                                            if (isPracticing && !confirm('Lagi latihan, yakin mau keluar?')) return;
                                            logout();
                                        }}
                                        className="text-gray-900 hover:text-red-600 px-3 py-2 rounded-md text-sm font-medium"
                                    >
                                        Keluar
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <Link href="/login" className="text-gray-900 hover:text-red-600 px-3 py-2 rounded-md text-sm font-medium" onClick={handleNavClick}>
                                        Masuk
                                    </Link>
                                    <Link href="/register" className="bg-red-600 text-white hover:bg-red-700 px-4 py-2 rounded-md text-sm font-medium" onClick={handleNavClick}>
                                        Daftar
                                    </Link>
                                </>
                            )
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <div className="flex items-center md:hidden">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-red-500"
                            aria-expanded="false"
                        >
                            <span className="sr-only">Open main menu</span>
                            <svg className={`${isMenuOpen ? 'hidden' : 'block'} h-6 w-6`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                            <svg className={`${isMenuOpen ? 'block' : 'hidden'} h-6 w-6`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            <div className={`${isMenuOpen ? 'block' : 'hidden'} md:hidden`}>
                <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                    <Link href="/kanji" className="text-gray-900 hover:text-red-600 block px-3 py-2 rounded-md text-base font-medium" onClick={handleNavClick}>
                        Kanji
                    </Link>
                    <Link href="/bunpo" className="text-gray-900 hover:text-red-600 block px-3 py-2 rounded-md text-base font-medium" onClick={handleNavClick}>
                        Tata Bahasa
                    </Link>
                    <Link href="/kotoba" className="text-gray-900 hover:text-red-600 block px-3 py-2 rounded-md text-base font-medium" onClick={handleNavClick}>
                        Kotoba
                    </Link>
                    <Link href="/practice" className="text-gray-900 hover:text-red-600 block px-3 py-2 rounded-md text-base font-medium" onClick={handleNavClick}>
                        Latihan
                    </Link>
                </div>
                <div className="pt-4 pb-4 border-t border-gray-200">
                    {!loading && (
                        user ? (
                            <div className="px-5 space-y-3">
                                <div className="flex items-center">
                                    <div className="ml-3">
                                        <div className="text-base font-medium leading-none text-gray-800">{user.username}</div>
                                        <div className="text-sm font-medium leading-none text-gray-500">{user.email}</div>
                                    </div>
                                </div>
                                {(user.email === 'imronm1309@gmail.com' || user.is_staff) && (
                                    <Link href="/admin" className="block px-3 py-2 rounded-md text-base font-medium text-red-600 hover:text-red-800 hover:bg-gray-50" onClick={handleNavClick}>
                                        Admin Dashboard
                                    </Link>
                                )}
                                <button
                                    onClick={() => {
                                        if (isPracticing && !confirm('Lagi latihan, yakin mau keluar?')) return;
                                        logout();
                                        setIsMenuOpen(false);
                                    }}
                                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                                >
                                    Keluar
                                </button>
                            </div>
                        ) : (
                            <div className="px-5 space-y-3">
                                <Link href="/login" className="block px-3 py-2 rounded-md text-base font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50" onClick={handleNavClick}>
                                    Masuk
                                </Link>
                                <Link href="/register" className="block px-3 py-2 rounded-md text-base font-medium text-red-600 hover:text-red-500 hover:bg-gray-50" onClick={handleNavClick}>
                                    Daftar
                                </Link>
                            </div>
                        )
                    )}
                </div>
            </div>
        </nav>
    );
}
