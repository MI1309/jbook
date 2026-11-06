'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { jbookApi } from '@/services/jbookApi';
import { appToast as toast } from '@/components/common/AppMessage';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminFilterBar from '@/components/admin/AdminFilterBar';
import AdminDataTable from '@/components/admin/AdminDataTable';
import AdminConfirmDialog from '@/components/admin/AdminConfirmDialog';
import { AdminErrorState } from '@/components/admin/AdminFeedback';

const PAGE_SIZE = 20;
const columns = [
    { key: 'title', label: 'Judul', render: module => <span className="font-medium">{module.title}</span> },
    { key: 'module_type', label: 'Tipe' },
    { key: 'is_published', label: 'Status', render: module => module.is_published ? 'Published' : 'Draft' },
    { key: 'description', label: 'Deskripsi', render: module => module.description || '—' },
];

export default function AdminCustomModulesPage() {
    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pendingDelete, setPendingDelete] = useState(null);

    const fetchModules = useCallback(async () => {
        setLoading(true);
        setFetchError('');
        try {
            const data = await jbookApi.adminGetCustomModules();
            setModules(Array.isArray(data) ? data : []);
        } catch {
            setFetchError('Tidak dapat memuat modul. Periksa koneksi atau akses akun, lalu coba lagi.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchModules(); }, [fetchModules]);

    const filtered = useMemo(() => modules.filter(module => `${module.title} ${module.description || ''} ${module.module_type}`.toLowerCase().includes(search.trim().toLowerCase())), [modules, search]);
    const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map(module => ({ ...module, label: module.title }));

    const confirmDelete = async () => {
        if (!pendingDelete) return;
        try {
            await jbookApi.adminDeleteCustomModule(pendingDelete.id);
            toast.success('Modul berhasil dihapus.');
            await fetchModules();
        } catch {
            toast.error('Gagal menghapus modul.');
        } finally {
            setPendingDelete(null);
        }
    };

    return <div className="space-y-5">
        <AdminPageHeader title="Modul Latihan Kustom" description="Kelola modul, status publikasi, dan soal latihan." breadcrumbs={[{ label: 'Modul Kustom' }]} action={<Link href="/admin/custom-modules/new" className="rounded-lg bg-[var(--brand-red)] px-4 py-2.5 text-sm font-medium text-white">Buat modul</Link>} />
        <AdminFilterBar onReset={() => { setSearch(''); setPage(1); }}><input type="search" value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} placeholder="Cari modul" aria-label="Cari modul" className="min-w-0 flex-1 rounded-lg border border-[var(--border-color)] bg-[var(--background)] px-3 py-2 text-sm" /></AdminFilterBar>
        {fetchError ? <AdminErrorState title="Modul gagal dimuat" message={fetchError} onRetry={fetchModules} /> : <AdminDataTable columns={columns} rows={visible} getRowId={module => module.id} loading={loading} emptyTitle="Belum ada modul kustom" emptyMessage="Buat modul pertama untuk menyusun latihan khusus." page={page} pages={pages} onPageChange={setPage} onView={module => `/admin/custom-modules/${module.id}`} onEdit={module => `/admin/custom-modules/${module.id}/edit`} onDelete={module => setPendingDelete(module)} />}
        <AdminConfirmDialog open={!!pendingDelete} onCancel={() => setPendingDelete(null)} onConfirm={confirmDelete} itemLabel={pendingDelete?.title ? `modul “${pendingDelete.title}”` : 'modul'} />
    </div>;
}
