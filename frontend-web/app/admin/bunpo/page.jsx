'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { API_URL } from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDebounce } from 'use-debounce';
import Cookies from 'js-cookie';
import { cacheGet, cacheSet } from '@/lib/cache-store';
import { toast } from 'react-toastify';
import ConfirmationModal from '@/components/common/ConfirmationModal';

export default function BunpoAdmin() {
    const { user } = useAuth();
    const [bunpos, setBunpos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterLevel, setFilterLevel] = useState('');
    const [filterChapter, setFilterChapter] = useState('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const LIMIT = 20;
    const [pendingDelete, setPendingDelete] = useState(null);
    const router = useRouter();

    const [allBunpos, setAllBunpos] = useState([]);

    const [debouncedChapter] = useDebounce(filterChapter, 500);
    const [debouncedSearch] = useDebounce(search, 500);

    useEffect(() => { setPage(1); }, [filterLevel, debouncedChapter, debouncedSearch]);
    
    useEffect(() => { fetchAllBunpos(); }, []);

    useEffect(() => {
        applyFiltersAndPagination();
    }, [allBunpos, filterLevel, debouncedChapter, debouncedSearch, page]);

    const fetchAllBunpos = async () => {
        setLoading(true);

        if (typeof navigator !== 'undefined' && !navigator.onLine) {
            const cached = cacheGet('admin-bunpo-all');
            if (cached) { setAllBunpos(cached); setLoading(false); return; }
            toast.error('Tidak ada koneksi internet dan data admin belum tersedia secara offline.');
            setLoading(false);
            return;
        }

        try {
            const token = Cookies.get('access_token');
            const url = `${API_URL}/admin/grammar`;
            const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) {
                const data = await res.json();
                const items = Array.isArray(data) ? data : (data.items || []);
                setAllBunpos(items);
                cacheSet('admin-bunpo-all', items);
            } else {
                const cached = cacheGet('admin-bunpo-all');
                if (cached) { setAllBunpos(cached); return; }
                toast.error(`Gagal mengambil data Bunpo: ${res.status} ${res.statusText}`);
            }
        } catch (error) {
            console.error("Failed to fetch bunpos", error);
            const cached = cacheGet('admin-bunpo-all');
            if (cached) { setAllBunpos(cached); return; }
            toast.error(`Terjadi kesalahan jaringan.`);
        } finally {
            setLoading(false);
        }
    };

    const applyFiltersAndPagination = () => {
        let filtered = [...allBunpos];

        if (filterLevel) {
            filtered = filtered.filter(b => b.jlpt_level == filterLevel);
        }
        if (debouncedChapter && !isNaN(parseInt(debouncedChapter))) {
            const ch = parseInt(debouncedChapter);
            filtered = filtered.filter(b => b.chapter === ch);
        }
        if (debouncedSearch) {
            const ls = debouncedSearch.toLowerCase();
            filtered = filtered.filter(b => 
                (b.title && b.title.toLowerCase().includes(ls)) ||
                (b.structure && b.structure.toLowerCase().includes(ls)) ||
                (b.explanation && b.explanation.toLowerCase().includes(ls))
            );
        }

        const totalItems = filtered.length;
        const totalPages = Math.max(1, Math.ceil(totalItems / LIMIT));
        const safePage = Math.min(page, totalPages);
        
        if (safePage !== page) {
            setPage(safePage);
        }

        const offset = (safePage - 1) * LIMIT;
        setBunpos(filtered.slice(offset, offset + LIMIT));
    };

    const handleDelete = (e, id) => {
        e.stopPropagation();
        setPendingDelete(id);
    };

    const confirmDelete = async () => {
        if (!pendingDelete) return;
        try {
            const token = Cookies.get('access_token');
            const res = await fetch(`${API_URL}/admin/grammar/${pendingDelete}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                toast.success('Grammar deleted successfully');
                fetchAllBunpos();
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
            if (filterLevel) queryParams.append('level', filterLevel);
            if (filterChapter) queryParams.append('chapter', filterChapter);
            if (search) queryParams.append('search', search);
            
            const res = await fetch(`${API_URL}/admin/grammar/export/csv?${queryParams.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `grammar_export_${new Date().toISOString().split('T')[0]}.csv`;
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

    const levelColor = (level) => {
        const colors = {
            5: 'bg-blue-900/30 text-blue-400',
            4: 'bg-teal-900/30 text-teal-400',
            3: 'bg-indigo-900/30 text-indigo-400',
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
                        Bunpo <span className="text-red-600">Management</span>
                    </h1>
                    <p className="mt-1 text-xs font-bold uppercase tracking-[0.2em] text-neutral-500">
                        Kelola tata bahasa Jepang
                    </p>
                </div>
                <Link href="/admin/bunpo/new" className="inline-flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-2xl hover:bg-red-700 font-black text-sm shadow-lg shadow-red-500/20 transition-all active:scale-95">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Tambah Bunpo Baru
                </Link>
            </div>

            {/* Filters & Search */}
            <div className="p-6 rounded-3xl border bg-neutral-900/30 border-white/5">
                <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
                    <div className="flex flex-1 flex-col md:flex-row gap-3">
                        <input
                            type="text" placeholder="Cari judul, struktur..."
                            className="flex-1 px-4 py-3 rounded-2xl border text-sm font-bold focus:outline-none focus:ring-2 focus:ring-red-500/30 bg-neutral-800 border-white/10 text-white placeholder-neutral-600"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <select
                            className="flex-1 md:w-32 px-4 py-3 rounded-2xl border text-sm font-bold focus:outline-none focus:ring-2 focus:ring-red-500/30 bg-neutral-800 border-white/10 text-white"
                            value={filterLevel}
                            onChange={(e) => setFilterLevel(e.target.value)}
                        >
                            <option value="">Semua Level</option>
                            {[5, 4, 3, 2, 1].map(l => <option key={l} value={l}>N{l}</option>)}
                        </select>
                        <input
                            type="number" min="1"
                            className="px-4 py-3 rounded-2xl border text-sm font-bold focus:outline-none focus:ring-2 focus:ring-red-500/30 bg-neutral-800 border-white/10 text-white placeholder-neutral-600"
                            value={filterChapter}
                            onChange={(e) => {
                                const val = parseInt(e.target.value);
                                if (e.target.value === '' || (!isNaN(val) && val >= 1)) setFilterChapter(e.target.value);
                            }}
                            placeholder="Bab"
                        />
                    </div>
                    <button 
                        onClick={handleExport}
                        className="inline-flex items-center justify-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-2xl hover:bg-emerald-700 font-black text-sm shadow-lg shadow-emerald-500/20 transition-all active:scale-95">
                        <span>📥</span> Export CSV
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="rounded-3xl border overflow-hidden bg-neutral-900/30 border-white/5">
                {loading ? (
                    <div className="p-12 text-center">
                        <div className="w-10 h-10 border-4 border-red-600/20 border-t-red-600 rounded-full animate-spin mx-auto"></div>
                        <p className="mt-4 text-xs font-bold uppercase tracking-widest text-neutral-500">
                            Memuat...
                        </p>
                    </div>
                ) : bunpos.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="text-4xl mb-4">📚</div>
                        <p className="text-sm font-bold text-neutral-500">
                            Tidak ada Bunpo ditemukan
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="min-w-full divide-y">
                                <thead className={'bg-neutral-800/50'}>
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-black text-neutral-500 uppercase tracking-widest">Judul</th>
                                        <th className="px-6 py-4 text-left text-xs font-black text-neutral-500 uppercase tracking-widest">Struktur</th>
                                        <th className="px-6 py-4 text-left text-xs font-black text-neutral-500 uppercase tracking-widest">Level</th>
                                        <th className="px-6 py-4 text-left text-xs font-black text-neutral-500 uppercase tracking-widest">Bab</th>
                                        <th className="px-6 py-4 text-right text-xs font-black text-neutral-500 uppercase tracking-widest">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {bunpos.map((b) => (
                                        <tr key={b.id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-lg font-black text-gray-900 dark:text-white">{b.title}</td>
                                            <td className="px-6 py-4 text-sm font-bold text-gray-600 dark:text-neutral-400 truncate max-w-xs">{b.structure}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-3 py-1 inline-flex text-xs font-black rounded-full ${levelColor(b.jlpt_level)}`}>
                                                    N{b.jlpt_level}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-600 dark:text-neutral-400">Bab {b.chapter}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link
                                                        href={`/bunpo/${b.id}`} target="_blank"
                                                        className="p-2 rounded-xl transition-colors text-emerald-400 hover:bg-emerald-500/10"
                                                        title="Lihat"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.478 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                    </Link>
                                                    <Link
                                                        href={`/admin/bunpo/${b.id}`}
                                                        className="p-2 rounded-xl transition-colors text-indigo-400 hover:bg-indigo-500/10"
                                                        title="Edit"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </Link>
                                                    <button
                                                        onClick={(e) => handleDelete(e, b.id)}
                                                        className="p-2 rounded-xl transition-colors text-red-400 hover:bg-red-500/10"
                                                        title="Hapus"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                            {bunpos.map((b) => (
                                <div key={b.id} className="divide-white/5">
                                    <div
                                        className="flex items-center gap-4 px-5 py-4 active:bg-black/5 dark:active:bg-white/5 transition-colors cursor-pointer"
                                        onClick={() => router.push(`/bunpo/${b.id}`)}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="font-black text-lg text-white">{b.title}</div>
                                            <div className="text-sm font-bold text-gray-600 dark:text-neutral-400">{b.structure}</div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`inline-flex px-3 py-1 text-xs font-black rounded-full ${levelColor(b.jlpt_level)}`}>N{b.jlpt_level}</span>
                                                <span className="text-xs font-bold text-neutral-500">Bab {b.chapter}</span>
                                            </div>
                                        </div>
                                        <svg className="w-5 h-5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                    <div className="flex items-center justify-between px-5 py-3 bg-neutral-900/30">
                                        <div className="flex items-center gap-2">
                                            <Link
                                                href={`/admin/bunpo/${b.id}`}
                                                className="p-2 rounded-xl transition-colors text-indigo-400 hover:bg-indigo-500/10"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </Link>
                                            <button
                                                onClick={(e) => handleDelete(e, b.id)}
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

                        {/* Pagination */}
                        {!loading && (
                            <div className="px-6 py-5 border-t bg-neutral-900/50 border-white/5">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="text-xs font-bold text-neutral-500">Halaman <span className="text-gray-900 dark:text-white">{page}</span> dari <span className="text-gray-900 dark:text-white">{Math.max(1, Math.ceil(allBunpos.length / LIMIT))}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setPage(p => Math.max(1, p - 1))}
                                            disabled={page === 1}
                                            className={`p-2 rounded-xl border text-sm font-bold transition-all ${
                                                page === 1 ? 'opacity-30 cursor-not-allowed' : `bg-neutral-800 border-white/10 text-white hover:bg-neutral-700 active:scale-95`
                                            }`}
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                            </svg>
                                        </button>
                                        <span className="px-4 py-2 rounded-xl border text-sm font-black bg-red-600/20 border-red-500/30 text-red-400">
                                            {page}
                                        </span>
                                        <button
                                            onClick={() => setPage(p => p + 1)}
                                            disabled={bunpos.length < LIMIT}
                                            className={`p-2 rounded-xl border text-sm font-bold transition-all ${
                                                bunpos.length < LIMIT ? 'opacity-30 cursor-not-allowed' : `bg-neutral-800 border-white/10 text-white hover:bg-neutral-700 active:scale-95`
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
                    </>
                )}
            </div>

            <ConfirmationModal
                isOpen={!!pendingDelete}
                onClose={() => setPendingDelete(null)}
                onConfirm={confirmDelete}
                title="Hapus Bunpo?"
                message="Are you sure you want to delete this Grammar point? Tindakan ini tidak dapat dibatalkan."
                confirmText="Hapus"
                cancelText="Batal"
                type="danger"
            />
        </div>
    );
}
