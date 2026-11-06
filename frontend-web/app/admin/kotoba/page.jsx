'use client';

import { useState, useEffect, useCallback } from 'react';
import { API_URL, setVocabVisibilityCache } from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { appToast as toast } from '@/components/common/AppMessage';
import ConfirmationModal from '@/components/common/ConfirmationModal';
import Pagination from '@/components/common/Pagination';
import { useDebounce } from 'use-debounce';
import { Eye, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import AdminDataTable from '@/components/admin/AdminDataTable';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminFilterBar from '@/components/admin/AdminFilterBar';

export default function KotobaAdmin() {
    const [vocabs, setVocabs] = useState([]);
    const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [debouncedSearch] = useDebounce(search, 400);
    const [level, setLevel] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const router = useRouter();

    const [duplicates, setDuplicates] = useState([]);
    const [bulkDeleting, setBulkDeleting] = useState(false);
    const [pendingDelete, setPendingDelete] = useState(null);
    const [previewingAll, setPreviewingAll] = useState(false);
    const [disabledLevels, setDisabledLevels] = useState([]);
    const [savingVisibility, setSavingVisibility] = useState(false);

    useEffect(() => { 
        setCurrentPage(1);
    }, [search, level]);

    useEffect(() => {
        fetchVisibility();
    }, []);

    const fetchVisibility = async () => {
        try {
            const token = Cookies.get('access_token');
            const res = await fetch(`${API_URL}/admin/vocab/visibility`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setDisabledLevels(data.disabled_levels || []);
            }
        } catch (error) {
            console.error('Failed to fetch Kotoba visibility', error);
        }
    };

    const toggleVisibility = async (lvl) => {
        const nextDisabledLevels = disabledLevels.includes(lvl)
            ? disabledLevels.filter(item => item !== lvl)
            : [...disabledLevels, lvl].sort((a, b) => a - b);
        setSavingVisibility(true);
        try {
            const token = Cookies.get('access_token');
            const res = await fetch(`${API_URL}/admin/vocab/visibility`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ disabled_levels: nextDisabledLevels })
            });
            if (!res.ok) throw new Error('Visibility update failed');
            setDisabledLevels(nextDisabledLevels);
            setVocabVisibilityCache(nextDisabledLevels);
            toast.success(`Kotoba N${lvl} ${nextDisabledLevels.includes(lvl) ? 'dinonaktifkan' : 'diaktifkan'}`);
        } catch {
            toast.error('Gagal mengubah visibilitas level Kotoba.');
        } finally {
            setSavingVisibility(false);
        }
    };

    const fetchVocabs = useCallback(async () => {
        setLoading(true);

        try {
            const token = Cookies.get('access_token');
            const queryParams = new URLSearchParams({ page: String(currentPage), limit: '50' });
            if (level) queryParams.append('level', level);
            if (debouncedSearch) queryParams.append('search', debouncedSearch);
            const res = await fetch(`${API_URL}/admin/vocab?${queryParams.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.ok) {
                const data = await res.json();
                const result = normalizeKotobaPage(data, currentPage, 50);
                setVocabs(result.items);
                setPagination(result.pagination);
                if (result.pagination.page !== currentPage) setCurrentPage(result.pagination.page);
            } else {
                const errorData = await res.json().catch(() => ({}));
                console.error("Fetch failed:", res.status, errorData);
                if (res.status === 403) {
                    toast.error("Admin access denied. Please login with admin account (imronm1309@gmail.com)");
                } else if (res.status === 500) {
                    toast.error(`Server Error 500. Silakan pastikan server PythonAnywhere sudah diperbarui.`);
                } else {
                    toast.error(`Gagal mengambil data: ${res.status} ${res.statusText}`);
                }
            }
        } catch (error) {
            console.error("Failed to fetch vocabs", error);
            toast.error(`Terjadi kesalahan jaringan: ${error.message}`);
        } finally {
            setLoading(false);
        }
    }, [currentPage, level, debouncedSearch]);

    useEffect(() => {
        fetchVocabs();
    }, [fetchVocabs]);

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
                fetchVocabs();
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

    const levelColor = (level) => {
        const colors = {
            5: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
            4: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
            3: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
            2: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
            1: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
        };
        return colors[level] || 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400';
    };

    return (
        <div className="space-y-6">
            <AdminPageHeader title="Kotoba" description="Kelola kosakata bahasa Jepang." breadcrumbs={[{ label: 'Kotoba' }]} action={<Link href="/admin/kotoba/new" className="rounded-lg bg-[var(--brand-red)] px-4 py-2.5 text-sm font-medium text-white">Tambah Kotoba</Link>} />
            {/* Header */}
            <div hidden className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-[var(--foreground)]">
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

            {/* Visibilitas Kotoba per Level */}
            <div className="p-6 rounded-[2rem] border backdrop-blur-xl bg-white/5 border-white/5 shadow-2xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-sm font-black uppercase tracking-widest text-[var(--foreground)]">Visibilitas Kotoba</h2>
                        <p className="mt-2 text-xs text-[var(--admin-muted)]">Klik level untuk mengaktifkan atau menonaktifkan kosakata yang tampil di publik dan latihan. Perubahan tersimpan otomatis.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {[5, 4, 3, 2, 1].map(lvl => {
                            const isDisabled = disabledLevels.includes(lvl);
                            return (
                                <button
                                    key={lvl}
                                    type="button"
                                    disabled={savingVisibility}
                                    onClick={() => toggleVisibility(lvl)}
                                    className={`px-4 py-2 rounded-xl border text-xs font-black transition-all cursor-pointer ${isDisabled
                                        ? 'bg-red-600/20 border-red-500/40 text-red-300'
                                        : 'bg-emerald-600/20 border-emerald-500/40 text-emerald-300'
                                    } disabled:opacity-50`}
                                >
                                    N{lvl} {isDisabled ? 'OFF' : 'ON'}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Filters & Search */}
            <AdminFilterBar className="admin-surface p-6 rounded-3xl border" onReset={() => { setSearch(''); setLevel(''); }}>
                <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
                    <div className="flex flex-1 flex-col md:flex-row gap-3">
                        <select
                            className="admin-control flex-1 px-4 py-3 rounded-2xl border text-sm font-bold focus:outline-none focus:ring-2 focus:ring-red-500/30"
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
                            className="admin-control flex-1 px-4 py-3 rounded-2xl border text-sm font-bold placeholder:text-[var(--admin-muted)] focus:outline-none focus:ring-2 focus:ring-red-500/30"
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
                    <Link href="/admin/kotoba/tools" className="inline-flex items-center justify-center rounded-xl border border-[var(--border-color)] px-4 py-2.5 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--background)]">Check duplicates</Link>
                </div>
            </AdminFilterBar>

            <AdminDataTable
                columns={[
                    { key: 'word', label: 'Kata' },
                    { key: 'reading', label: 'Bacaan' },
                    { key: 'meaning', label: 'Arti' },
                    { key: 'jlpt_level', label: 'Level', render: item => `N${item.jlpt_level}` },
                ]}
                rows={vocabs}
                getRowId={item => item.id}
                loading={loading}
                emptyTitle="Belum ada Kotoba"
                emptyMessage="Ubah pencarian atau tambahkan data baru."
                page={currentPage}
                pages={pagination.pages}
                onPageChange={setCurrentPage}
                onView={item => `/admin/kotoba/${item.id}`}
                onEdit={item => `/admin/kotoba/${item.id}/edit`}
                onDelete={item => setPendingDelete(item.id)}
            />

            {/* Legacy table retained temporarily for its card layout. */}
            <div hidden className="admin-surface rounded-3xl border overflow-hidden">
                {loading ? (
                    <div className="animate-pulse space-y-3 p-5 sm:p-6">{[1, 2, 3, 4, 5].map(row => <div key={row} className="h-14 rounded-lg bg-[var(--admin-control)]" />)}</div>
                ) : vocabs.length === 0 ? (
                    <div className="px-6 py-12 text-center">
                        <Search size={30} className="mx-auto text-[var(--foreground)]/35" />
                        <p className="mt-3 text-sm font-semibold text-[var(--foreground)]">Belum ada Kotoba</p>
                        <p className="mt-1 text-sm text-[var(--foreground)]/55">Ubah pencarian atau tambahkan data baru.</p>
                        <Link href="/admin/kotoba/new" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[var(--brand-red)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-red)]"><Plus size={16} /> Tambah Kotoba</Link>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="admin-table min-w-full divide-y">
                                <thead className="admin-table-head">
                                    <tr>
                                        <th className="admin-table-heading px-6 py-4 text-left text-xs font-black uppercase tracking-widest">Kata</th>
                                        <th className="admin-table-heading px-6 py-4 text-left text-xs font-black uppercase tracking-widest">Bacaan</th>
                                        <th className="admin-table-heading px-6 py-4 text-left text-xs font-black uppercase tracking-widest">Arti</th>
                                        <th className="admin-table-heading px-6 py-4 text-left text-xs font-black uppercase tracking-widest">Level</th>
                                        <th className="admin-table-heading px-6 py-4 text-right text-xs font-black uppercase tracking-widest">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="admin-table-body divide-y">
                                    {vocabs.map((v) => (
                                        <tr key={v.id} className="admin-table-row">
                                            <td className="px-6 py-4 whitespace-nowrap text-lg font-black text-[var(--foreground)]">{v.word}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-[var(--foreground)]/75">{v.reading}</td>
                                            <td className="px-6 py-4 text-sm font-bold text-[var(--foreground)]/75 max-w-md truncate">{v.meaning}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-3 py-1 inline-flex text-xs font-black rounded-full ${levelColor(v.jlpt_level)}`}>
                                                    N{v.jlpt_level}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link href={`/kotoba/${v.id}`} target="_blank" aria-label={`Lihat ${v.word}`} className="rounded-lg p-2 text-[var(--accent-green)] transition-colors hover:bg-[var(--accent-green)]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent-green)]">
                                                        <Eye size={18} />
                                                    </Link>
                                                    <Link href={`/admin/kotoba/${v.id}/edit`} aria-label={`Edit ${v.word}`} className="rounded-lg p-2 text-[var(--accent-blue)] transition-colors hover:bg-[var(--accent-blue)]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent-blue)]">
                                                        <Pencil size={18} />
                                                    </Link>
                                                    <button onClick={(e) => handleDelete(e, v.id)} aria-label={`Hapus ${v.word}`} className="rounded-lg p-2 text-[var(--brand-red)] transition-colors hover:bg-[var(--brand-red)]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-red)]">
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
                            {vocabs.map((v) => (
                                <div key={v.id} className="divide-[var(--admin-divider)]">
                                    <div
                                        className="flex items-center gap-4 px-5 py-4 active:bg-[var(--admin-hover)] transition-colors cursor-pointer"
                                        onClick={() => router.push(`/kotoba/${v.id}`)}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xl font-black text-[var(--foreground)]">{v.word}</div>
                                            <div className="text-sm font-bold text-[var(--foreground)]/75">{v.reading}</div>
                                            <div className="mt-1 text-sm font-bold text-[var(--foreground)]/80 truncate">{v.meaning}</div>
                                            <span className={`inline-flex mt-2 px-2.5 py-1 text-xs font-black rounded-full ${levelColor(v.jlpt_level)}`}>
                                                N{v.jlpt_level}
                                            </span>
                                        </div>
                                        <svg className="w-5 h-5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                    <div className="admin-control flex items-center justify-between px-5 py-3 border-t">
                                        <div className="flex items-center gap-2">
                                            <Link href={`/admin/kotoba/${v.id}/edit`} aria-label={`Edit ${v.word}`} className="rounded-lg p-2 text-[var(--accent-blue)] transition-colors hover:bg-[var(--accent-blue)]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent-blue)]" onClick={(e) => e.stopPropagation()}>
                                                <Pencil size={18} />
                                            </Link>
                                            <button
                                                onClick={(e) => handleDelete(e, v.id)}
                                                aria-label={`Hapus ${v.word}`}
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

                {/* Pagination Controls */}
                {!loading && pagination.pages > 1 && (
                    <div className="admin-control px-6 py-5 border-t">
                        <div className="flex items-center justify-between gap-4">
                            <div className="text-xs font-bold text-neutral-500">
                                Halaman <span className="text-gray-900 dark:text-white">{pagination.page}</span> dari <span className="text-gray-900 dark:text-white">{pagination.pages}</span> ({pagination.total} hasil)
                            </div>
                            <Pagination
                                currentPage={currentPage}
                                totalPages={pagination.pages}
                                onPageChange={setCurrentPage}
                                activeClassName="bg-red-600/20 border-red-500/30 text-red-400"
                                buttonClassName="bg-neutral-800 border-white/10 text-white hover:bg-neutral-700"
                            />
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
                                                        fetchVocabs();
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
            <div hidden className="fixed right-6 bottom-6 z-50 flex flex-col gap-3">
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
                            fetchVocabs();
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

function normalizeKotobaPage(data, page, limit) {
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
