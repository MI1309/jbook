'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { API_URL } from '@/lib/api';
import Link from 'next/link';
import Cookies from 'js-cookie';
import ConfirmationModal from '@/components/common/ConfirmationModal';

function slugify(str) {
    return str.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
}

function formatBytes(bytes) {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default function BlogAdmin() {
    const { user } = useAuth();
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [formData, setFormData] = useState({ title: '', slug: '', content: '', excerpt: '', tags: '', is_published: false, featured_image_url: '' });
    const [pendingDelete, setPendingDelete] = useState(null);

    // Media library state
    const [showMedia, setShowMedia] = useState(false);
    const [mediaList, setMediaList] = useState([]);
    const [mediaLoading, setMediaLoading] = useState(false);
    const [uploadingMedia, setUploadingMedia] = useState(false);
    const [mediaMessage, setMediaMessage] = useState(null);
    const fileInputRef = useRef(null);
    const contentTextareaRef = useRef(null);

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

    const fetchMedia = async () => {
        setMediaLoading(true);
        try {
            const token = Cookies.get('access_token');
            const res = await fetch(`${API_URL}/admin/media`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setMediaList(data);
            }
        } catch (err) {
            console.error("Failed to load media", err);
        } finally {
            setMediaLoading(false);
        }
    };

    const openMediaLibrary = async () => {
        setShowMedia(true);
        setMediaMessage(null);
        await fetchMedia();
    };

    const handleUploadMedia = async (e) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploadingMedia(true);
        setMediaMessage(null);
        const token = Cookies.get('access_token');
        let successCount = 0;

        for (const file of Array.from(files)) {
            try {
                const formData = new FormData();
                formData.append('file', file);

                const res = await fetch(`${API_URL}/admin/media/upload`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData,
                });

                if (res.ok) {
                    successCount++;
                }
            } catch (err) {
                console.error("Upload error:", err);
            }
        }

        setUploadingMedia(false);
        setMediaMessage({ type: 'success', text: `Berhasil upload ${successCount} file!` });
        if (fileInputRef.current) fileInputRef.current.value = '';
        await fetchMedia();
    };

    const getFullMediaUrl = (url) => {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        return `${API_URL.replace(/\/$/, '')}/${url.replace(/^\//, '')}`;
    };

    const copyMediaUrl = (media) => {
        const fullUrl = getFullMediaUrl(media.url);
        navigator.clipboard.writeText(fullUrl).then(() => {
            setMediaMessage({ type: 'success', text: 'URL disalin!' });
            setTimeout(() => setMediaMessage(null), 2000);
        });
    };

    const insertMediaAsFeatured = (media) => {
        setFormData(prev => ({ ...prev, featured_image_url: media.url }));
        setShowMedia(false);
    };

    const insertMediaIntoContent = (media) => {
        const fullUrl = getFullMediaUrl(media.url);
        const textarea = contentTextareaRef.current;
        const embed = getMarkdownEmbed(media, fullUrl);

        setFormData(prev => {
            const currentContent = prev.content;
            if (!textarea) {
                return {
                    ...prev,
                    content: currentContent + (currentContent && !currentContent.endsWith('\n') ? '\n' : '') + embed
                };
            }

            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const before = currentContent.substring(0, start);
            const after = currentContent.substring(end);

            // Restore cursor position after update
            setTimeout(() => {
                const pos = start + embed.length;
                textarea.focus();
                textarea.setSelectionRange(pos, pos);
            }, 50);

            return {
                ...prev,
                content: before + embed + after
            };
        });
    };

    const getMarkdownEmbed = (media, fullUrl) => {
        if (media.media_type === 'image') {
            return `\n![${media.filename}](${fullUrl})\n`;
        } else if (media.media_type === 'audio') {
            return `\n<audio controls src="${fullUrl}"></audio>\n`;
        } else if (media.media_type === 'video') {
            return `\n<video controls src="${fullUrl}" style="max-width:100%"></video>\n`;
        } else if (media.media_type === 'document') {
            return `\n[📄 Download ${media.filename}](${fullUrl})\n`;
        }
        return `\n[${media.filename}](${fullUrl})\n`;
    };

    const deleteMedia = async (mediaId) => {
        if (!confirm("Hapus file media ini?")) return;
        try {
            const token = Cookies.get('access_token');
            const res = await fetch(`${API_URL}/admin/media/${mediaId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                await fetchMedia();
            }
        } catch (err) {
            console.error("Delete media error:", err);
        }
    };

    const insertEditorText = (before, after = '') => {
        const textarea = contentTextareaRef.current;
        if (!textarea) {
            setFormData(prev => ({ ...prev, content: prev.content + before + after }));
            return;
        }

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const value = textarea.value;
        const selected = value.substring(start, end) || 'teks';
        const newContent = value.substring(0, start) + before + selected + after + value.substring(end);

        setFormData(prev => ({ ...prev, content: newContent }));

        setTimeout(() => {
            textarea.focus();
            const pos = start + before.length + selected.length;
            textarea.setSelectionRange(pos, pos);
        }, 50);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = Cookies.get('access_token');
            const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(t => t);
            const payload = {
                title: formData.title,
                slug: formData.slug || slugify(formData.title),
                content: formData.content,
                excerpt: formData.excerpt,
                featured_image_url: formData.featured_image_url,
                tags: tagsArray,
                is_published: formData.is_published
            };

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
        setFormData({ title: '', slug: '', content: '', excerpt: '', tags: '', is_published: false, featured_image_url: '' });
    };

    const openEdit = (blog) => {
        setEditing(blog);
        setFormData({
            title: blog.title,
            slug: blog.slug,
            content: blog.content,
            excerpt: blog.excerpt || '',
            tags: blog.tags ? blog.tags.join(', ') : '',
            is_published: blog.is_published,
            featured_image_url: blog.featured_image_url || ''
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

    const autoSlugFromTitle = (title) => {
        if (!editing) {
            setFormData(prev => ({ ...prev, slug: slugify(title) }));
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
                        Kelola postingan blog & media
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={openMediaLibrary}
                        className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-white px-5 py-3 rounded-2xl hover:bg-white/10 font-black text-sm transition-all active:scale-95"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Media Library
                    </button>
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
                    <div className="divide-y divide-white/5">
                        {blogs.map((blog) => (
                            <div key={blog.id} className="p-6 flex flex-col md:flex-row gap-4 hover:bg-white/5 transition-colors">
                                {/* Featured image thumbnail */}
                                <div className="w-full md:w-40 flex-shrink-0">
                                    {blog.featured_image_url ? (
                                        <img
                                            src={getFullMediaUrl(blog.featured_image_url)}
                                            alt={blog.title}
                                            className="w-full h-28 object-cover rounded-2xl border border-white/10"
                                            onError={(e) => (e.currentTarget.style.display = 'none')}
                                        />
                                    ) : (
                                        <div className="w-full h-28 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center text-2xl text-neutral-600">
                                            📄
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-3 mb-2">
                                        <h3 className="text-lg font-black text-white">{blog.title}</h3>
                                        <span className={`px-3 py-1 inline-flex text-xs font-black rounded-full ${
                                            blog.is_published
                                                ? ('bg-green-900/30 text-green-400')
                                                : ('bg-yellow-900/30 text-yellow-400')
                                        }`}>
                                            {blog.is_published ? 'Published' : 'Draft'}
                                        </span>
                                        {blog.excerpt && (
                                            <p className="text-xs font-bold text-neutral-500 line-clamp-1 mt-1 md:mt-0">
                                                {blog.excerpt}
                                            </p>
                                        )}
                                    </div>
                                    <p className="text-xs font-bold text-neutral-500">
                                        Slug: /blog/{blog.slug} • {new Date(blog.created_at).toLocaleDateString('id-ID')}
                                    </p>
                                    {blog.tags && blog.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {blog.tags.map((tag, idx) => (
                                                <span key={idx} className="px-2 py-1 text-[10px] font-black rounded-full bg-white/5 text-neutral-400">
                                                    #{tag}
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
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="w-full max-w-5xl h-[95vh] rounded-[2.5rem] shadow-2xl overflow-hidden transform animate-in zoom-in duration-300 bg-neutral-900 border border-white/10 flex flex-col">
                        <div className="p-6 md:p-8 border-b border-white/5 flex justify-between items-center">
                            <h2 className="text-2xl font-black tracking-tight text-white">
                                {editing ? 'Edit Post' : 'Post Baru'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-neutral-500 text-3xl leading-none hover:text-white transition-colors">&times;</button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar">
                            <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Main content column */}
                                <div className="lg:col-span-2 space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest opacity-50">Judul</label>
                                        <input
                                            required
                                            type="text"
                                            value={formData.title}
                                            onChange={(e) => {
                                                setFormData({ ...formData, title: e.target.value });
                                                autoSlugFromTitle(e.target.value);
                                            }}
                                            placeholder="Judul postingan blog..."
                                            className="w-full p-4 rounded-xl border-2 outline-none transition-all bg-white/5 border-white/5 focus:border-red-600 text-white text-lg font-bold"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest opacity-50">Slug (URL)</label>
                                        <input
                                            required
                                            type="text"
                                            value={formData.slug}
                                            onChange={(e) => setFormData({ ...formData, slug: slugify(e.target.value) })}
                                            className="w-full p-3 rounded-xl border-2 outline-none transition-all bg-white/5 border-white/5 focus:border-red-600 text-white font-mono text-sm"
                                        />
                                    </div>

                                    {/* Editor Toolbar */}
                                    <div className="flex flex-wrap gap-2 p-2 rounded-xl border border-white/5 bg-white/5">
                                        <button type="button" onClick={() => insertEditorText('**', '**')} title="Bold" className="px-3 py-1.5 rounded-lg font-black text-sm text-white hover:bg-white/10 transition-colors">B</button>
                                        <button type="button" onClick={() => insertEditorText('*', '*')} title="Italic" className="px-3 py-1.5 rounded-lg font-bold italic text-sm text-white hover:bg-white/10 transition-colors">I</button>
                                        <button type="button" onClick={() => insertEditorText('## ', '')} title="Heading 2" className="px-3 py-1.5 rounded-lg font-black text-xs text-white hover:bg-white/10 transition-colors">H2</button>
                                        <button type="button" onClick={() => insertEditorText('### ', '')} title="Heading 3" className="px-3 py-1.5 rounded-lg font-black text-xs text-white hover:bg-white/10 transition-colors">H3</button>
                                        <button type="button" onClick={() => insertEditorText('[', '](https://)')} title="Link" className="px-3 py-1.5 rounded-lg text-sm text-white hover:bg-white/10 transition-colors">🔗 Link</button>
                                        <button type="button" onClick={() => insertEditorText('\n- ', '')} title="List" className="px-3 py-1.5 rounded-lg text-sm text-white hover:bg-white/10 transition-colors">• List</button>
                                        <button type="button" onClick={() => insertEditorText('\n> ', '')} title="Quote" className="px-3 py-1.5 rounded-lg text-sm text-white hover:bg-white/10 transition-colors">❝ Quote</button>
                                        <button type="button" onClick={() => insertEditorText('\n```\n', '\n```\n')} title="Code Block" className="px-3 py-1.5 rounded-lg font-mono text-xs text-white hover:bg-white/10 transition-colors">{`{ }`} Code</button>
                                        <div className="flex-1"></div>
                                        <button
                                            type="button"
                                            onClick={openMediaLibrary}
                                            className="px-3 py-1.5 rounded-lg text-sm font-bold text-white bg-red-600/20 hover:bg-red-600/30 transition-colors flex items-center gap-1.5"
                                        >
                                            🖼️ Insert Media
                                        </button>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest opacity-50">Konten (Markdown / HTML)</label>
                                        <textarea
                                            ref={contentTextareaRef}
                                            required
                                            rows={18}
                                            value={formData.content}
                                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                            placeholder="Tulis konten blog Anda di sini... (Gunakan toolbar di atas untuk memformat, atau klik 'Insert Media' untuk menambahkan gambar/audio/dokumen)"
                                            className="w-full p-4 rounded-xl border-2 outline-none transition-all font-mono text-sm bg-white/5 border-white/5 focus:border-red-600 text-white leading-relaxed"
                                        />
                                    </div>
                                </div>

                                {/* Sidebar column */}
                                <div className="space-y-6">
                                    {/* Featured Image */}
                                    <div className="space-y-3 p-4 rounded-2xl border border-white/5 bg-white/5">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[10px] font-black uppercase tracking-widest opacity-70">Featured Image</label>
                                            <button
                                                type="button"
                                                onClick={openMediaLibrary}
                                                className="text-[10px] font-black uppercase tracking-widest text-red-400 hover:text-red-300 transition-colors"
                                            >
                                                Pilih dari Media
                                            </button>
                                        </div>

                                        {formData.featured_image_url ? (
                                            <div className="relative">
                                                <img
                                                    src={getFullMediaUrl(formData.featured_image_url)}
                                                    alt="Featured"
                                                    className="w-full h-40 object-cover rounded-xl border border-white/10"
                                                    onError={(e) => (e.currentTarget.style.display = 'none')}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, featured_image_url: '' }))}
                                                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white text-xs hover:bg-black/80 transition-colors"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="w-full h-40 rounded-xl border-2 border-dashed border-white/10 bg-white/5 flex flex-col items-center justify-center text-center p-4">
                                                <div className="text-3xl mb-2">🖼️</div>
                                                <p className="text-xs font-bold text-neutral-500">Belum ada featured image</p>
                                                <p className="text-[10px] text-neutral-600 mt-1">Klik "Pilih dari Media" di atas</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Excerpt */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest opacity-50">Excerpt (Cuplikan)</label>
                                        <textarea
                                            rows={4}
                                            value={formData.excerpt}
                                            onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                                            placeholder="Cuplikan singkat untuk daftar blog (opsional)..."
                                            className="w-full p-3 rounded-xl border-2 outline-none transition-all bg-white/5 border-white/5 focus:border-red-600 text-white text-sm"
                                        />
                                    </div>

                                    {/* Tags */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest opacity-50">Tags (pisahkan dengan koma)</label>
                                        <input
                                            type="text"
                                            value={formData.tags}
                                            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                            placeholder="tips, belajar, jlpt n5..."
                                            className="w-full p-3 rounded-xl border-2 outline-none transition-all bg-white/5 border-white/5 focus:border-red-600 text-white"
                                        />
                                        {formData.tags && (
                                            <div className="flex flex-wrap gap-1.5 mt-2">
                                                {formData.tags.split(',').map((t, i) => t.trim() && (
                                                    <span key={i} className="px-2 py-0.5 rounded-full bg-red-600/20 text-red-300 text-[10px] font-black">
                                                        #{t.trim()}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Publish */}
                                    <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                                        <input
                                            id="publish_checkbox"
                                            type="checkbox"
                                            checked={formData.is_published}
                                            onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                                            className="w-5 h-5 rounded-md border-gray-300 text-red-600 focus:ring-red-600"
                                        />
                                        <label htmlFor="publish_checkbox" className="text-xs font-bold uppercase tracking-widest text-neutral-400 cursor-pointer select-none">
                                            {editing ? (formData.is_published ? 'Status: Published' : 'Status: Draft') : 'Publish Segera'}
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Submit Button Bar */}
                            <div className="p-6 md:p-8 border-t border-white/5 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-4 rounded-2xl font-black text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 transition-all"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="flex-[2] bg-red-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-red-500/20 hover:bg-red-700 transition-all active:scale-95"
                                >
                                    {editing ? '💾 Simpan Perubahan' : '✅ Simpan Post'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Media Library Modal */}
            {showMedia && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-6 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="w-full max-w-5xl h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden transform animate-in zoom-in duration-300 bg-neutral-900 border border-white/10 flex flex-col">
                        <div className="p-6 md:p-8 border-b border-white/5 flex flex-col md:flex-row justify-between gap-4">
                            <div>
                                <h2 className="text-2xl font-black tracking-tight text-white mb-1">
                                    📦 Media Library
                                </h2>
                                <p className="text-xs font-bold text-neutral-500">
                                    Upload dan kelola gambar, audio, video, dan dokumen
                                </p>
                            </div>
                            <button onClick={() => setShowMedia(false)} className="text-neutral-500 text-3xl leading-none hover:text-white transition-colors self-start">&times;</button>
                        </div>

                        <div className="p-6 md:p-8 flex-1 overflow-y-auto custom-scrollbar">
                            {/* Upload section */}
                            <div className="mb-6 p-6 rounded-2xl border-2 border-dashed border-white/10 bg-white/5">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    onChange={handleUploadMedia}
                                    className="hidden"
                                    id="media-file-input"
                                    accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                                />
                                <label
                                    htmlFor="media-file-input"
                                    className="block w-full text-center cursor-pointer"
                                >
                                    {uploadingMedia ? (
                                        <div className="space-y-3">
                                            <div className="w-10 h-10 mx-auto border-4 border-red-600/20 border-t-red-600 rounded-full animate-spin"></div>
                                            <p className="text-sm font-bold text-neutral-400">Mengunggah file...</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-600/10 border border-red-600/20">
                                                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-white">Klik untuk upload, atau seret file ke sini</p>
                                                <p className="text-xs text-neutral-500 mt-1 font-bold">
                                                    Support: Image (PNG/JPG/WebP/GIF), Audio (MP3/WAV), Video (MP4/WebM), Dokumen (PDF/DOC/XLS)
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </label>
                            </div>

                            {mediaMessage && (
                                <div className={`mb-4 p-3 rounded-xl text-xs font-black ${
                                    mediaMessage.type === 'success'
                                        ? 'bg-green-600/20 text-green-300 border border-green-600/20'
                                        : 'bg-red-600/20 text-red-300 border border-red-600/20'
                                }`}>
                                    {mediaMessage.text}
                                </div>
                            )}

                            {/* Media grid */}
                            {mediaLoading ? (
                                <div className="p-12 text-center">
                                    <div className="w-10 h-10 mx-auto border-4 border-red-600/20 border-t-red-600 rounded-full animate-spin"></div>
                                </div>
                            ) : mediaList.length === 0 ? (
                                <div className="p-12 text-center rounded-2xl bg-white/5">
                                    <div className="text-4xl mb-3">📭</div>
                                    <p className="text-sm font-bold text-neutral-500">Belum ada media. Upload file pertama Anda!</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {mediaList.map(media => (
                                        <div key={media.id} className="group relative rounded-2xl overflow-hidden border border-white/10 bg-white/5 hover:border-red-500/50 transition-all">
                                            <div className="aspect-square flex items-center justify-center bg-black/30 overflow-hidden relative">
                                                {media.media_type === 'image' ? (
                                                    <img
                                                        src={getFullMediaUrl(media.url)}
                                                        alt={media.filename}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            e.currentTarget.style.display = 'none';
                                                            e.currentTarget.parentElement.innerHTML = '<div class="text-4xl">🖼️</div>';
                                                        }}
                                                    />
                                                ) : media.media_type === 'audio' ? (
                                                    <div className="text-4xl">🎵</div>
                                                ) : media.media_type === 'video' ? (
                                                    <div className="text-4xl">🎬</div>
                                                ) : media.media_type === 'document' ? (
                                                    <div className="text-4xl">📄</div>
                                                ) : (
                                                    <div className="text-4xl">📦</div>
                                                )}

                                                {/* Overlay actions on hover */}
                                                <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                                                    <button
                                                        onClick={() => insertMediaAsFeatured(media)}
                                                        className="w-full px-2 py-1.5 rounded-lg bg-indigo-600 text-white text-[10px] font-black hover:bg-indigo-700 transition-colors"
                                                    >
                                                        ✨ Jadikan Featured
                                                    </button>
                                                    <button
                                                        onClick={() => insertMediaIntoContent(media)}
                                                        className="w-full px-2 py-1.5 rounded-lg bg-green-600 text-white text-[10px] font-black hover:bg-green-700 transition-colors"
                                                    >
                                                        ➕ Sisipkan ke Konten
                                                    </button>
                                                    <button
                                                        onClick={() => copyMediaUrl(media)}
                                                        className="w-full px-2 py-1.5 rounded-lg bg-white/10 text-white text-[10px] font-black hover:bg-white/20 transition-colors"
                                                    >
                                                        📋 Salin URL
                                                    </button>
                                                    <button
                                                        onClick={() => deleteMedia(media.id)}
                                                        className="w-full px-2 py-1.5 rounded-lg bg-red-600/80 text-white text-[10px] font-black hover:bg-red-600 transition-colors"
                                                    >
                                                        🗑️ Hapus
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="p-2.5 space-y-1">
                                                <p className="text-[11px] font-bold text-white truncate" title={media.filename}>
                                                    {media.filename}
                                                </p>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[9px] uppercase font-black rounded-full px-1.5 py-0.5 bg-white/10 text-neutral-400">
                                                        {media.media_type}
                                                    </span>
                                                    <span className="text-[9px] font-bold text-neutral-500">
                                                        {formatBytes(media.file_size)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="p-4 md:p-6 border-t border-white/5 flex justify-end gap-3">
                            <button
                                onClick={() => setShowMedia(false)}
                                className="px-8 py-3 rounded-2xl font-black bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 transition-all"
                            >
                                Tutup
                            </button>
                        </div>
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
