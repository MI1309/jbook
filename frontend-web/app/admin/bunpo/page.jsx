'use client';

import { useState, useEffect, useCallback } from 'react';
import { API_URL, setBunpoVisibilityCache } from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDebounce } from 'use-debounce';
import Cookies from 'js-cookie';
import { appToast as toast } from '@/components/common/AppMessage';
import ConfirmationModal from '@/components/common/ConfirmationModal';
import Pagination from '@/components/common/Pagination';
import { getBunpoSlug } from '@/data/bunpoSlugs';
import BunpoImportPanel from './BunpoImportPanel';
import { Download, Eye, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { AdminEmptyState, AdminErrorState, AdminSkeleton } from '@/components/admin/AdminFeedback';
import AdminDataTable from '@/components/admin/AdminDataTable';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminFilterBar from '@/components/admin/AdminFilterBar';

export default function BunpoAdmin() {
    const [bunpos, setBunpos] = useState([]);
    const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState('');
    const [filterLevel, setFilterLevel] = useState('');
    const [filterChapter, setFilterChapter] = useState('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const LIMIT = 20;
    const [pendingDelete, setPendingDelete] = useState(null);
    const [disabledLevels, setDisabledLevels] = useState([]);
    const [savingVisibility, setSavingVisibility] = useState(false);
    const router = useRouter();

    const [debouncedChapter] = useDebounce(filterChapter, 500);
    const [debouncedSearch] = useDebounce(search, 500);

    useEffect(() => { setPage(1); }, [filterLevel, debouncedChapter, debouncedSearch]);
    
    useEffect(() => {
        fetchVisibility();
    }, []);

    const fetchVisibility = async () => {
        try {
            const token = Cookies.get('access_token');
            const res = await fetch(`${API_URL}/admin/bunpo/visibility`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setDisabledLevels(data.disabled_levels || []);
            }
        } catch (error) {
            console.error('Failed to fetch Bunpo visibility', error);
        }
    };

    const toggleVisibility = async (level) => {
        const nextDisabledLevels = disabledLevels.includes(level)
            ? disabledLevels.filter(item => item !== level)
            : [...disabledLevels, level].sort((a, b) => a - b);
        setSavingVisibility(true);
        try {
            const token = Cookies.get('access_token');
            const res = await fetch(`${API_URL}/admin/bunpo/visibility`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ disabled_levels: nextDisabledLevels })
            });
            if (!res.ok) throw new Error('Visibility update failed');
            setDisabledLevels(nextDisabledLevels);
            setBunpoVisibilityCache(nextDisabledLevels);
            toast.success(`Bunpo N${level} ${nextDisabledLevels.includes(level) ? 'dinonaktifkan' : 'diaktifkan'}`);
        } catch {
            toast.error('Gagal mengubah visibilitas level Bunpo.');
        } finally {
            setSavingVisibility(false);
        }
    };

    const fetchBunpos = useCallback(async () => {
        setLoading(true);
        try {
            const token = Cookies.get('access_token');
            const queryParams = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
            if (filterLevel) queryParams.append('level', filterLevel);
            if (debouncedChapter) queryParams.append('chapter', debouncedChapter);
            if (debouncedSearch) queryParams.append('search', debouncedSearch);
            const url = `${API_URL}/admin/grammar?${queryParams.toString()}`;
            const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) {
                const data = await res.json();
                const result = normalizeBunpoPage(data, page, LIMIT);
                setBunpos(result.items);
                setPagination(result.pagination);
                setFetchError('');
                if (result.pagination.page !== page) setPage(result.pagination.page);
            } else {
                setBunpos([]);
                setFetchError(res.status === 401 || res.status === 403
                    ? 'Akses ditolak. Pastikan Anda sudah login dengan akun Admin, lalu muat ulang halaman.'
                    : 'Gagal memuat data Bunpo. Silakan coba lagi beberapa saat.');
            }
        } catch (error) {
            console.error("Failed to fetch bunpos", error);
            setBunpos([]);
            setFetchError('Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi.');
        } finally {
            setLoading(false);
        }
    }, [page, filterLevel, debouncedChapter, debouncedSearch]);

    useEffect(() => {
        fetchBunpos();
    }, [fetchBunpos]);

    const handleDelete = (e, id) => {
        e.stopPropagation();
        setPendingDelete(id);
    };

    const confirmDelete = async () => {
        if (!pendingDelete) return;
        try {
            const token = Cookies.get('access_token');
            const res = await fetch(`${API_URL}/admin/bunpo/${pendingDelete}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                toast.success('Bunpo berhasil dihapus.');
                fetchBunpos();
            } else {
                toast.error('Gagal menghapus Bunpo.');
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
            5: 'bg-[var(--accent-green)]/10 text-[var(--accent-green)]',
            4: 'bg-[var(--accent-blue)]/10 text-[var(--accent-blue)]',
            3: 'bg-[var(--accent-gold)]/12 text-[var(--accent-gold)]',
            2: 'bg-[var(--brand-red)]/10 text-[var(--brand-red)]',
            1: 'bg-[var(--foreground)]/8 text-[var(--foreground)]/70'
        };
        return colors[level] || 'bg-[var(--background)] text-[var(--foreground)]/65';
    };

    return (
        <div className="space-y-6">
            <AdminPageHeader title="Bunpo" description="Kelola materi tata bahasa dan contoh kalimat." breadcrumbs={[{ label: 'Bunpo' }]} action={<div className="flex flex-wrap gap-2"><Link href="/admin/bunpo/import" className="rounded-lg border border-[var(--border-color)] px-4 py-2.5 text-sm">Import</Link><Link href="/admin/bunpo/new" className="rounded-lg bg-[var(--brand-red)] px-4 py-2.5 text-sm font-medium text-white">Tambah Bunpo</Link></div>} />
            {/* Header */}
            <div hidden className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <p className="text-sm text-[var(--foreground)]/55">Koleksi / Bunpo</p>
                    <h1 className="mt-1 text-2xl font-semibold text-[var(--foreground)]">Bunpo</h1>
                    <p className="mt-1 text-sm text-[var(--foreground)]/60">Kelola materi tata bahasa dan contoh kalimat.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Link href="/admin/bunpo/import" className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-color)] px-4 py-2.5 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--card-bg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-red)]"><Download size={16} /> Import data</Link>
                    <Link href="/admin/bunpo/new" className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-red)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-red)]"><Plus size={16} /> Tambah Bunpo</Link>
                </div>
            </div>

            <BunpoImportPanel onImported={fetchBunpos} />

            <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-5 sm:p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-sm font-semibold text-[var(--foreground)]">Visibilitas Bunpo</h2>
                        <p className="mt-1 text-sm text-[var(--foreground)]/55">Atur level yang tersedia di publik dan latihan.</p>
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
                                    className={`px-4 py-2 rounded-xl border text-xs font-black transition-all cursor-pointer ${isDisabled
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

            {/* Filters & Search */}
            <AdminFilterBar className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4 sm:p-5" onReset={() => { setSearch(''); setFilterLevel(''); setFilterChapter(''); }}>
                <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
                    <div className="flex flex-1 flex-col md:flex-row gap-3">
                        <input
                            type="search" placeholder="Cari judul atau struktur..."
                            className="min-w-0 flex-1 rounded-xl border border-[var(--border-color)] bg-[var(--background)] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground)]/45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent-blue)]"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <select
                            className="rounded-xl border border-[var(--border-color)] bg-[var(--background)] px-4 py-2.5 text-sm text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent-blue)]"
                            value={filterLevel}
                            onChange={(e) => setFilterLevel(e.target.value)}
                        >
                            <option value="">Semua Level</option>
                            {[5, 4, 3, 2, 1].map(l => <option key={l} value={l}>N{l}</option>)}
                        </select>
                        <input
                            type="number" min="1"
                            className="w-28 rounded-xl border border-[var(--border-color)] bg-[var(--background)] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground)]/45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent-blue)]"
                            value={filterChapter}
                            onChange={(e) => {
                                const val = parseInt(e.target.value);
                                if (e.target.value === '' || (!isNaN(val) && val >= 1)) setFilterChapter(e.target.value);
                            }}
                            placeholder="Bab"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={handleExport}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border-color)] px-4 py-2.5 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--background)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-red)]">
                        <Download size={16} /> Export CSV
                    </button>
                </div>
            </AdminFilterBar>

            {fetchError ? <AdminErrorState title="Bunpo gagal dimuat" message={fetchError} onRetry={fetchBunpos} /> : <AdminDataTable
                columns={[
                    { key: 'title', label: 'Judul' },
                    { key: 'structure', label: 'Struktur' },
                    { key: 'jlpt_level', label: 'Level', render: item => `N${item.jlpt_level}` },
                    { key: 'chapter', label: 'Bab' },
                ]}
                rows={bunpos}
                getRowId={item => item.id}
                loading={loading}
                emptyTitle="Belum ada Bunpo"
                emptyMessage="Ubah filter atau tambahkan materi baru."
                page={page}
                pages={pagination.pages}
                onPageChange={setPage}
                onView={item => `/admin/bunpo/${item.id}`}
                onEdit={item => `/admin/bunpo/${item.id}/edit`}
                onDelete={item => setPendingDelete(item.id)}
            />}

            {/* Legacy table retained temporarily during the route migration. */}
            <div hidden className="overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)]">
                {loading ? (
                    <AdminSkeleton rows={5} />
                ) : fetchError ? (
                    <div className="p-5 sm:p-6"><AdminErrorState title="Bunpo gagal dimuat" message={fetchError} onRetry={fetchBunpos} /></div>
                ) : bunpos.length === 0 ? (
                    <AdminEmptyState title="Belum ada Bunpo" message="Ubah filter atau tambahkan materi baru." href="/admin/bunpo/new" actionLabel="Tambah Bunpo" icon={Search} />
                ) : (
                    <>
                        {/* Desktop Table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="admin-table min-w-full">
                                <thead className="admin-table-head">
                                    <tr>
                                        <th className="admin-table-heading px-5 py-3.5 text-left text-xs font-semibold">Judul</th>
                                        <th className="admin-table-heading px-5 py-3.5 text-left text-xs font-semibold">Struktur</th>
                                        <th className="admin-table-heading px-5 py-3.5 text-left text-xs font-semibold">Level</th>
                                        <th className="admin-table-heading px-5 py-3.5 text-left text-xs font-semibold">Bab</th>
                                        <th className="admin-table-heading px-5 py-3.5 text-right text-xs font-semibold">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="admin-table-body divide-y">
                                    {bunpos.map((b) => (
                                        <tr key={b.id} className="admin-table-row">
                                            <td className="px-5 py-4 whitespace-nowrap text-sm font-semibold text-[var(--foreground)]">{b.title}</td>
                                            <td className="max-w-xs truncate px-5 py-4 text-sm text-[var(--foreground)]/70">{b.structure}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ${levelColor(b.jlpt_level)}`}>
                                                    N{b.jlpt_level}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 whitespace-nowrap text-sm text-[var(--foreground)]/70">Bab {b.chapter}</td>
                                            <td className="px-5 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link
                                                        href={b.slug || getBunpoSlug(b.title) ? `/bunpo/n${b.jlpt_level}/${b.slug || getBunpoSlug(b.title)}` : `/bunpo/n${b.jlpt_level}`} target="_blank"
                                                        className="rounded-lg p-2 text-[var(--accent-green)] transition-colors hover:bg-[var(--accent-green)]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent-green)]"
                                                        title="Lihat"
                                                        aria-label={`Lihat ${b.title}`}
                                                    >
                                                        <Eye size={18} />
                                                    </Link>
                                                    <Link
                                                        href={`/admin/bunpo/${b.id}/edit`}
                                                        className="rounded-lg p-2 text-[var(--accent-blue)] transition-colors hover:bg-[var(--accent-blue)]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent-blue)]"
                                                        title="Edit"
                                                        aria-label={`Edit ${b.title}`}
                                                    >
                                                        <Pencil size={18} />
                                                    </Link>
                                                    <button
                                                        onClick={(e) => handleDelete(e, b.id)}
                                                        className="rounded-lg p-2 text-[var(--brand-red)] transition-colors hover:bg-[var(--brand-red)]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-red)]"
                                                        title="Hapus"
                                                        aria-label={`Hapus ${b.title}`}
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
                            {bunpos.map((b) => (
                                <div key={b.id} className="divide-[var(--admin-divider)]">
                                    <div
                                        className="flex items-center gap-4 px-5 py-4 active:bg-[var(--admin-hover)] transition-colors cursor-pointer"
                                        onClick={() => router.push(b.slug || getBunpoSlug(b.title) ? `/bunpo/n${b.jlpt_level}/${b.slug || getBunpoSlug(b.title)}` : `/bunpo/n${b.jlpt_level}`)}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="font-black text-lg text-[var(--foreground)]">{b.title}</div>
                                            <div className="text-sm font-bold text-[var(--foreground)]/75">{b.structure}</div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ${levelColor(b.jlpt_level)}`}>N{b.jlpt_level}</span>
                                                                <span className="text-xs text-[var(--foreground)]/55">Bab {b.chapter}</span>
                                            </div>
                                        </div>
                                        <svg className="h-5 w-5 text-[var(--foreground)]/45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                    <div className="admin-control flex items-center justify-between px-5 py-3 border-t">
                                        <div className="flex items-center gap-2">
                                            <Link
                                                href={`/admin/bunpo/${b.id}/edit`}
                                                aria-label={`Edit ${b.title}`}
                                                className="rounded-lg p-2 text-[var(--accent-blue)] transition-colors hover:bg-[var(--accent-blue)]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent-blue)]"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <Pencil size={18} />
                                            </Link>
                                            <button
                                                onClick={(e) => handleDelete(e, b.id)}
                                                aria-label={`Hapus ${b.title}`}
                                                className="rounded-lg p-2 text-[var(--brand-red)] transition-colors hover:bg-[var(--brand-red)]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-red)]"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {!loading && (
                            <div className="admin-control px-6 py-5 border-t">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="text-xs font-bold text-neutral-500">Halaman <span className="text-gray-900 dark:text-white">{pagination.page}</span> dari <span className="text-gray-900 dark:text-white">{pagination.pages}</span> ({pagination.total} hasil)
                                    </div>
                                    <Pagination
                                        currentPage={page}
                                        totalPages={pagination.pages}
                                        onPageChange={setPage}
                                        activeClassName="bg-[var(--brand-red)]/10 border-[var(--brand-red)]/30 text-[var(--brand-red)]"
                                        buttonClassName="bg-[var(--card-bg)] border-[var(--border-color)] text-[var(--foreground)] hover:bg-[var(--background)]"
                                    />
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

function normalizeBunpoPage(data, page, limit) {
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
