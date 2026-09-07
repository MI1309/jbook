'use client';

import { useState, useEffect, Suspense } from 'react';
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

            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-4 sm:py-8 relative z-10">
                {!isPlaying && (
                    <div className="mb-8 sm:mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[var(--border-color)] pb-6 text-center md:text-left">
                        <div>
                            <h1 className={`text-3xl sm:text-4xl md:text-6xl font-japanese font-black mb-2 tracking-tight transition-colors ${textColor}`}>
                                練習 <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-blue to-accent-green drop-shadow-sm">Latihan & Analitik</span>
                            </h1>
                            <div className="h-1.5 w-24 bg-gradient-to-r from-accent-blue to-accent-green rounded-full mt-3 sm:mt-4 mx-auto md:mx-0"></div>
                        </div>
                    </div>
                )}

            {/* Configuration Section */}
            <div className="mb-8 sm:mb-12">
                {isPlaying ? <PracticeRunner /> : (
                    <div className="space-y-8 sm:space-y-12">
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
