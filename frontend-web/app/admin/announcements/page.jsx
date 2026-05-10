'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { API_URL } from '@/lib/api';
import Cookies from 'js-cookie';
import Link from 'next/link';
import ConfirmationModal from '@/components/common/ConfirmationModal';

export default function AdminAnnouncements() {
    const { theme } = useTheme();
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
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
        try {
            const token = Cookies.get('access_token');
            const res = await fetch(`${API_URL}/admin/announcements`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setAnnouncements(data);
            }
        } catch (error) {
            console.error("Failed to fetch announcements", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
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

            if (res.ok) {
                fetchAnnouncements();
                setShowModal(false);
                setEditing(null);
                resetForm();
            }
        } catch (error) {
            console.error("Save failed", error);
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
            if (res.ok) fetchAnnouncements();
        } catch (error) {
            console.error("Delete failed", error);
        } finally {
            setPendingDelete(null);
        }
    };

    const openEdit = (ann) => {
        setEditing(ann);
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

    const textColor = theme === 'dark' ? 'text-white' : 'text-gray-900';
    const subTextColor = theme === 'dark' ? 'text-neutral-500' : 'text-gray-400';

    return (
        <div className="max-w-6xl mx-auto py-10 px-4 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="animate-in fade-in slide-in-from-left-6 duration-700">
                    <Link href="/admin" className="text-red-600 font-black text-xs uppercase tracking-widest hover:underline mb-2 block">
                        &larr; Kembali ke Dashboard
                    </Link>
                    <h1 className={`text-5xl font-black tracking-tighter ${textColor}`}>
                        Manajemen <span className="text-red-600">Pengumuman</span>
                    </h1>
                </div>

                <button 
                    onClick={() => {
                        setEditing(null);
                        resetForm();
                        setShowModal(true);
                    }}
                    className="bg-red-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-red-500/20 hover:bg-red-700 transition-all active:scale-95 flex items-center gap-3"
                >
                    <span className="text-xl">📢</span>
                    Buat Pengumuman Baru
                </button>
            </div>

            {loading ? (
                <div className="text-center py-20">
                    <div className="animate-spin h-10 w-10 border-4 border-red-600/20 border-t-red-600 rounded-full mx-auto"></div>
                </div>
            ) : (
                <div className="grid gap-4">
                    {announcements.map((ann) => (
                        <div 
                            key={ann.id}
                            className={`p-6 rounded-3xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 ${
                                theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-white border-gray-100 shadow-sm'
                            }`}
                        >
                            <div className="flex gap-4 flex-1">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 ${
                                    ann.type === 'important' ? 'bg-red-600 text-white' :
                                    ann.type === 'warning' ? 'bg-yellow-500 text-white' :
                                    ann.type === 'success' ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'
                                }`}>
                                    {ann.type === 'important' ? '🚨' : ann.type === 'warning' ? '⚠️' : ann.type === 'success' ? '✅' : 'ℹ️'}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                                        <h3 className={`text-lg font-black ${textColor}`}>{ann.title}</h3>
                                        <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border ${
                                            ann.is_active ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-gray-500/10 text-gray-500 border-gray-500/20'
                                        }`}>
                                            {ann.is_active ? 'Aktif' : 'Nonaktif'}
                                        </span>
                                        {ann.show_as_popup && (
                                            <span className="px-2 py-0.5 bg-purple-500/10 text-purple-500 text-[8px] font-black uppercase tracking-widest rounded-md border border-purple-500/20">Popup</span>
                                        )}
                                        <span className="px-2 py-0.5 bg-blue-500/10 text-blue-500 text-[8px] font-black uppercase tracking-widest rounded-md border border-blue-500/20">Prio: {ann.priority}</span>
                                    </div>
                                    <p className={`text-sm font-medium line-clamp-1 mb-2 ${subTextColor}`}>{ann.content}</p>
                                    {(ann.show_from || ann.show_until) && (
                                        <p className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest">
                                            🕒 {ann.show_from ? new Date(ann.show_from).toLocaleString() : 'Sekarang'} &rarr; {ann.show_until ? new Date(ann.show_until).toLocaleString() : 'Selamanya'}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => openEdit(ann)}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                        theme === 'dark' ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                    }`}
                                >
                                    Edit
                                </button>
                                <button 
                                    onClick={() => handleDelete(ann.id)}
                                    className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-red-600/10 text-red-600 hover:bg-red-600 hover:text-white transition-all"
                                >
                                    Hapus
                                </button>
                            </div>
                        </div>
                    ))}
                    {announcements.length === 0 && (
                        <div className="text-center py-20 opacity-50 font-bold uppercase tracking-widest text-xs">Belum ada pengumuman.</div>
                    )}
                </div>
            )}

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className={`w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden transform animate-in zoom-in duration-300 ${
                        theme === 'dark' ? 'bg-neutral-900 border border-white/10' : 'bg-white'
                    }`}>
                        <div className="p-8 border-b border-gray-100 dark:border-white/5 flex justify-between items-center">
                            <h2 className={`text-2xl font-black tracking-tight ${textColor}`}>
                                {editing ? 'Edit Pengumuman' : 'Buat Pengumuman'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className={subTextColor}>&times;</button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2 col-span-full">
                                    <label className="text-[10px] font-black uppercase tracking-widest opacity-50">Judul</label>
                                    <input 
                                        required
                                        type="text" 
                                        value={formData.title}
                                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                                        className={`w-full p-4 rounded-xl border-2 outline-none transition-all ${
                                            theme === 'dark' ? 'bg-white/5 border-white/5 focus:border-red-600' : 'bg-gray-50 border-transparent focus:border-red-600 focus:bg-white'
                                        } ${textColor}`}
                                    />
                                </div>

                                <div className="space-y-2 col-span-full">
                                    <label className="text-[10px] font-black uppercase tracking-widest opacity-50">Konten</label>
                                    <textarea 
                                        required
                                        rows="3"
                                        value={formData.content}
                                        onChange={(e) => setFormData({...formData, content: e.target.value})}
                                        className={`w-full p-4 rounded-xl border-2 outline-none transition-all ${
                                            theme === 'dark' ? 'bg-white/5 border-white/5 focus:border-red-600' : 'bg-gray-50 border-transparent focus:border-red-600 focus:bg-white'
                                        } ${textColor}`}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest opacity-50">Tipe</label>
                                    <select 
                                        value={formData.type}
                                        onChange={(e) => setFormData({...formData, type: e.target.value})}
                                        className={`w-full p-4 rounded-xl border-2 outline-none transition-all ${
                                            theme === 'dark' ? 'bg-neutral-800 border-white/5' : 'bg-gray-50 border-transparent'
                                        } ${textColor}`}
                                    >
                                        <option value="info">Info (Biru)</option>
                                        <option value="warning">Peringatan (Kuning)</option>
                                        <option value="important">Penting (Merah)</option>
                                        <option value="success">Sukses (Hijau)</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest opacity-50">Prioritas (Angka)</label>
                                    <input 
                                        type="number" 
                                        value={formData.priority}
                                        onChange={(e) => setFormData({...formData, priority: parseInt(e.target.value)})}
                                        className={`w-full p-4 rounded-xl border-2 outline-none transition-all ${
                                            theme === 'dark' ? 'bg-white/5 border-white/5 focus:border-red-600' : 'bg-gray-50 border-transparent focus:border-red-600 focus:bg-white'
                                        } ${textColor}`}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest opacity-50">Tampilkan Dari</label>
                                    <input 
                                        type="datetime-local" 
                                        value={formData.show_from}
                                        onChange={(e) => setFormData({...formData, show_from: e.target.value})}
                                        className={`w-full p-4 rounded-xl border-2 outline-none transition-all ${
                                            theme === 'dark' ? 'bg-white/5 border-white/5 focus:border-red-600' : 'bg-gray-50 border-transparent focus:border-red-600 focus:bg-white'
                                        } ${textColor}`}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest opacity-50">Tampilkan Sampai</label>
                                    <input 
                                        type="datetime-local" 
                                        value={formData.show_until}
                                        onChange={(e) => setFormData({...formData, show_until: e.target.value})}
                                        className={`w-full p-4 rounded-xl border-2 outline-none transition-all ${
                                            theme === 'dark' ? 'bg-white/5 border-white/5 focus:border-red-600' : 'bg-gray-50 border-transparent focus:border-red-600 focus:bg-white'
                                        } ${textColor}`}
                                    />
                                </div>

                                <div className="flex flex-col justify-center space-y-3 col-span-full pt-4">
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <input 
                                            type="checkbox" 
                                            checked={formData.is_active}
                                            onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                                            className="w-5 h-5 rounded-md border-gray-300 text-red-600 focus:ring-red-600"
                                        />
                                        <span className="text-xs font-bold uppercase tracking-widest group-hover:text-red-600 transition-colors">Aktif (Live)</span>
                                    </label>
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <input 
                                            type="checkbox" 
                                            checked={formData.show_as_popup}
                                            onChange={(e) => setFormData({...formData, show_as_popup: e.target.checked})}
                                            className="w-5 h-5 rounded-md border-gray-300 text-red-600 focus:ring-red-600"
                                        />
                                        <span className="text-xs font-bold uppercase tracking-widest group-hover:text-red-600 transition-colors">Muncul sebagai Popup Modal</span>
                                    </label>
                                </div>
                            </div>

                            <button 
                                type="submit"
                                className="w-full bg-red-600 text-white py-5 rounded-2xl font-black shadow-xl shadow-red-500/20 hover:bg-red-700 transition-all active:scale-95 mt-8"
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

