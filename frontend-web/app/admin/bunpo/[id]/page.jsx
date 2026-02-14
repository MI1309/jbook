'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
            const token = localStorage.getItem('access_token');
            const res = await fetch(`http://localhost:8000/api/admin/bunpo/${id}`, {
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
                alert(`Failed to load Grammar: ${res.status} ${res.statusText}\n${text}`);
                router.push('/admin/bunpo');
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
            const token = localStorage.getItem('access_token');
            const payload = {
                ...formData,
                chapter: parseInt(formData.chapter),
                jlpt_level: parseInt(formData.jlpt_level)
            };

            const url = isNew
                ? 'http://localhost:8000/api/admin/bunpo'
                : `http://localhost:8000/api/admin/bunpo/${id}`;

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
                alert(isNew ? 'Grammar created!' : 'Grammar updated!');
                router.push('/admin/bunpo');
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
                    <Link href="/admin/bunpo" className="text-gray-500 hover:text-gray-700">
                        &larr; Back
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-800">{isNew ? 'Add New Grammar' : 'Edit Grammar'}</h1>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Title</label>
                            <input
                                type="text"
                                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 text-lg p-2 border"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Structure</label>
                            <input
                                type="text"
                                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 text-lg p-2 border"
                                value={formData.structure}
                                onChange={(e) => setFormData({ ...formData, structure: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Explanation</label>
                        <textarea
                            rows="4"
                            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 p-2 border"
                            value={formData.explanation}
                            onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                            required
                        ></textarea>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Chapter</label>
                            <input
                                type="number"
                                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 p-2 border"
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
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">JLPT Level (1-5)</label>
                            <select
                                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 p-2 border"
                                value={formData.jlpt_level}
                                onChange={(e) => setFormData({ ...formData, jlpt_level: e.target.value })}
                            >
                                {[5, 4, 3, 2, 1].map(l => <option key={l} value={l}>N{l}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Sentences */}
                    <div className="border-t pt-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Example Sentences</h3>
                        {formData.sentences.map((sent, idx) => (
                            <div key={idx} className="mb-3 p-3 bg-gray-50 rounded border flex justify-between items-start">
                                <div>
                                    <p className="font-bold text-gray-800">{sent.jp}</p>
                                    <p className="text-sm text-gray-600">{sent.id}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeSentence(idx)}
                                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                        <div className="bg-gray-50 p-4 rounded border border-dashed border-gray-300 mt-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Add New Sentence</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                <input
                                    type="text" placeholder="Japanese Sentence"
                                    className="border p-2 rounded text-sm w-full"
                                    value={newSentence.jp}
                                    onChange={(e) => setNewSentence({ ...newSentence, jp: e.target.value })}
                                />
                                <input
                                    type="text" placeholder="Indonesian Translation"
                                    className="border p-2 rounded text-sm w-full"
                                    value={newSentence.id}
                                    onChange={(e) => setNewSentence({ ...newSentence, id: e.target.value })}
                                />
                            </div>
                            <button
                                type="button"
                                onClick={handleAddSentence}
                                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded text-sm font-medium w-full"
                            >
                                Add Sentence
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-end pt-6 border-t border-gray-100">
                        <Link href="/admin/bunpo" className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 font-bold mr-4">
                            Cancel
                        </Link>
                        <button type="submit" className="bg-red-600 text-white px-8 py-3 rounded-lg hover:bg-red-700 font-bold shadow-lg shadow-red-200">
                            {isNew ? 'Create Grammar' : 'Update Grammar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
