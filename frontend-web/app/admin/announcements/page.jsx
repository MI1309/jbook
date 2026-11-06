'use client';

import { useState, useEffect } from 'react';
import { API_URL } from '@/lib/api';
import Cookies from 'js-cookie';
import ConfirmationModal from '@/components/common/ConfirmationModal';
import { AdminEmptyState, AdminErrorState, AdminSkeleton } from '@/components/admin/AdminFeedback';
import AdminTabs from '@/components/admin/AdminTabs';
import { appToast as toast } from '@/components/common/AppMessage';
import { Bell, X } from 'lucide-react';

export default function AdminAnnouncements() {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [formTab, setFormTab] = useState('info');
    const [editing, setEditing] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        type: 'info',
        priority: 0,
        show_from: '',
        show_until: '',
        is_active: true,
        show_as_popup: false
    });
    const [pendingDelete, setPendingDelete] = useState(null);

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        setFetchError('');
        try {
            const token = Cookies.get('access_token');
            const res = await fetch(`${API_URL}/admin/announcements`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error(`Gagal memuat pengumuman (${res.status}).`);
            setAnnouncements(await res.json());
        } catch (error) {
            console.error("Failed to fetch announcements", error);
            setFetchError('Tidak dapat memuat pengumuman. Periksa koneksi atau akses akun, lalu coba lagi.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title.trim() || !formData.content.trim()) {
            setFormTab('info');
            toast.error('Judul dan konten wajib diisi.');
            return;
        }
        try {
            const token = Cookies.get('access_token');
            const url = editing 
                ? `${API_URL}/admin/announcements/${editing.id}`
                : `${API_URL}/admin/announcements`;
            
            // Format dates for backend if they exist
            const payload = {
                ...formData,
                show_from: formData.show_from || null,
                show_until: formData.show_until || null,
            };

            const res = await fetch(url, {
                method: editing ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error(`Gagal menyimpan pengumuman (${res.status}).`);
            fetchAnnouncements();
            setShowModal(false);
            setEditing(null);
            resetForm();
            toast.success(editing ? 'Pengumuman berhasil diperbarui.' : 'Pengumuman berhasil dibuat.');
        } catch (error) {
            console.error("Save failed", error);
            toast.error(error.message || 'Gagal menyimpan pengumuman.');
        }
    };

    const resetForm = () => {
        setFormData({ 
            title: '', 
            content: '', 
            type: 'info', 
            priority: 0,
            show_from: '',
            show_until: '',
            is_active: true, 
            show_as_popup: false 
        });
    };

    const handleDelete = (id) => {
        setPendingDelete(id);
    };

    const confirmDelete = async () => {
        if (!pendingDelete) return;
        try {
            const token = Cookies.get('access_token');
            const res = await fetch(`${API_URL}/admin/announcements/${pendingDelete}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Gagal menghapus pengumuman.');
            fetchAnnouncements();
            toast.success('Pengumuman berhasil dihapus.');
        } catch (error) {
            console.error("Delete failed", error);
            toast.error(error.message || 'Gagal menghapus pengumuman.');
        } finally {
            setPendingDelete(null);
        }
    };

    const openEdit = (ann) => {
        setEditing(ann);
        setFormTab('info');
        setFormData({
            title: ann.title,
            content: ann.content,
            type: ann.type,
            priority: ann.priority || 0,
            show_from: ann.show_from ? ann.show_from.substring(0, 16) : '',
            show_until: ann.show_until ? ann.show_until.substring(0, 16) : '',
            is_active: ann.is_active,
            show_as_popup: ann.show_as_popup
        });
        setShowModal(true);
    };

    return (
        <div className="mx-auto max-w-6xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <p className="text-sm text-[var(--foreground)]/55">Workspace / Pengumuman</p>
                    <h1 className="mt-1 text-2xl font-semibold text-[var(--foreground)]">Pengumuman</h1>
                    <p className="mt-1 text-sm text-[var(--foreground)]/60">Kelola informasi yang tampil kepada pengguna.</p>
                </div>

                <button 
                    onClick={() => {
                        setEditing(null);
                        resetForm();
                        setFormTab('info');
                        setShowModal(true);
                    }}
                    className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-red)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-red)]"
                >
                    <Bell size={16} />
                    Buat Pengumuman Baru
                </button>
            </div>

            {loading ? <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)]"><AdminSkeleton rows={4} /></div> : fetchError ? <AdminErrorState title="Pengumuman gagal dimuat" message={fetchError} onRetry={fetchAnnouncements} /> : (
                <div className="grid gap-4">
                    {announcements.map((ann) => (
                        <div 
                            key={ann.id}
                            className="flex flex-col justify-between gap-5 rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-5 transition-colors hover:border-[var(--foreground)]/20 md:flex-row md:items-center"
                        >
                            <div className="flex gap-4 flex-1">
                                <div className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${
                                    ann.type === 'important' ? 'bg-[var(--brand-red)]/10 text-[var(--brand-red)]' :
                                    ann.type === 'warning' ? 'bg-[var(--accent-gold)]/12 text-[var(--accent-gold)]' :
                                    ann.type === 'success' ? 'bg-[var(--accent-green)]/10 text-[var(--accent-green)]' : 'bg-[var(--accent-blue)]/10 text-[var(--accent-blue)]'
                                }`}>
                                    <Bell size={18} aria-hidden="true" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                                        <h3 className="text-base font-semibold text-[var(--foreground)]">{ann.title}</h3>
                                        <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border ${
                                            ann.is_active ? 'bg-[var(--accent-green)]/10 text-[var(--accent-green)] border-[var(--accent-green)]/20' : 'bg-[var(--background)] text-[var(--foreground)]/55 border-[var(--border-color)]'
                                        }`}>
                                            {ann.is_active ? 'Aktif' : 'Nonaktif'}
                                        </span>
                                        {ann.show_as_popup && (
                                            <span className="px-2 py-0.5 bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] text-[8px] font-semibold uppercase rounded-md border border-[var(--accent-blue)]/20">Popup</span>
                                        )}
                                        <span className="px-2 py-0.5 bg-[var(--accent-gold)]/10 text-[var(--accent-gold)] text-[8px] font-semibold uppercase rounded-md border border-[var(--accent-gold)]/20">Prio: {ann.priority}</span>
                                    </div>
                                    <p className="mb-2 line-clamp-2 text-sm text-[var(--foreground)]/60">{ann.content}</p>
                                    {(ann.show_from || ann.show_until) && (
                                        <p className="text-xs text-[var(--foreground)]/50">
                                            🕒 {ann.show_from ? new Date(ann.show_from).toLocaleString() : 'Sekarang'} &rarr; {ann.show_until ? new Date(ann.show_until).toLocaleString() : 'Selamanya'}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => openEdit(ann)}
                                    className="rounded-xl border border-[var(--border-color)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--background)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-red)]"
                                >
                                    Edit
                                </button>
                                <button 
                                    onClick={() => handleDelete(ann.id)}
                                    className="rounded-xl px-4 py-2 text-sm font-medium text-[var(--brand-red)] transition-colors hover:bg-[var(--brand-red)]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-red)]"
                                >
                                    Hapus
                                </button>
                            </div>
                        </div>
                    ))}
                    {announcements.length === 0 && <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)]"><AdminEmptyState title="Belum ada pengumuman" message="Buat pengumuman untuk menyampaikan informasi kepada pengguna." /></div>}
                </div>
            )}

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] shadow-2xl">
                        <div className="flex items-center justify-between border-b border-[var(--border-color)] p-5 sm:p-6">
                            <h2 className="text-xl font-semibold text-[var(--foreground)]">
                                {editing ? 'Edit Pengumuman' : 'Buat Pengumuman'}
                            </h2>
                            <button type="button" aria-label="Tutup" onClick={() => setShowModal(false)} className="rounded-lg p-2 text-[var(--foreground)]/60 transition-colors hover:bg-[var(--background)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-red)]"><X size={18} /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="max-h-[70vh] space-y-5 overflow-y-auto p-5 sm:p-6">
                            <AdminTabs value={formTab} onChange={setFormTab} label="Bagian formulir pengumuman" tabs={[{ id: 'info', label: 'Info Dasar' }, { id: 'content', label: 'Konten' }, { id: 'metadata', label: 'Metadata' }]} />
                            <section id="admin-panel-info" role="tabpanel" aria-labelledby="admin-tab-info" hidden={formTab !== 'info'} className="space-y-4">
                                <label className="block space-y-2"><span className="text-sm font-medium text-[var(--foreground)]">Judul</span><input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--background)] p-3.5 text-sm text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent-blue)]" /></label>
                                <label className="block space-y-2"><span className="text-sm font-medium text-[var(--foreground)]">Konten</span><textarea rows="4" value={formData.content} onChange={(e) => setFormData({...formData, content: e.target.value})} className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--background)] p-3.5 text-sm text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent-blue)]" /></label>
                            </section>
                            <section id="admin-panel-content" role="tabpanel" aria-labelledby="admin-tab-content" hidden={formTab !== 'content'} className="grid gap-4 sm:grid-cols-2">
                                <label className="block space-y-2"><span className="text-sm font-medium text-[var(--foreground)]">Tipe</span><select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--background)] p-3.5 text-sm text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent-blue)]"><option value="info">Info (Biru)</option><option value="warning">Peringatan (Kuning)</option><option value="important">Penting (Merah)</option><option value="success">Sukses (Hijau)</option></select></label>
                                <label className="block space-y-2"><span className="text-sm font-medium text-[var(--foreground)]">Prioritas</span><input type="number" value={formData.priority} onChange={(e) => setFormData({...formData, priority: Number(e.target.value)})} className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--background)] p-3.5 text-sm text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent-blue)]" /></label>
                            </section>
                            <section id="admin-panel-metadata" role="tabpanel" aria-labelledby="admin-tab-metadata" hidden={formTab !== 'metadata'} className="space-y-4">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <label className="block space-y-2"><span className="text-sm font-medium text-[var(--foreground)]">Tampilkan dari</span><input type="datetime-local" value={formData.show_from} onChange={(e) => setFormData({...formData, show_from: e.target.value})} className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--background)] p-3.5 text-sm text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent-blue)]" /></label>
                                    <label className="block space-y-2"><span className="text-sm font-medium text-[var(--foreground)]">Tampilkan sampai</span><input type="datetime-local" value={formData.show_until} onChange={(e) => setFormData({...formData, show_until: e.target.value})} className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--background)] p-3.5 text-sm text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent-blue)]" /></label>
                                </div>
                                <div className="flex flex-col justify-center space-y-3 border-t border-[var(--border-color)] pt-4">
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <input 
                                            type="checkbox" 
                                            checked={formData.is_active}
                                            onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                                            className="size-5 rounded-md border-[var(--border-color)] text-[var(--brand-red)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-red)]"
                                        />
                                        <span className="text-sm font-medium transition-colors group-hover:text-[var(--brand-red)]">Aktif (Live)</span>
                                    </label>
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <input 
                                            type="checkbox" 
                                            checked={formData.show_as_popup}
                                            onChange={(e) => setFormData({...formData, show_as_popup: e.target.checked})}
                                            className="size-5 rounded-md border-[var(--border-color)] text-[var(--brand-red)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-red)]"
                                        />
                                        <span className="text-sm font-medium transition-colors group-hover:text-[var(--brand-red)]">Muncul sebagai Popup Modal</span>
                                    </label>
                                </div>
                            </section>

                            <button 
                                type="submit"
                                className="mt-4 w-full rounded-xl bg-[var(--brand-red)] px-5 py-3 text-sm font-semibold text-white transition-colors hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-red)]"
                            >
                                {editing ? 'Simpan Perubahan' : 'Buat Sekarang'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={!!pendingDelete}
                onClose={() => setPendingDelete(null)}
                onConfirm={confirmDelete}
                title="Hapus Pengumuman?"
                message="Hapus pengumuman ini? Tindakan ini akan menyembunyikan pengumuman dari user (Soft Delete)."
                confirmText="Hapus"
                cancelText="Batal"
                type="danger"
            />
        </div>
    );
}

