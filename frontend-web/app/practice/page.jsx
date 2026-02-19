'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getUserAnalytics } from '@/lib/api';
import { getGuestAnalytics } from '@/lib/local-analytics';
import PracticeConfig from '@/components/PracticeConfig';
import { useAuth } from '@/context/AuthContext';

export default function PracticePage() {
    const { user, loading: authLoading } = useAuth();
    const [analytics, setAnalytics] = useState({
        total_attempts: 0,
        accuracy: 0,
        wrong_stats: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (authLoading) return;

        async function fetchAnalytics() {
            try {
                if (user) {
                    const data = await getUserAnalytics();
                    setAnalytics(data);
                } else {
                    const data = getGuestAnalytics();
                    setAnalytics(data);
                }
            } catch (error) {
                console.error("Failed to load analytics", error);
            } finally {
                setLoading(false);
            }
        }

        fetchAnalytics();
    }, [user, authLoading]);

    if (loading || authLoading) {
        return (
            <div className="container mx-auto px-4 py-8 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-600"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-4xl font-extrabold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-red-900 border-b-4 border-red-500 inline-block pb-2">
                Latihan & Analitik
            </h1>

            {/* Configuration Section */}
            <div className="mb-12">
                <PracticeConfig />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* Stats Card */}
                <div className="bg-white shadow-lg rounded-2xl p-6 border border-gray-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 text-8xl grayscale group-hover:grayscale-0 transition-all duration-500 pointer-events-none">
                        📊
                    </div>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                            <span className="text-red-500">📈</span> Statistik Belajar
                            {!user && <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">Guest</span>}
                        </h2>
                    </div>
                    <div className="grid grid-cols-2 gap-6 text-center relative z-10">
                        <div className="p-6 bg-red-50 rounded-2xl border border-red-100">
                            <div className="text-4xl font-black text-red-600 mb-2">{analytics.total_attempts}</div>
                            <div className="text-sm font-bold text-red-800 uppercase tracking-wide">Total Percobaan</div>
                        </div>
                        <div className="p-6 bg-green-50 rounded-2xl border border-green-100">
                            <div className="text-4xl font-black text-green-600 mb-2">{analytics.accuracy}%</div>
                            <div className="text-sm font-bold text-green-800 uppercase tracking-wide">Akurasi</div>
                        </div>
                    </div>
                </div>

                {/* Wrong Guesses Card */}
                <div className="bg-white shadow-lg rounded-2xl p-6 border border-gray-100 relative overflow-hidden">
                    <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
                        <span className="text-red-500">🎯</span> Perlu Dilatih Lagi
                    </h2>
                    {analytics.wrong_stats.length > 0 ? (
                        <ul className="space-y-3">
                            {analytics.wrong_stats.map((stat, index) => (
                                <li key={index} className="flex items-center justify-between p-3 hover:bg-red-50 rounded-xl border border-gray-100 hover:border-red-200 transition-all cursor-default">
                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                        <span className={`text-xl font-medium text-gray-800 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100 ${stat.character.length === 1 ? 'w-12 h-12 flex justify-center items-center text-3xl font-serif' : ''}`}>
                                            {stat.character}
                                        </span>
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                                            <span className="text-sm font-bold text-gray-500 uppercase tracking-wider text-xs">{stat.type === 'grammar' ? 'Bunpo' : stat.type === 'vocab' ? 'Kotoba' : 'Kanji'}</span>
                                            <span className="text-xs text-red-600 font-bold bg-red-100 px-2 py-0.5 rounded-full whitespace-nowrap">{stat.count}x Salah</span>
                                        </div>
                                    </div>
                                    <Link href={stat.type === 'grammar' ? `/bunpo?search=${stat.character}` : stat.type === 'vocab' ? `/kotoba?search=${stat.character}` : `/kanji?search=${stat.character}`} className="text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 ml-2 flex-shrink-0">
                                        Pelajari <span>→</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-center text-gray-400">
                            <div className="text-6xl mb-4 opacity-20">✨</div>
                            <p className="italic">Belum ada data kesalahan. Hebat!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

