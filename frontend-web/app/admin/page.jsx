'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Cookies from 'js-cookie';
import { API_URL } from '@/lib/api';
import { appToast as toast } from '@/components/common/AppMessage';
import StatCard from '@/components/admin/StatCard';
import { AdminEmptyState, AdminErrorState } from '@/components/admin/AdminFeedback';
import { AudioLines, BookOpen, Languages, Mic2, Search, Users, ArrowUpRight, Database } from 'lucide-react';

const metrics = [
    { key: 'user_count', label: 'Total Users', icon: Users, href: null, color: 'var(--accent-blue)' },
    { key: 'vocab_count', label: 'Total Kosakata', icon: AudioLines, href: '/admin/kotoba', color: 'var(--accent-green)' },
    { key: 'kanji_count', label: 'Total Kanji', icon: Languages, href: '/admin/kanji', color: 'var(--accent-gold)' },
    { key: 'tts_session_count', label: 'Sesi TTS', icon: Mic2, href: null, color: 'var(--brand-red)' },
];

const collections = [
    { label: 'Kanji', key: 'kanji_count', href: '/admin/kanji', icon: Languages },
    { label: 'Bunpo', key: 'bunpo_count', href: '/admin/bunpo', icon: BookOpen },
    { label: 'Kotoba', key: 'vocab_count', href: '/admin/kotoba', icon: AudioLines },
];

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [statsError, setStatsError] = useState('');
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [searching, setSearching] = useState(false);

    const fetchStats = useCallback(async () => {
        setStatsError('');
        try {
            const token = Cookies.get('access_token');
            const response = await fetch(`${API_URL}/admin/stats`, { headers: { Authorization: `Bearer ${token}` } });
            if (!response.ok) throw new Error('Tidak dapat memuat statistik admin. Periksa koneksi atau akses akun, lalu coba lagi.');
            setStats(await response.json());
        } catch {
            setStatsError('Tidak dapat memuat statistik admin. Periksa koneksi atau akses akun, lalu coba lagi.');
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            return undefined;
        }
        let cancelled = false;
        const timer = setTimeout(async () => {
            setSearching(true);
            try {
                const token = Cookies.get('access_token');
                const response = await fetch(`${API_URL}/admin/search?q=${encodeURIComponent(query.trim())}`, { headers: { Authorization: `Bearer ${token}` } });
                if (!response.ok) throw new Error('Pencarian gagal');
                const data = await response.json();
                if (!cancelled) setResults(Array.isArray(data) ? data : []);
            } catch {
                if (!cancelled) toast.error('Pencarian admin gagal.');
            } finally {
                if (!cancelled) setSearching(false);
            }
        }, 350);
        return () => { cancelled = true; clearTimeout(timer); };
    }, [query]);

    const hasContent = stats && (stats.kanji_count > 0 || stats.bunpo_count > 0 || stats.vocab_count > 0);

    return (
        <div className="mx-auto max-w-[1440px] space-y-7 pb-10">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="text-sm text-[var(--foreground)]/55">Workspace / Overview</p>
                    <h1 className="mt-1 text-2xl font-semibold tracking-normal text-[var(--foreground)]">Overview</h1>
                    <p className="mt-1 text-sm text-[var(--foreground)]/60">Ringkasan aktivitas dan konten JBook.</p>
                </div>
                <Link href="/admin/bunpo" className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-red)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-red)]"><BookOpen size={16} /> Kelola Bunpo</Link>
            </div>

            <section aria-label="Statistik" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {statsError ? (
                    <div className="sm:col-span-2 xl:col-span-4"><AdminErrorState title="Statistik belum tersedia" message={statsError} onRetry={fetchStats} /></div>
                ) : metrics.map(metric => <StatCard key={metric.key} {...metric} value={stats?.[metric.key]} loading={!stats} />)}
            </section>

            <section className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)]">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-color)] p-5 sm:px-6">
                    <div><h2 className="text-base font-semibold">Ringkasan konten</h2><p className="mt-1 text-sm text-[var(--foreground)]/55">Jumlah data di setiap koleksi utama.</p></div>
                    <label className="flex h-10 w-full max-w-xs items-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--background)] px-3 text-[var(--foreground)]/50 focus-within:border-[var(--accent-blue)]"><Search size={16} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Cari kanji atau materi..." className="min-w-0 flex-1 bg-transparent text-sm text-[var(--foreground)] placeholder:text-[var(--foreground)]/45 focus-visible:outline-none" />{searching && <span className="size-4 animate-spin rounded-full border-2 border-[var(--border-color)] border-t-[var(--brand-red)]" />}</label>
                </div>

                {query.trim() ? (
                    <div className="divide-y divide-[var(--border-color)]">
                        {results.length ? results.map((item, index) => {
                            const type = item.type === 'grammar' ? 'bunpo' : item.type === 'vocab' ? 'kotoba' : item.type;
                            return <Link key={`${item.type}-${item.id}-${index}`} href={`/admin/${type}/${item.id}`} className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-[var(--background)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-red)] sm:px-6"><span className="min-w-0"><span className="block truncate text-sm font-medium">{item.title}</span><span className="mt-1 block text-xs capitalize text-[var(--foreground)]/50">{type}</span></span><ArrowUpRight size={17} className="shrink-0 text-[var(--foreground)]/45" /></Link>;
                        }) : <div className="px-6 py-10 text-center"><Search size={24} className="mx-auto text-[var(--foreground)]/35" /><p className="mt-3 text-sm font-medium">Belum ada hasil</p><p className="mt-1 text-sm text-[var(--foreground)]/55">Coba kata kunci yang berbeda.</p></div>}
                    </div>
                ) : !stats ? (
                    <div className="animate-pulse p-5 sm:p-6"><div className="h-4 w-40 rounded bg-[var(--border-color)]" />{[1, 2, 3].map(row => <div key={row} className="mt-5 h-10 rounded-lg bg-[var(--background)]" />)}</div>
                ) : hasContent ? (
                    <div className="divide-y divide-[var(--border-color)]">
                        {collections.map(({ label, key, href, icon: Icon }) => <Link key={key} href={href} className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-[var(--background)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-red)] sm:px-6"><span className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-xl bg-[var(--background)] text-[var(--foreground)]/65"><Icon size={17} /></span><span className="text-sm font-medium">{label}</span></span><span className="flex items-center gap-2 text-sm tabular-nums text-[var(--foreground)]/70">{Number(stats[key] || 0).toLocaleString('id-ID')}<ArrowUpRight size={15} /></span></Link>)}
                    </div>
                ) : (
                    <AdminEmptyState title="Belum ada data" message="Mulai isi koleksi pembelajaran JBook." href="/admin/bunpo" actionLabel="Buka Bunpo" icon={Database} />
                )}
            </section>
        </div>
    );
}