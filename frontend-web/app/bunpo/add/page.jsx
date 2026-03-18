'use client';

import { useState } from 'react';
import { suggestContent } from '@/lib/api';
import Link from 'next/link';

export default function AddGrammarPage() {
    const [formData, setFormData] = useState({
        title: '',
        structure: '',
        explanation: '',
        chapter: '1',
        jlpt_level: '5',
    });
    const [status, setStatus] = useState({ type: '', message: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setStatus({ type: '', message: '' });

        try {
            const payload = {
                type: 'bunpo',
                data: {
                    ...formData,
                    chapter: parseInt(formData.chapter),
                    jlpt_level: parseInt(formData.jlpt_level),
                    sentences: [] // Empty examples for now
                }
            };

            const res = await suggestContent(payload);
            setStatus({ type: 'success', message: res.message });
            setFormData({
                title: '',
                structure: '',
                explanation: '',
                chapter: '1',
                jlpt_level: '5',
            });
        } catch (error) {
            setStatus({ type: 'error', message: 'Gagal mengirim saran. Coba lagi nanti.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="container mx-auto px-6 py-12 max-w-2xl">
            <Link href="/bunpo" className="inline-flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-red-600 mb-8 transition-colors">
                ← Kembali ke Daftar
            </Link>

            <div className="bg-white rounded-[2.5rem] border border-gray-100 p-10 shadow-xl shadow-gray-100/50">
                <h1 className="text-3xl font-black text-gray-900 mb-2">Tambah Tata Bahasa</h1>
                <p className="text-gray-400 font-medium mb-8 text-sm">Bantu teman-teman lain dengan menambahkan pola kalimat baru.</p>

                {status.message && (
                    <div className={`p-4 rounded-2xl mb-8 font-bold text-sm ${status.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                        {status.message}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Judul (Pola)</label>
                            <input
                                type="text"
                                className="w-full bg-gray-50 border-2 border-transparent focus:border-red-100 focus:bg-white p-4 rounded-2xl outline-none transition-all font-black text-gray-700"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                required
                                placeholder="e.g. ～は～です"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Level JLPT</label>
                            <select
                                className="w-full bg-gray-50 border-2 border-transparent focus:border-red-100 focus:bg-white p-4 rounded-2xl outline-none transition-all font-bold text-gray-700 h-[68px]"
                                value={formData.jlpt_level}
                                onChange={(e) => setFormData({ ...formData, jlpt_level: e.target.value })}
                            >
                                <option value="5">N5</option>
                                <option value="4">N4</option>
                                <option value="3">N3</option>
                                <option value="2">N2</option>
                                <option value="1">N1</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Struktur Kalimat</label>
                        <input
                            type="text"
                            className="w-full bg-gray-50 border-2 border-transparent focus:border-red-100 focus:bg-white p-4 rounded-2xl outline-none transition-all font-bold placeholder:font-medium"
                            value={formData.structure}
                            onChange={(e) => setFormData({ ...formData, structure: e.target.value })}
                            required
                            placeholder="Contoh: KB1 + は + KB2 + です"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Penjelasan</label>
                        <textarea
                            rows="4"
                            className="w-full bg-gray-50 border-2 border-transparent focus:border-red-100 focus:bg-white p-4 rounded-2xl outline-none transition-all font-medium text-gray-700"
                            value={formData.explanation}
                            onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                            required
                            placeholder="Jelaskan fungsi dan cara penggunaan pola ini..."
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Bab / Chapter</label>
                        <input
                            type="number"
                            className="w-full bg-gray-50 border-2 border-transparent focus:border-red-100 focus:bg-white p-4 rounded-2xl outline-none transition-all font-bold"
                            value={formData.chapter}
                            onChange={(e) => setFormData({ ...formData, chapter: e.target.value })}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-red-600 text-white p-5 rounded-2xl font-black text-lg shadow-xl shadow-red-200 hover:bg-red-700 transition-all disabled:opacity-50 active:scale-[0.98]"
                    >
                        {isSubmitting ? 'Mengirim...' : 'Kirim Saran Tata Bahasa'}
                    </button>
                </form>
            </div>
        </div>
    );
}
