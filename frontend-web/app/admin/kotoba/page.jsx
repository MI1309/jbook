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

export default function KotobaAdmin() {
    const { user } = useAuth();
    const [vocabs, setVocabs] = useState([]);
    const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [level, setLevel] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [serverLevel, setServerLevel] = useState(null);
    const router = useRouter();

    const [allVocabs, setAllVocabs] = useState([]);
    const [duplicates, setDuplicates] = useState([]);
    const [bulkDeleting, setBulkDeleting] = useState(false);
    const [bulkDeleteProgress, setBulkDeleteProgress] = useState(0);
    const [pendingDelete, setPendingDelete] = useState(null);
    const [previewingAll, setPreviewingAll] = useState(false);

    useEffect(() => { 
        setCurrentPage(1);
    }, [search, level]);

    useEffect(() => { fetchAllVocabs(); }, []);

    useEffect(() => {
        applyFiltersAndPagination();
    }, [allVocabs, search, level, currentPage]);

    const fetchAllVocabs = async () => {
        setLoading(true);

        // If offline, try cache first
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
            const cached = cacheGet('admin-vocab-all');
            if (cached) {
                setAllVocabs(cached);
                setLoading(false);
                return;
            }
            toast.error('Tidak ada koneksi internet dan data admin belum tersedia secara offline.');
            setLoading(false);
            return;
        }

        try {
            const token = Cookies.get('access_token');
            const res = await fetch(`${API_URL}/admin/vocab?limit=10000`, { 
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.ok) {
                const data = await res.json();
                const fetchedItems = Array.isArray(data) ? data : (data.items || []);
                setAllVocabs(fetchedItems);
                setServerLevel(data.debug_level || null);
                // Save to offline cache
                cacheSet('admin-vocab-all', fetchedItems);
            } else {
                const errorData = await res.json().catch(() => ({}));
                console.error("Fetch failed:", res.status, errorData);
                if (res.status === 403) {
                    toast.error("Admin access denied. Please login with admin account (imronm1309@gmail.com)");
                } else if (res.status === 500) {
                    // Try cache as fallback on 500
                    const cached = cacheGet('admin-vocab-all');
                    if (cached) { setAllVocabs(cached); return; }
                    toast.error(`Server Error 500. Silakan pastikan server PythonAnywhere sudah diperbarui.`);
                } else {
                    toast.error(`Gagal mengambil data: ${res.status} ${res.statusText}`);
                }
            }
        } catch (error) {
            console.error("Failed to fetch vocabs", error);
            // On network error, try cache
            const cached = cacheGet('admin-vocab-all');
            if (cached) {
                setAllVocabs(cached);
                return;
            }
            toast.error(`Terjadi kesalahan jaringan: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const applyFiltersAndPagination = () => {
        const pageSize = 50;
        let filtered = [...allVocabs];

        if (level) {
            filtered = filtered.filter(v => v.jlpt_level == level);
        }

        if (search) {
            const searchLower = search.toLowerCase();
            filtered = filtered.filter(v => 
                (v.word && v.word.toLowerCase().includes(searchLower)) ||
                (v.reading && v.reading.toLowerCase().includes(searchLower)) ||
                (v.meaning && v.meaning.toLowerCase().includes(searchLower))
            );
        }

        const totalItems = filtered.length;
        const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
        const safePage = Math.min(currentPage, totalPages);
        
        if (safePage !== currentPage) {
            setCurrentPage(safePage);
        }

        const offset = (safePage - 1) * pageSize;
        const paginatedItems = filtered.slice(offset, offset + pageSize);

        setVocabs(paginatedItems);
        setPagination({
            total: totalItems,
            page: safePage,
            pages: totalPages
        });
    };

    const handleDelete = (e, id) => {
        e.stopPropagation();
        setPendingDelete(id);
    };

    const confirmDelete = async () => {
        if (!pendingDelete) return;
        try {
            const token = Cookies.get('access_token');
            const res = await fetch(`${API_URL}/admin/vocab/${pendingDelete}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                toast.success('Vocabulary deleted successfully');
                fetchAllVocabs();
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
            if (level) queryParams.append('level', level);
            if (search) queryParams.append('search', search);
            
            const res = await fetch(`${API_URL}/admin/vocab/export/csv?${queryParams.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `vocab_export_${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
            } else {
                toast.error("Gagal mengekspor data.");
            }
        } catch (error) {
            console.error("Export failed", error);
            toast.error("Terjadi kesalahan saat mengekspor.");
        }
    };

    const checkDuplicates = () => {
        const map = {};
        allVocabs.forEach(v => {
            const key = `${v.word}||${v.meaning}`;
            if (!map[key]) map[key] = [];
            map[key].push(v);
        });
        const dups = Object.entries(map).filter(([, arr]) => arr.length > 1).map(([k, arr]) => ({ key: k, items: arr }));
        setDuplicates(dups);
        if (!dups || dups.length === 0) {
            toast.info('No duplicate kotoba found');
        } else {
            toast.info(`${dups.length} duplicate groups found`);
        }
    };

    const levelColor = (level) => {
        const colors = {
            5: 'bg-green-900/30 text-green-400',
            4: 'bg-teal-900/30 text-teal-400',
            3: 'bg-blue-900/30 text-blue-400',
            2: 'bg-purple-900/30 text-purple-400',
            1: 'bg-red-900/30 text-red-400'
        };
        return colors[level] || ('bg-neutral-800 text-neutral-400');
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-white">
                        Kotoba <span className="text-red-600">Management</span>
                    </h1>
                    <p className="mt-1 text-xs font-bold uppercase tracking-[0.2em] text-neutral-500">
                        Kelola kosakata Bahasa Jepang
                    </p>
                </div>
                <Link href="/admin/kotoba/new" className="inline-flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-2xl hover:bg-red-700 font-black text-sm shadow-lg shadow-red-500/20 transition-all active:scale-95">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Tambah Kotoba
                </Link>
            </div>

            {/* Filters & Search */}
            <div className="p-6 rounded-3xl border bg-neutral-900/30 border-white/5">
                <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
                    <div className="flex flex-1 flex-col md:flex-row gap-3">
                        <select
                            className="flex-1 px-4 py-3 rounded-2xl border text-sm font-bold focus:outline-none focus:ring-2 focus:ring-red-500/30 bg-neutral-800 border-white/10 text-white"
                            value={level}
                            onChange={(e) => setLevel(e.target.value)}
                        >
                            <option value="">Semua Level</option>
                            <option value="5">N5</option>
                            <option value="4">N4</option>
                            <option value="3">N3</option>
                            <option value="2">N2</option>
                            <option value="1">N1</option>
                        </select>
                        <input
                            type="text" placeholder="Cari kata, bacaan, atau arti..."
                            className="flex-1 px-4 py-3 rounded-2xl border text-sm font-bold focus:outline-none focus:ring-2 focus:ring-red-500/30 bg-neutral-800 border-white/10 text-white placeholder-neutral-600"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <button 
                        onClick={handleExport}
                        className="inline-flex items-center justify-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-2xl hover:bg-emerald-700 font-black text-sm shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
                    >
                        <span>📥</span> Export CSV
                    </button>
                    <button
                        onClick={checkDuplicates}
                        className="inline-flex items-center justify-center gap-2 ml-3 bg-yellow-500 text-white px-4 py-2 rounded-2xl hover:bg-yellow-600 font-black text-sm shadow transition-all active:scale-95"
                    >
                        Check Duplicates
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="rounded-3xl border overflow-hidden bg-neutral-900/30 border-white/5">
                {loading ? (
                    <div className="p-12 text-center">
                        <div className="w-10 h-10 border-4 border-red-600/20 border-t-red-600 rounded-full animate-spin mx-auto"></div>
                        <p className="mt-4 text-xs font-black uppercase tracking-widest text-neutral-500">
                            Memuat...
                        </p>
                    </div>
                ) : vocabs.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="text-4xl mb-4">📖</div>
                        <p className="text-sm font-bold text-neutral-500">
                            Tidak ada Kotoba ditemukan
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="min-w-full divide-y">
                                <thead className={'bg-neutral-800/50'}>
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-neutral-500">Kata</th>
                                        <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-neutral-500">Bacaan</th>
                                        <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-neutral-500">Arti</th>
                                        <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-neutral-500">Level</th>
                                        <th className="px-6 py-4 text-right text-xs font-black uppercase tracking-widest text-neutral-500">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {vocabs.map((v) => (
                                        <tr key={v.id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-lg font-black text-gray-900 dark:text-white">{v.word}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-600 dark:text-neutral-400">{v.reading}</td>
                                            <td className="px-6 py-4 text-sm font-bold text-gray-600 dark:text-neutral-400 max-w-md truncate">{v.meaning}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-3 py-1 inline-flex text-xs font-black rounded-full ${levelColor(v.jlpt_level)}`}>
                                                    N{v.jlpt_level}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link href={`/kotoba/${v.id}`} target="_blank" className="p-2 rounded-xl transition-colors text-emerald-400 hover:bg-emerald-500/10">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                    </Link>
                                                    <Link href={`/admin/kotoba/${v.id}`} className="p-2 rounded-xl transition-colors text-indigo-400 hover:bg-indigo-500/10">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </Link>
                                                    <button onClick={(e) => handleDelete(e, v.id)} className="p-2 rounded-xl transition-colors text-red-400 hover:bg-red-500/10">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
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
                            {vocabs.map((v) => (
                                <div key={v.id} className="divide-white/5">
                                    <div
                                        className="flex items-center gap-4 px-5 py-4 active:bg-black/5 dark:active:bg-white/5 transition-colors cursor-pointer"
                                        onClick={() => router.push(`/kotoba/${v.id}`)}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xl font-black text-gray-900 dark:text-white">{v.word}</div>
                                            <div className="text-sm font-bold text-gray-600 dark:text-neutral-400">{v.reading}</div>
                                            <div className="mt-1 text-sm font-bold text-gray-700 dark:text-neutral-300 truncate">{v.meaning}</div>
                                            <span className={`inline-flex mt-2 px-2.5 py-1 text-xs font-black rounded-full ${levelColor(v.jlpt_level)}`}>
                                                N{v.jlpt_level}
                                            </span>
                                        </div>
                                        <svg className="w-5 h-5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                    <div className="flex items-center justify-between px-5 py-3 bg-neutral-900/30">
                                        <div className="flex items-center gap-2">
                                            <Link href={`/admin/kotoba/${v.id}`} className="p-2 rounded-xl transition-colors text-indigo-400 hover:bg-indigo-500/10" onClick={(e) => e.stopPropagation()}>
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </Link>
                                            <button
                                                onClick={(e) => handleDelete(e, v.id)}
                                                className="p-2 rounded-xl transition-colors text-red-400 hover:bg-red-500/10"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* Pagination Controls */}
                {!loading && pagination.pages > 1 && (
                    <div className="px-6 py-5 border-t bg-neutral-900/50 border-white/5">
                        <div className="flex items-center justify-between gap-4">
                            <div className="text-xs font-bold text-neutral-500">
                                Halaman <span className="text-gray-900 dark:text-white">{pagination.page}</span> dari <span className="text-gray-900 dark:text-white">{pagination.pages}</span> ({pagination.total} hasil)
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className={`p-2 rounded-xl border text-sm font-bold transition-all ${
                                        currentPage === 1 
                                            ? 'opacity-30 cursor-not-allowed' 
                                            : `bg-neutral-800 border-white/10 text-white hover:bg-neutral-700 active:scale-95`
                                    }`}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                <span className="px-4 py-2 rounded-xl border text-sm font-black bg-red-600/20 border-red-500/30 text-red-400">
                                    {currentPage}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(pagination.pages, p + 1))}
                                    disabled={currentPage === pagination.pages}
                                    className={`p-2 rounded-xl border text-sm font-bold transition-all ${
                                        currentPage === pagination.pages 
                                            ? 'opacity-30 cursor-not-allowed' 
                                            : `bg-neutral-800 border-white/10 text-white hover:bg-neutral-700 active:scale-95`
                                    }`}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                {duplicates.length > 0 && (
                    <div className="p-6 rounded-3xl border mt-6 bg-neutral-900/30 border-white/5">
                        <h2 className="text-lg font-black">Duplicate Kotoba Found ({duplicates.length})</h2>
                        <div className="mt-4 space-y-3">
                            {duplicates.map(d => (
                                <div key={d.key} className="p-3 rounded-lg bg-neutral-800/40 flex items-start justify-between">
                                    <div>
                                        <div className="text-lg font-black">{d.items[0].word} <span className="text-sm text-neutral-400">({d.items.length})</span></div>
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
                                                        const res = await fetch(`${API_URL}/admin/kotoba/duplicates/delete`, {
                                                            method: 'POST',
                                                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                                            body: JSON.stringify({ ids: toDelete })
                                                        });
                                                        if (res.ok) {
                                                            const data = await res.json();
                                                            toast.success(`Deleted ${data.deleted} duplicates for ${d.items[0].word}`);
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
                                                        fetchAllVocabs();
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
            </div>

            <ConfirmationModal
                isOpen={!!pendingDelete}
                onClose={() => setPendingDelete(null)}
                onConfirm={confirmDelete}
                title="Hapus Kotoba?"
                message="Are you sure you want to delete this Vocabulary? Tindakan ini tidak dapat dibatalkan."
                confirmText="Hapus"
                cancelText="Batal"
                type="danger"
            />

            {/* Floating quick controls for duplicates (preview / bulk-delete) */}
            <div className="fixed right-6 bottom-6 z-50 flex flex-col gap-3">
                <button
                    onClick={async () => {
                        setPreviewingAll(true);
                        try {
                            const token = Cookies.get('access_token');
                            const res = await fetch(`${API_URL}/admin/kotoba/duplicates`, { headers: { 'Authorization': `Bearer ${token}` } });
                            if (!res.ok) {
                                const text = await res.text().catch(() => res.statusText);
                                throw new Error(text || `Status ${res.status}`);
                            }
                            const data = await res.json();
                            toast.info(`Found ${data.length} duplicate groups (console)`);
                            console.log('kotoba-duplicates', data);
                            // offer download
                            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `kotoba_duplicates_${new Date().toISOString().slice(0,10)}.json`;
                            document.body.appendChild(a);
                            a.click();
                            a.remove();
                            URL.revokeObjectURL(url);
                        } catch (e) {
                            console.error(e);
                            toast.error(e?.message || 'Failed to fetch duplicates');
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
                            const res = await fetch(`${API_URL}/admin/kotoba/duplicates` , { headers: { 'Authorization': `Bearer ${token}` } });
                            if (!res.ok) { throw new Error('Failed to list'); }
                            const groups = await res.json();
                            // collect all ids except first in each group
                            const ids = [];
                            groups.forEach(g => {
                                if (g.items && g.items.length > 1) {
                                    g.items.slice(1).forEach(it => ids.push(it.id));
                                }
                            });
                            if (ids.length === 0) { toast.info('No duplicate ids to delete'); return; }
                            setBulkDeleting(true);
                            const del = await fetch(`${API_URL}/admin/kotoba/duplicates/delete`, {
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
                            fetchAllVocabs();
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
