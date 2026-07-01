'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { API_URL } from '@/lib/api';
import Link from 'next/link';
import Cookies from 'js-cookie';
import ConfirmationModal from '@/components/common/ConfirmationModal';

export default function BlogAdmin() {
    const { user } = useAuth();
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [formData, setFormData] = useState({ title: '', slug: '', content: '', tags: '', is_published: false });
    const [pendingDelete, setPendingDelete] = useState(null);

    useEffect(() => {
        fetchBlogs();
    }, []);

    const fetchBlogs = async () => {
        setLoading(true);
        try {
            const token = Cookies.get('access_token');
            const res = await fetch(`${API_URL}/admin/blog`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setBlogs(data);
            }
        } catch (error) {
            console.error("Failed to fetch blogs", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = Cookies.get('access_token');
            const tagsArray = formData.tags.split(',').map(tag => tag.trim());
            const payload = { ...formData, tags: tagsArray };

            const url = editing
                ? `${API_URL}/admin/blog/${editing.id}`
                : `${API_URL}/admin/blog`;
            const method = editing ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                fetchBlogs();
                setShowModal(false);
                setEditing(null);
                resetForm();
            }
        } catch (error) {
            console.error("Save failed", error);
        }
    };

    const resetForm = () => {
        setFormData({ title: '', slug: '', content: '', tags: '', is_published: false });
    };

    const openEdit = (blog) => {
        setEditing(blog);
        setFormData({
            title: blog.title,
            slug: blog.slug,
            content: blog.content,
            tags: blog.tags ? blog.tags.join(', ') : '',
            is_published: blog.is_published
        });
        setShowModal(true);
    };

    const confirmDelete = async () => {
        if (!pendingDelete) return;
        try {
            const token = Cookies.get('access_token');
            const res = await fetch(`${API_URL}/admin/blog/${pendingDelete}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                fetchBlogs();
            }
        } catch (error) {
            console.error("Delete failed", error);
        } finally {
            setPendingDelete(null);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-white">
                        Blog <span className="text-red-600">Management</span>
                    </h1>
                    <p className="mt-1 text-xs font-bold uppercase tracking-[0.2em] text-neutral-500">
                        Kelola postingan blog
                    </p>
                </div>
                <button
                    onClick={() => {
                        setEditing(null);
                        resetForm();
                        setShowModal(true);
                    }}
                    className="inline-flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-2xl hover:bg-red-700 font-black text-sm shadow-lg shadow-red-500/20 transition-all active:scale-95"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Post Baru
                </button>
            </div>

            {/* Content */}
            <div className="rounded-3xl border overflow-hidden bg-neutral-900/30 border-white/5">
                {loading ? (
                    <div className="p-12 text-center">
                        <div className="w-10 h-10 border-4 border-red-600/20 border-t-red-600 rounded-full animate-spin mx-auto"></div>
                        <p className="mt-4 text-xs font-bold uppercase tracking-widest text-neutral-500">
                            Memuat...
                        </p>
                    </div>
                ) : blogs.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="text-4xl mb-4">✍️</div>
                        <p className="text-sm font-bold text-neutral-500">
                            Belum ada postingan blog
                        </p>
                    </div>
                ) : (
                    <div className="divide-y">
                        {blogs.map((blog) => (
                            <div key={blog.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 divide-white/5 hover:bg-white/5 transition-colors">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-lg font-black text-white">{blog.title}</h3>
                                        <span className={`px-3 py-1 inline-flex text-xs font-black rounded-full ${
                                            blog.is_published
                                                ? ('bg-green-900/30 text-green-400')
                                                : ('bg-yellow-900/30 text-yellow-400')
                                        }`}>
                                            {blog.is_published ? 'Published' : 'Draft'}
                                        </span>
                                    </div>
                                    <p className="text-sm font-bold text-neutral-500">{blog.slug}</p>
                                    {blog.tags && blog.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {blog.tags.map((tag, idx) => (
                                                <span key={idx} className="px-2 py-1 text-[10px] font-black rounded-full bg-white/5 text-neutral-400">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => openEdit(blog)}
                                        className="p-2 rounded-xl transition-colors text-indigo-400 hover:bg-indigo-500/10"
                                        title="Edit"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => setPendingDelete(blog.id)}
                                        className="p-2 rounded-xl transition-colors text-red-400 hover:bg-red-500/10"
                                        title="Hapus"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="w-full max-w-3xl rounded-[2.5rem] shadow-2xl overflow-hidden transform animate-in zoom-in duration-300 bg-neutral-900 border border-white/10">
                        <div className="p-8 border-b border-gray-100 dark:border-white/5 flex justify-between items-center">
                            <h2 className="text-2xl font-black tracking-tight text-white">
                                {editing ? 'Edit Post' : 'Post Baru'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-neutral-500">&times;</button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2 col-span-full">
                                    <label className="text-[10px] font-black uppercase tracking-widest opacity-50">Judul</label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full p-4 rounded-xl border-2 outline-none transition-all bg-white/5 border-white/5 focus:border-red-600 text-white"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest opacity-50">Slug</label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.slug}
                                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                        className="w-full p-4 rounded-xl border-2 outline-none transition-all bg-white/5 border-white/5 focus:border-red-600 text-white"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest opacity-50">Tags (pisahkan dengan koma)</label>
                                    <input
                                        type="text"
                                        value={formData.tags}
                                        onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                        className="w-full p-4 rounded-xl border-2 outline-none transition-all bg-white/5 border-white/5 focus:border-red-600 text-white"
                                    />
                                </div>

                                <div className="space-y-2 col-span-full">
                                    <label className="text-[10px] font-black uppercase tracking-widest opacity-50">Konten (Markdown)</label>
                                    <textarea
                                        required
                                        rows="10"
                                        value={formData.content}
                                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                        className="w-full p-4 rounded-xl border-2 outline-none transition-all font-mono bg-white/5 border-white/5 focus:border-red-600 text-white"
                                    />
                                </div>

                                <div className="flex items-center gap-3 col-span-full pt-4">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_published}
                                        onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                                        className="w-5 h-5 rounded-md border-gray-300 text-red-600 focus:ring-red-600"
                                    />
                                    <label className="text-xs font-bold uppercase tracking-widest text-neutral-600">Publish Segera</label>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-red-600 text-white py-5 rounded-2xl font-black shadow-xl shadow-red-500/20 hover:bg-red-700 transition-all active:scale-95 mt-8"
                            >
                                {editing ? 'Simpan Perubahan' : 'Simpan Post'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={!!pendingDelete}
                onClose={() => setPendingDelete(null)}
                onConfirm={confirmDelete}
                title="Hapus Post?"
                message="Apakah Anda yakin ingin menghapus postingan blog ini?"
                confirmText="Hapus"
                cancelText="Batal"
                type="danger"
            />
        </div>
    );
}
