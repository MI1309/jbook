'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { API_URL, setKanjiVisibilityCache } from '@/lib/api';
import Link from 'next/link';
import { getKanjiHref } from '@/lib/kanji-route';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { useDebounce } from 'use-debounce';
import { cacheGet, cacheSet } from '@/lib/cache-store';
import { appToast as toast } from '@/components/common/AppMessage';
import ConfirmationModal from '@/components/common/ConfirmationModal';
import Pagination from '@/components/common/Pagination';

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
    const [debouncedSearch] = useDebounce(search, 400);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ total: 0, pages: 1, page: 1 });
    const [pendingDelete, setPendingDelete] = useState(null);
    const [disabledLevels, setDisabledLevels] = useState([1, 2, 3]);
    const [savingVisibility, setSavingVisibility] = useState(false);
    const router = useRouter();

    useEffect(() => { setPage(1); }, [filterLevel, debouncedSearch]);

    useEffect(() => { 
        setMounted(true);
        fetchKanjis(); 
    }, [filterLevel, debouncedSearch, page]);

    useEffect(() => {
        fetchVisibility();
    }, []);

    const fetchVisibility = async () => {
        try {
            const token = Cookies.get('access_token');
            const res = await fetch(`${API_URL}/admin/kanji/visibility`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setDisabledLevels(data.disabled_levels || [1, 2, 3]);
            }
        } catch (error) {
            console.error('Failed to fetch Kanji visibility', error);
        }
    };

    const toggleVisibility = async (level) => {
        const nextDisabledLevels = disabledLevels.includes(level)
            ? disabledLevels.filter(item => item !== level)
            : [...disabledLevels, level].sort((a, b) => a - b);
        setSavingVisibility(true);
        try {
            const token = Cookies.get('access_token');
            const res = await fetch(`${API_URL}/admin/kanji/visibility`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ disabled_levels: nextDisabledLevels })
            });
            if (!res.ok) throw new Error('Visibility update failed');
            setDisabledLevels(nextDisabledLevels);
            setKanjiVisibilityCache(nextDisabledLevels);
            toast.success(`Kanji N${level} ${nextDisabledLevels.includes(level) ? 'dinonaktifkan' : 'diaktifkan'}`);
        } catch (error) {
            toast.error('Gagal mengubah visibilitas level Kanji.');
        } finally {
            setSavingVisibility(false);
        }
    };

    const fetchKanjis = async () => {
        setLoading(true);
        const cacheKey = `admin-kanji-${filterLevel || 'all'}-${debouncedSearch || 'all'}-${page}`;

        if (typeof navigator !== 'undefined' && !navigator.onLine) {
            const cached = cacheGet(cacheKey);
            if (cached) {
                const result = normalizeKanjiPage(cached, page, 50);
                setKanjiList(result.items);
                setPagination(result.pagination);
                setLoading(false);
                return;
            }
            toast.error('Tidak ada koneksi internet dan data admin belum tersedia secara offline.');
            setLoading(false);
            return;
        }

        try {
            const token = Cookies.get('access_token');
            const queryParams = new URLSearchParams({ page: String(page), limit: '50' });
            if (filterLevel && filterLevel !== 'all') queryParams.append('level', filterLevel);
            if (debouncedSearch) queryParams.append('search', debouncedSearch);
            const url = `${API_URL}/admin/kanji?${queryParams.toString()}`;

            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                const result = normalizeKanjiPage(data, page, 50);
                setKanjiList(result.items);
                setPagination(result.pagination);
                if (result.pagination.page !== page) setPage(result.pagination.page);
                cacheSet(cacheKey, data);
            } else {
                const cached = cacheGet(cacheKey);
                if (cached) {
                    const result = normalizeKanjiPage(cached, page, 50);
                    setKanjiList(result.items);
                    setPagination(result.pagination);
                    return;
                }
                toast.error(`Gagal mengambil data Kanji: ${res.status} ${res.statusText}`);
            }
        } catch (error) {
            console.error("Failed to fetch", error);
            const cached = cacheGet(cacheKey);
            if (cached) {
                const result = normalizeKanjiPage(cached, page, 50);
                setKanjiList(result.items);
                setPagination(result.pagination);
                return;
            }
        } finally {
            setLoading(false);
        }
    };

    const checkDuplicates = async () => {
        try {
            const token = Cookies.get('access_token');
            const res = await fetch(`${API_URL}/admin/kanji/duplicates`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Gagal memeriksa duplikat');
            const data = await res.json();
            setDuplicates(data);
            toast.info(data.length ? `${data.length} grup duplikat ditemukan` : 'Tidak ada kanji duplikat');
        } catch (error) {
            toast.error(error.message || 'Gagal memeriksa duplikat');
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

    const handleExportPdf = async () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            toast.error('Izinkan pop-up untuk membuat materi PDF.');
            return;
        }

        try {
            const token = Cookies.get('access_token');
            const queryParams = new URLSearchParams();
            if (filterLevel && filterLevel !== 'all') queryParams.append('level', filterLevel);
            if (search) queryParams.append('search', search);

            const res = await fetch(`${API_URL}/admin/kanji?${queryParams.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) throw new Error('Gagal mengambil data kanji untuk PDF.');
            const kanjiItems = await res.json();
            if (!Array.isArray(kanjiItems) || kanjiItems.length === 0) {
                throw new Error('Tidak ada kanji yang dapat diekspor.');
            }

            printWindow.addEventListener('load', () => printWindow.print(), { once: true });
            printWindow.document.open();
            printWindow.document.write(buildKanjiWorkbookHtml(kanjiItems, filterLevel, search));
            printWindow.document.close();
            printWindow.document.title = `JBook - Materi Kanji${filterLevel ? ` N${filterLevel}` : ''}`;
            printWindow.focus();
        } catch (error) {
            console.error("Export failed", error);
            printWindow.close();
            toast.error(error.message || 'Gagal membuat materi PDF.');
        }
    };

    const handleExportCsv = async () => {
        try {
            const token = Cookies.get('access_token');
            const queryParams = new URLSearchParams();
            if (filterLevel && filterLevel !== 'all') queryParams.append('level', filterLevel);
            if (search) queryParams.append('search', search);

            const res = await fetch(`${API_URL}/admin/kanji/export/csv?${queryParams.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Gagal mengekspor data.');

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = `kanji_export_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Export failed", error);
            toast.error(error.message || 'Gagal mengekspor data.');
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
                    <p className="text-xs font-bold text-neutral-500 uppercase tracking-[0.2em] mt-3">Total: {pagination.total} Entitas</p>
                </div>
                <Link 
                    href="/admin/kanji/new" 
                    className="bg-red-600 hover:bg-red-500 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-red-600/20 active:scale-95 text-center"
                >
                    + Tambah Kanji Baru
                </Link>
            </div>

            <div className="p-6 rounded-[2rem] border backdrop-blur-xl bg-white/5 border-white/5 shadow-2xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-sm font-black uppercase tracking-widest text-white">Visibilitas Kanji</h2>
                        <p className="text-xs text-neutral-500 mt-2">Klik level untuk mengatur data yang tampil di publik dan latihan Kanji. Perubahan tersimpan otomatis.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {[5, 4, 3, 2, 1].map(level => {
                            const isDisabled = disabledLevels.includes(level);
                            return (
                                <button
                                    key={level}
                                    type="button"
                                    disabled={savingVisibility}
                                    onClick={() => toggleVisibility(level)}
                                    className={`px-4 py-2 rounded-xl border text-xs font-black transition-all ${isDisabled
                                        ? 'bg-red-600/20 border-red-500/40 text-red-300'
                                        : 'bg-emerald-600/20 border-emerald-500/40 text-emerald-300'
                                    } disabled:opacity-50`}
                                >
                                    N{level} {isDisabled ? 'OFF' : 'ON'}
                                </button>
                            );
                        })}
                    </div>
                </div>
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
                            onClick={handleExportPdf}
                            className="p-4 rounded-2xl transition-all active:scale-95 bg-red-600/10 text-red-400 border border-red-500/20"
                            title="Ekspor materi JBook sebagai PDF"
                            aria-label="Ekspor materi JBook sebagai PDF"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v12m0 0 4-4m-4 4-4-4M5 17v3h14v-3" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 3h5l3 3v4" /></svg>
                        </button>
                        <button
                            onClick={handleExportCsv}
                            className="p-4 rounded-2xl transition-all active:scale-95 bg-emerald-600/10 text-emerald-500 border border-emerald-500/20"
                            title="Ekspor data CSV"
                            aria-label="Ekspor data CSV"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4-4 4m0 0l-4-4m4 4V4" /></svg>
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
                                                        href={getKanjiHref(k)} 
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
                                        onClick={() => router.push(getKanjiHref(k))}
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

            {!loading && pagination.pages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-white/5 bg-white/5 px-5 py-4">
                    <p className="text-xs font-bold text-neutral-500">Halaman {pagination.page} dari {pagination.pages} ({pagination.total} hasil)</p>
                    <Pagination
                        currentPage={page}
                        totalPages={pagination.pages}
                        onPageChange={setPage}
                        activeClassName="bg-red-600/20 border-red-500/30 text-red-400"
                        buttonClassName="bg-neutral-800 border-white/10 text-white hover:bg-neutral-700"
                    />
                </div>
            )}

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
                        if (!res.ok) {
                            const text = await res.text().catch(() => res.statusText);
                            throw new Error(text || `Status ${res.status}`);
                        }
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

function buildKanjiWorkbookHtml(items, selectedLevel, selectedSearch) {
    const safe = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    })[character]);
    const list = (values) => Array.isArray(values) && values.length
        ? values.map((value) => safe(value)).join('、')
        : 'Belum tersedia';
    const levels = [...new Set(items.map((item) => item.jlpt_level))].sort((a, b) => b - a);
    const levelLabel = selectedLevel ? `N${safe(selectedLevel)}` : levels.map((level) => `N${level}`).join(', ');
    const dateLabel = new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(new Date());
    const entries = items.map((item, index) => {
        const examples = Array.isArray(item.examples) && item.examples.length
            ? `<ul>${item.examples.map((example) => `<li><strong lang="ja">${safe(example.word)}</strong><span class="reading">${safe(example.reading || '')}</span><span>${safe(example.meaning || '')}</span></li>`).join('')}</ul>`
            : '<p class="muted">Belum ada contoh kata.</p>';
        return `<article class="kanji-entry">
            <div class="entry-top"><span>JBOOK KANJI WORKBOOK</span><span>${String(index + 1).padStart(2, '0')} / ${items.length}</span></div>
            <div class="entry-heading"><div class="character" lang="ja">${safe(item.character)}</div><div><p class="eyebrow">KANJI • JLPT N${safe(item.jlpt_level)}</p><h2>${safe(item.meaning)}</h2><p class="meta">${item.strokes ? `${safe(item.strokes)} goresan` : 'Goresan tidak dicatat'}${item.radical ? ` · Radikal ${safe(item.radical)}` : ''}${item.word_type ? ` · ${safe(item.word_type)}` : ''}</p></div></div>
            <div class="reading-grid"><section><h3>Onyomi · 音読み</h3><p lang="ja">${list(item.onyomi)}</p></section><section><h3>Kunyomi · 訓読み</h3><p lang="ja">${list(item.kunyomi)}</p></section></div>
            <section class="examples"><h3>Contoh kata</h3>${examples}</section>
            <section class="practice"><h3>Latihan menulis</h3><p>Tulis kanji ini sambil mengingat arti dan bacaannya.</p><div class="writing-grid">${Array.from({ length: 6 }, () => '<span lang="ja">&nbsp;</span>').join('')}</div></section>
        </article>`;
    }).join('');

    return `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>JBook - Materi Kanji ${levelLabel}</title><style>
        @page{size:A4;margin:16mm 15mm 18mm}*{box-sizing:border-box}body{margin:0;color:#202a2b;font:12px/1.55 Arial,"Noto Sans JP","Yu Gothic",Meiryo,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}.cover{min-height:255mm;display:flex;flex-direction:column;justify-content:space-between;border-top:9px solid #bd342b;padding:16mm 3mm 8mm;page-break-after:always}.brand{font-size:12px;font-weight:800;letter-spacing:2px;color:#bd342b}.cover h1{font:700 42px/1.1 Georgia,"Yu Mincho",serif;margin:8px 0 14px;color:#1d2929}.cover .subtitle{font-size:17px;color:#576363}.cover-block{max-width:145mm}.cover-meta{border-top:1px solid #cbd2ce;padding-top:12px;color:#465352}.cover-meta strong{color:#1d2929}.cover-note{background:#f1f4ef;border-left:4px solid #94a899;padding:12px 16px;margin-top:28px}.entries{display:block}.kanji-entry{page-break-inside:avoid;break-inside:avoid;border-bottom:1px solid #cbd2ce;padding:0 0 9mm;margin:0 0 9mm}.entry-top{display:flex;justify-content:space-between;color:#7c8986;font-size:9px;font-weight:700;letter-spacing:1.2px;border-bottom:1px solid #dce1dc;padding-bottom:7px}.entry-heading{display:flex;align-items:center;gap:20px;padding:13px 0}.character{font:80px/1.1 "Noto Serif CJK JP","Yu Mincho",serif;color:#bd342b;min-width:90px;text-align:center}.eyebrow{font-size:9px;letter-spacing:1.2px;color:#bd342b;font-weight:700;margin:0 0 4px}.entry-heading h2{font:700 24px/1.2 Georgia,"Yu Mincho",serif;margin:0}.meta,.muted{color:#687471;margin:5px 0 0}.reading-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.reading-grid section,.examples,.practice{border-top:1px solid #cbd2ce;padding:9px 0}.kanji-entry h3{font-size:10px;letter-spacing:.7px;text-transform:uppercase;margin:0 0 7px;color:#51605c}.reading-grid p{font-size:15px;margin:0}.examples ul{list-style:none;margin:0;padding:0}.examples li{display:grid;grid-template-columns:1.1fr 1fr 1.6fr;gap:8px;padding:5px 0;border-bottom:1px solid #edf0ec}.examples li strong{font-size:15px;font-weight:600}.reading{color:#66736f}.practice p{margin:0 0 7px;color:#687471}.writing-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:7px}.writing-grid span{height:27mm;border:1px solid #cbd2ce;background-image:linear-gradient(90deg,transparent calc(50% - .5px),#e4e9e4 50%,transparent calc(50% + .5px)),linear-gradient(transparent calc(50% - .5px),#e4e9e4 50%,transparent calc(50% + .5px));display:grid;place-items:center;font:42px/1 "Noto Serif CJK JP","Yu Mincho",serif;color:#d7ddda}.footer{margin-top:10px;color:#75817d;font-size:9px}@media screen{body{max-width:210mm;margin:20px auto;padding:18mm 15mm;box-shadow:0 2px 24px #0002}.cover{min-height:245mm}}@media print{.kanji-entry{page-break-inside:avoid;break-inside:avoid}.footer{position:fixed;bottom:-12mm;left:0}}
    </style></head><body><section class="cover"><div class="brand">JBOOK <span style="color:#293a38">/ BELAJAR BAHASA JEPANG</span></div><div class="cover-block"><p class="eyebrow">MATERI BELAJAR · KANJI</p><h1>Kanji ${levelLabel}</h1><p class="subtitle">Kumpulan kanji untuk memahami arti, mengenali cara baca, dan berlatih menulis.</p><div class="cover-note"><strong>Urutan belajar</strong><br>Kenali bentuk dan arti kanji, baca onyomi serta kunyomi, pelajari contoh kata, lalu tulis ulang pada kotak latihan.</div></div><div class="cover-meta"><strong>${items.length} kanji</strong><br>Disusun ${dateLabel}<br><span class="footer">Materi administrasi JBook${selectedSearch ? ` · Hasil pencarian: ${safe(selectedSearch)}` : ''}</span></div></section><main class="entries">${entries}</main></body></html>`;
}

function normalizeKanjiPage(data, page, limit) {
    if (!Array.isArray(data)) {
        return {
            items: data.items || [],
            pagination: data,
        };
    }

    const total = data.length;
    const pages = Math.max(1, Math.ceil(total / limit));
    const safePage = Math.min(Math.max(page, 1), pages);
    const start = (safePage - 1) * limit;
    return {
        items: data.slice(start, start + limit),
        pagination: { total, pages, page: safePage, limit },
    };
}