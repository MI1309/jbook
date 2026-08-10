'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { API_URL } from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { cacheGet, cacheSet } from '@/lib/cache-store';
import { toast } from 'react-toastify';
import ConfirmationModal from '@/components/common/ConfirmationModal';

export default function KanjiAdmin() {
    const { user } = useAuth();
    const [kanjiList, setKanjiList] = useState([]);
    const [duplicates, setDuplicates] = useState([]);
    const [bulkDeleting, setBulkDeleting] = useState(false);
    const [bulkDeleteProgress, setBulkDeleteProgress] = useState(0);
    const [mounted, setMounted] = useState(false);
    const [previewingAll, setPreviewingAll] = useState(false);
    const [loading, setLoading] = useState(true);
    const [filterLevel, setFilterLevel] = useState('');
    const [search, setSearch] = useState('');
    const [pendingDelete, setPendingDelete] = useState(null);
    const router = useRouter();

    useEffect(() => { 
        setMounted(true);
        fetchKanjis(); 
    }, [filterLevel, search]);

    const fetchKanjis = async () => {
        setLoading(true);

        if (typeof navigator !== 'undefined' && !navigator.onLine) {
            const cached = cacheGet('admin-kanji-all');
            if (cached) { setKanjiList(cached); setLoading(false); return; }
            toast.error('Tidak ada koneksi internet dan data admin belum tersedia secara offline.');
            setLoading(false);
            return;
        }

        try {
            const token = Cookies.get('access_token');
            let url = `${API_URL}/admin/kanji?limit=10000`;

            const queryParams = new URLSearchParams();
            if (filterLevel && filterLevel !== 'all') queryParams.append('level', filterLevel);
            if (search) queryParams.append('search', search);

            const queryString = queryParams.toString();
            if (queryString) url += `?${queryString}`;

            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setKanjiList(data);
                if (!filterLevel && !search) cacheSet('admin-kanji-all', data);
            } else {
                const cached = cacheGet('admin-kanji-all');
                if (cached) { setKanjiList(cached); return; }
                toast.error(`Gagal mengambil data Kanji: ${res.status} ${res.statusText}`);
            }
        } catch (error) {
            console.error("Failed to fetch", error);
            const cached = cacheGet('admin-kanji-all');
            if (cached) { setKanjiList(cached); return; }
        } finally {
            setLoading(false);
        }
    };

    const checkDuplicates = () => {
        const map = {};
        kanjiList.forEach(k => {
            const key = k.character;
            if (!map[key]) map[key] = [];
            map[key].push(k);
        });
        const dups = Object.entries(map).filter(([, arr]) => arr.length > 1).map(([char, arr]) => ({ character: char, items: arr }));
        setDuplicates(dups);
        if (!dups || dups.length === 0) {
            toast.info('No duplicate kanji found');
        } else {
            toast.info(`${dups.length} duplicate groups found`);
        }
    };

    const handleDelete = (e, id) => {
        e.stopPropagation();
        setPendingDelete(id);
    };

    const confirmDelete = async () => {
        if (!pendingDelete) return;
        try {
            const token = Cookies.get('access_token');
            const res = await fetch(`${API_URL}/admin/kanji/${pendingDelete}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                toast.success('Kanji deleted successfully');
                fetchKanjis();
            } else {
                toast.error('Failed to delete');
            }
        } catch (error) {
            console.error("Delete error", error);
            toast.error('Network error while deleting');
        } finally {
            setPendingDelete(null);
        }
    };

    const handleExport = async () => {
        try {
            const token = Cookies.get('access_token');
            const queryParams = new URLSearchParams();
            if (filterLevel && filterLevel !== 'all') queryParams.append('level', filterLevel);
            if (search) queryParams.append('search', search);
            
            const res = await fetch(`${API_URL}/admin/kanji/export/csv?${queryParams.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `kanji_export_${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
            } else {
                toast.error("Gagal mengekspor data.");
            }
        } catch (error) {
            console.error("Export failed", error);
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-5xl font-black tracking-tighter text-white">
                        Kanji <span className="text-red-600">Management</span>
                    </h1>
                    <p className="text-xs font-bold text-neutral-500 uppercase tracking-[0.2em] mt-3">Total: {kanjiList.length} Entitas</p>
                </div>
                <Link 
                    href="/admin/kanji/new" 
                    className="bg-red-600 hover:bg-red-500 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-red-600/20 active:scale-95 text-center"
                >
                    + Tambah Kanji Baru
                </Link>
            </div>

            {/* Filter & Actions Bar */}
            <div className="p-6 rounded-[2rem] border backdrop-blur-xl transition-all bg-white/5 border-white/5 shadow-2xl">
                <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="relative flex-1 w-full">
                        <input 
                            type="text" 
                            placeholder="Cari berdasarkan karakter atau arti..." 
                            className="w-full p-4 pl-12 rounded-2xl font-bold text-sm transition-all outline-none bg-neutral-900/50 text-white border-white/5 focus:bg-neutral-900 focus:ring-2 focus:ring-red-600/50"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <select 
                            className="flex-1 md:w-32 p-4 rounded-2xl font-bold text-sm outline-none cursor-pointer bg-neutral-900/50 text-white border-white/5"
                            value={filterLevel} 
                            onChange={(e) => setFilterLevel(e.target.value)}
                        >
                            <option value="">Semua Level</option>
                            {[5, 4, 3, 2, 1].map(l => <option key={l} value={l}>N{l}</option>)}
                        </select>
                        
                        <button 
                            onClick={handleExport}
                            className="p-4 rounded-2xl transition-all active:scale-95 bg-emerald-600/10 text-emerald-500 border border-emerald-500/20"
                            title="Export to CSV"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        </button>
                        <button
                            onClick={checkDuplicates}
                            className="p-4 rounded-2xl transition-all active:scale-95 bg-yellow-500/10 text-yellow-400 border border-yellow-400/20"
                            title="Check Duplicates"
                        >
                            Check Duplicates
                        </button>
                    </div>
                </div>
            </div>

            {/* Table Section */}
            <div className="rounded-[2.5rem] border overflow-hidden transition-all bg-white/5 border-white/5">
                {loading ? (
                    <div className="p-20 text-center">
                        <div className="w-12 h-12 border-4 border-red-600/20 border-t-red-600 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Menarik Data...</p>
                    </div>
                ) : kanjiList.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="text-4xl mb-4">📝</div>
                        <p className="text-sm font-bold text-neutral-500">
                            Tidak ada Kanji ditemukan
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="min-w-full divide-y">
                                <thead className={'bg-neutral-800/50'}>
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-black text-neutral-500 uppercase tracking-widest">Karakter</th>
                                        <th className="px-6 py-4 text-left text-xs font-black text-neutral-500 uppercase tracking-widest">Arti & Detail</th>
                                        <th className="px-6 py-4 text-left text-xs font-black text-neutral-500 uppercase tracking-widest">Level</th>
                                        <th className="px-6 py-4 text-right text-xs font-black text-neutral-500 uppercase tracking-widest">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {kanjiList.map((k) => (
                                        <tr key={k.id} className="transition-colors hover:bg-white/5">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-4xl font-black text-white">{k.character}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-black text-lg text-neutral-200">{k.meaning}</div>
                                                <div className="flex flex-wrap gap-x-4 mt-1">
                                                    <div className="text-xs font-bold text-neutral-500 uppercase tracking-widest"><span className="text-red-500">音:</span> {k.onyomi.join(', ')}</div>
                                                    <div className="text-xs font-bold text-neutral-500 uppercase tracking-widest"><span className="text-blue-500">訓:</span> {k.kunyomi.join(', ')}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-3 py-1 text-xs font-black rounded-full bg-red-600/10 text-red-500 border border-red-500/20">N{k.jlpt_level}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link 
                                                        href={`/kanji/${k.id}`} 
                                                        target="_blank" 
                                                        className="p-2 rounded-xl transition-colors text-emerald-400 hover:bg-emerald-500/10"
                                                        title="Lihat Publik"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                    </Link>
                                                    <Link 
                                                        href={`/admin/kanji/${k.id}`} 
                                                        className="p-2 rounded-xl transition-colors text-indigo-400 hover:bg-indigo-500/10"
                                                        title="Edit Data"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                    </Link>
                                                    <button 
                                                        onClick={(e) => handleDelete(e, k.id)} 
                                                        className="p-2 rounded-xl transition-colors text-red-400 hover:bg-red-500/10"
                                                        title="Hapus Data"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="md:hidden divide-y">
                            {kanjiList.map((k) => (
                                <div key={k.id} className="divide-white/5">
                                    <div
                                        className="flex items-center gap-4 px-5 py-4 active:bg-black/5 dark:active:bg-white/5 transition-colors cursor-pointer"
                                        onClick={() => router.push(`/kanji/${k.id}`)}
                                    >
                                        <div className="text-4xl font-black text-white">{k.character}</div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-black text-lg text-neutral-200">{k.meaning}</div>
                                            <div className="flex flex-wrap gap-x-2 mt-1">
                                                <div className="text-xs font-bold text-neutral-500 uppercase tracking-widest"><span className="text-red-500">音:</span> {k.onyomi.join(', ')}</div>
                                                <div className="text-xs font-bold text-neutral-500 uppercase tracking-widest"><span className="text-blue-500">訓:</span> {k.kunyomi.join(', ')}</div>
                                            </div>
                                            <span className="inline-flex mt-2 px-3 py-1 text-xs font-black rounded-full bg-red-600/10 text-red-500 border border-red-500/20">N{k.jlpt_level}</span>
                                        </div>
                                        <svg className="w-5 h-5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                    <div className="flex items-center justify-between px-5 py-3 bg-neutral-900/30">
                                        <div className="flex items-center gap-2">
                                            <Link 
                                                href={`/admin/kanji/${k.id}`} 
                                                className="p-2 rounded-xl transition-colors text-indigo-400 hover:bg-indigo-500/10"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                            </Link>
                                            <button 
                                                onClick={(e) => handleDelete(e, k.id)} 
                                                className="p-2 rounded-xl transition-colors text-red-400 hover:bg-red-500/10"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            <ConfirmationModal
                isOpen={!!pendingDelete}
                onClose={() => setPendingDelete(null)}
                onConfirm={confirmDelete}
                title="Hapus Kanji?"
                message="Yakin ingin menghapus Kanji ini? Tindakan ini tidak dapat dibatalkan."
                confirmText="Hapus"
                cancelText="Batal"
                type="danger"
            />
            {duplicates.length > 0 && (
                <div className="p-6 rounded-2xl border mt-6 bg-neutral-900/30 border-white/5">
                    <h2 className="text-lg font-black">Duplicate Kanji Found ({duplicates.length})</h2>
                    <div className="mt-4 space-y-3">
                        {duplicates.map(d => (
                            <div key={d.character} className="p-3 rounded-lg bg-neutral-800/40 flex items-start justify-between">
                                <div>
                                    <div className="text-2xl font-black">{d.character} <span className="text-sm text-neutral-400">({d.items.length})</span></div>
                                    <div className="text-xs text-neutral-400 mt-1">
                                        {d.items.map(it => `${it.id} — ${it.meaning}`).join(' • ')}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={async () => {
                                            const token = Cookies.get('access_token');
                                            const toDelete = d.items.slice(1).map(i => i.id);
                                            if (toDelete.length === 0) return;
                                            setBulkDeleting(true);
                                            setBulkDeleteProgress(0);
                                            try {
                                                const res = await fetch(`${API_URL}/admin/kanji/duplicates/delete`, {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                                    body: JSON.stringify({ ids: toDelete })
                                                });
                                                if (res.ok) {
                                                    const data = await res.json();
                                                    toast.success(`Deleted ${data.deleted} duplicates for ${d.character}`);
                                                } else {
                                                    const err = await res.text().catch(() => res.statusText);
                                                    toast.error(`Delete failed: ${res.status} ${err}`);
                                                }
                                            } catch (e) {
                                                console.error(e);
                                                toast.error('Network error during bulk delete');
                                            } finally {
                                                setBulkDeleting(false);
                                                setBulkDeleteProgress(0);
                                                fetchKanjis();
                                                setDuplicates([]);
                                            }
                                        }}
                                        disabled={bulkDeleting}
                                        className={`px-4 py-2 rounded-2xl ${bulkDeleting ? 'bg-neutral-700 text-neutral-300' : 'bg-red-600 text-white'}`}
                                    >
                                        {bulkDeleting ? 'Deleting...' : 'Delete duplicates'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        
        {/* Floating quick controls for duplicates (preview / bulk-delete) */}
        <div className="fixed right-6 bottom-6 z-50 flex flex-col gap-3">
            <button
                onClick={async () => {
                    setPreviewingAll(true);
                    try {
                        const token = Cookies.get('access_token');
                        const res = await fetch(`${API_URL}/admin/kanji/duplicates`, { headers: { 'Authorization': `Bearer ${token}` } });
                        if (!res.ok) { throw new Error(`Status ${res.status}`); }
                        const data = await res.json();
                        toast.info(`Found ${data.length} duplicate groups (console)`);
                        console.log('kanji-duplicates', data);
                        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `kanji_duplicates_${new Date().toISOString().slice(0,10)}.json`;
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                        URL.revokeObjectURL(url);
                    } catch (e) {
                        console.error(e);
                        toast.error('Failed to fetch duplicates');
                    } finally { setPreviewingAll(false); }
                }}
                disabled={previewingAll}
                className="px-4 py-2 rounded-full bg-blue-600 text-white shadow-lg"
                title="Preview duplicate groups and download JSON"
            >{previewingAll ? 'Loading...' : 'Preview duplicates'}</button>

            <button
                onClick={async () => {
                    if (!confirm('This will delete all duplicate items (keeps first in each group). Proceed? Make sure you have a backup.')) return;
                    try {
                        const token = Cookies.get('access_token');
                        const res = await fetch(`${API_URL}/admin/kanji/duplicates` , { headers: { 'Authorization': `Bearer ${token}` } });
                        if (!res.ok) { throw new Error('Failed to list'); }
                        const groups = await res.json();
                        const ids = [];
                        groups.forEach(g => {
                            if (g.items && g.items.length > 1) {
                                g.items.slice(1).forEach(it => ids.push(it.id));
                            }
                        });
                        if (ids.length === 0) { toast.info('No duplicate ids to delete'); return; }
                        setBulkDeleting(true);
                        const del = await fetch(`${API_URL}/admin/kanji/duplicates/delete`, {
                            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                            body: JSON.stringify({ ids })
                        });
                        if (del.ok) {
                            const out = await del.json();
                            toast.success(`Deleted ${out.deleted} items`);
                        } else {
                            const txt = await del.text().catch(() => del.statusText);
                            toast.error(`Delete failed: ${del.status} ${txt}`);
                        }
                        fetchKanjis();
                        setDuplicates([]);
                    } catch (e) {
                        console.error(e);
                        toast.error('Bulk-delete failed');
                    } finally { setBulkDeleting(false); }
                }}
                className="px-4 py-2 rounded-full bg-red-600 text-white shadow-lg"
                title="Delete all duplicate items (dangerous)"
            >Delete all duplicates</button>
        </div>
        </div>
    );
}