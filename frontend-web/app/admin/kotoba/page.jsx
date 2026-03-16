'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

export default function KotobaAdmin() {
    const { user } = useAuth();
    const [vocabs, setVocabs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const router = useRouter();

    useEffect(() => { fetchVocabs(); }, [search]);

    const fetchVocabs = async () => {
        setLoading(true);
        try {
            const token = Cookies.get('access_token');
            let url = 'https://imronm.pythonanywhere.com/api/admin/vocab';
            if (search) url += `?search=${search}`;
            const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) setVocabs(await res.json());
            else console.error("Fetch failed");
        } catch (error) {
            console.error("Failed to fetch vocabs", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this Vocabulary?')) return;
        try {
            const token = Cookies.get('access_token');
            const res = await fetch(`https://imronm.pythonanywhere.com/api/admin/vocab/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) fetchVocabs();
            else alert('Failed to delete');
        } catch (error) {
            console.error("Delete error", error);
        }
    };

    const levelColor = (level) => {
        const colors = { 5: 'bg-green-100 text-green-700', 4: 'bg-teal-100 text-teal-700', 3: 'bg-blue-100 text-blue-700', 2: 'bg-purple-100 text-purple-700', 1: 'bg-red-100 text-red-700' };
        return colors[level] || 'bg-gray-100 text-gray-700';
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Kotoba Management</h1>
                <Link href="/admin/kotoba/new" className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 font-medium no-underline text-sm">
                    + New Kotoba
                </Link>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-700">Vocabulary List</h3>
                    <input
                        type="text" placeholder="Search..."
                        className="border border-gray-300 rounded-md text-sm p-2 w-40 md:w-56"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {loading ? (
                    <div className="p-8 text-center text-gray-500">Loading...</div>
                ) : (
                    <>
                        {/* Desktop Table */}
                        <table className="hidden md:table min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Word</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reading</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Meaning</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {vocabs.map((v) => (
                                    <tr key={v.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{v.word}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">{v.reading}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">{v.meaning}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${levelColor(v.jlpt_level)}`}>N{v.jlpt_level}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <Link href={`/kotoba/${v.id}`} target="_blank" className="text-emerald-600 hover:text-emerald-900 mr-4">Lihat</Link>
                                            <Link href={`/admin/kotoba/${v.id}`} className="text-indigo-600 hover:text-indigo-900 mr-4">Edit</Link>
                                            <button onClick={(e) => handleDelete(e, v.id)} className="text-red-600 hover:text-red-900">Delete</button>
                                        </td>
                                    </tr>
                                ))}
                                {vocabs.length === 0 && (
                                    <tr><td colSpan="5" className="px-6 py-4 text-center text-gray-500">No Vocabulary found.</td></tr>
                                )}
                            </tbody>
                        </table>

                        {/* Mobile Cards */}
                        <div className="md:hidden divide-y divide-gray-100">
                            {vocabs.length === 0 && <div className="p-6 text-center text-gray-500">No Vocabulary found.</div>}
                            {vocabs.map((v) => (
                                <div key={v.id} className="flex items-center">
                                    {/* Tap area → public detail page */}
                                    <div
                                        className="flex items-center gap-3 flex-1 min-w-0 px-4 py-3 active:bg-gray-50 transition-colors cursor-pointer"
                                        onClick={() => router.push(`/kotoba/${v.id}`)}
                                    >
                                        <div className="flex-shrink-0 w-12 text-center">
                                            <div className="text-lg font-bold text-gray-800 leading-tight">{v.word}</div>
                                            <div className="text-xs text-gray-400 truncate">{v.reading}</div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm text-gray-700 truncate">{v.meaning}</div>
                                            <span className={`inline-flex mt-0.5 px-1.5 py-0.5 text-xs font-semibold rounded-full ${levelColor(v.jlpt_level)}`}>
                                                N{v.jlpt_level}
                                            </span>
                                        </div>
                                        <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>

                                    {/* Right side: edit + delete */}
                                    <div className="flex items-center gap-1 px-3 border-l border-gray-100 flex-shrink-0">
                                        <Link
                                            href={`/admin/kotoba/${v.id}`}
                                            className="p-2 rounded-lg text-indigo-500 active:bg-indigo-50 transition-colors"
                                            title="Edit"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </Link>
                                        <button
                                            onClick={(e) => handleDelete(e, v.id)}
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