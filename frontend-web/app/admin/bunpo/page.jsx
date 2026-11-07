'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useDebounce } from 'use-debounce';
import Cookies from 'js-cookie';
import { Download, Plus, RefreshCw, Upload, X } from 'lucide-react';
import { API_URL, setBunpoVisibilityCache } from '@/lib/api';
import { appToast as toast } from '@/components/common/AppMessage';
import ConfirmationModal from '@/components/common/ConfirmationModal';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminFilterBar from '@/components/admin/AdminFilterBar';
import { AdminErrorState } from '@/components/admin/AdminFeedback';
import BunpoListTable from '@/components/admin/bunpo/BunpoListTable';

const LIMIT = 20;
const LEVELS = [5, 4, 3, 2, 1];

const LEVEL_STYLES = {
    5: 'bg-[var(--accent-green)]/10 text-[var(--accent-green)]',
    4: 'bg-[var(--accent-blue)]/10 text-[var(--accent-blue)]',
    3: 'bg-[var(--accent-gold)]/12 text-[var(--accent-gold)]',
    2: 'bg-[var(--brand-red)]/10 text-[var(--brand-red)]',
    1: 'bg-[var(--foreground)]/8 text-[var(--foreground)]/70',
};

const inputClass =
    'rounded-xl border border-[var(--border-color)] bg-[var(--background)] px-4 py-2.5 text-sm text-[var(--foreground)] ' +
    'placeholder:text-[var(--foreground)]/45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent-blue)]';

const secondaryButtonClass =
    'inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border-color)] px-4 py-2.5 text-sm font-medium ' +
    'text-[var(--foreground)] transition-colors hover:bg-[var(--background)] disabled:cursor-not-allowed disabled:opacity-50 ' +
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-red)]';

const primaryButtonClass =
    'inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--brand-red)] px-4 py-2.5 text-sm font-medium text-white ' +
    'transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ' +
    'focus-visible:outline-[var(--brand-red)]';

function authHeaders(extra = {}) {
    const token = Cookies.get('access_token');
    return { ...extra, Authorization: `Bearer ${token}` };
}

function normalizeBunpoPage(data, page, limit) {
    if (!Array.isArray(data)) {
        const items = data.items || [];
        return {
            items,
            pagination: {
                total: data.total ?? items.length,
                page: data.page ?? page,
                pages: data.pages ?? 1,
            },
        };
    }

    // API lama mengembalikan array penuh, jadi paginasi dilakukan di client.
    const total = data.length;
    const pages = Math.max(1, Math.ceil(total / limit));
    const safePage = Math.min(Math.max(page, 1), pages);
    const start = (safePage - 1) * limit;
    return {
        items: data.slice(start, start + limit),
        pagination: { total, pages, page: safePage },
    };
}

