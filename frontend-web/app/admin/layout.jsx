'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function AdminLayout({ children }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push('/login');
            } else if (user.email !== 'imronm1309@gmail.com') {
                router.push('/');
            } else {
                setIsAuthorized(true);
            }
        }
    }, [user, loading, router]);

    if (loading || !isAuthorized) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <div className="w-64 bg-white shadow-md flex-shrink-0 relative z-20">
                <div className="p-6 border-b border-gray-200">
                    <h1 className="text-2xl font-bold text-red-600">JBook Admin</h1>
                    <p className="text-sm text-gray-500 mt-1">v1.0.0</p>
                </div>
                <nav className="mt-6 px-4 space-y-2">
                    <Link href="/admin" className="block px-4 py-2 rounded-md hover:bg-red-50 text-gray-700 hover:text-red-700 font-medium">
                        Dashboard
                    </Link>
                    <Link href="/admin/blog" className="block px-4 py-2 rounded-md hover:bg-red-50 text-gray-700 hover:text-red-700 font-medium">
                        Blog
                    </Link>
                    <Link href="/admin/kanji" className="block px-4 py-2 rounded-md hover:bg-red-50 text-gray-700 hover:text-red-700 font-medium">
                        Kanji
                    </Link>
                    <Link href="/admin/bunpo" className="block px-4 py-2 rounded-md hover:bg-red-50 text-gray-700 hover:text-red-700 font-medium">
                        Bunpo (Grammar)
                    </Link>
                    <div className="border-t border-gray-200 my-4"></div>
                    <Link href="/" className="block px-4 py-2 rounded-md hover:bg-gray-100 text-gray-600 font-medium">
                        &larr; Back to Site
                    </Link>
                </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto p-8 relative z-10">
                {children}
            </div>
        </div>
    );
}
