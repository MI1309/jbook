'use client';

import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { API_URL } from '@/lib/api';
import { BookOpen, Gamepad2, LockKeyhole, RefreshCw, Trophy } from 'lucide-react';

function Metric({ icon: Icon, label, value, detail, color }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
                    <p className="mt-2 text-3xl font-semibold tabular-nums text-slate-950 dark:text-white">{value}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{detail}</p>
                </div>
                <span className={`rounded-lg p-2.5 ${color}`}>
                    <Icon aria-hidden="true" className="h-5 w-5" />
                </span>
            </div>
        </div>
    );
}

export default function Dashboard() {
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
                    throw new Error('Silakan masuk untuk melihat progres belajar personal.');
                }

                const response = await fetch(`${API_URL}/learning/dashboard/stats`, {
                    headers: { Authorization: `Bearer ${token}` },
                    cache: 'no-store',
                });
                if (!response.ok) {
                    if (response.status === 401) throw new Error('Sesi masuk berakhir. Silakan masuk kembali.');
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
    }, [reloadKey]);

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
                        <RefreshCw aria-hidden="true" className="h-4 w-4" />
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
                            <div className="flex min-w-44 items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3">
                                <Trophy aria-hidden="true" className="h-6 w-6 text-amber-300" />
                                <div>
                                    <p className="text-xs text-slate-300">Total Poin TTS</p>
                                    <p className="text-2xl font-semibold tabular-nums" aria-live="polite">{loading ? '—' : (stats?.total_tts_points ?? 0).toLocaleString('id-ID')}</p>
                                </div>
                            </div>
                        </div>
                    </header>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Metric
                            icon={BookOpen}
                            label="Koleksi Kosakata"
                            value={loading ? '—' : (stats?.total_saved ?? 0).toLocaleString('id-ID')}
                            detail="kata tersimpan untuk diulang"
                            color="bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300"
                        />
                        <Metric
                            icon={Gamepad2}
                            label="Sesi Game TTS"
                            value={loading ? '—' : (stats?.tts_games_played ?? 0).toLocaleString('id-ID')}
                            detail="sesi permainan tercatat"
                            color="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                        />
                    </div>

                    <section aria-labelledby="roadmap-heading" className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-950">
                        <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">Peta perjalanan</p>
                                <h3 id="roadmap-heading" className="mt-1 text-lg font-semibold text-slate-950 dark:text-white">Roadmap Belajar</h3>
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Kana sampai JLPT N1</p>
                        </div>

                        {loading ? (
                            <div className="space-y-4" aria-label="Memuat roadmap">
                                {[0, 1, 2].map((item) => <div key={item} className="h-14 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-900" />)}
                            </div>
                        ) : (
                            <ol className="divide-y divide-slate-100 dark:divide-slate-800">
                                {(stats?.roadmap || []).map((stage) => {
                                    const progress = Math.min(100, Math.max(0, Number(stage.completion_percentage) || 0));
                                    return (
                                        <li key={stage.stage_code} className="py-4 first:pt-0 last:pb-0">
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex min-w-0 items-center gap-3">
                                                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${stage.is_available ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-400'}`}>
                                                        {stage.is_available ? stage.stage_code.replace('hiragana', 'あ').replace('katakana', 'ア').toUpperCase() : <LockKeyhole aria-hidden="true" className="h-4 w-4" />}
                                                    </span>
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{stage.title}</p>
                                                        {!stage.is_available && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Coming Soon</p>}
                                                    </div>
                                                </div>
                                                {stage.is_available && <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-600 dark:text-slate-300">{progress}%</span>}
                                            </div>
                                            <div className={`mt-3 h-2 overflow-hidden rounded-full ${stage.is_available ? 'bg-slate-100 dark:bg-slate-800' : 'bg-slate-50 dark:bg-slate-900/60'}`}>
                                                <div
                                                    className={`h-full rounded-full transition-[width] duration-700 ${stage.is_available ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                                                    style={{ width: `${stage.is_available ? progress : 0}%` }}
                                                />
                                            </div>
                                        </li>
                                    );
                                })}
                                {!stats?.roadmap?.length && <li className="py-4 text-sm text-slate-500">Tahapan belajar belum tersedia.</li>}
                            </ol>
                        )}
                    </section>
                </>
            )}
        </section>
    );
}