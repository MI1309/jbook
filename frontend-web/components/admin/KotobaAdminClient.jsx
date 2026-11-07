'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useDebounce } from 'use-debounce';
import Cookies from 'js-cookie';
import { Download, Pencil, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
import { API_URL, setVocabVisibilityCache } from '@/lib/api';
import { appToast as toast } from '@/components/common/AppMessage';
import ConfirmationModal from '@/components/common/ConfirmationModal';
import Pagination from '@/components/common/Pagination';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import TypeTabs from '@/components/kotoba/TypeTabs';
import WordTypeBadge from '@/components/kotoba/WordTypeBadge';
import { WORD_TYPE_OPTIONS } from '@/components/kotoba/wordTypes';

const PAGE_SIZE = 30;
const levelClasses = {
    5: 'border-accent-green/25 bg-accent-green/10 text-accent-green',
    4: 'border-accent-blue/25 bg-accent-blue/10 text-accent-blue',
    3: 'border-accent-gold/30 bg-accent-gold/15 text-[var(--foreground)]',
    2: 'border-[var(--brand-red)]/25 bg-[var(--brand-red)]/10 text-[var(--brand-red)]',
    1: 'border-[var(--border-color)] bg-[var(--background)] text-[var(--foreground)]/75',
};

export default function KotobaAdminClient() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [vocabs, setVocabs] = useState([]);
    const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
    const [counts, setCounts] = useState({});
    const [loadingCounts, setLoadingCounts] = useState(true);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const requestedType = searchParams.get('type') || 'all';
    const [type, setType] = useState(requestedType === 'all' || WORD_TYPE_OPTIONS.some(({ value }) => value === requestedType) ? requestedType : 'all');
    const [level, setLevel] = useState(searchParams.get('level') || '');
    const [search, setSearch] = useState(searchParams.get('q') || '');
    const [debouncedSearch] = useDebounce(search, 350);
    const [page, setPage] = useState(Math.max(1, Number(searchParams.get('page')) || 1));
    const [pendingDelete, setPendingDelete] = useState(null);
    const [disabledLevels, setDisabledLevels] = useState([]);
    const [savingVisibility, setSavingVisibility] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams();
        if (type !== 'all') params.set('type', type);
        if (level) params.set('level', level);
        if (debouncedSearch.trim()) params.set('q', debouncedSearch.trim());
        if (page > 1) params.set('page', String(page));
        const query = params.toString();
        router.replace(`${pathname}${query ? `?${query}` : ''}`, { scroll: false });
    }, [debouncedSearch, level, page, pathname, router, type]);

    useEffect(() => {
        let cancelled = false;
        const loadCounts = async () => {
            setLoadingCounts(true);
            const token = Cookies.get('access_token');
            try {
                const [allResponse, ...typeResponses] = await Promise.all([
                    fetch(`${API_URL}/admin/vocab?page=1&limit=1`, { headers: { Authorization: `Bearer ${token}` } }),
                    ...WORD_TYPE_OPTIONS.map(({ value }) => fetch(`${API_URL}/admin/vocab?word_type=${encodeURIComponent(value)}&page=1&limit=1`, { headers: { Authorization: `Bearer ${token}` } })),
                ]);
                if (!allResponse.ok || typeResponses.some((response) => !response.ok)) throw new Error('Jumlah Kotoba tidak dapat dimuat.');
                const [allData, ...typeData] = await Promise.all([allResponse.json(), ...typeResponses.map((response) => response.json())]);
                if (!cancelled) {
                    setCounts({ all: Number(allData.total) || 0, ...Object.fromEntries(WORD_TYPE_OPTIONS.map(({ value }, index) => [value, Number(typeData[index].total) || 0])) });
                }
            } catch (loadError) {
                console.error('Failed to load Kotoba type counts', loadError);
                if (!cancelled) setCounts({});
            } finally {
                if (!cancelled) setLoadingCounts(false);
            }
        };
        loadCounts();
        return () => { cancelled = true; };
    }, []);

    const fetchVocabs = useCallback(async () => {
        setLoading(true);
        setError('');
        const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
        if (type !== 'all') params.set('word_type', type);
        if (level) params.set('level', level);
        if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());
        try {
            const response = await fetch(`${API_URL}/admin/vocab?${params}`, { headers: { Authorization: `Bearer ${Cookies.get('access_token')}` } });
            if (!response.ok) throw new Error(`Gagal memuat Kotoba (${response.status}).`);
            const data = await response.json();
            if (Array.isArray(data)) {
                const start = (page - 1) * PAGE_SIZE;
                setVocabs(data.slice(start, start + PAGE_SIZE));
                setPagination({ total: data.length, page: 1, pages: Math.max(1, Math.ceil(data.length / PAGE_SIZE)) });
            } else {
                setVocabs(data.items || []);
                setPagination({ total: Number(data.total) || 0, page: Number(data.page) || page, pages: Math.max(1, Number(data.pages) || 1) });
                if (Number(data.page) && Number(data.page) !== page) setPage(Number(data.page));
            }
        } catch (loadError) {
            setError(loadError.message || 'Terjadi kesalahan jaringan.');
            setVocabs([]);
        } finally {
            setLoading(false);
        }
    }, [debouncedSearch, level, page, type]);

    useEffect(() => { fetchVocabs(); }, [fetchVocabs]);

    useEffect(() => {
        let cancelled = false;
        fetch(`${API_URL}/admin/vocab/visibility`, { headers: { Authorization: `Bearer ${Cookies.get('access_token')}` } })
            .then((response) => response.ok ? response.json() : null)
            .then((data) => { if (!cancelled && data) setDisabledLevels(data.disabled_levels || []); })
            .catch((visibilityError) => console.error('Failed to load Kotoba visibility', visibilityError));
        return () => { cancelled = true; };
    }, []);

    const changeType = (nextType) => { setType(nextType); setPage(1); };
    const changeLevel = (event) => { setLevel(event.target.value); setPage(1); };
    const changeSearch = (event) => { setSearch(event.target.value); setPage(1); };
    const resetFilters = () => { setType('all'); setLevel(''); setSearch(''); setPage(1); };

    const toggleVisibility = async (targetLevel) => {
        const nextLevels = disabledLevels.includes(targetLevel)
            ? disabledLevels.filter((item) => item !== targetLevel)
            : [...disabledLevels, targetLevel].sort((a, b) => a - b);
        setSavingVisibility(true);
        try {
            const response = await fetch(`${API_URL}/admin/vocab/visibility`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${Cookies.get('access_token')}` },
                body: JSON.stringify({ disabled_levels: nextLevels }),
            });
            if (!response.ok) throw new Error('Perubahan visibilitas gagal disimpan.');
            setDisabledLevels(nextLevels);
            setVocabVisibilityCache(nextLevels);
            toast.success(`Visibilitas Kotoba N${targetLevel} diperbarui.`);
        } catch (visibilityError) {
            toast.error(visibilityError.message || 'Gagal mengubah visibilitas level Kotoba.');
        } finally {
            setSavingVisibility(false);
        }
    };

    const exportCsv = async () => {
        const params = new URLSearchParams();
        if (level) params.set('level', level);
        if (search.trim()) params.set('search', search.trim());
        try {
            const response = await fetch(`${API_URL}/admin/vocab/export/csv?${params}`, { headers: { Authorization: `Bearer ${Cookies.get('access_token')}` } });
            if (!response.ok) throw new Error('Gagal mengekspor Kotoba.');
            const url = URL.createObjectURL(await response.blob());
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = `kotoba_${new Date().toISOString().slice(0, 10)}.csv`;
            anchor.click();
            URL.revokeObjectURL(url);
        } catch (exportError) {
            toast.error(exportError.message || 'Gagal mengekspor Kotoba.');
        }
    };

    const confirmDelete = async () => {
        if (!pendingDelete) return;
        try {
            const response = await fetch(`${API_URL}/admin/vocab/${pendingDelete}`, { method: 'DELETE', headers: { Authorization: `Bearer ${Cookies.get('access_token')}` } });
            if (!response.ok) throw new Error('Kotoba gagal dihapus.');
            toast.success('Kotoba berhasil dihapus.');
            setPendingDelete(null);
            fetchVocabs();
        } catch (deleteError) {
            toast.error(deleteError.message || 'Terjadi kesalahan saat menghapus Kotoba.');
            setPendingDelete(null);
        }
    };

    const rangeStart = pagination.total ? (page - 1) * PAGE_SIZE + 1 : 0;
    const rangeEnd = Math.min(page * PAGE_SIZE, pagination.total);

    return (
        <div className="space-y-5">
            <AdminPageHeader title="Manajemen Kotoba" description="Kelola kosakata berdasarkan tipe dan level JLPT." breadcrumbs={[{ label: 'Kotoba' }]} action={<Link href="/admin/kotoba/new" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[var(--brand-red)] px-4 text-sm font-semibold text-white transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-red)]"><Plus size={17} /> Tambah Kotoba</Link>} />

            <section aria-label="Visibilitas kosakata publik" className="flex flex-col gap-3 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4 sm:flex-row sm:items-center sm:justify-between">
                <div><h2 className="text-sm font-semibold">Visibilitas publik</h2><p className="mt-1 text-xs text-[var(--foreground)]/60">Atur level JLPT yang tampil di halaman publik dan latihan.</p></div>
                <div className="flex flex-wrap gap-2">
                    {[5, 4, 3, 2, 1].map((targetLevel) => {
                        const disabled = disabledLevels.includes(targetLevel);
                        return <button key={targetLevel} type="button" disabled={savingVisibility} aria-pressed={!disabled} onClick={() => toggleVisibility(targetLevel)} className={`min-h-11 rounded-lg border px-3 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-blue disabled:opacity-50 ${disabled ? 'border-[var(--border-color)] text-[var(--foreground)]/60' : 'border-accent-green/30 bg-accent-green/10 text-accent-green'}`}>N{targetLevel} {disabled ? 'Off' : 'On'}</button>;
                    })}
                </div>
            </section>

            <section className="z-20 -mx-4 border-y border-[var(--border-color)] bg-[var(--background)]/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-t-xl sm:border-x sm:px-4 md:sticky md:top-0" aria-label="Filter Kotoba">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-sm font-semibold">Tipe kata</h2>
                    <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={exportCsv} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[var(--border-color)] px-3 text-sm font-medium hover:bg-[var(--card-bg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-blue"><Download size={16} /> Export CSV</button>
                        <Link href="/admin/kotoba/tools" className="inline-flex min-h-11 items-center rounded-lg border border-[var(--border-color)] px-3 text-sm font-medium hover:bg-[var(--card-bg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-blue">Duplikat</Link>
                    </div>
                </div>
                <TypeTabs value={type} counts={loadingCounts ? {} : counts} onChange={changeType} />
                <div className="grid gap-3 pt-3 sm:grid-cols-[minmax(0,1fr)_12rem_auto]">
                    <div className="relative min-w-0">
                        <label htmlFor="kotoba-search" className="sr-only">Cari kata, bacaan, atau arti</label>
                        <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--foreground)]/45" />
                        <input id="kotoba-search" type="search" value={search} onChange={changeSearch} placeholder="Cari kata, bacaan, atau arti..." className="min-h-11 w-full rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] pl-10 pr-3 text-sm outline-none placeholder:text-[var(--foreground)]/45 focus-visible:ring-2 focus-visible:ring-accent-blue/40" />
                    </div>
                    <div>
                        <label htmlFor="kotoba-level" className="sr-only">Filter level JLPT</label>
                        <select id="kotoba-level" value={level} onChange={changeLevel} className="min-h-11 w-full rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/40">
                            <option value="">Semua level JLPT</option>
                            {[5, 4, 3, 2, 1].map((item) => <option key={item} value={item}>N{item}</option>)}
                        </select>
                    </div>
                    <button type="button" onClick={resetFilters} className="min-h-11 rounded-lg border border-[var(--border-color)] px-3 text-sm font-medium hover:bg-[var(--card-bg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-blue">Reset filter</button>
                </div>
            </section>

            <section id="kotoba-list-panel" role="tabpanel" aria-labelledby={`kotoba-type-tab-${type}`} className="overflow-hidden rounded-b-xl border border-[var(--border-color)] bg-[var(--card-bg)]">
                {error ? (
                    <div role="alert" className="p-8 text-center">
                        <h2 className="text-lg font-semibold">Data Kotoba tidak dapat dimuat</h2>
                        <p className="mt-2 text-sm text-[var(--foreground)]/65">{error}</p>
                        <button type="button" onClick={fetchVocabs} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg border border-[var(--border-color)] px-4 text-sm font-semibold hover:bg-[var(--background)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-blue"><RefreshCw size={16} /> Coba lagi</button>
                    </div>
                ) : loading ? (
                    <div aria-label="Memuat Kotoba" className="animate-pulse space-y-3 p-4" role="status">
                        {[1, 2, 3, 4, 5].map((row) => <div key={row} className="h-16 rounded-lg bg-[var(--background)]" />)}
                    </div>
                ) : vocabs.length ? (
                    <>
                        <div className="hidden overflow-x-auto md:block">
                            <table className="min-w-full table-fixed border-collapse">
                                <thead className="bg-[var(--background)] text-left text-xs font-semibold text-[var(--foreground)]/65"><tr><th scope="col" className="w-[16%] px-4 py-3">Kata</th><th scope="col" className="w-[16%] px-4 py-3">Bacaan</th><th scope="col" className="w-[31%] px-4 py-3">Arti</th><th scope="col" className="w-[17%] px-4 py-3">Tipe</th><th scope="col" className="w-[9%] px-4 py-3">Level</th><th scope="col" className="w-[11%] px-4 py-3 text-right">Aksi</th></tr></thead>
                                <tbody className="divide-y divide-[var(--border-color)]">{vocabs.map((item, index) => <tr key={item.id} className={`${index % 2 ? 'bg-[var(--background)]/45' : ''} transition-colors hover:bg-accent-blue/5`}>
                                    <td className="px-4 py-3 font-japanese text-lg font-bold">{item.word}</td>
                                    <td className="px-4 py-3 font-japanese text-sm text-[var(--foreground)]/75">{item.reading || '—'}</td>
                                    <td className="px-4 py-3 text-sm text-[var(--foreground)]/80"><span className="line-clamp-2">{item.meaning}</span></td>
                                    <td className="px-4 py-3"><WordTypeBadge type={item.word_type} /></td>
                                    <td className="px-4 py-3"><span className={`inline-flex rounded-md border px-2 py-1 text-xs font-bold ${levelClasses[item.jlpt_level] || ''}`}>N{item.jlpt_level}</span></td>
                                    <td className="px-4 py-3"><div className="flex justify-end gap-1"><Link href={`/admin/kotoba/${item.id}/edit`} title={`Edit ${item.word}`} aria-label={`Edit ${item.word}`} className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-accent-blue hover:bg-accent-blue/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-blue"><Pencil size={17} /></Link><button type="button" title={`Hapus ${item.word}`} aria-label={`Hapus ${item.word}`} onClick={() => setPendingDelete(item.id)} className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-[var(--brand-red)] hover:bg-[var(--brand-red)]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-red)]"><Trash2 size={17} /></button></div></td>
                                </tr>)}</tbody>
                            </table>
                        </div>
                        <ul className="divide-y divide-[var(--border-color)] md:hidden">
                            {vocabs.map((item) => <li key={item.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 p-4">
                                <div className="min-w-0"><p className="break-words font-japanese text-xl font-bold">{item.word}</p><p className="mt-1 break-words font-japanese text-sm text-[var(--foreground)]/65">{item.reading || '—'}</p><p className="mt-2 break-words text-sm leading-relaxed text-[var(--foreground)]/80">{item.meaning}</p></div>
                                <div className="flex max-w-36 flex-col items-end gap-2"><WordTypeBadge type={item.word_type} className="justify-center text-center" /><span className={`inline-flex rounded-md border px-2 py-1 text-xs font-bold ${levelClasses[item.jlpt_level] || ''}`}>N{item.jlpt_level}</span><div className="flex gap-1"><Link href={`/admin/kotoba/${item.id}/edit`} title={`Edit ${item.word}`} aria-label={`Edit ${item.word}`} className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-accent-blue hover:bg-accent-blue/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-blue"><Pencil size={17} /></Link><button type="button" title={`Hapus ${item.word}`} aria-label={`Hapus ${item.word}`} onClick={() => setPendingDelete(item.id)} className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-[var(--brand-red)] hover:bg-[var(--brand-red)]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-red)]"><Trash2 size={17} /></button></div></div>
                            </li>)}
                        </ul>
                        <div className="flex flex-col items-center gap-3 border-t border-[var(--border-color)] px-4 py-4 sm:flex-row sm:justify-between">
                            <p className="text-sm text-[var(--foreground)]/65">Menampilkan {rangeStart}–{rangeEnd} dari {pagination.total.toLocaleString('id-ID')}</p>
                            <Pagination currentPage={page} totalPages={pagination.pages} onPageChange={setPage} />
                        </div>
                    </>
                ) : (
                    <div className="px-5 py-12 text-center sm:py-16">
                        <Search aria-hidden="true" className="mx-auto h-8 w-8 text-[var(--foreground)]/35" />
                        <h2 className="mt-3 text-base font-semibold">Belum ada kosakata untuk tipe ini</h2>
                        <p className="mt-1 text-sm text-[var(--foreground)]/60">Ubah filter atau tambahkan Kotoba baru.</p>
                        <Link href="/admin/kotoba/new" className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg bg-[var(--brand-red)] px-4 text-sm font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-red)]"><Plus size={16} /> Tambah Kotoba</Link>
                    </div>
                )}
            </section>

            <ConfirmationModal isOpen={Boolean(pendingDelete)} onClose={() => setPendingDelete(null)} onConfirm={confirmDelete} title="Hapus Kotoba?" message="Kosakata ini akan dihapus dan tindakan tidak dapat dibatalkan." confirmText="Hapus" cancelText="Batal" type="danger" />
        </div>
    );
}