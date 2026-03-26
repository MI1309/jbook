'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { API_URL } from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

export default function KanjiAdmin() {
    const { user } = useAuth();
    const [kanjis, setKanjis] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterLevel, setFilterLevel] = useState('');
    const router = useRouter();

    useEffect(() => { fetchKanjis(); }, [level, search]);

    const fetchKanjis = async () => {
        setLoading(true);
        try {
            const token = Cookies.get('access_token');
            let url = `${API_URL}admin/kanji`;

            const queryParams = new URLSearchParams();
            if (level && level !== 'all') queryParams.append('level', level);
            if (search) queryParams.append('search', search);

            const queryString = queryParams.toString();
            if (queryString) {
                url += `?${queryString}`;
            }

            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setKanjiList(data);
            } else {
                alert(`Gagal mengambil data Kanji: ${res.status} ${res.statusText}`);
            }
        } catch (error) {
            console.error("Failed to fetch", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Yakin ingin menghapus Kanji ini?")) return;
        try {
            const token = Cookies.get('access_token');
            const res = await fetch(`${API_URL}admin/kanji/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) fetchKanjis();
            else alert('Failed to delete');
        } catch (error) {
            console.error("Delete error", error);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Kanji Management</h1>
                <Link href="/admin/kanji/new" className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 font-medium no-underline text-sm">
                    + New Kanji
                </Link>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-700">Kanji List</h3>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Level:</span>
                        <select className="border border-gray-300 rounded-md text-sm p-1" value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)}>
                            <option value="">All</option>
                            {[5, 4, 3, 2, 1].map(l => <option key={l} value={l}>N{l}</option>)}
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-gray-500">Loading...</div>
                ) : (
                    <>
                        {/* Desktop Table */}
                        <table className="hidden md:table min-w-full divide-y divide-gray-200">
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
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">N{k.jlpt_level}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <Link href={`/kanji/${k.id}`} target="_blank" className="text-emerald-600 hover:text-emerald-900 mr-4">Lihat</Link>
                                            <Link href={`/admin/kanji/${k.id}`} className="text-indigo-600 hover:text-indigo-900 mr-4">Edit</Link>
                                            <button onClick={(e) => handleDelete(e, k.id)} className="text-red-600 hover:text-red-900">Delete</button>
                                        </td>
                                    </tr>
                                ))}
                                {kanjis.length === 0 && (
                                    <tr><td colSpan="5" className="px-6 py-4 text-center text-gray-500">No Kanji found.</td></tr>
                                )}
                            </tbody>
                        </table>

                        {/* Mobile Cards */}
                        <div className="md:hidden divide-y divide-gray-100">
                            {kanjis.length === 0 && <div className="p-6 text-center text-gray-500">No Kanji found.</div>}
                            {kanjis.map((k) => (
                                <div key={k.id} className="flex items-center">
                                    {/* Tap area → public detail page */}
                                    <div
                                        className="flex items-center gap-3 flex-1 min-w-0 px-4 py-3 active:bg-gray-50 transition-colors cursor-pointer"
                                        onClick={() => router.push(`/kanji/${k.id}`)}
                                    >
                                        <div className="text-4xl font-serif text-gray-800 w-12 text-center flex-shrink-0">{k.character}</div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="font-semibold text-gray-900 text-sm">{k.meaning}</span>
                                                <span className="px-1.5 py-0.5 text-xs font-bold rounded-full bg-red-100 text-red-700">N{k.jlpt_level}</span>
                                            </div>
                                            <div className="text-xs text-gray-400 truncate">
                                                音: {k.onyomi.join(', ')} · 訓: {k.kunyomi.join(', ')}
                                            </div>
                                        </div>
                                        <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>

                                    {/* Right side: edit + delete (separated by border) */}
                                    <div className="flex items-center gap-1 px-3 border-l border-gray-100 flex-shrink-0">
                                        {/* Edit → admin edit page */}
                                        <Link
                                            href={`/admin/kanji/${k.id}`}
                                            className="p-2 rounded-lg text-indigo-500 active:bg-indigo-50 transition-colors"
                                            title="Edit"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </Link>
                                        <button
                                            onClick={(e) => handleDelete(e, k.id)}
                                            className="p-2 rounded-lg text-red-400 active:bg-red-50 transition-colors"
                                            title="Delete"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}