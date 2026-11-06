'use client';

import { useCallback, useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { API_URL } from '@/lib/api';
import { appToast as toast } from '@/components/common/AppMessage';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminConfirmDialog from '@/components/admin/AdminConfirmDialog';
import { AdminEmptyState, AdminErrorState, AdminSkeleton } from '@/components/admin/AdminFeedback';

export default function AdminDuplicateTool({ resource, endpoint }) {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [pending, setPending] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const response = await fetch(`${API_URL}/admin/${endpoint}/duplicates`, { headers: { Authorization: `Bearer ${Cookies.get('access_token')}` } });
            if (!response.ok) throw new Error(`Gagal memuat duplikat (${response.status}).`);
            setGroups(await response.json());
        } catch (loadError) {
            setError(loadError.message || 'Tidak dapat memeriksa duplikat.');
        } finally {
            setLoading(false);
        }
    }, [endpoint]);

    useEffect(() => { load(); }, [load]);

    const deleteDuplicates = async () => {
        if (!pending) return;
        try {
            const response = await fetch(`${API_URL}/admin/${endpoint}/duplicates/delete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${Cookies.get('access_token')}` },
                body: JSON.stringify({ ids: pending.items.slice(1).map(item => item.id) }),
            });
            if (!response.ok) throw new Error(`Gagal menghapus duplikat (${response.status}).`);
            toast.success('Duplikat berhasil dihapus.');
            await load();
        } catch (deleteError) {
            toast.error(deleteError.message || 'Gagal menghapus duplikat.');
        } finally {
            setPending(null);
        }
    };

    return <div className="space-y-5"><AdminPageHeader title={`Cek duplikat ${resource}`} breadcrumbs={[{ label: resource, href: `/admin/${endpoint}` }, { label: 'Tools' }]} description="Data pertama dalam grup dipertahankan; data berikutnya akan dihapus setelah konfirmasi." />
        {loading ? <AdminSkeleton rows={5} /> : error ? <AdminErrorState title="Pemeriksaan gagal" message={error} onRetry={load} /> : groups.length === 0 ? <AdminEmptyState title="Tidak ada duplikat" message={`Tidak ditemukan data ${resource.toLowerCase()} yang duplikat.`} /> : <div className="space-y-3">{groups.map(group => <section key={group.key} className="flex flex-col gap-3 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-semibold">{group.items[0]?.word || group.items[0]?.character || group.key} <span className="text-sm font-normal text-[var(--foreground)]/55">({group.items.length} entri)</span></h2><p className="mt-1 text-sm text-[var(--foreground)]/60">{group.items.map(item => `${item.id}: ${item.meaning || item.character || ''}`).join(' · ')}</p></div><button type="button" onClick={() => setPending(group)} className="rounded-lg border border-[var(--brand-red)]/30 px-3 py-2 text-sm text-[var(--brand-red)] hover:bg-[var(--brand-red)]/10">Hapus duplikat</button></section>)}</div>}
        <AdminConfirmDialog open={!!pending} onCancel={() => setPending(null)} onConfirm={deleteDuplicates} itemLabel={`duplikat ${resource}`} />
    </div>;
}
