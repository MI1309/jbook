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
        <div className="container mx-auto px-4 py-8">
            {!isPlaying && (
                <h1 className={`text-4xl font-extrabold mb-8 inline-block pb-2 border-b-4 border-red-500 transition-colors ${textColor}`}>
                    Latihan <span className="text-red-600 dark:text-red-500">& Analitik</span>
                </h1>
            )}

            {/* Configuration Section */}
            <div className="mb-12">
                {isPlaying ? <PracticeRunner /> : (
                    <div className="space-y-12">
                        <PracticeConfig />

                        {/* Mistakes Review Section */}
                        {analytics?.wrong_stats?.length > 0 && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h2 className={`text-2xl font-black transition-colors ${textColor}`}>Butuh Review?</h2>
                                        <p className={`text-xs font-bold uppercase tracking-widest transition-colors ${!mounted ? 'text-gray-400' : (theme === 'dark' ? 'text-gray-500' : 'text-gray-400')}`}>
                                            Materi yang paling sering salah kamu jawab
                                        </p>
                                    </div>
                                    <div className="h-0.5 flex-grow mx-6 bg-gradient-to-r from-red-600/20 to-transparent rounded-full hidden md:block"></div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {analytics.wrong_stats.map((mistake, idx) => (
                                        <div 
                                            key={idx}
                                            onClick={() => handleOpenMistake(mistake)}
                                            className={`group p-5 rounded-3xl border-2 transition-all cursor-pointer hover:border-red-500 hover:scale-[1.02] flex items-center justify-between ${!mounted ? 'bg-white border-gray-100' : (theme === 'dark' ? 'bg-[#0a0a0a] border-red-950/20' : 'bg-white border-gray-100')}`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-red-600 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-red-500/20 group-hover:rotate-6 transition-transform">
                                                    {mistake.character?.length > 1 ? mistake.character[0] : (mistake.character || '？')}
                                                </div>
                                                <div>
                                                    <h3 className={`font-black text-lg transition-colors ${textColor}`}>{mistake.character}</h3>
                                                    <span className={`text-[9px] font-black uppercase tracking-widest transition-colors ${!mounted ? 'text-gray-400' : (theme === 'dark' ? 'text-gray-600' : 'text-gray-400')}`}>
                                                        {mistake.type === 'vocab' ? 'Kotoba' : mistake.type === 'grammar' ? 'Bunpo' : 'Kanji'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-red-600 font-black text-xl leading-none">{mistake.count}x</div>
                                                <div className="text-[9px] font-black uppercase tracking-tighter text-gray-400">salah</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
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
    );
}

export default function PracticePage() {
    return (
        <Suspense fallback={<div className="container mx-auto px-4 py-32 text-center animate-pulse tracking-widest text-gray-400 font-bold uppercase">Memuat Latihan...</div>}>
            <PracticePageContent />
        </Suspense>
    );
}
