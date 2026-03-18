'use client';

import { useState } from 'react';
import { suggestContent } from '@/lib/api';
import Link from 'next/link';

export default function AddKanjiPage() {
    const [formData, setFormData] = useState({
        character: '',
        meaning: '',
        onyomi: '',
        kunyomi: '',
        strokes: '',
        jlpt_level: '5',
        radical: '',
    });
    const [status, setStatus] = useState({ type: '', message: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setStatus({ type: '', message: '' });

        try {
            const payload = {
                type: 'kanji',
                data: {
                    ...formData,
                    strokes: parseInt(formData.strokes),
                    jlpt_level: parseInt(formData.jlpt_level),
                    onyomi: formData.onyomi.split(',').map(s => s.trim()).filter(Boolean),
                    kunyomi: formData.kunyomi.split(',').map(s => s.trim()).filter(Boolean),
                    examples: [] // Set default empty examples for now
                }
            };

            const res = await suggestContent(payload);
            setStatus({ type: 'success', message: res.message });
            setFormData({
                character: '',
                meaning: '',
                onyomi: '',
                kunyomi: '',
                strokes: '',
                jlpt_level: '5',
                radical: '',
            });
        } catch (error) {
            setStatus({ type: 'error', message: 'Gagal mengirim saran. Coba lagi nanti.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="container mx-auto px-6 py-12 max-w-2xl">
            <Link href="/kanji" className="inline-flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-red-600 mb-8 transition-colors">
                ← Kembali ke Daftar
            </Link>

            <div className="bg-white rounded-[2.5rem] border border-gray-100 p-10 shadow-xl shadow-gray-100/50">
                <h1 className="text-3xl font-black text-gray-900 mb-2">Tambah Kanji Baru</h1>
                <p className="text-gray-400 font-medium mb-8 text-sm">Saran kamu akan direview oleh admin sebelum muncul di aplikasi.</p>

                {status.message && (
                    <div className={`p-4 rounded-2xl mb-8 font-bold text-sm ${status.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                        {status.message}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Karakter Kanji</label>
                            <input
                                type="text"
                                maxLength="1"
                                className="w-full bg-gray-50 border-2 border-transparent focus:border-red-100 focus:bg-white p-4 rounded-2xl outline-none transition-all font-serif text-2xl text-center"
                                value={formData.character}
                                onChange={(e) => setFormData({ ...formData, character: e.target.value })}
                                required
                                placeholder="例"
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
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Arti (Bahasa Indonesia)</label>
                        <input
                            type="text"
                            className="w-full bg-gray-50 border-2 border-transparent focus:border-red-100 focus:bg-white p-4 rounded-2xl outline-none transition-all font-bold placeholder:font-medium"
                            value={formData.meaning}
                            onChange={(e) => setFormData({ ...formData, meaning: e.target.value })}
                            required
                            placeholder="Contoh: Makan, Minum, dll"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Onyomi (Katakana)</label>
                            <input
                                type="text"
                                className="w-full bg-gray-50 border-2 border-transparent focus:border-red-100 focus:bg-white p-3 rounded-xl outline-none transition-all text-sm font-medium"
                                value={formData.onyomi}
                                onChange={(e) => setFormData({ ...formData, onyomi: e.target.value })}
                                placeholder="Pisahkan dengan koma"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Kunyomi (Hiragana)</label>
                            <input
                                type="text"
                                className="w-full bg-gray-50 border-2 border-transparent focus:border-red-100 focus:bg-white p-3 rounded-xl outline-none transition-all text-sm font-medium"
                                value={formData.kunyomi}
                                onChange={(e) => setFormData({ ...formData, kunyomi: e.target.value })}
                                placeholder="Pisahkan dengan koma"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Jumlah Goresan</label>
                            <input
                                type="number"
                                className="w-full bg-gray-50 border-2 border-transparent focus:border-red-100 focus:bg-white p-3 rounded-xl outline-none transition-all text-sm font-bold"
                                value={formData.strokes}
                                onChange={(e) => setFormData({ ...formData, strokes: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Radikal (Opsional)</label>
                            <input
                                type="text"
                                className="w-full bg-gray-50 border-2 border-transparent focus:border-red-100 focus:bg-white p-3 rounded-xl outline-none transition-all text-sm font-medium"
                                value={formData.radical}
                                onChange={(e) => setFormData({ ...formData, radical: e.target.value })}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-red-600 text-white p-5 rounded-2xl font-black text-lg shadow-xl shadow-red-200 hover:bg-red-700 transition-all disabled:opacity-50 active:scale-[0.98]"
                    >
                        {isSubmitting ? 'Mengirim...' : 'Kirim Saran Kanji'}
                    </button>
                </form>
            </div>
        </div>
    );
}
