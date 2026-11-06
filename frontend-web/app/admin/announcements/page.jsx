'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Cookies from 'js-cookie';
import { API_URL } from '@/lib/api';
import { appToast as toast } from '@/components/common/AppMessage';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminFilterBar from '@/components/admin/AdminFilterBar';
import AdminDataTable from '@/components/admin/AdminDataTable';
import AdminConfirmDialog from '@/components/admin/AdminConfirmDialog';
import { AdminErrorState } from '@/components/admin/AdminFeedback';

const PAGE_SIZE = 20;
const columns = [
    { key: 'title', label: 'Judul', render: item => <span className="font-medium">{item.title}</span> },
    { key: 'type', label: 'Tipe' },
    { key: 'priority', label: 'Prioritas' },
    { key: 'is_active', label: 'Status', render: item => item.is_active ? 'Aktif' : 'Nonaktif' },
    { key: 'show_as_popup', label: 'Popup', render: item => item.show_as_popup ? 'Ya' : 'Tidak' },
];

export default function AdminAnnouncements() {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pendingDelete, setPendingDelete] = useState(null);

    const fetchAnnouncements = useCallback(async () => {
        setLoading(true);
        setFetchError('');
        try {
            const response = await fetch(`${API_URL}/admin/announcements`, { headers: { Authorization: `Bearer ${Cookies.get('access_token')}` } });
            if (!response.ok) throw new Error(`Gagal memuat pengumuman (${response.status}).`);
            setAnnouncements(await response.json());
        } catch (error) {
            setFetchError(error.message || 'Tidak dapat memuat pengumuman.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchAnnouncements(); }, [fetchAnnouncements]);

    const filtered = useMemo(() => announcements.filter(item => `${item.title} ${item.content}`.toLowerCase().includes(search.trim().toLowerCase())), [announcements, search]);
    const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

    const confirmDelete = async () => {
        if (!pendingDelete) return;
        try {
            const response = await fetch(`${API_URL}/admin/announcements/${pendingDelete.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${Cookies.get('access_token')}` } });
            if (!response.ok) throw new Error(`Gagal menghapus pengumuman (${response.status}).`);
            toast.success('Pengumuman berhasil dihapus.');
            await fetchAnnouncements();
        } catch (error) {
            toast.error(error.message || 'Gagal menghapus pengumuman.');
        } finally {
            setPendingDelete(null);
        }
    };

    return <div className="space-y-5">
        <AdminPageHeader title="Pengumuman" description="Kelola informasi yang tampil kepada pengguna." breadcrumbs={[{ label: 'Pengumuman' }]} action={<Link href="/admin/announcements/new" className="rounded-lg bg-[var(--brand-red)] px-4 py-2.5 text-sm font-medium text-white">Buat pengumuman</Link>} />
        <AdminFilterBar onReset={() => { setSearch(''); setPage(1); }}><input type="search" value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} placeholder="Cari judul atau konten" aria-label="Cari pengumuman" className="min-w-0 flex-1 rounded-lg border border-[var(--border-color)] bg-[var(--background)] px-3 py-2 text-sm" /></AdminFilterBar>
        {fetchError ? <AdminErrorState title="Pengumuman gagal dimuat" message={fetchError} onRetry={fetchAnnouncements} /> : <AdminDataTable columns={columns} rows={visible} getRowId={item => item.id} loading={loading} emptyTitle="Belum ada pengumuman" emptyMessage="Buat pengumuman untuk menyampaikan informasi kepada pengguna." page={page} pages={pages} onPageChange={setPage} onView={item => `/admin/announcements/${item.id}`} onEdit={item => `/admin/announcements/${item.id}/edit`} onDelete={item => setPendingDelete({ ...item, label: item.title })} />}
        <AdminConfirmDialog open={!!pendingDelete} onCancel={() => setPendingDelete(null)} onConfirm={confirmDelete} itemLabel={pendingDelete?.title ? `pengumuman “${pendingDelete.title}”` : 'pengumuman'} />
    </div>;
}

