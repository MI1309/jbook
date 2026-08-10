'use client';

import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function DashboardLayout({ children }) {
    const { theme, mounted } = useTheme();
    const { user } = useAuth();
    const pathname = usePathname();

    const tc = (dark, light) => !mounted ? light : (theme === 'dark' ? dark : light);
    const textPrimary = tc('text-white', 'text-gray-900');
    const textSecondary = tc('text-gray-400', 'text-gray-600');
    const borderStyle = tc('border-blue-900/20', 'border-gray-100');

    const navigationItems = [
        { name: 'Ringkasan', path: '/dashboard' },
        { name: 'Akurasi Level', path: '/dashboard/levels' },
        { name: 'Analisis Dikte', path: '/dashboard/kakitori' },
        { name: 'Daftar Kesalahan', path: '/dashboard/mistakes' },
        { name: 'Riwayat', path: '/dashboard/history' },
        { name: 'Manajemen Data', path: '/dashboard/data' },
    ];

    return (
        <div className="container mx-auto px-4 py-8 max-w-5xl">
            <h1 className={`text-3xl font-black mb-2 transition-colors ${textPrimary}`}>Dashboard</h1>
            <p className={`mb-6 transition-colors ${textSecondary}`}>
                Statistik, analisis, dan manajemen data dari latihan kamu.
            </p>

            {/* Sub-navigation Tabs */}
            <div className={`flex flex-wrap gap-2 pb-4 mb-8 border-b-2 transition-colors ${borderStyle}`}>
                {navigationItems.map((item) => {
                    const isActive = pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            href={item.path}
                            className={`px-4 py-2 rounded-xl text-sm font-black transition-all ${
                                isActive
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 scale-[1.02]'
                                    : tc(
                                          'bg-black/40 text-gray-400 hover:text-white hover:bg-black/60',
                                          'bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                                      )
                            }`}
                        >
                            {item.name}
                        </Link>
                    );
                })}
            </div>

            {/* Main Content Area */}
            <div>{children}</div>
        </div>
    );
}
