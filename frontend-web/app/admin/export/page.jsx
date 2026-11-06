'use client';

import { useState, Suspense } from 'react';
import { API_URL } from '@/lib/api';
import { useSearchParams } from 'next/navigation';
import Cookies from 'js-cookie';
import Link from 'next/link';
import { appToast as toast } from '@/components/common/AppMessage';
import { Anchor, AudioLines, BookOpen, Download, Languages } from 'lucide-react';

function ExportContent() {
    const searchParams = useSearchParams();
    
    const [type, setType] = useState(searchParams.get('type') || 'kanji');
    const [level, setLevel] = useState('');
    const [search, setSearch] = useState('');
    const [chapter, setChapter] = useState('');
    const [loading, setLoading] = useState(false);

    const handleExport = async () => {
        setLoading(true);
        try {
            const token = Cookies.get('access_token');
            const queryParams = new URLSearchParams();
            if (level) queryParams.append('level', level);
            if (search) queryParams.append('search', search);
            if (chapter) queryParams.append('chapter', chapter);
            
            const endpoint = type === 'vocab' || type === 'kotoba' ? 'vocab' : (type === 'bunpo' ? 'bunpo' : type);
            const res = await fetch(`${API_URL}/admin/${endpoint}/export/csv?${queryParams.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${type}_export_${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
                toast.success('File CSV berhasil diekspor.');
            } else {
                toast.error("Gagal mengekspor data.");
            }
        } catch (error) {
            console.error("Export failed", error);
            toast.error('Ekspor gagal karena koneksi bermasalah.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`relative z-10 rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-5 transition-opacity sm:p-7 ${loading ? 'opacity-70' : ''}`}>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <div className="space-y-6">
                    <label className="ml-1 block text-sm font-semibold text-[var(--foreground)]">Kategori data</label>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { id: 'kanji', label: 'Kanji', icon: Languages },
                            { id: 'vocab', label: 'Kotoba', icon: AudioLines },
                            { id: 'bunpo', label: 'Bunpo', icon: BookOpen },
                            { id: 'particle', label: 'Partikel', icon: Anchor }
                        ].map((cat) => (
                            <button 
                                key={cat.id} 
                                type="button"
                                aria-pressed={type === cat.id}
                                onClick={() => setType(cat.id)} 
                                className={`group relative flex min-h-28 flex-col items-center justify-center gap-3 overflow-hidden rounded-xl border p-4 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-red)] ${
                                    type === cat.id 
                                        ? 'border-[var(--brand-red)]/40 bg-[var(--brand-red)]/10 text-[var(--brand-red)]'
                                        : 'border-[var(--border-color)] bg-[var(--background)] text-[var(--foreground)]/60 hover:bg-[var(--admin-hover)]'
                                }`}
                            >
                                <cat.icon size={20} aria-hidden="true" />
                                <span className="text-sm font-medium">{cat.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="group">
                        <label className="mb-2 ml-1 block text-sm font-medium text-[var(--foreground)]">Level JLPT</label>
                        <div className="relative">
                            <select 
                                className="w-full appearance-none rounded-xl border border-[var(--border-color)] bg-[var(--background)] p-3.5 text-sm text-[var(--foreground)] transition-colors hover:bg-[var(--admin-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent-blue)]"
                                value={level} 
                                onChange={(e) => setLevel(e.target.value)}
                            >
                                <option value="">Semua Level</option>
                                <option value="5">N5 - Dasar</option>
                                <option value="4">N4 - Dasar Lanjut</option>
                                <option value="3">N3 - Menengah</option>
                                <option value="2">N2 - Menengah Lanjut</option>
                                <option value="1">N1 - Mahir</option>
                            </select>
                            <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[var(--foreground)]/45">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                            </div>
                        </div>
                    </div>

                    <div className="group">
                        <label className="mb-2 ml-1 block text-sm font-medium text-[var(--foreground)]">Pencarian kata/arti</label>
                        <input 
                            type="text" 
                            placeholder="Contoh: Taberu..." 
                            className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--background)] p-3.5 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground)]/40 transition-colors hover:bg-[var(--admin-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent-blue)]"
                            value={search} 
                            onChange={(e) => setSearch(e.target.value)} 
                        />
                    </div>

                    {type === 'bunpo' && (
                        <div className="group animate-in fade-in slide-in-from-top-4 duration-500">
                            <label className="mb-2 ml-1 block text-sm font-medium text-[var(--foreground)]">Bab</label>
                            <input 
                                type="number" 
                                placeholder="Nomor Bab" 
                                className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--background)] p-3.5 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground)]/40 transition-colors hover:bg-[var(--admin-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent-blue)]"
                                value={chapter} 
                                onChange={(e) => setChapter(e.target.value)} 
                            />
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-8 flex flex-col items-center border-t border-[var(--border-color)] pt-7">
                <div className="mb-6 flex items-center gap-2 rounded-xl bg-[var(--background)] px-4 py-2 text-sm text-[var(--foreground)]/65">
                    <span className="size-2 rounded-full bg-[var(--accent-green)]" aria-hidden="true" />
                    <span>CSV standar tanpa ID</span>
                </div>
                
                <button 
                    onClick={handleExport} 
                    disabled={loading} 
                    className={`group relative inline-flex min-h-12 w-full items-center justify-center overflow-hidden rounded-xl px-5 py-3 text-sm font-semibold text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-red)] md:w-64 ${
                        loading ? 'cursor-wait bg-[var(--foreground)]/35' : 'bg-[var(--brand-red)] hover:opacity-90'
                    }`}
                >
                    {loading ? (
                        <span className="flex items-center justify-center gap-3">
                            <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Mengekspor...
                        </span>
                    ) : (
                        <span className="flex items-center justify-center gap-3">
                            <Download size={18} aria-hidden="true" />
                            Download CSV
                        </span>
                    )}
                </button>
            </div>
        </div>
    );
}

export default function ExportPage() {
    return (
        <div className="mx-auto max-w-5xl space-y-6">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                    <p className="text-sm text-[var(--foreground)]/55">Workspace / Ekspor</p>
                    <h1 className="mt-1 text-2xl font-semibold text-[var(--foreground)]">Ekspor data</h1>
                    <p className="mt-1 text-sm text-[var(--foreground)]/60">Unduh koleksi materi dalam format CSV.</p>
                </div>
            </div>

            <Suspense fallback={
                <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)]"><div className="animate-pulse space-y-4 p-6"><div className="h-5 w-40 rounded bg-[var(--border-color)]" /><div className="h-40 rounded-xl bg-[var(--background)]" /><div className="h-12 rounded-xl bg-[var(--background)]" /></div></div>
            }>
                <ExportContent />
            </Suspense>

            <div className="pt-2">
                <Link href="/admin" className="inline-flex items-center gap-2 rounded-lg text-sm text-[var(--foreground)]/60 transition-colors hover:text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-red)]">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    Kembali ke Dashboard
                </Link>
            </div>
        </div>
    );
}

