'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/lib/api';
import Link from 'next/link';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';

export default function KanjiForm({ params }) {
    const router = useRouter();
    const { id } = use(params);
    const isNew = id === 'new';

    const [loading, setLoading] = useState(!isNew);
    const [formData, setFormData] = useState({
        character: '',
        meaning: '',
        onyomi: '',
        kunyomi: '',
        strokes: 0,
        jlpt_level: 5,
        radical: '',
        word_type: ''
    });

    useEffect(() => {
        if (!isNew) {
            fetchKanji();
        }
    }, [id]);

    const fetchKanji = async () => {
        try {
            const token = Cookies.get('access_token');
            const res = await fetch(`${API_URL}/admin/kanji/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const kanji = await res.json();
                setFormData({
                    character: kanji.character,
                    meaning: kanji.meaning,
                    onyomi: kanji.onyomi.join(', '),
                    kunyomi: kanji.kunyomi.join(', '),
                    strokes: kanji.strokes,
                    jlpt_level: kanji.jlpt_level,
                    radical: kanji.radical || '',
                    word_type: kanji.word_type || ''
                });
            } else {
                console.error("Fetch failed:", res.status, res.statusText);
                const text = await res.text();
                console.error("Response body:", text);
                toast.error(`Gagal memuat Kanji: ${res.status} ${res.statusText}\n${text}`);
            }
        } catch (error) {
            console.error("Fetch error", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = Cookies.get('access_token');
            const onyomiArray = typeof formData.onyomi === 'string' ? formData.onyomi.split(',').map(s => s.trim()).filter(Boolean) : [];
            const kunyomiArray = typeof formData.kunyomi === 'string' ? formData.kunyomi.split(',').map(s => s.trim()).filter(Boolean) : [];

            const payload = {
                ...formData,
                onyomi: onyomiArray,
                kunyomi: kunyomiArray,
                strokes: parseInt(formData.strokes),
                jlpt_level: parseInt(formData.jlpt_level)
            };

            const url = isNew
                ? `${API_URL}/admin/kanji`
                : `${API_URL}/admin/kanji/${id}`;

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
                toast.success(isNew ? 'Kanji created!' : 'Kanji updated!');
                router.push('/admin/kanji');
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
                    <Link href="/admin/kanji" className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/5">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </Link>
                    <h1 className="text-3xl font-black tracking-tight text-white">
                        {isNew ? 'Tambah Kanji Baru' : 'Edit Kanji'}
                    </h1>
                </div>
            </div>

            {/* Form */}
            <div className="rounded-[2rem] border overflow-hidden bg-neutral-900/30 border-white/5">
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest opacity-50">Karakter</label>
                            <input
                                type="text"
                                className="w-full p-4 rounded-xl border-2 outline-none transition-all bg-white/5 border-white/5 focus:border-red-600 text-white"
                                value={formData.character}
                                onChange={(e) => setFormData({ ...formData, character: e.target.value })}
                                required
                                maxLength={1}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest opacity-50">Arti (Indonesia)</label>
                            <input
                                type="text"
                                className="w-full p-4 rounded-xl border-2 outline-none transition-all bg-white/5 border-white/5 focus:border-red-600 text-white"
                                value={formData.meaning}
                                onChange={(e) => setFormData({ ...formData, meaning: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest opacity-50">Onyomi (pisahkan dengan koma)</label>
                            <input
                                type="text"
                                className="w-full p-4 rounded-xl border-2 outline-none transition-all bg-white/5 border-white/5 focus:border-red-600 text-white"
                                value={formData.onyomi}
                                onChange={(e) => setFormData({ ...formData, onyomi: e.target.value })}
                                placeholder="e.g. NICHI, JITSU"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest opacity-50">Kunyomi (pisahkan dengan koma)</label>
                            <input
                                type="text"
                                className="w-full p-4 rounded-xl border-2 outline-none transition-all bg-white/5 border-white/5 focus:border-red-600 text-white"
                                value={formData.kunyomi}
                                onChange={(e) => setFormData({ ...formData, kunyomi: e.target.value })}
                                placeholder="e.g. hi, bi"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest opacity-50">Strokes</label>
                            <input
                                type="number"
                                className="w-full p-4 rounded-xl border-2 outline-none transition-all bg-white/5 border-white/5 focus:border-red-600 text-white"
                                value={formData.strokes}
                                onChange={(e) => setFormData({ ...formData, strokes: e.target.value })}
                                min={1}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest opacity-50">Level JLPT</label>
                            <select
                                className="w-full p-4 rounded-xl border-2 outline-none transition-all bg-neutral-800 border-white/5 text-white"
                                value={formData.jlpt_level}
                                onChange={(e) => setFormData({ ...formData, jlpt_level: e.target.value })}
                            >
                                {[5, 4, 3, 2, 1].map(l => <option key={l} value={l}>N{l}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest opacity-50">Radikal (Opsional)</label>
                            <input
                                type="text"
                                className="w-full p-4 rounded-xl border-2 outline-none transition-all bg-white/5 border-white/5 focus:border-red-600 text-white"
                                value={formData.radical}
                                onChange={(e) => setFormData({ ...formData, radical: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest opacity-50">Tipe Kata</label>
                            <select
                                className="w-full p-4 rounded-xl border-2 outline-none transition-all bg-neutral-800 border-white/5 text-white"
                                value={formData.word_type}
                                onChange={(e) => setFormData({ ...formData, word_type: e.target.value })}
                            >
                                <option value="">- Pilih Tipe -</option>
                                <option value="noun">Noun (Kata Benda)</option>
                                <option value="godan">Godan Verb (Gol. 1)</option>
                                <option value="ichidan">Ichidan Verb (Gol. 2)</option>
                                <option value="suru">Suru Verb (Gol. 3)</option>
                                <option value="i_adj">I-Adjective (Sifat I)</option>
                                <option value="na_adj">Na-Adjective (Sifat Na)</option>
                                <option value="adverb">Adverb (Keterangan)</option>
                                <option value="particle">Particle (Partikel)</option>
                                <option value="suffix">Suffix (Akhiran)</option>
                                <option value="conjunction">Conjunction (Sambung)</option>
                                <option value="interjection">Interjection (Seru)</option>
                                <option value="pronoun">Pronoun (Ganti)</option>
                                <option value="counter">Counter (Bantu Bilangan)</option>
                                <option value="other">Lain-lain</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row md:justify-end gap-4 pt-6 border-t border-gray-100 dark:border-white/5">
                        <Link href="/admin/kanji" className="flex-1 md:flex-none px-6 py-3 rounded-xl font-bold text-center transition-all bg-white/5 text-white hover:bg-white/10">
                            Batal
                        </Link>
                        <button type="submit" className="flex-1 md:flex-none bg-red-600 text-white px-8 py-3 rounded-xl font-black shadow-lg shadow-red-500/20 hover:bg-red-700 transition-all active:scale-95">
                            {isNew ? 'Buat Kanji' : 'Update Kanji'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
