'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { getUserAnalytics } from '@/lib/api';
import Link from 'next/link';

export default function DashboardPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [analytics, setAnalytics] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    useEffect(() => {
        const fetchAnalytics = async () => {
            if (!user) return;
            try {
                const data = await getUserAnalytics();
                setAnalytics(data);
            } catch (err) {
                console.error("Error fetching analytics:", err);
                setError("Gagal memuat data latihan. Coba lagi nanti.");
            } finally {
                setIsLoading(false);
            }
        };

        if (user) {
            fetchAnalytics();
        }
    }, [user]);

    if (loading || isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 w-64 bg-gray-200 rounded"></div>
                    <div className="h-32 w-full max-w-2xl bg-gray-200 rounded"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="h-48 w-full bg-gray-200 rounded"></div>
                        <div className="h-48 w-full bg-gray-200 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (!user) {
        return null; // Will redirect
    }

    // Prepare data
    const totalExercises = analytics?.total_attempts || 0;
    const accuracy = analytics?.accuracy || 0.0;
    const topMistakes = analytics?.wrong_stats || [];

    // Categorize top mistakes simply
    const getMistakeTypeIcon = (type) => {
        switch (type) {
            case 'kanji': return '語';
            case 'vocab': return '文';
            case 'grammar': return '法';
            default: return '？';
        }
    };

    const getMistakeTypeLabel = (type) => {
        switch (type) {
            case 'kanji': return 'Kanji';
            case 'vocab': return 'Kotoba';
            case 'grammar': return 'Tata Bahasa';
            default: return 'Lainnya';
        }
    };


    return (
        <div className="container mx-auto px-4 py-8 max-w-5xl">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Latihan</h1>
            <p className="text-gray-600 mb-8">Statistik dan analisis dari latihan kamu sejauh ini.</p>

            {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-8" role="alert">
                    {error}
                </div>
            )}

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                {/* Total Attempts Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-center items-center">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4 text-xl">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-1">{totalExercises}</div>
                    <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Latihan</div>
                    <p className="text-xs text-gray-400 mt-2 text-center">soal yang sudah dikerjakan</p>
                </div>

                {/* Overall Accuracy Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-center items-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 text-xl ${accuracy >= 80 ? 'bg-green-50 text-green-600' : accuracy >= 50 ? 'bg-yellow-50 text-yellow-600' : 'bg-red-50 text-red-600'}`}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-1">{accuracy}%</div>
                    <div className={`text-lg font-bold mb-1 ${accuracy === 100 ? 'text-purple-600' : accuracy >= 90 ? 'text-green-600' : accuracy >= 80 ? 'text-blue-600' : accuracy >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {accuracy === 100 ? 'Sangat Baik' : accuracy >= 90 ? 'Baik' : accuracy >= 80 ? 'Lumayan' : accuracy >= 50 ? 'Cukup Baik' : 'Perbaiki Lagi'}
                    </div>
                    <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">Tingkat Pemahaman</div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                        <div
                            className={`h-2 rounded-full ${accuracy >= 80 ? 'bg-green-500' : accuracy >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${Math.min(Math.max(accuracy, 0), 100)}%` }}
                        ></div>
                    </div>
                </div>

                {/* Call to action Card */}
                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl shadow-sm border border-red-200 p-6 flex flex-col justify-center items-center text-center">
                    <div className="text-xl font-bold text-red-800 mb-3">Tingkatkan Terus!</div>
                    <p className="text-sm text-red-600 mb-4">Latihan konsisten adalah kunci menguasai Bahasa Jepang.</p>
                    <Link href="/practice" className="bg-red-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors shadow-sm">
                        Mulai Latihan
                    </Link>
                </div>
            </div>

            {/* Analysis Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Top Mistakes */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="border-b border-gray-100 bg-gray-50 px-6 py-4">
                        <h2 className="text-lg font-bold text-gray-900 flex items-center">
                            <span className="bg-red-100 text-red-600 p-1 rounded mr-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                            </span>
                            Sering Salah
                        </h2>
                    </div>
                    <div className="p-6">
                        {topMistakes.length > 0 ? (
                            <div className="space-y-4">
                                {topMistakes.map((mistake, idx) => (
                                    <div key={idx} className="flex items-center justify-between group">
                                        <div className="flex items-center">
                                            <div className="w-10 h-10 rounded bg-gray-100 text-gray-600 flex items-center justify-center font-bold text-xl mr-4 group-hover:bg-red-50 group-hover:text-red-600 transition-colors">
                                                {mistake.character.length > 3 ? mistake.character.substring(0, 2) + ".." : mistake.character}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-gray-900">{mistake.character}</div>
                                                <div className="text-xs text-gray-500 font-medium">
                                                    Kategori: <span className="text-gray-700">{getMistakeTypeLabel(mistake.type)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <div className="font-bold text-red-600">{mistake.count}x</div>
                                            <div className="text-xs text-gray-400">salah</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <div className="text-gray-300 mb-3 flex justify-center">
                                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path></svg>
                                </div>
                                <p className="text-gray-500 font-medium">Belum ada data kesalahan.</p>
                                <p className="text-sm text-gray-400">Bagus! Ayo mulai latihan untuk melihat analisisnya.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Tips */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="border-b border-gray-100 bg-gray-50 px-6 py-4">
                        <h2 className="text-lg font-bold text-gray-900 flex items-center">
                            <span className="bg-blue-100 text-blue-600 p-1 rounded mr-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>
                            </span>
                            Saran Belajar
                        </h2>
                    </div>
                    <div className="p-6">
                        <ul className="space-y-4">
                            {accuracy < 50 && totalExercises > 20 && (
                                <li className="flex items-start">
                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center mr-3 mt-0.5">
                                        <span className="font-bold text-xs">!</span>
                                    </div>
                                    <p className="text-gray-600 text-sm"><span className="font-bold text-gray-900">Kurangi kecepatan.</span> Sepertinya kamu banyak melakukan kesalahan. Cobalah belajar materi per bab terlebih dahulu sebelum melakukan latihan acak.</p>
                                </li>
                            )}

                            {topMistakes.some(m => m.type === 'kanji') && (
                                <li className="flex items-start">
                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-3 mt-0.5">
                                        <span className="font-bold text-xs">K</span>
                                    </div>
                                    <p className="text-gray-600 text-sm"><span className="font-bold text-gray-900">Fokus pada Kanji.</span> Kanji <span className="font-medium bg-gray-100 px-1 rounded">{topMistakes.find(m => m.type === 'kanji')?.character}</span> sering salah. Review kembali bentuk radikalnya.</p>
                                </li>
                            )}

                            {topMistakes.some(m => m.type === 'grammar') && (
                                <li className="flex items-start">
                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center mr-3 mt-0.5">
                                        <span className="font-bold text-xs">T</span>
                                    </div>
                                    <p className="text-gray-600 text-sm"><span className="font-bold text-gray-900">Review Tata Bahasa.</span> Coba perbanyak membaca contoh kalimat untuk memahami konteks tata bahasa yang sering salah.</p>
                                </li>
                            )}

                            {totalExercises < 10 && (
                                <li className="flex items-start">
                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center mr-3 mt-0.5">
                                        <span className="font-bold text-xs">✓</span>
                                    </div>
                                    <p className="text-gray-600 text-sm"><span className="font-bold text-gray-900">Awal yang baik!</span> Perbanyak latihan agar analisis pemahaman kamu semakin akurat.</p>
                                </li>
                            )}

                            {accuracy >= 80 && totalExercises > 20 && (
                                <li className="flex items-start">
                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mr-3 mt-0.5">
                                        <span className="font-bold text-xs">★</span>
                                    </div>
                                    <p className="text-gray-600 text-sm"><span className="font-bold text-gray-900">Luar biasa!</span> Tingkat pemahaman kamu sangat bagus. Saatnya mencoba materi JLPT di level yang lebih tinggi.</p>
                                </li>
                            )}
                        </ul>
                    </div>
                </div>

            </div>
        </div>
    );
}
