'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/lib/api';
import Link from 'next/link';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';

export default function BunpoForm({ params }) {
    const router = useRouter();
    const { id } = use(params);
    const isNew = id === 'new';

    const [loading, setLoading] = useState(!isNew);
    const [formData, setFormData] = useState({
        title: '',
        structure: '',
        explanation: '',
        chapter: 1,
        jlpt_level: 5,
        sentences: []
    });
    // Temporary state for a new sentence
    const [newSentence, setNewSentence] = useState({ jp: '', id: '' });

    useEffect(() => {
        if (!isNew) {
            fetchBunpo();
        }
    }, [id]);

    const fetchBunpo = async () => {
        try {
            const token = Cookies.get('access_token');
            const res = await fetch(`${API_URL}/admin/grammar/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setFormData({
                    title: data.title,
                    structure: data.structure,
                    explanation: data.explanation,
                    chapter: data.chapter,
                    jlpt_level: data.jlpt_level,
                    sentences: data.sentences || []
                });
            } else {
                console.error("Fetch failed:", res.status, res.statusText);
                const text = await res.text();
                toast.error(`Gagal memuat Grammar: ${res.status} ${res.statusText}\n${text}`);
            }
        } catch (error) {
            console.error("Fetch error", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddSentence = () => {
        if (newSentence.jp && newSentence.id) {
            setFormData({
                ...formData,
                sentences: [...formData.sentences, newSentence]
            });
            setNewSentence({ jp: '', id: '' });
        }
    };

    const removeSentence = (index) => {
        setFormData({
            ...formData,
            sentences: formData.sentences.filter((_, i) => i !== index)
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = Cookies.get('access_token');
            const payload = {
                ...formData,
                chapter: parseInt(formData.chapter),
                jlpt_level: parseInt(formData.jlpt_level)
            };

            const url = isNew
                ? `${API_URL}/admin/grammar`
                : `${API_URL}/admin/grammar/${id}`;
            const method = isNew ? 'POST' : 'PUT';

            const res = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                toast.success(isNew ? 'Grammar created!' : 'Grammar updated!');
                router.push('/admin/bunpo');
            } else {
                const errorData = await res.json();
                console.error("Failed to save", errorData);
                toast.error(`Failed to save: ${JSON.stringify(errorData)}`);
            }
        } catch (error) {
            console.error("Save error", error);
            toast.error('Error saving data');
        }
    };

    if (loading) return (
        <div className="p-12 text-center">
            <div className="w-10 h-10 border-4 border-red-600/20 border-t-red-600 rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-xs font-bold uppercase tracking-widest text-neutral-500">
                Memuat...
            </p>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/admin/bunpo" className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/5">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </Link>
                    <h1 className="text-3xl font-black tracking-tight text-white">
                        {isNew ? 'Tambah Bunpo Baru' : 'Edit Bunpo'}
                    </h1>
                </div>
            </div>

            {/* Form */}
            <div className="rounded-[2rem] border overflow-hidden bg-neutral-900/30 border-white/5">
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2 col-span-full md:col-span-1">
                            <label className="text-[10px] font-black uppercase tracking-widest opacity-50">Judul</label>
                            <input
                                type="text"
                                className="w-full p-4 rounded-xl border-2 outline-none transition-all bg-white/5 border-white/5 focus:border-red-600 text-white"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2 col-span-full md:col-span-1">
                            <label className="text-[10px] font-black uppercase tracking-widest opacity-50">Struktur</label>
                            <input
                                type="text"
                                className="w-full p-4 rounded-xl border-2 outline-none transition-all bg-white/5 border-white/5 focus:border-red-600 text-white"
                                value={formData.structure}
                                onChange={(e) => setFormData({ ...formData, structure: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest opacity-50">Penjelasan</label>
                        <textarea
                            rows="6"
                            className="w-full p-4 rounded-xl border-2 outline-none transition-all bg-white/5 border-white/5 focus:border-red-600 text-white"
                            value={formData.explanation}
                            onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest opacity-50">Bab</label>
                            <input
                                type="number"
                                className="w-full p-4 rounded-xl border-2 outline-none transition-all bg-white/5 border-white/5 focus:border-red-600 text-white"
                                value={formData.chapter}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    if (e.target.value === '' || (!isNaN(val) && val >= 1)) {
                                        setFormData({ ...formData, chapter: e.target.value });
                                    }
                                }}
                                required
                                min={1}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest opacity-50">Level JLPT (1-5)</label>
                            <select
                                className="w-full p-4 rounded-xl border-2 outline-none transition-all bg-neutral-800 border-white/5 text-white"
                                value={formData.jlpt_level}
                                onChange={(e) => setFormData({ ...formData, jlpt_level: e.target.value })}
                            >
                                {[5,4,3,2,1].map(l => <option key={l} value={l}>N{l}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Sentences */}
                    <div className="border-t border-gray-100 dark:border-white/5 pt-6 space-y-4">
                        <h3 className="text-sm font-black text-neutral-500 uppercase tracking-widest opacity-50">Contoh Kalimat</h3>
                        {formData.sentences.map((sent, idx) => (
                            <div key={idx} className="p-4 rounded-xl flex items-start justify-between bg-white/5">
                                <div className="space-y-1 flex-1">
                                    <p className="font-black text-white">{sent.jp}</p>
                                    <p className="text-sm font-bold text-neutral-400">{sent.id}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeSentence(idx)}
                                    className="p-2 rounded-lg transition-colors text-red-400 hover:bg-red-500/10"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        ))}

                        <div className="p-4 rounded-xl border-2 border-dashed border-white/5">
                            <h4 className="text-xs font-black uppercase tracking-widest opacity-50 mb-3">Tambah Kalimat Baru</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                <input
                                    type="text"
                                    placeholder="Kalimat Bahasa Jepang"
                                    className="p-3 rounded-lg border text-sm bg-white/5 border-white/5 text-white"
                                    value={newSentence.jp}
                                    onChange={(e) => setNewSentence({ ...newSentence, jp: e.target.value })}
                                />
                                <input
                                    type="text"
                                    placeholder="Terjemahan Bahasa Indonesia"
                                    className="p-3 rounded-lg border text-sm bg-white/5 border-white/5 text-white"
                                    value={newSentence.id}
                                    onChange={(e) => setNewSentence({ ...newSentence, id: e.target.value })}
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    if (newSentence.jp && newSentence.id) {
                                        setFormData({
                                            ...formData,
                                            sentences: [...formData.sentences, newSentence]
                                        });
                                        setNewSentence({ jp: '', id: '' });
                                    }
                                }}
                                className="w-full px-6 py-3 rounded-xl font-bold transition-colors bg-white/5 text-white hover:bg-white/10"
                            >
                                Tambah Kalimat
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row md:justify-end gap-4 pt-6 border-t border-gray-100 dark:border-white/5">
                        <Link href="/admin/bunpo" className="flex-1 md:flex-none px-6 py-3 rounded-xl font-bold text-center transition-all bg-white/5 text-white hover:bg-white/10">
                            Batal
                        </Link>
                        <button type="submit" className="flex-1 md:flex-none bg-red-600 text-white px-8 py-3 rounded-xl font-black shadow-lg shadow-red-500/20 hover:bg-red-700 transition-all active:scale-95">
                            {isNew ? 'Buat Bunpo' : 'Update Bunpo'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
