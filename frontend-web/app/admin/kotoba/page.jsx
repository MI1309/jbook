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
import { Download, Eye, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { AdminErrorState } from '@/components/admin/AdminFeedback';

export default function KotobaAdmin() {
    const [vocabs, setVocabs] = useState([]);
    const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState('');
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
        setFetchError('');

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
                setFetchError(res.status === 401 || res.status === 403
                    ? 'Akses ditolak. Pastikan Anda masuk dengan akun admin, lalu coba lagi.'
                    : `Gagal mengambil data Kotoba (${res.status}). Periksa koneksi lalu coba lagi.`);
            }
        } catch (error) {
            console.error("Failed to fetch vocabs", error);
            setFetchError('Terjadi kesalahan jaringan saat memuat Kotoba. Periksa koneksi lalu coba lagi.');
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

    const checkDuplicates = () => {
        const token = Cookies.get('access_token');
        fetch(`${API_URL}/admin/kotoba/duplicates`, {
            headers: { 'Authorization': `Bearer ${token}` }
        }).then(async (res) => {
            if (!res.ok) throw new Error('Gagal memeriksa duplikat');
            const data = await res.json();
            setDuplicates(data);
            toast.info(data.length ? `${data.length} grup duplikat ditemukan` : 'Tidak ada kotoba duplikat');
        }).catch((error) => toast.error(error.message || 'Gagal memeriksa duplikat'));
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
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <p className="text-sm text-[var(--foreground)]/55">Koleksi / Kotoba</p>
                    <h1 className="mt-1 text-2xl font-semibold text-[var(--foreground)]">Kotoba</h1>
                    <p className="mt-1 text-sm text-[var(--foreground)]/60">Kelola kosakata bahasa Jepang.</p>
                </div>
                <Link href="/admin/kotoba/new" className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-red)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-red)]">
                    <Plus size={16} /> Tambah Kotoba
                </Link>
            </div>

            {/* Visibilitas Kotoba per Level */}
            <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-5 sm:p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-sm font-black uppercase tracking-widest text-[var(--foreground)]">Visibilitas Kotoba</h2>
                        <p className="mt-1 text-sm text-[var(--foreground)]/55">Atur level yang tersedia di publik dan latihan.</p>
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
                                    className={`px-4 py-2 rounded-xl border text-xs font-semibold transition-colors ${isDisabled
                                        ? 'bg-[var(--brand-red)]/10 border-[var(--brand-red)]/25 text-[var(--brand-red)]'
                                        : 'bg-[var(--accent-green)]/10 border-[var(--accent-green)]/25 text-[var(--accent-green)]'
                                    } hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-red)] disabled:cursor-wait disabled:opacity-50`}
                                >
                                    N{lvl} {isDisabled ? 'OFF' : 'ON'}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="admin-surface p-6 rounded-3xl border">
                <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
                            <div className="flex flex-1 flex-col gap-3 md:flex-row">
                        <select
                            className="admin-control flex-1 rounded-xl border px-4 py-2.5 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent-blue)]"
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
                            className="admin-control flex-1 rounded-xl border px-4 py-2.5 text-sm placeholder:text-[var(--admin-muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent-blue)]"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <button
                        type="button"
                        onClick={handleExport}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border-color)] px-4 py-2.5 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--background)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-red)]"
                    >
                        <Download size={16} /> Export CSV
                    </button>
                    <button
                        onClick={checkDuplicates}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border-color)] px-4 py-2.5 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--background)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-red)]"
                    >
                        Check Duplicates
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="admin-surface rounded-3xl border overflow-hidden">
                {loading ? (
                    <div className="animate-pulse space-y-3 p-5 sm:p-6">{[1, 2, 3, 4, 5].map(row => <div key={row} className="h-14 rounded-lg bg-[var(--admin-control)]" />)}</div>
                ) : fetchError ? (
                    <div className="p-5 sm:p-6"><AdminErrorState title="Kotoba gagal dimuat" message={fetchError} onRetry={fetchVocabs} /></div>
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
                                                    <span className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ${levelColor(v.jlpt_level)}`}>
                                                    N{v.jlpt_level}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link href={`/kotoba/${v.id}`} target="_blank" aria-label={`Lihat ${v.word}`} className="rounded-lg p-2 text-[var(--accent-green)] transition-colors hover:bg-[var(--accent-green)]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent-green)]">
                                                        <Eye size={18} />
                                                    </Link>
                                                    <Link href={`/admin/kotoba/${v.id}`} aria-label={`Edit ${v.word}`} className="rounded-lg p-2 text-[var(--accent-blue)] transition-colors hover:bg-[var(--accent-blue)]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent-blue)]">
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
                                            <span className={`mt-2 inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ${levelColor(v.jlpt_level)}`}>
                                                N{v.jlpt_level}
                                            </span>
                                        </div>
                                        <svg className="w-5 h-5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                    <div className="admin-control flex items-center justify-between px-5 py-3 border-t">
                                        <div className="flex items-center gap-2">
                                            <Link href={`/admin/kotoba/${v.id}`} aria-label={`Edit ${v.word}`} className="rounded-lg p-2 text-[var(--accent-blue)] transition-colors hover:bg-[var(--accent-blue)]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent-blue)]" onClick={(e) => e.stopPropagation()}>
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
                            <div className="text-xs text-[var(--foreground)]/55">
                                Halaman <span className="font-semibold text-[var(--foreground)]">{pagination.page}</span> dari <span className="font-semibold text-[var(--foreground)]">{pagination.pages}</span> ({pagination.total} hasil)
                            </div>
                            <Pagination
                                currentPage={currentPage}
                                totalPages={pagination.pages}
                                onPageChange={setCurrentPage}
                                activeClassName="bg-[var(--brand-red)]/10 border-[var(--brand-red)]/30 text-[var(--brand-red)]"
                                buttonClassName="bg-[var(--card-bg)] border-[var(--border-color)] text-[var(--foreground)] hover:bg-[var(--background)]"
                            />
                        </div>
                    </div>
                )}
                {duplicates.length > 0 && (
                    <div className="mt-6 rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-5 sm:p-6">
                        <h2 className="text-base font-semibold">Duplikat Kotoba ({duplicates.length})</h2>
                        <div className="mt-4 space-y-3">
                            {duplicates.map(d => (
                                <div key={d.key} className="flex items-start justify-between gap-4 rounded-xl border border-[var(--border-color)] bg-[var(--background)] p-3">
                                    <div>
                                        <div className="text-lg font-semibold">{d.items[0].word} <span className="text-sm text-[var(--foreground)]/55">({d.items.length})</span></div>
                                        <div className="mt-1 text-xs text-[var(--foreground)]/55">
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
                                                className="rounded-xl bg-[var(--brand-red)] px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-red)] disabled:cursor-wait disabled:opacity-50"
                                            >
                                                {bulkDeleting ? 'Menghapus duplikat...' : 'Hapus duplikat'}
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
                    className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] px-4 py-2 text-sm font-medium text-[var(--foreground)] shadow-lg transition-colors hover:bg-[var(--background)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-red)] disabled:cursor-wait disabled:opacity-60"
                    title="Preview duplicate groups and download JSON"
                >{previewingAll ? 'Menyiapkan preview...' : 'Unduh daftar duplikat'}</button>

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
                    className="rounded-xl bg-[var(--brand-red)] px-4 py-2 text-sm font-medium text-white shadow-lg transition-colors hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-red)]"
                    title="Delete all duplicate items (dangerous)"
                >Hapus semua duplikat</button>
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
