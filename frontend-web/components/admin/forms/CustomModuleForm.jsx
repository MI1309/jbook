'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { jbookApi } from '@/services/jbookApi';
import { appToast as toast } from '@/components/common/AppMessage';
import AudioUploadWidget from '@/components/admin/AudioUploadWidget';
import AdminFormShell from '@/components/admin/AdminFormShell';
import { AdminSkeleton } from '@/components/admin/AdminFeedback';

const initialData = { title: '', description: '', module_type: 'general', passage: '', audio_url: '', is_published: false };
const fieldClass = 'w-full rounded-lg border border-[var(--border-color)] bg-[var(--background)] px-3 py-2.5 text-sm text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent-blue)]';

export default function CustomModuleForm({ isNew = false }) {
    const { id } = useParams();
    const router = useRouter();
    const [data, setData] = useState(initialData);
    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isNew) return undefined;
        let cancelled = false;
        jbookApi.adminGetCustomModule(id).then(item => {
            if (!cancelled) setData({ ...initialData, ...item });
        }).catch(() => {
            if (!cancelled) setError('Modul tidak ditemukan atau gagal dimuat.');
        }).finally(() => {
            if (!cancelled) setLoading(false);
        });
        return () => { cancelled = true; };
    }, [id, isNew]);

    const handleSubmit = async event => {
        event.preventDefault();
        setError('');
        if (!data.title.trim()) {
            setError('Judul modul wajib diisi.');
            return;
        }
        setSaving(true);
        try {
            if (isNew) await jbookApi.adminCreateCustomModule(data);
            else await jbookApi.adminUpdateCustomModule(id, data);
            toast.success(isNew ? 'Modul berhasil dibuat.' : 'Modul berhasil diperbarui.');
            router.push(isNew ? '/admin/custom-modules' : `/admin/custom-modules/${id}`);
        } catch {
            setError('Gagal menyimpan modul. Periksa koneksi atau akses akun lalu coba lagi.');
            toast.error('Gagal menyimpan modul.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <AdminSkeleton rows={5} />;
    return <AdminFormShell title={isNew ? 'Buat modul kustom' : 'Edit modul kustom'} breadcrumbs={[{ label: 'Modul Kustom', href: '/admin/custom-modules' }, { label: isNew ? 'Baru' : `Edit #${id}` }]} backHref={isNew ? '/admin/custom-modules' : `/admin/custom-modules/${id}`} onSubmit={handleSubmit} saving={saving} error={error} submitLabel={isNew ? 'Buat modul' : 'Simpan perubahan'}>
        <label className="block space-y-1.5"><span className="text-sm font-medium">Judul modul *</span><input required className={fieldClass} value={data.title} onChange={event => setData({ ...data, title: event.target.value })} /></label>
        <label className="block space-y-1.5"><span className="text-sm font-medium">Deskripsi</span><textarea rows={3} className={fieldClass} value={data.description} onChange={event => setData({ ...data, description: event.target.value })} /></label>
        <label className="block max-w-sm space-y-1.5"><span className="text-sm font-medium">Tipe modul</span><select className={fieldClass} value={data.module_type} onChange={event => setData({ ...data, module_type: event.target.value })}><option value="general">Umum</option><option value="dokkai">Dokkai</option><option value="choukai">Choukai</option></select></label>
        {data.module_type === 'dokkai' && <label className="block space-y-1.5"><span className="text-sm font-medium">Teks bacaan</span><textarea rows={6} className={fieldClass} value={data.passage} onChange={event => setData({ ...data, passage: event.target.value })} /></label>}
        {data.module_type === 'choukai' && <AudioUploadWidget value={data.audio_url} onChange={audio_url => setData({ ...data, audio_url })} folder="choukai" />}
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={data.is_published} onChange={event => setData({ ...data, is_published: event.target.checked })} />Publikasikan modul</label>
    </AdminFormShell>;
}
