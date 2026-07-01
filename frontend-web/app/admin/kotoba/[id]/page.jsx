'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/lib/api';
import Link from 'next/link';
import Cookies from 'js-cookie';

export default function KotobaForm({ params }) {
    const { id } = use(params);
    const router = useRouter();
    const isNew = id === 'new';

    const [formData, setFormData] = useState({
        word: '',
        reading: '',
        meaning: '',
        word_type: '',
        jlpt_level: 5,
        examples: []
    });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!isNew) {
            fetchVocab();
        }
    }, [id]);

    const fetchVocab = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = Cookies.get('access_token');
            const res = await fetch(`${API_URL}/admin/vocab/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setFormData({
                    ...data,
                    examples: data.examples || []
                });
            } else {
                const data = await res.json().catch(() => ({}));
                setError(data.detail || data.message || `Gagal memuat data (Status: ${res.status})`);
            }
        } catch (err) {
            console.error(err);
            setError("Koneksi gagal. Mohon periksa internet Anda.");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        try {
            const token = Cookies.get('access_token');
            const url = isNew
                ? `${API_URL}/admin/vocab`
                : `${API_URL}/admin/vocab/${id}`;
            const method = isNew ? 'POST' : 'PUT';

            const res = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                router.push('/admin/kotoba');
            } else {
                const data = await res.json().catch(() => ({}));
                setError(data.detail || data.message || `Gagal menyimpan (Status: ${res.status})`);
            }
        } catch (err) {
            console.error(err);
            setError("Koneksi gagal. Mohon periksa internet Anda.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center min-h-[50vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
        </div>
    );

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/admin/kotoba" className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/5">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </Link>
                    <h1 className="text-3xl font-black tracking-tight text-white">
                        {isNew ? 'Kotoba Baru' : 'Edit Kotoba'}
                    </h1>
                </div>
            </div>

            {error && (
                <div className="p-6 rounded-[2rem] border bg-red-900/30 border-red-500/30 text-red-400 flex items-center gap-3" role="alert">
                    <span className="text-2xl">❌</span>
                    <span className="font-bold">{error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="rounded-[2rem] border overflow-hidden bg-neutral-900/30 border-white/5 space-y-6 p-8">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-50">Kata / Kanji</label>
                    <input
                        type="text"
                        required
                        className="w-full p-4 rounded-xl border-2 outline-none transition-all bg-white/5 border-white/5 focus:border-red-600 text-white"
                        value={formData.word}
                        onChange={e => setFormData({ ...formData, word: e.target.value })}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-50">Bacaan (Kana)</label>
                    <input
                        type="text"
                        required
                        className="w-full p-4 rounded-xl border-2 outline-none transition-all bg-white/5 border-white/5 focus:border-red-600 text-white"
                        value={formData.reading}
                        onChange={e => setFormData({ ...formData, reading: e.target.value })}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-50">Arti</label>
                    <textarea
                        required
                        rows="4"
                        className="w-full p-4 rounded-xl border-2 outline-none transition-all bg-white/5 border-white/5 focus:border-red-600 text-white"
                        value={formData.meaning}
                        onChange={e => setFormData({ ...formData, meaning: e.target.value })}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-50">Tipe Kata</label>
                    <select
                        className="w-full p-4 rounded-xl border-2 outline-none transition-all bg-neutral-800 border-white/5 text-white"
                        value={formData.word_type || ''}
                        onChange={e => setFormData({ ...formData, word_type: e.target.value })}
                    >
                        <option value="">-- Tidak Ada Tipe --</option>
                        <option value="noun">Noun (Kata Benda)</option>
                        <option value="godan">Godan Verb (Golongan 1)</option>
                        <option value="ichidan">Ichidan Verb (Golongan 2)</option>
                        <option value="suru">Suru Verb (Golongan 3)</option>
                        <option value="intransitive">Intransitive Verb</option>
                        <option value="transitive">Transitive Verb</option>
                        <option value="i_adj">I-Adjective</option>
                        <option value="na_adj">Na-Adjective</option>
                        <option value="adverb">Adverb (Kata Keterangan)</option>
                        <option value="particle">Particle (Partikel)</option>
                        <option value="suffix">Suffix (Akhiran)</option>
                        <option value="other">Other (Lain-lain)</option>
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-50">Level JLPT</label>
                    <select
                        className="w-full p-4 rounded-xl border-2 outline-none transition-all bg-neutral-800 border-white/5 text-white"
                        value={formData.jlpt_level}
                        onChange={e => setFormData({ ...formData, jlpt_level: parseInt(e.target.value) })}
                    >
                        {[5, 4, 3, 2, 1].map(l => (
                            <option key={l} value={l}>N{l}</option>
                        ))}
                    </select>
                </div>

                {/* Examples */}
                <div className="border-t border-gray-100 dark:border-white/5 pt-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black uppercase tracking-widest opacity-50">Contoh Kalimat</label>
                        <button
                            type="button"
                            onClick={() => {
                                const newExamples = [...(formData.examples || []), { sentence: '', meaning: '' }];
                                setFormData({ ...formData, examples: newExamples });
                            }}
                            className="text-xs font-black text-red-600 hover:text-red-700 uppercase tracking-widest"
                        >
                            + Tambah Contoh
                        </button>
                    </div>

                    <div className="space-y-4">
                        {(formData.examples || []).map((ex, idx) => (
                            <div key={idx} className="p-4 rounded-xl relative group bg-white/5">
                                <button
                                    type="button"
                                    onClick={() => {
                                        const newExamples = formData.examples.filter((_, i) => i !== idx);
                                        setFormData({ ...formData, examples: newExamples });
                                    }}
                                    className="absolute top-3 right-3 p-1 rounded-lg transition-colors text-neutral-400 hover:text-red-400 hover:bg-red-500/10"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                                <div className="space-y-3 pr-10">
                                    <div>
                                        <input
                                            type="text"
                                            placeholder="Kalimat Bahasa Jepang"
                                            className="w-full p-3 rounded-lg border text-sm bg-white/5 border-white/5 text-white"
                                            value={ex.sentence}
                                            onChange={e => {
                                                const newExamples = [...formData.examples];
                                                newExamples[idx].sentence = e.target.value;
                                                setFormData({ ...formData, examples: newExamples });
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <input
                                            type="text"
                                            placeholder="Arti"
                                            className="w-full p-3 rounded-lg border text-sm bg-white/5 border-white/5 text-white"
                                            value={ex.meaning}
                                            onChange={e => {
                                                const newExamples = [...formData.examples];
                                                newExamples[idx].meaning = e.target.value;
                                                setFormData({ ...formData, examples: newExamples });
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                        {(formData.examples || []).length === 0 && (
                            <p className="text-sm text-center py-8 rounded-xl text-neutral-500 bg-white/5">
                                Belum ada contoh kalimat.
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex flex-col md:flex-row md:justify-end gap-4 pt-6 border-t border-gray-100 dark:border-white/5">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="flex-1 md:flex-none px-6 py-3 rounded-xl font-bold text-center transition-all bg-white/5 text-white hover:bg-white/10"
                    >
                        Batal
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex-1 md:flex-none bg-red-600 text-white px-8 py-3 rounded-xl font-black shadow-lg shadow-red-500/20 hover:bg-red-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? 'Menyimpan...' : 'Simpan Kotoba'}
                    </button>
                </div>
            </form>
        </div>
    );
}
