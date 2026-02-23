'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import Cookies from 'js-cookie';

export default function KanjiAdmin() {
    const { user } = useAuth();
    const [kanjis, setKanjis] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterLevel, setFilterLevel] = useState('');

    useEffect(() => {
        fetchKanjis();
    }, [filterLevel]);

    const fetchKanjis = async () => {
        setLoading(true);
        try {
            const token = Cookies.get('access_token');
            let url = 'http://localhost:8000/api/admin/kanji';
            if (filterLevel) {
                url += `?level=${filterLevel}`;
            }

            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setKanjis(data);
            } else {
                console.error("Fetch failed:", res.status, res.statusText);
                const text = await res.text();
                console.error("Response body:", text);
                alert(`Gagal mengambil data Kanji: ${res.status} ${res.statusText}`);
            }
        } catch (error) {
            console.error("Failed to fetch kanjis", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this Kanji?')) return;

        try {
            const token = Cookies.get('access_token');
            const res = await fetch(`http://localhost:8000/api/admin/kanji/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                fetchKanjis();
            } else {
                alert('Failed to delete');
            }
        } catch (error) {
            console.error("Delete error", error);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Kanji Management</h1>
                <Link
                    href="/admin/kanji/new"
                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 font-medium no-underline"
                >
                    + New Kanji
                </Link>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-700">Kanji List</h3>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Filter Level:</span>
                        <select
                            className="border border-gray-300 rounded-md text-sm p-1"
                            value={filterLevel}
                            onChange={(e) => setFilterLevel(e.target.value)}
                        >
                            <option value="">All</option>
                            {[5, 4, 3, 2, 1].map(l => <option key={l} value={l}>N{l}</option>)}
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-gray-500">Loading...</div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Character</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Meaning</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Readings</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {kanjis.map((k) => (
                                <tr key={k.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-2xl font-serif">{k.character}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{k.meaning}</td>
                                    <td className="px-6 py-4">
                                        <div className="text-xs text-gray-500">On: {k.onyomi.join(', ')}</div>
                                        <div className="text-xs text-gray-500">Kun: {k.kunyomi.join(', ')}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800`}>
                                            N{k.jlpt_level}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <Link href={`/kanji/${k.id}`} target="_blank" className="text-emerald-600 hover:text-emerald-900 mr-4">Lihat</Link>
                                        <Link href={`/admin/kanji/${k.id}`} className="text-indigo-600 hover:text-indigo-900 mr-4">Edit</Link>
                                        <button onClick={() => handleDelete(k.id)} className="text-red-600 hover:text-red-900">Delete</button>
                                    </td>
                                </tr>
                            ))}
                            {kanjis.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500">No Kanji found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
