'use client';

import React, { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/lib/api';

// --- INLINE SVG COMPONENTS (HARDCODED) ---
const BaseIcon = ({ children, className = "h-5 w-5", ...props }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
        {...props}
    >
        {children}
    </svg>
);

const IconBook = (props) => (
    <BaseIcon {...props}>
        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
    </BaseIcon>
);

const IconGamepad = (props) => (
    <BaseIcon {...props}>
        <line x1="6" x2="10" y1="12" y2="12" />
        <line x1="8" x2="8" y1="10" y2="14" />
        <rect width="20" height="12" x="2" y="6" rx="2" />
        <circle cx="15.5" cy="10.5" r=".5" fill="currentColor" />
        <circle cx="17.5" cy="12.5" r=".5" fill="currentColor" />
    </BaseIcon>
);

const IconFlame = (props) => (
    <BaseIcon {...props}>
        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </BaseIcon>
);

const IconCalendar = (props) => (
    <BaseIcon {...props}>
        <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
        <line x1="16" x2="16" y1="2" y2="6" />
        <line x1="8" x2="8" y1="2" y2="6" />
        <line x1="3" x2="21" y1="10" y2="10" />
    </BaseIcon>
);

const IconTarget = (props) => (
    <BaseIcon {...props}>
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
    </BaseIcon>
);

const IconClock = (props) => (
    <BaseIcon {...props}>
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
    </BaseIcon>
);

const IconTrophy = (props) => (
    <BaseIcon {...props}>
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
        <path d="M4 22h16" />
        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
        <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </BaseIcon>
);

const IconRefresh = (props) => (
    <BaseIcon {...props}>
        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
        <path d="M21 3v5h-5" />
        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
        <path d="M3 21v-5h5" />
    </BaseIcon>
);

const IconLock = (props) => (
    <BaseIcon {...props}>
        <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </BaseIcon>
);

// --- COMPONENTS ---

function Metric({ icon: Icon, label, value, detail, color, loading }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
                    <p className="mt-2 min-h-9 text-3xl font-semibold tabular-nums text-slate-950 dark:text-white">
                        {loading ? <span aria-hidden="true" className="block h-8 w-20 animate-pulse rounded bg-slate-200 dark:bg-slate-800" /> : value}
                    </p>
                    <p className="mt-1 min-h-4 text-xs text-slate-500 dark:text-slate-400">
                        {loading ? <span aria-hidden="true" className="block h-3 w-28 animate-pulse rounded bg-slate-100 dark:bg-slate-900" /> : detail}
                    </p>
                </div>
                <span className={`rounded-lg p-2.5 ${color}`}>
                    <Icon aria-hidden="true" className="h-5 w-5" />
                </span>
            </div>
        </div>
    );
}

