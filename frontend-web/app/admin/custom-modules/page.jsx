'use client';

import { useState, useEffect } from 'react';
import { jbookApi } from '@/services/jbookApi';
import Link from 'next/link';
import AudioUploadWidget from '@/components/admin/AudioUploadWidget';
import { AdminEmptyState, AdminErrorState, AdminSkeleton } from '@/components/admin/AdminFeedback';
import { appToast as toast } from '@/components/common/AppMessage';
import AdminTabs from '@/components/admin/AdminTabs';

export default function AdminCustomModulesPage() {
    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [createTab, setCreateTab] = useState('info');
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        module_type: 'general',
        passage: '',
        audio_url: '',
        is_published: false
    });

    useEffect(() => {
        fetchModules();
    }, []);

    const fetchModules = async () => {
        setFetchError('');
        try {
            const data = await jbookApi.adminGetCustomModules();
            setModules(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Failed to fetch modules", error);
            setFetchError('Tidak dapat memuat modul. Periksa koneksi atau akses akun, lalu coba lagi.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!formData.title.trim()) {
            setCreateTab('info');
            toast.error('Judul modul wajib diisi.');
            return;
        }
        try {
            await jbookApi.adminCreateCustomModule(formData);
            setIsCreating(false);
            setFormData({ title: '', description: '', module_type: 'general', passage: '', audio_url: '', is_published: false });
            fetchModules();
            toast.success('Modul berhasil dibuat.');
        } catch (error) {
            console.error("Failed to create module", error);
            toast.error('Gagal membuat modul.');
        }
    };

    const handleDelete = async (id) => {
        if (confirm("Apakah Anda yakin ingin menghapus modul ini?")) {
            try {
                await jbookApi.adminDeleteCustomModule(id);
                fetchModules();
                toast.success('Modul berhasil dihapus.');
            } catch (error) {
                console.error("Failed to delete module", error);
                toast.error('Gagal menghapus modul.');
            }
        }
    };

    if (loading) {
        return <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)]"><AdminSkeleton rows={4} /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div><p className="text-sm text-[var(--foreground)]/55">Latihan / Modul Kustom</p><h1 className="mt-1 text-2xl font-semibold text-[var(--foreground)]">Modul Latihan Kustom</h1></div>
                <button 
                    onClick={() => setIsCreating(true)}
                    className="w-full rounded-xl bg-[var(--brand-red)] px-4 py-2.5 text-center text-sm font-medium text-white transition-colors hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-red)] sm:w-auto"
                >
                    + Buat Modul
                </button>
            </div>

            {isCreating && (
                <form onSubmit={handleCreate} className="overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)]">
                    <h2 className="text-lg md:text-xl font-semibold">Buat Modul Baru</h2>
                    <AdminTabs value={createTab} onChange={setCreateTab} label="Bagian formulir modul" tabs={[{ id: 'info', label: 'Info Dasar' }, { id: 'content', label: 'Konten' }, { id: 'metadata', label: 'Metadata' }]} />
                    <div className="space-y-5 p-4 md:p-6">
                        <section id="admin-panel-info" role="tabpanel" aria-labelledby="admin-tab-info" hidden={createTab !== 'info'} className="space-y-4">
                            <label className="block space-y-2"><span className="text-sm font-medium text-[var(--foreground)]">Judul modul</span><input type="text" className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--background)] p-3 text-sm text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent-blue)]" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} /></label>
                            <label className="block space-y-2"><span className="text-sm font-medium text-[var(--foreground)]">Deskripsi</span><textarea className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--background)] p-3 text-sm text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent-blue)]" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea></label>
                        </section>
                        <section id="admin-panel-content" role="tabpanel" aria-labelledby="admin-tab-content" hidden={createTab !== 'content'} className="space-y-4">
                            {formData.module_type === 'dokkai' && <label className="block space-y-2"><span className="text-sm font-medium text-[var(--foreground)]">Teks cerita / passage</span><textarea className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--background)] p-3 text-sm text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent-blue)]" rows="5" value={formData.passage} onChange={e => setFormData({...formData, passage: e.target.value})}></textarea></label>}
                            {formData.module_type === 'choukai' && <AudioUploadWidget value={formData.audio_url} onChange={(url) => setFormData({ ...formData, audio_url: url })} folder="choukai" />}
                            {formData.module_type === 'general' && <p className="text-sm text-[var(--foreground)]/55">Modul umum tidak memerlukan konten tambahan.</p>}
                        </section>
                        <section id="admin-panel-metadata" role="tabpanel" aria-labelledby="admin-tab-metadata" hidden={createTab !== 'metadata'} className="space-y-4">
                            <label className="block space-y-2"><span className="text-sm font-medium text-[var(--foreground)]">Tipe modul</span><select className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--background)] p-3 text-sm text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent-blue)]" value={formData.module_type} onChange={e => setFormData({...formData, module_type: e.target.value})}><option value="general">Umum (Campuran)</option><option value="dokkai">Dokkai (Membaca)</option><option value="choukai">Choukai (Mendengar)</option></select></label>
                            <label className="flex items-center gap-3 text-sm text-[var(--foreground)]"><input type="checkbox" checked={formData.is_published} onChange={e => setFormData({...formData, is_published: e.target.checked})} className="size-4 accent-[var(--brand-red)]" /> Publikasikan setelah dibuat</label>
                        </section>
                        <div className="flex flex-col-reverse justify-end gap-3 border-t border-[var(--border-color)] pt-5 sm:flex-row">
                            <button type="button" onClick={() => setIsCreating(false)} className="rounded-xl border border-[var(--border-color)] px-4 py-2.5 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--background)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-red)]">Batal</button>
                            <button type="submit" className="rounded-xl bg-[var(--brand-red)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-red)]">Simpan modul</button>
                        </div>
                    </div>
                </form>
            )}

            {fetchError ? <AdminErrorState title="Modul gagal dimuat" message={fetchError} onRetry={fetchModules} /> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {modules.map(module => (
                    <div key={module.id} className="flex h-full flex-col rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4 md:p-5">
                        <div className="flex justify-between items-start mb-2 gap-2">
                            <h3 className="font-bold text-lg line-clamp-2 leading-tight">{module.title}</h3>
                            <span className={`shrink-0 rounded-lg px-2 py-1 text-[10px] font-semibold uppercase ${module.is_published ? 'bg-[var(--accent-green)]/10 text-[var(--accent-green)]' : 'bg-[var(--accent-gold)]/12 text-[var(--accent-gold)]'}`}>
                                {module.is_published ? 'Published' : 'Draft'}
                            </span>
                        </div>
                        <p className="text-sm opacity-70 mb-4 flex-1 line-clamp-3">{module.description}</p>
                        <div className="flex justify-between items-center text-xs opacity-60 mb-4 uppercase font-bold tracking-wider">
                            <span>{module.module_type}</span>
                        </div>
                        <div className="flex gap-2 mt-auto">
                            <Link href={`/admin/custom-modules/${module.id}`} className="flex-1 rounded-xl border border-[var(--border-color)] py-2.5 text-center text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--background)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-red)]">
                                Kelola Soal
                            </Link>
                            <button onClick={() => handleDelete(module.id)} className="rounded-xl px-4 py-2.5 text-sm font-medium text-[var(--brand-red)] transition-colors hover:bg-[var(--brand-red)]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-red)]">
                                Hapus
                            </button>
                        </div>
                    </div>
                ))}
                {modules.length === 0 && !isCreating && (
                    <div className="col-span-full rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)]"><AdminEmptyState title="Belum ada modul kustom" message="Buat modul pertama untuk menyusun latihan khusus." /></div>
                )}
            </div>}
        </div>
    );
}
