'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { getUserAnalytics, resolveContentId } from '@/lib/api';
import { getGuestAnalytics } from '@/lib/local-analytics';
import PracticeConfig from '@/components/practice/PracticeConfig';
import PracticeRunner from '@/components/practice/PracticeRunner';
import KanjiDetailModal from '@/components/kanji/KanjiDetailModal';
import KotobaDetailModal from '@/components/kotoba/KotobaDetailModal';
import BunpoDetailModal from '@/components/bunpo/BunpoDetailModal';
import { toast } from 'react-toastify';

function PracticePageContent() {
    const { theme, mounted } = useTheme();
    const { user } = useAuth();
    const searchParams = useSearchParams();
    const isPlaying = searchParams.get('play') === 'true';

    const [analytics, setAnalytics] = useState(null);
    const [detailView, setDetailView] = useState(null); // { id, type }
    const [isLoadingStats, setIsLoadingStats] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                if (user) {
                    const data = await getUserAnalytics();
                    setAnalytics(data);
                } else {
                    const data = getGuestAnalytics();
                    setAnalytics(data);
                }
            } catch (err) {
                console.error("Failed to fetch stats for practice dashboard", err);
            } finally {
                setIsLoadingStats(false);
            }
        }
        if (!isPlaying) fetchStats();
    }, [user, isPlaying]);

    const textColor = !mounted ? 'text-black' : (theme === 'dark' ? 'text-white' : 'text-black');

    // Resolve character → ID (online: from API, offline: from IndexedDB)
    const handleOpenMistake = async (mistake) => {
        try {
            const id = await resolveContentId(mistake.type, mistake.character);
            if (id) {
                setDetailView({ id, type: mistake.type });
            } else {
                toast.error(`Detail untuk "${mistake.character}" tidak ditemukan.`, {
                    theme: theme === 'dark' ? 'dark' : 'colored'
                });
            }
        } catch (err) {
            console.error('[jbook] handleOpenMistake error:', err);
        }
    };

    return (
        <div className="relative min-h-screen">
            {/* Decorative Background Glows */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-[-1]">
                <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-accent-blue/5 dark:bg-accent-blue/10 blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-pulse duration-10000" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-accent-green/5 dark:bg-accent-green/10 blur-[150px] mix-blend-multiply dark:mix-blend-screen animate-pulse duration-7000 delay-1000" />
            </div>

            <div className="container mx-auto px-4 py-8 relative z-10">
                {!isPlaying && (
                    <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[var(--border-color)] pb-6">
                        <div>
                            <h1 className={`text-4xl md:text-6xl font-japanese font-black mb-2 tracking-tight transition-colors ${textColor}`}>
                                練習 <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-blue to-accent-green drop-shadow-sm">Latihan & Analitik</span>
                            </h1>
                            <div className="h-1.5 w-24 bg-gradient-to-r from-accent-blue to-accent-green rounded-full mt-4"></div>
                        </div>
                        
                        {/* Banner Buttons */}
                        <div className="flex gap-4 flex-col xl:flex-row">
                            {/* Mensetsu Banner Button */}
                            <div className="flex-shrink-0 bg-[var(--card-bg)] border border-[var(--border-color)] p-4 rounded-2xl flex items-center gap-4 shadow-sm hover:border-accent-green transition-all duration-300">
                                <div className="w-10 h-10 rounded-xl bg-accent-green/10 text-accent-green flex items-center justify-center flex-shrink-0">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-foreground">Praktik Mensetsu</h4>
                                    <p className="text-[10px] text-gray-500 font-light mb-1.5">Latih simulasi interview mandiri</p>
                                    <Link href="/mensetsu" className="inline-flex items-center gap-1 text-[10px] font-bold text-accent-green hover:underline">
                                        Mulai Simulasi →
                                    </Link>
                                </div>
                            </div>
                            
                            {/* Latihan Kustom Button */}
                            <div className="flex-shrink-0 bg-[var(--card-bg)] border border-[var(--border-color)] p-4 rounded-2xl flex items-center gap-4 shadow-sm hover:border-accent-blue transition-all duration-300">
                                <div className="w-10 h-10 rounded-xl bg-accent-blue/10 text-accent-blue flex items-center justify-center flex-shrink-0">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-foreground">Latihan Tambahan</h4>
                                    <p className="text-[10px] text-gray-500 font-light mb-1.5">Latihan soal khusus dari admin</p>
                                    <Link href="/practice/custom" className="inline-flex items-center gap-1 text-[10px] font-bold text-accent-blue hover:underline">
                                        Lihat Daftar Modul →
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            {/* Configuration Section */}
            <div className="mb-12">
                {isPlaying ? <PracticeRunner /> : (
                    <div className="space-y-12">
                        <PracticeConfig />
                    </div>
                )}
            </div>

            {/* Detail View Overlay */}
            {detailView && (
                <div className="fixed inset-0 z-[110] animate-in fade-in zoom-in duration-300">
                    {detailView.type === 'kanji' && (
                        <KanjiDetailModal 
                            id={detailView.id} 
                            onClose={() => setDetailView(null)} 
                        />
                    )}
                    {(detailView.type === 'vocab' || detailView.type === 'kotoba') && (
                        <KotobaDetailModal 
                            id={detailView.id} 
                            onClose={() => setDetailView(null)} 
                        />
                    )}
                    {detailView.type === 'grammar' && (
                        <BunpoDetailModal 
                            id={detailView.id} 
                            onClose={() => setDetailView(null)} 
                        />
                    )}
                </div>
            )}
            </div>
        </div>
    );
}

export default function PracticePage() {
    return (
        <Suspense fallback={<div className="container mx-auto px-4 py-32 text-center animate-pulse tracking-widest text-gray-400 font-bold uppercase">Memuat Latihan...</div>}>
            <PracticePageContent />
        </Suspense>
    );
}
