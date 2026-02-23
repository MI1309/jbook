'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import Cookies from 'js-cookie';

export default function KotobaAdmin() {
    const { user } = useAuth();
    const [vocabs, setVocabs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchVocabs();
    }, [search]); // Re-fetch when search changes (debounce might be better but simple for now)

    const fetchVocabs = async () => {
        setLoading(true);
        try {
            const token = Cookies.get('access_token');
            let url = 'http://localhost:8000/api/admin/vocab';
            if (search) {
                url += `?search=${search}`;
            }

            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setVocabs(data);
            } else {
                console.error("Fetch failed");
            }
        } catch (error) {
            console.error("Failed to fetch vocabs", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this Vocabulary?')) return;

        try {
            const token = Cookies.get('access_token');
            const res = await fetch(`http://localhost:8000/api/admin/vocab/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                fetchVocabs();
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
                <h1 className="text-2xl font-bold text-gray-800">Kotoba Management</h1>
                <Link
                    href="/admin/kotoba/new"
                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 font-medium no-underline"
                >
                    + New Kotoba
                </Link>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-700">Vocabulary List</h3>
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            placeholder="Search..."
                            className="border border-gray-300 rounded-md text-sm p-1 px-2"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-gray-500">Loading...</div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
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
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800`}>
                                            N{v.jlpt_level}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <Link href={`/kotoba/${v.id}`} target="_blank" className="text-emerald-600 hover:text-emerald-900 mr-4">Lihat</Link>
                                        <Link href={`/admin/kotoba/${v.id}`} className="text-indigo-600 hover:text-indigo-900 mr-4">Edit</Link>
                                        <button onClick={() => handleDelete(v.id)} className="text-red-600 hover:text-red-900">Delete</button>
                                    </td>
                                </tr>
                            ))}
                            {vocabs.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500">No Vocabulary found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
