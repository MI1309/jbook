'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useDebounce } from 'use-debounce';
import Cookies from 'js-cookie';

export default function BunpoAdmin() {
    const { user } = useAuth();
    const [bunpos, setBunpos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterLevel, setFilterLevel] = useState('');
    const [filterChapter, setFilterChapter] = useState('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const LIMIT = 20;

    // Debounce chapter input to prevent spam/invalid intermediate values
    const [debouncedChapter] = useDebounce(filterChapter, 500);
    const [debouncedSearch] = useDebounce(search, 500);

    useEffect(() => {
        setPage(1);
    }, [filterLevel, debouncedChapter, debouncedSearch]);

    useEffect(() => {
        fetchBunpos();
    }, [filterLevel, debouncedChapter, debouncedSearch, page]);

    const fetchBunpos = async () => {
        setLoading(true);
        try {
            const token = Cookies.get('access_token');
            let url = `http://localhost:8000/api/admin/bunpo?page=${page}&limit=${LIMIT}&`;

            if (filterLevel) {
                url += `level=${filterLevel}&`;
            }

            // Only send chapter if it's a valid integer
            if (debouncedChapter && !isNaN(parseInt(debouncedChapter))) {
                url += `chapter=${parseInt(debouncedChapter)}&`;
            }

            if (debouncedSearch) {
                url += `search=${encodeURIComponent(debouncedSearch)}&`;
            }

            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setBunpos(data);
            } else {
                console.error("Fetch failed:", res.status, res.statusText);
                const text = await res.text();
                console.error("Response body:", text);
                alert(`Gagal mengambil data Bunpo: ${res.status} ${res.statusText}`);
            }
        } catch (error) {
            console.error("Failed to fetch bunpos", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this Grammar point?')) return;

        try {
            const token = Cookies.get('access_token');
            const res = await fetch(`http://localhost:8000/api/admin/bunpo/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                fetchBunpos();
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
                <h1 className="text-2xl font-bold text-gray-800">Bunpo Management</h1>
                <Link
                    href="/admin/bunpo/new"
                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 font-medium no-underline"
                >
                    + New Grammar
                </Link>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                    <h3 className="font-bold text-gray-700">Grammar List</h3>
                    <div className="flex flex-col md:flex-row gap-4">
                        <input
                            type="text"
                            placeholder="Search title, structure..."
                            className="border border-gray-300 rounded-md text-sm p-2 w-full md:w-64"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Level:</span>
                            <select
                                className="border border-gray-300 rounded-md text-sm p-2"
                                value={filterLevel}
                                onChange={(e) => setFilterLevel(e.target.value)}
                            >
                                <option value="">All</option>
                                {[5, 4, 3, 2, 1].map(l => <option key={l} value={l}>N{l}</option>)}
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Chapter:</span>
                            <input
                                type="number"
                                min="1"
                                className="border border-gray-300 rounded-md text-sm p-2 w-20"
                                value={filterChapter}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    if (e.target.value === '' || (!isNaN(val) && val >= 1)) {
                                        setFilterChapter(e.target.value);
                                    }
                                }}
                                placeholder="Any"
                            />
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-gray-500">Loading...</div>
                ) : (
                    <>
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Structure</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chapter</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {bunpos.map((b) => (
                                    <tr key={b.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{b.title}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate max-w-xs">{b.structure}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800`}>
                                                N{b.jlpt_level}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            Ch {b.chapter}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <Link href={`/bunpo/${b.id}`} target="_blank" className="text-emerald-600 hover:text-emerald-900 mr-4">Lihat</Link>
                                            <Link href={`/admin/bunpo/${b.id}`} className="text-indigo-600 hover:text-indigo-900 mr-4">Edit</Link>
                                            <button onClick={() => handleDelete(b.id)} className="text-red-600 hover:text-red-900">Delete</button>
                                        </td>
                                    </tr>
                                ))}
                                {bunpos.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-4 text-center text-gray-500">No Grammar points found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                        {/* Pagination Controls */}
                        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                            <div className="text-sm text-gray-500">
                                Page {page}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className={`px-3 py-1 rounded border ${page === 1 ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setPage(p => p + 1)}
                                    // Disable next if we have fewer items than limit (likely last page)
                                    // Note: This is an approximation as we don't have total count from API
                                    disabled={bunpos.length < LIMIT}
                                    className={`px-3 py-1 rounded border ${bunpos.length < LIMIT ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
