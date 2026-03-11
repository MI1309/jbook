'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Cookies from 'js-cookie';

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
        radical: ''
    });

    useEffect(() => {
        if (!isNew) {
            fetchKanji();
        }
    }, [id]);

    const fetchKanji = async () => {
        try {
            const token = Cookies.get('access_token');
            const res = await fetch(`https://imronm.pythonanywhere.com/api/admin/kanji/${id}`, {
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
                    radical: kanji.radical || ''
                });
            } else {
                console.error("Fetch failed:", res.status, res.statusText);
                const text = await res.text();
                console.error("Response body:", text);
                alert(`Gagal memuat Kanji: ${res.status} ${res.statusText}\n${text}`);
                // router.push('/admin/kanji'); // Don't redirect immediately so user can see error
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
                ? 'https://imronm.pythonanywhere.com/api/admin/kanji'
                : `https://imronm.pythonanywhere.com/api/admin/kanji/${id}`;

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
                alert(isNew ? 'Kanji created!' : 'Kanji updated!');
                router.push('/admin/kanji');
            } else {
                const errorData = await res.json();
                console.error("Failed to save", errorData);
                alert(`Failed to save: ${JSON.stringify(errorData)}`);
            }
        } catch (error) {
            console.error("Save error", error);
            alert('Error saving data');
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <Link href="/admin/kanji" className="text-gray-500 hover:text-gray-700">
                        &larr; Back
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-800">{isNew ? 'Add New Kanji' : 'Edit Kanji'}</h1>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Character</label>
                            <input
                                type="text"
                                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 text-lg p-2 border"
                                value={formData.character}
                                onChange={(e) => setFormData({ ...formData, character: e.target.value })}
                                required
                                maxLength={1}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Meaning (Indonesia)</label>
                            <input
                                type="text"
                                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 text-lg p-2 border"
                                value={formData.meaning}
                                onChange={(e) => setFormData({ ...formData, meaning: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Onyomi (comma separated)</label>
                            <input
                                type="text"
                                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 p-2 border"
                                value={formData.onyomi}
                                onChange={(e) => setFormData({ ...formData, onyomi: e.target.value })}
                                placeholder="e.g. NICHI, JITSU"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Kunyomi (comma separated)</label>
                            <input
                                type="text"
                                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 p-2 border"
                                value={formData.kunyomi}
                                onChange={(e) => setFormData({ ...formData, kunyomi: e.target.value })}
                                placeholder="e.g. hi, bi"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Strokes</label>
                            <input
                                type="number"
                                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 p-2 border"
                                value={formData.strokes}
                                onChange={(e) => setFormData({ ...formData, strokes: e.target.value })}
                                min={1}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">JLPT Level</label>
                            <select
                                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 p-2 border"
                                value={formData.jlpt_level}
                                onChange={(e) => setFormData({ ...formData, jlpt_level: e.target.value })}
                            >
                                {[5, 4, 3, 2, 1].map(l => <option key={l} value={l}>N{l}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Radical (Optional)</label>
                            <input
                                type="text"
                                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 p-2 border"
                                value={formData.radical}
                                onChange={(e) => setFormData({ ...formData, radical: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-6 border-t border-gray-100">
                        <Link href="/admin/kanji" className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 font-bold mr-4">
                            Cancel
                        </Link>
                        <button type="submit" className="bg-red-600 text-white px-8 py-3 rounded-lg hover:bg-red-700 font-bold shadow-lg shadow-red-200">
                            {isNew ? 'Create Kanji' : 'Update Kanji'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
