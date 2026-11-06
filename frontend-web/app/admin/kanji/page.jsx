'use client';

import { useState, useEffect, useCallback } from 'react';
import { API_URL, setKanjiVisibilityCache } from '@/lib/api';
import Link from 'next/link';
import { getKanjiHref } from '@/lib/kanji-route';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { useDebounce } from 'use-debounce';
import { appToast as toast } from '@/components/common/AppMessage';
import ConfirmationModal from '@/components/common/ConfirmationModal';
import Pagination from '@/components/common/Pagination';
import { Eye, Pencil, Search, Trash2 } from 'lucide-react';
import AdminDataTable from '@/components/admin/AdminDataTable';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminFilterBar from '@/components/admin/AdminFilterBar';

export default function KanjiAdmin() {
    const [kanjiList, setKanjiList] = useState([]);
    const [duplicates, setDuplicates] = useState([]);
    const [bulkDeleting, setBulkDeleting] = useState(false);
    const [previewingAll, setPreviewingAll] = useState(false);
    const [loading, setLoading] = useState(true);
    const [filterLevel, setFilterLevel] = useState('');
    const [search, setSearch] = useState('');
    const [debouncedSearch] = useDebounce(search, 400);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ total: 0, pages: 1, page: 1 });
    const [pendingDelete, setPendingDelete] = useState(null);
    const [disabledLevels, setDisabledLevels] = useState([]);
    const [savingVisibility, setSavingVisibility] = useState(false);
    const router = useRouter();

    useEffect(() => { setPage(1); }, [filterLevel, debouncedSearch]);

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
                setDisabledLevels(data.disabled_levels || []);
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
        } catch {
            toast.error('Gagal mengubah visibilitas level Kanji.');
        } finally {
            setSavingVisibility(false);
        }
    };

    const fetchKanjis = useCallback(async () => {
        setLoading(true);

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
            } else {
                toast.error(`Gagal mengambil data Kanji: ${res.status} ${res.statusText}`);
            }
        } catch (error) {
            console.error("Failed to fetch", error);
            toast.error('Terjadi kesalahan jaringan saat memuat Kanji.');
        } finally {
            setLoading(false);
        }
    }, [page, filterLevel, debouncedSearch]);

    useEffect(() => {
        fetchKanjis();
    }, [fetchKanjis]);

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

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20">
            <AdminPageHeader title="Kanji" description={`${pagination.total} entri`} breadcrumbs={[{ label: 'Kanji' }]} action={<Link href="/admin/kanji/new" className="rounded-lg bg-[var(--brand-red)] px-4 py-2.5 text-sm font-medium text-white">Tambah Kanji</Link>} />
            {/* Page Header */}
            <div hidden className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-5xl font-black tracking-tighter text-[var(--foreground)]">
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

            <div className="admin-surface p-6 rounded-[2rem] border shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-sm font-black uppercase tracking-widest text-[var(--foreground)]">Visibilitas Kanji</h2>
                        <p className="mt-2 text-xs text-[var(--admin-muted)]">Klik level untuk mengatur data yang tampil di publik dan latihan Kanji. Perubahan tersimpan otomatis.</p>
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
            <AdminFilterBar className="admin-surface p-6 rounded-[2rem] border shadow-sm" onReset={() => { setSearch(''); setFilterLevel(''); }}>
                <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="relative flex-1 w-full">
                        <input 
                            type="text" 
                            placeholder="Cari berdasarkan karakter atau arti..." 
                            className="admin-control w-full p-4 pl-12 rounded-2xl border font-bold text-sm transition-all outline-none focus:ring-2 focus:ring-red-600/50"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <select 
                            className="admin-control flex-1 md:w-32 p-4 rounded-2xl border font-bold text-sm outline-none cursor-pointer"
                            value={filterLevel} 
                            onChange={(e) => setFilterLevel(e.target.value)}
                        >
                            <option value="">Semua Level</option>
                            {[5, 4, 3, 2, 1].map(l => <option key={l} value={l}>N{l}</option>)}
                        </select>
                        
                        <Link href="/admin/kanji/tools" className="rounded-xl border border-[var(--border-color)] px-4 py-2.5 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--background)]">Check duplicates</Link>
                    </div>
                </div>
            </AdminFilterBar>

            <AdminDataTable
                columns={[
                    { key: 'character', label: 'Karakter' },
                    { key: 'meaning', label: 'Arti', render: item => <span><strong>{item.meaning}</strong><span className="mt-1 block text-xs text-[var(--foreground)]/55">音: {(item.onyomi || []).join(', ')} · 訓: {(item.kunyomi || []).join(', ')}</span></span> },
                    { key: 'jlpt_level', label: 'Level', render: item => `N${item.jlpt_level}` },
                ]}
                rows={kanjiList}
                getRowId={item => item.id}
                loading={loading}
                emptyTitle="Belum ada Kanji"
                emptyMessage="Ubah pencarian atau tambahkan data baru."
                page={page}
                pages={pagination.pages}
                onPageChange={setPage}
                onView={item => `/admin/kanji/${item.id}`}
                onEdit={item => `/admin/kanji/${item.id}/edit`}
                onDelete={item => setPendingDelete(item.id)}
            />

            {/* Legacy table retained temporarily for the existing mobile presentation. */}
            <div hidden className="admin-surface rounded-[2.5rem] border overflow-hidden transition-all">
                {loading ? (
                    <div className="animate-pulse space-y-3 p-5 sm:p-6">{[1, 2, 3, 4, 5].map(row => <div key={row} className="h-14 rounded-lg bg-[var(--admin-control)]" />)}</div>
                ) : kanjiList.length === 0 ? (
                    <div className="px-6 py-12 text-center">
                        <Search size={30} className="mx-auto text-[var(--foreground)]/35" />
                        <p className="mt-3 text-sm font-semibold text-[var(--foreground)]">Belum ada Kanji</p>
                        <p className="mt-1 text-sm text-[var(--foreground)]/55">Ubah pencarian atau tambahkan data baru.</p>
                        <Link href="/admin/kanji/new" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[var(--brand-red)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-red)]">Tambah Kanji</Link>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="admin-table min-w-full divide-y">
                                <thead className="admin-table-head">
                                    <tr>
                                        <th className="admin-table-heading px-6 py-4 text-left text-xs font-black uppercase tracking-widest">Karakter</th>
                                        <th className="admin-table-heading px-6 py-4 text-left text-xs font-black uppercase tracking-widest">Arti & Detail</th>
                                        <th className="admin-table-heading px-6 py-4 text-left text-xs font-black uppercase tracking-widest">Level</th>
                                        <th className="admin-table-heading px-6 py-4 text-right text-xs font-black uppercase tracking-widest">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="admin-table-body divide-y">
                                    {kanjiList.map((k) => (
                                        <tr key={k.id} className="admin-table-row">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-4xl font-black text-[var(--foreground)]">{k.character}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-black text-lg text-[var(--foreground)]">{k.meaning}</div>
                                                <div className="flex flex-wrap gap-x-4 mt-1">
                                                    <div className="text-xs font-bold text-[var(--admin-muted)] uppercase tracking-widest"><span className="text-red-500">音:</span> {k.onyomi.join(', ')}</div>
                                                    <div className="text-xs font-bold text-[var(--admin-muted)] uppercase tracking-widest"><span className="text-blue-500">訓:</span> {k.kunyomi.join(', ')}</div>
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
                                                        className="rounded-lg p-2 text-[var(--accent-green)] transition-colors hover:bg-[var(--accent-green)]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent-green)]"
                                                        title="Lihat Publik"
                                                        aria-label={`Lihat ${k.character} di halaman publik`}
                                                    >
                                                        <Eye size={18} />
                                                    </Link>
                                                    <Link 
                                                        href={`/admin/kanji/${k.id}/edit`}
                                                        className="rounded-lg p-2 text-[var(--accent-blue)] transition-colors hover:bg-[var(--accent-blue)]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent-blue)]"
                                                        title="Edit Data"
                                                        aria-label={`Edit ${k.character}`}
                                                    >
                                                        <Pencil size={18} />
                                                    </Link>
                                                    <button 
                                                        onClick={(e) => handleDelete(e, k.id)} 
                                                        className="rounded-lg p-2 text-[var(--brand-red)] transition-colors hover:bg-[var(--brand-red)]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-red)]"
                                                        title="Hapus Data"
                                                        aria-label={`Hapus ${k.character}`}
                                                    >
                                                        <Trash2 size={18} />
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
                                <div key={k.id} className="divide-[var(--admin-divider)]">
                                    <div
                                        className="flex items-center gap-4 px-5 py-4 active:bg-[var(--admin-hover)] transition-colors cursor-pointer"
                                        onClick={() => router.push(getKanjiHref(k))}
                                    >
                                        <div className="text-4xl font-black text-[var(--foreground)]">{k.character}</div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-black text-lg text-[var(--foreground)]">{k.meaning}</div>
                                            <div className="flex flex-wrap gap-x-2 mt-1">
                                                <div className="text-xs font-bold text-[var(--admin-muted)] uppercase tracking-widest"><span className="text-red-500">音:</span> {k.onyomi.join(', ')}</div>
                                                <div className="text-xs font-bold text-[var(--admin-muted)] uppercase tracking-widest"><span className="text-blue-500">訓:</span> {k.kunyomi.join(', ')}</div>
                                            </div>
                                            <span className="inline-flex mt-2 px-3 py-1 text-xs font-black rounded-full bg-red-600/10 text-red-500 border border-red-500/20">N{k.jlpt_level}</span>
                                        </div>
                                        <svg className="w-5 h-5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                    <div className="admin-control flex items-center justify-between px-5 py-3 border-t">
                                        <div className="flex items-center gap-2">
                                            <Link 
                                                href={`/admin/kanji/${k.id}/edit`}
                                                aria-label={`Edit ${k.character}`}
                                                className="rounded-lg p-2 text-[var(--accent-blue)] transition-colors hover:bg-[var(--accent-blue)]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent-blue)]"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <Pencil size={18} />
                                            </Link>
                                            <button 
                                                onClick={(e) => handleDelete(e, k.id)} 
                                                aria-label={`Hapus ${k.character}`}
                                                className="rounded-lg p-2 text-[var(--brand-red)] transition-colors hover:bg-[var(--brand-red)]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-red)]"
                                            >
                                                <Trash2 size={18} />
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
                <div hidden className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-white/5 bg-white/5 px-5 py-4">
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
        <div hidden className="fixed right-6 bottom-6 z-50 flex flex-col gap-3">
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