export default function Dashboard() {
    const router = useRouter();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        let isCurrent = true;

        async function fetchDashboard() {
            setLoading(true);
            setError('');

            try {
                const token = localStorage.getItem('access_token') || Cookies.get('access_token');
                if (!token) {
                    router.replace('/login');
                    return;
                }

                const response = await fetch(`${API_URL}/learning/dashboard/stats`, {
                    headers: { Authorization: `Bearer ${token}` },
                    cache: 'no-store',
                });
                if (!response.ok) {
                    if (response.status === 401) {
                        router.replace('/login');
                        return;
                    }
                    throw new Error('Dashboard belum dapat dimuat. Coba lagi sebentar.');
                }

                const data = await response.json();
                if (isCurrent) setStats(data);
            } catch (fetchError) {
                if (isCurrent) setError(fetchError.message || 'Terjadi kesalahan saat memuat dashboard.');
            } finally {
                if (isCurrent) setLoading(false);
            }
        }

        fetchDashboard();
        return () => { isCurrent = false; };
    }, [reloadKey, router]);

    // Filtering logic for Roadmap
    const roadmap = Array.isArray(stats?.roadmap) ? stats.roadmap : [];
    let activeIndex = roadmap.findIndex(s => s && s.is_available && (Number(s.completion_percentage) || 0) < 100);

    if (activeIndex === -1 && roadmap.length > 0) {
        const availableIndices = roadmap.map((s, i) => s && s.is_available ? i : -1).filter(i => i !== -1);
        if (availableIndices.length > 0) {
            activeIndex = availableIndices[availableIndices.length - 1];
        } else {
            activeIndex = 0;
        }
    }

    const displayRoadmap = activeIndex !== -1 ? roadmap.slice(activeIndex, activeIndex + 3) : [];

    return (
        <section aria-labelledby="learning-dashboard-title" className="mb-10 space-y-6">
            {error ? (
                <div role="alert" className="flex flex-col gap-4 rounded-xl border border-rose-200 bg-rose-50 p-5 text-rose-900 sm:flex-row sm:items-center sm:justify-between dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
                    <p className="text-sm">{error}</p>
                    <button
                        type="button"
                        onClick={() => setReloadKey((key) => key + 1)}
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-current px-3 text-sm font-semibold hover:bg-white/60 dark:hover:bg-black/20"
                    >
                        <IconRefresh aria-hidden="true" className="h-4 w-4" />
                        Coba lagi
                    </button>
                </div>
            ) : (
                <>
                    <header className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-950 px-6 py-7 text-white sm:px-8">
                        <div className="absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-emerald-500/15 to-transparent" />
                        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300">Ruang belajar personal</p>
                                <h2 id="learning-dashboard-title" className="mt-2 text-2xl font-semibold sm:text-3xl">
                                    {loading ? 'Memuat progres...' : `Selamat belajar, ${stats?.username || 'Learner'}`}
                                </h2>
                                <p className="mt-2 max-w-xl text-sm text-slate-300">Satu langkah kecil hari ini membawa kamu lebih dekat ke target bahasa Jepang.</p>
                            </div>
                            <div className="flex min-w-64 items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3">
                                <IconTrophy aria-hidden="true" className="h-6 w-6 text-amber-300" />
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs text-slate-300">Total Poin TTS</p>
                                    <p className="text-2xl font-semibold tabular-nums" aria-live="polite">{loading ? '—' : (stats?.total_tts_points ?? 0).toLocaleString('id-ID')}</p>
                                </div>
                                <div className="border-l border-white/15 pl-3">
                                    <p className="text-xs text-slate-300">Akurasi kuis</p>
                                    <p className="text-lg font-semibold tabular-nums" aria-live="polite">{loading ? '—' : `${(stats?.accuracy_rate ?? 0).toLocaleString('id-ID')}%`}</p>
                                </div>
                            </div>
                        </div>
                    </header>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        <Metric
                            icon={IconBook}
                            label="Koleksi Kosakata"
                            value={(stats?.total_saved ?? 0).toLocaleString('id-ID')}
                            detail="kata tersimpan untuk diulang"
                            color="bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300"
                            loading={loading}
                        />
                        <Metric
                            icon={IconGamepad}
                            label="Sesi Game TTS"
                            value={(stats?.tts_games_played ?? 0).toLocaleString('id-ID')}
                            detail="sesi permainan tercatat"
                            color="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                            loading={loading}
                        />
                        <Metric
                            icon={IconFlame}
                            label="Streak Belajar"
                            value={`${(stats?.current_streak ?? 0).toLocaleString('id-ID')} hari`}
                            detail={`Rekor ${ (stats?.longest_streak ?? 0).toLocaleString('id-ID') } hari`}
                            color="bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300"
                            loading={loading}
                        />
                        <Metric
                            icon={IconCalendar}
                            label="Perlu Diulang"
                            value={(stats?.due_today ?? 0).toLocaleString('id-ID')}
                            detail="kosakata jatuh tempo atau terlewat"
                            color="bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                            loading={loading}
                        />
                        <Metric
                            icon={IconTarget}
                            label="Retensi Kosakata"
                            value={`${(stats?.retention_rate ?? 0).toLocaleString('id-ID')}%`}
                            detail="vocab direview yang pernah naik level"
                            color="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                            loading={loading}
                        />
                        <Metric
                            icon={IconClock}
                            label="Waktu Belajar"
                            value={`${Math.round((stats?.total_time_spent ?? 0) / 60).toLocaleString('id-ID')} mnt`}
                            detail="durasi sesi belajar selesai"
                            color="bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                            loading={loading}
                        />
                    </div>

                    <section aria-labelledby="roadmap-heading" className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-950">
                        <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">Peta perjalanan</p>
                                <h3 id="roadmap-heading" className="mt-1 text-lg font-semibold text-slate-950 dark:text-white">Roadmap Belajar</h3>
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                {stats?.next_stage ? `Selanjutnya: ${stats.next_stage.title}` : 'Semua tahap tersedia telah selesai'}
                            </p>
                        </div>

                        {loading ? (
                            <div className="space-y-4" aria-label="Memuat roadmap">
                                {[0, 1, 2].map((item) => <div key={item} className="h-14 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-900" />)}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {displayRoadmap.map((stage, index) => {
                                    const isActive = index === 0;
                                    const progress = Math.min(100, Math.max(0, Number(stage.completion_percentage) || 0));
                                    
                                    return (
                                        <div 
                                            key={stage.stage_code} 
                                            className={`rounded-xl border p-4 transition-all duration-300 ${
                                                isActive 
                                                    ? 'border-emerald-200 bg-emerald-50/30 ring-1 ring-emerald-100 dark:border-emerald-900/30 dark:bg-emerald-950/20 dark:ring-emerald-900/20' 
                                                    : 'border-slate-100 bg-white opacity-60 grayscale-[0.5] dark:border-slate-800 dark:bg-slate-950'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex min-w-0 items-center gap-3">
                                                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                                                        stage.is_available 
                                                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                                                            : 'bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-400'
                                                    }`}>
                                                        {stage.is_available 
                                                            ? (stage.stage_code?.replace('hiragana', 'あ').replace('katakana', 'ア').toUpperCase() || '?') 
                                                            : <IconLock className="h-4 w-4" />}
                                                    </span>
                                                    <div className="min-w-0">
                                                        <p className={`truncate font-semibold text-slate-900 dark:text-slate-100 ${isActive ? 'text-base' : 'text-sm'}`}>
                                                            {stage.title}
                                                            {isActive && <span className="ml-2 inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">Tahap Saat Ini</span>}
                                                        </p>
                                                        {!stage.is_available && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Coming Soon</p>}
                                                    </div>
                                                </div>
                                                {stage.is_available && (
                                                    <div className="text-right">
                                                        <span className={`block font-bold tabular-nums text-slate-900 dark:text-white ${isActive ? 'text-lg' : 'text-sm'}`}>
                                                            {progress}%
                                                        </span>
                                                        <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">Selesai</span>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <div className={`mt-4 h-2.5 overflow-hidden rounded-full ${stage.is_available ? 'bg-slate-100 dark:bg-slate-800' : 'bg-slate-50 dark:bg-slate-900/60'}`}>
                                                <div
                                                    className={`h-full rounded-full transition-[width] duration-1000 ease-out ${
                                                        stage.is_available ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-slate-300 dark:bg-slate-700'
                                                    }`}
                                                    style={{ width: `${stage.is_available ? progress : 0}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                                {!roadmap.length && (
                                    <div className="rounded-lg border border-dashed border-slate-200 py-8 text-center dark:border-slate-800">
                                        <p className="text-sm text-slate-500 dark:text-slate-400">Tahapan belajar belum tersedia.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </section>
                </>
            )}
        </section>
    );
}
