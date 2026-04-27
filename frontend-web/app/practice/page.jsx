'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { getUserAnalytics, resolveContentId } from '@/lib/api';
import { getGuestAnalytics } from '@/lib/local-analytics';
import PracticeConfig from '@/components/PracticeConfig';
import PracticeRunner from '@/components/PracticeRunner';
import KanjiDetailModal from '@/components/KanjiDetailModal';
import KotobaDetailModal from '@/components/KotobaDetailModal';
import BunpoDetailModal from '@/components/BunpoDetailModal';

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
                alert(`Detail untuk "${mistake.character}" tidak ditemukan. Jika offline, pastikan kamu sudah mengunduh materi.`);
            }
        } catch (err) {
            console.error('[jbook] handleOpenMistake error:', err);
        }
    };

    return (
        <div className="relative min-h-screen">
            {/* Decorative Background Glows */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-[-1]">
                <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-red-400/20 dark:bg-red-900/20 blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-pulse duration-10000" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-rose-400/20 dark:bg-rose-900/20 blur-[150px] mix-blend-multiply dark:mix-blend-screen animate-pulse duration-7000 delay-1000" />
            </div>

            <div className="container mx-auto px-4 py-8 relative z-10">
                {!isPlaying && (
                    <div className="mb-10">
                        <h1 className={`text-5xl md:text-6xl font-black mb-2 tracking-tight transition-colors ${textColor}`}>
                            Latihan <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-rose-500 drop-shadow-sm">& Analitik</span>
                        </h1>
                        <div className="h-1.5 w-24 bg-gradient-to-r from-red-600 to-rose-500 rounded-full mt-4"></div>
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
