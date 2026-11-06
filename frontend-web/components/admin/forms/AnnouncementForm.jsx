'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Cookies from 'js-cookie';
import { API_URL } from '@/lib/api';
import { appToast as toast } from '@/components/common/AppMessage';
import AdminFormShell from '@/components/admin/AdminFormShell';
import { AdminSkeleton } from '@/components/admin/AdminFeedback';

const initialData = { title: '', content: '', type: 'info', priority: 0, show_from: '', show_until: '', is_active: true, show_as_popup: false };
const fieldClass = 'w-full rounded-lg border border-[var(--border-color)] bg-[var(--background)] px-3 py-2.5 text-sm text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent-blue)]';

export default function AnnouncementForm({ isNew = false }) {
    const { id } = useParams();
    const router = useRouter();
    const [data, setData] = useState(initialData);
    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isNew) return undefined;
        let cancelled = false;
        const load = async () => {
            try {
                const response = await fetch(`${API_URL}/admin/announcements/${id}`, { headers: { Authorization: `Bearer ${Cookies.get('access_token')}` } });
                if (!response.ok) throw new Error(response.status === 404 ? 'Pengumuman tidak ditemukan.' : `Gagal memuat pengumuman (${response.status}).`);
                const item = await response.json();
                if (!cancelled) setData({ ...initialData, ...item, show_from: item.show_from?.slice(0, 16) || '', show_until: item.show_until?.slice(0, 16) || '' });
            } catch (loadError) {
                if (!cancelled) setError(loadError.message || 'Tidak dapat memuat pengumuman.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        load();
        return () => { cancelled = true; };
    }, [id, isNew]);

    const handleSubmit = async event => {
        event.preventDefault();
        setError('');
        if (!data.title.trim() || !data.content.trim()) {
            setError('Judul dan konten wajib diisi.');
            return;
        }
        setSaving(true);
        try {
            const response = await fetch(isNew ? `${API_URL}/admin/announcements` : `${API_URL}/admin/announcements/${id}`, {
                method: isNew ? 'POST' : 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${Cookies.get('access_token')}` },
                body: JSON.stringify({ ...data, show_from: data.show_from || null, show_until: data.show_until || null, priority: Number(data.priority) }),
            });
            if (!response.ok) throw new Error(`Gagal menyimpan pengumuman (${response.status}).`);
            toast.success(isNew ? 'Pengumuman berhasil dibuat.' : 'Pengumuman berhasil diperbarui.');
            router.push('/admin/announcements');
        } catch (saveError) {
            setError(saveError.message || 'Gagal menyimpan pengumuman.');
            toast.error(saveError.message || 'Gagal menyimpan pengumuman.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <AdminSkeleton rows={5} />;
    return <AdminFormShell title={isNew ? 'Buat pengumuman' : 'Edit pengumuman'} breadcrumbs={[{ label: 'Pengumuman', href: '/admin/announcements' }, { label: isNew ? 'Baru' : `Edit #${id}` }]} backHref="/admin/announcements" onSubmit={handleSubmit} saving={saving} error={error} submitLabel={isNew ? 'Buat pengumuman' : 'Simpan perubahan'}>
        <label className="block space-y-1.5"><span className="text-sm font-medium">Judul *</span><input required className={fieldClass} value={data.title} onChange={event => setData({ ...data, title: event.target.value })} /></label>
        <label className="block space-y-1.5"><span className="text-sm font-medium">Konten *</span><textarea required rows={6} className={fieldClass} value={data.content} onChange={event => setData({ ...data, content: event.target.value })} /></label>
        <div className="grid gap-4 sm:grid-cols-2"><label className="block space-y-1.5"><span className="text-sm font-medium">Tipe</span><select className={fieldClass} value={data.type} onChange={event => setData({ ...data, type: event.target.value })}><option value="info">Info</option><option value="warning">Peringatan</option><option value="important">Penting</option><option value="success">Sukses</option></select></label><label className="block space-y-1.5"><span className="text-sm font-medium">Prioritas</span><input type="number" className={fieldClass} value={data.priority} onChange={event => setData({ ...data, priority: event.target.value })} /></label></div>
        <div className="grid gap-4 sm:grid-cols-2"><label className="block space-y-1.5"><span className="text-sm font-medium">Tampilkan dari</span><input type="datetime-local" className={fieldClass} value={data.show_from} onChange={event => setData({ ...data, show_from: event.target.value })} /></label><label className="block space-y-1.5"><span className="text-sm font-medium">Tampilkan sampai</span><input type="datetime-local" className={fieldClass} value={data.show_until} onChange={event => setData({ ...data, show_until: event.target.value })} /></label></div>
        <div className="flex flex-wrap gap-6"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={data.is_active} onChange={event => setData({ ...data, is_active: event.target.checked })} />Aktif</label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={data.show_as_popup} onChange={event => setData({ ...data, show_as_popup: event.target.checked })} />Tampilkan sebagai popup</label></div>
    </AdminFormShell>;
}
