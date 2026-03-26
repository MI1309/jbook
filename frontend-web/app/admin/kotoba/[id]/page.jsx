'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/lib/api';
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
        jlpt_level: 5
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
                setFormData(data);
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
        <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">{isNew ? 'New Vocabulary' : 'Edit Vocabulary'}</h1>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center justify-between" role="alert">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">❌</span>
                        <span>{error}</span>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white p-6 shadow rounded-lg space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Word / Kanji</label>
                    <input
                        type="text"
                        required
                        className="w-full border border-gray-300 rounded-md p-2"
                        value={formData.word}
                        onChange={e => setFormData({ ...formData, word: e.target.value })}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reading (Kana)</label>
                    <input
                        type="text"
                        required
                        className="w-full border border-gray-300 rounded-md p-2"
                        value={formData.reading}
                        onChange={e => setFormData({ ...formData, reading: e.target.value })}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Meaning</label>
                    <textarea
                        required
                        rows="3"
                        className="w-full border border-gray-300 rounded-md p-2"
                        value={formData.meaning}
                        onChange={e => setFormData({ ...formData, meaning: e.target.value })}
                    ></textarea>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Word Type</label>
                    <select
                        className="w-full border border-gray-300 rounded-md p-2"
                        value={formData.word_type || ''}
                        onChange={e => setFormData({ ...formData, word_type: e.target.value })}
                    >
                        <option value="">-- No Type --</option>
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

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">JLPT Level</label>
                    <select
                        className="w-full border border-gray-300 rounded-md p-2"
                        value={formData.jlpt_level}
                        onChange={e => setFormData({ ...formData, jlpt_level: parseInt(e.target.value) })}
                    >
                        {[5, 4, 3, 2, 1].map(l => (
                            <option key={l} value={l}>N{l}</option>
                        ))}
                    </select>
                </div>


                <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-4">
                        <label className="block text-sm font-medium text-gray-700">Example Sentences</label>
                        <button
                            type="button"
                            onClick={() => {
                                const newExamples = [...(formData.examples || []), { sentence: '', meaning: '' }];
                                setFormData({ ...formData, examples: newExamples });
                            }}
                            className="text-sm text-red-600 hover:text-red-700 font-medium"
                        >
                            + Add Example
                        </button>
                    </div>

                    <div className="space-y-4">
                        {(formData.examples || []).map((ex, idx) => (
                            <div key={idx} className="bg-gray-50 p-4 rounded-md relative group">
                                <button
                                    type="button"
                                    onClick={() => {
                                        const newExamples = formData.examples.filter((_, i) => i !== idx);
                                        setFormData({ ...formData, examples: newExamples });
                                    }}
                                    className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                                >
                                    ✕
                                </button>
                                <div className="grid gap-3">
                                    <div>
                                        <input
                                            type="text"
                                            placeholder="Japanese Sentence"
                                            className="w-full border border-gray-300 rounded-md p-2 text-sm"
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
                                            placeholder="Meaning"
                                            className="w-full border border-gray-300 rounded-md p-2 text-sm"
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
                            <p className="text-sm text-gray-500 italic text-center py-4 bg-gray-50 rounded-md">
                                No examples added yet.
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : 'Save Vocabulary'}
                    </button>
                </div>
            </form>
        </div>
    );
}
