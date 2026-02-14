'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
    const { user, logout, loading } = useAuth();

    return (
        <nav className="bg-white shadow-sm border-b border-gray-200">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center">
                        <Link href="/" className="text-xl font-bold text-red-600">
                            JBook
                        </Link>
                        <div className="hidden md:ml-10 md:flex md:space-x-8">
                            <Link href="/kanji" className="text-gray-900 hover:text-red-600 px-3 py-2 rounded-md text-sm font-medium">
                                Kanji
                            </Link>
                            <Link href="/bunpo" className="text-gray-900 hover:text-red-600 px-3 py-2 rounded-md text-sm font-medium">
                                Tata Bahasa
                            </Link>
                            <Link href="/practice" className="text-gray-900 hover:text-red-600 px-3 py-2 rounded-md text-sm font-medium">
                                Latihan
                            </Link>
                        </div>
                    </div>
                    <div className="hidden md:flex items-center space-x-4">
                        {!loading && (
                            user ? (
                                <div className="flex items-center space-x-4">
                                    {(user.email === 'imronm1309@gmail.com' || user.is_staff) && (
                                        <Link href="/admin" className="text-red-600 hover:text-red-800 font-bold px-3 py-2 rounded-md text-sm">
                                            Admin Dashboard
                                        </Link>
                                    )}
                                    <span className="text-sm font-medium text-gray-700">Hi, {user.username}</span>
                                    <button
                                        onClick={logout}
                                        className="text-gray-900 hover:text-red-600 px-3 py-2 rounded-md text-sm font-medium"
                                    >
                                        Keluar
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <Link href="/login" className="text-gray-900 hover:text-red-600 px-3 py-2 rounded-md text-sm font-medium">
                                        Masuk
                                    </Link>
                                    <Link href="/register" className="bg-red-600 text-white hover:bg-red-700 px-4 py-2 rounded-md text-sm font-medium">
                                        Daftar
                                    </Link>
                                </>
                            )
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