function LevelBadge({ level }) {
    return (
        <span
            className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ${
                LEVEL_STYLES[level] || 'bg-[var(--background)] text-[var(--foreground)]/65'
            }`}
        >
            N{level}
        </span>
    );
}

export default function BunpoAdmin() {
    // Data
    const [bunpos, setBunpos] = useState([]);
    const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState('');

    // Filter
    const [search, setSearch] = useState('');
    const [filterLevel, setFilterLevel] = useState('');
    const [filterChapter, setFilterChapter] = useState('');
    const [page, setPage] = useState(1);
    const [debouncedSearch] = useDebounce(search, 500);
    const [debouncedChapter] = useDebounce(filterChapter, 500);

    // Aksi
    const [pendingDelete, setPendingDelete] = useState(null); // { id, title }
    const [deleting, setDeleting] = useState(false);
    const [exporting, setExporting] = useState(false);

    // Visibilitas level
    const [disabledLevels, setDisabledLevels] = useState([]);
    const [savingLevel, setSavingLevel] = useState(null);

    const hasActiveFilter = Boolean(search || filterLevel || filterChapter);
    const abortRef = useRef(null);

    /* ----------------------------- READ (list) ----------------------------- */

    const fetchBunpos = useCallback(async () => {
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
            if (filterLevel) params.append('level', filterLevel);
            if (debouncedChapter) params.append('chapter', debouncedChapter);
            if (debouncedSearch.trim()) params.append('search', debouncedSearch.trim());

            const res = await fetch(`${API_URL}/admin/grammar?${params.toString()}`, {
                headers: authHeaders(),
                signal: controller.signal,
            });

            if (!res.ok) {
                setBunpos([]);
                setFetchError(
                    res.status === 401 || res.status === 403
                        ? 'Akses ditolak. Pastikan Anda login sebagai Admin, lalu muat ulang halaman.'
                        : 'Gagal memuat data Bunpo. Silakan coba lagi beberapa saat.'
                );
                return;
            }

            const result = normalizeBunpoPage(await res.json(), page, LIMIT);
            setBunpos(result.items);
            setPagination(result.pagination);
            setFetchError('');
            if (result.pagination.page !== page) setPage(result.pagination.page);
        } catch (error) {
            if (error.name === 'AbortError') return; // request digantikan oleh yang lebih baru
            console.error('Failed to fetch bunpos', error);
            setBunpos([]);
            setFetchError('Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi.');
        } finally {
            if (abortRef.current === controller) setLoading(false);
        }
    }, [page, filterLevel, debouncedChapter, debouncedSearch]);

    useEffect(() => {
        fetchBunpos();
        return () => abortRef.current?.abort();
    }, [fetchBunpos]);

    /* ------------------------------ Filter UI ------------------------------ */

    const updateFilter = (setter) => (value) => {
        setter(value);
        setPage(1);
    };

    const resetFilters = () => {
        setSearch('');
        setFilterLevel('');
        setFilterChapter('');
        setPage(1);
    };

    const handleChapterChange = (e) => {
        const raw = e.target.value;
        const val = parseInt(raw, 10);
        if (raw === '' || (!Number.isNaN(val) && val >= 1)) updateFilter(setFilterChapter)(raw);
    };

    /* ----------------------------- DELETE (CRUD) ---------------------------- */

    const requestDelete = (item) => setPendingDelete({ id: item.id, title: item.title });

    const confirmDelete = async () => {
        if (!pendingDelete || deleting) return;
        setDeleting(true);
        try {
            const res = await fetch(`${API_URL}/admin/bunpo/${pendingDelete.id}`, {
                method: 'DELETE',
                headers: authHeaders(),
            });
            if (!res.ok) throw new Error(`Delete failed (${res.status})`);

            toast.success(`Bunpo "${pendingDelete.title}" berhasil dihapus.`);
            setPendingDelete(null);

            // Jika item terakhir di halaman dihapus, mundur satu halaman.
            if (bunpos.length === 1 && page > 1) setPage(page - 1);
            else fetchBunpos();
        } catch (error) {
            console.error('Delete error', error);
            toast.error('Gagal menghapus Bunpo. Silakan coba lagi.');
        } finally {
            setDeleting(false);
        }
    };

    /* ------------------------------- Export CSV ------------------------------ */

    const handleExport = async () => {
        setExporting(true);
        try {
            const params = new URLSearchParams();
            if (filterLevel) params.append('level', filterLevel);
            if (debouncedChapter) params.append('chapter', debouncedChapter);
            if (debouncedSearch.trim()) params.append('search', debouncedSearch.trim());

            const res = await fetch(`${API_URL}/admin/grammar/export/csv?${params.toString()}`, {
                headers: authHeaders(),
            });
            if (!res.ok) throw new Error(`Export failed (${res.status})`);

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `bunpo_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            toast.success('Data Bunpo berhasil diekspor.');
        } catch (error) {
            console.error('Export failed', error);
            toast.error('Gagal mengekspor data.');
        } finally {
            setExporting(false);
        }
    };

    /* --------------------------- Visibilitas level --------------------------- */

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`${API_URL}/admin/bunpo/visibility`, { headers: authHeaders() });
                if (res.ok) {
                    const data = await res.json();
                    setDisabledLevels(data.disabled_levels || []);
                }
            } catch (error) {
                console.error('Failed to fetch Bunpo visibility', error);
            }
        })();
    }, []);

    const toggleVisibility = async (level) => {
        if (savingLevel !== null) return;
        const willDisable = !disabledLevels.includes(level);
        const next = willDisable
            ? [...disabledLevels, level].sort((a, b) => a - b)
            : disabledLevels.filter((l) => l !== level);

        setSavingLevel(level);
        try {
            const res = await fetch(`${API_URL}/admin/bunpo/visibility`, {
                method: 'PUT',
                headers: authHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({ disabled_levels: next }),
            });
            if (!res.ok) throw new Error('Visibility update failed');
            setDisabledLevels(next);
            setBunpoVisibilityCache(next);
            toast.success(`Bunpo N${level} ${willDisable ? 'dinonaktifkan' : 'diaktifkan'}.`);
        } catch {
            toast.error('Gagal mengubah visibilitas level Bunpo.');
        } finally {
            setSavingLevel(null);
        }
    };

    /* --------------------------------- Table -------------------------------- */

    const columns = useMemo(
        () => [
            {
                key: 'title',
                label: 'Judul',
                render: (item) => <span className="font-semibold text-[var(--foreground)]">{item.title}</span>,
            },
            {
                key: 'structure',
                label: 'Struktur',
                render: (item) => (
                    <span
                        className="block max-w-xs truncate text-[var(--foreground)]/70 sm:max-w-md"
                        title={item.structure}
                    >
                        {item.structure || '-'}
                    </span>
                ),
            },
            { key: 'jlpt_level', label: 'Level', render: (item) => <LevelBadge level={item.jlpt_level} /> },
            {
                key: 'chapter',
                label: 'Bab',
                render: (item) => <span className="text-[var(--foreground)]/70">Bab {item.chapter}</span>,
            },
        ],
        []
    );

    const resultLabel = loading ? 'Memuat data...' : `${pagination.total} materi ditemukan`;

    return (
        <div className="space-y-6">
            <AdminPageHeader
                title="Bunpo"
                description="Kelola materi tata bahasa dan contoh kalimat."
                breadcrumbs={[{ label: 'Bunpo' }]}
                action={
                    <div className="flex flex-wrap gap-2">
                        <Link href="/admin/bunpo/import" className={secondaryButtonClass}>
                            <Upload size={16} aria-hidden="true" /> Import
                        </Link>
                        <Link href="/admin/bunpo/new" className={primaryButtonClass}>
                            <Plus size={16} aria-hidden="true" /> Tambah Bunpo
                        </Link>
                    </div>
                }
            />

            {/* Visibilitas level */}
            <section
                aria-labelledby="bunpo-visibility-title"
                className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-5 sm:p-6"
            >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 id="bunpo-visibility-title" className="text-sm font-semibold text-[var(--foreground)]">
                            Visibilitas level
                        </h2>
                        <p className="mt-1 text-sm text-[var(--foreground)]/55">
                            Level yang dimatikan tidak tampil di halaman publik dan latihan.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2" role="group" aria-label="Visibilitas level Bunpo">
                        {LEVELS.map((level) => {
                            const isOff = disabledLevels.includes(level);
                            const isSaving = savingLevel === level;
                            return (
                                <button
                                    key={level}
                                    type="button"
                                    aria-pressed={!isOff}
                                    aria-label={`Level N${level}, saat ini ${isOff ? 'nonaktif' : 'aktif'}`}
                                    disabled={savingLevel !== null}
                                    onClick={() => toggleVisibility(level)}
                                    className={`inline-flex min-w-[5.5rem] items-center justify-center gap-2 rounded-xl border px-4 py-2 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent-blue)] ${
                                        isOff
                                            ? 'border-red-500/40 bg-red-600/10 text-red-400'
                                            : 'border-emerald-500/40 bg-emerald-600/10 text-emerald-400'
                                    }`}
                                >
                                    <span
                                        aria-hidden="true"
                                        className={`h-2 w-2 rounded-full ${isOff ? 'bg-red-400' : 'bg-emerald-400'} ${
                                            isSaving ? 'animate-pulse' : ''
                                        }`}
                                    />
                                    N{level} {isOff ? 'Off' : 'On'}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Filter */}
            <AdminFilterBar
                className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4 sm:p-5"
                onReset={resetFilters}
            >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-1 flex-col gap-3 md:flex-row">
                        <label className="min-w-0 flex-1">
                            <span className="sr-only">Cari Bunpo</span>
                            <input
                                type="search"
                                placeholder="Cari judul atau struktur..."
                                className={`${inputClass} w-full`}
                                value={search}
                                onChange={(e) => updateFilter(setSearch)(e.target.value)}
                            />
                        </label>
                        <label>
                            <span className="sr-only">Filter level</span>
                            <select
                                className={`${inputClass} w-full md:w-40`}
                                value={filterLevel}
                                onChange={(e) => updateFilter(setFilterLevel)(e.target.value)}
                            >
                                <option value="">Semua level</option>
                                {LEVELS.map((l) => (
                                    <option key={l} value={l}>
                                        N{l}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label>
                            <span className="sr-only">Filter bab</span>
                            <input
                                type="number"
                                min="1"
                                inputMode="numeric"
                                placeholder="Bab"
                                className={`${inputClass} w-full md:w-28`}
                                value={filterChapter}
                                onChange={handleChapterChange}
                            />
                        </label>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {hasActiveFilter && (
                            <button type="button" onClick={resetFilters} className={secondaryButtonClass}>
                                <X size={16} aria-hidden="true" /> Reset
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={fetchBunpos}
                            disabled={loading}
                            className={secondaryButtonClass}
                            aria-label="Muat ulang data"
                        >
                            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} aria-hidden="true" />
                            <span className="hidden sm:inline">Muat ulang</span>
                        </button>
                        <button
                            type="button"
                            onClick={handleExport}
                            disabled={exporting}
                            className={secondaryButtonClass}
                        >
                            <Download size={16} aria-hidden="true" />
                            {exporting ? 'Mengekspor...' : 'Export CSV'}
                        </button>
                    </div>
                </div>
            </AdminFilterBar>

            {/* Tabel */}
            <div className="space-y-3">
                <p className="px-1 text-sm text-[var(--foreground)]/60" role="status" aria-live="polite">
                    {resultLabel}
                    {!loading && pagination.pages > 1 && ` · halaman ${pagination.page} dari ${pagination.pages}`}
                </p>

                {fetchError ? (
                    <AdminErrorState title="Bunpo gagal dimuat" message={fetchError} onRetry={fetchBunpos} />
                ) : (
                    <BunpoListTable
                        columns={columns}
                        rows={bunpos}
                        loading={loading}
                        hasActiveFilter={hasActiveFilter}
                        page={page}
                        pages={pagination.pages}
                        onPageChange={setPage}
                        onDelete={requestDelete}
                    />
                )}
            </div>

            <ConfirmationModal
                isOpen={Boolean(pendingDelete)}
                onClose={() => !deleting && setPendingDelete(null)}
                onConfirm={confirmDelete}
                title="Hapus Bunpo?"
                message={`Bunpo "${pendingDelete?.title ?? ''}" akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.`}
                confirmText={deleting ? 'Menghapus...' : 'Hapus'}
                cancelText="Batal"
                type="danger"
                isLoading={deleting}
            />
        </div>
    );
}