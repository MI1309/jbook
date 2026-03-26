'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

export default function KotobaAdmin() {
    const { user } = useAuth();
    const [vocabs, setVocabs] = useState([]);
    const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [level, setLevel] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [debugInfo, setDebugInfo] = useState(null);
    const [serverLevel, setServerLevel] = useState(null);
    const router = useRouter();

    useEffect(() => { 
        setCurrentPage(1); // Reset to first page on filter change
    }, [search, level]);

    useEffect(() => { fetchVocabs(); }, [search, level, currentPage]);

    const fetchVocabs = async () => {
        setLoading(true);
        try {
            const token = Cookies.get('access_token');
            const params = new URLSearchParams();
            if (level) params.append('level', level);
            if (search) params.append('search', search);
            params.append('page', currentPage);
            params.append('limit', 50);

            let url = `https://imronm.pythonanywhere.com/api/admin/vocab?${params.toString()}`;
            setDebugInfo(url);
            
            const res = await fetch(url, { 
                headers: { 'Authorization': `Bearer ${token}` },
                cache: 'no-store'
            });
            
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    setVocabs(data);
                    setPagination({ total: data.length, page: 1, pages: 1 });
                } else {
                    setVocabs(data.items || []);
                    setPagination({ 
                        total: data.total || 0, 
                        page: data.page || 1, 
                        pages: data.pages || 1 
                    });
                    setServerLevel(data.debug_level);
                }
            } else {
                const errorData = await res.json().catch(() => ({}));
                console.error("Fetch failed:", res.status, errorData);
                if (res.status === 403) {
                    alert("Admin access denied. Please login with admin account (imronm1309@gmail.com)");
                } else {
                    alert(`Gagal mengambil data: ${res.status} ${res.statusText}`);
                }
                setVocabs([]);
            }
        } catch (error) {
            console.error("Failed to fetch vocabs", error);
            alert(`Terjadi kesalahan: ${error.message}`);
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

            {/* DEBUG INFO */}
            <div className="text-[10px] text-gray-400 mb-2 font-mono break-all opacity-50">
                Fetching: {debugInfo || '...'} | Server Level: {serverLevel === null ? 'All' : `N${serverLevel}`}
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-wrap gap-4 justify-between items-center">
                    <h3 className="font-bold text-gray-700">Vocabulary List</h3>
                    <div className="flex gap-2 items-center">
                        <select
                            className="border border-gray-300 rounded-md text-sm p-2 bg-white"
                            value={level}
                            onChange={(e) => setLevel(e.target.value)}
                        >
                            <option value="">All Levels</option>
                            <option value="5">N5</option>
                            <option value="4">N4</option>
                            <option value="3">N3</option>
                            <option value="2">N2</option>
                            <option value="1">N1</option>
                        </select>
                        <input
                            type="text" placeholder="Search..."
                            className="border border-gray-300 rounded-md text-sm p-2 w-40 md:w-56"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-8 text-center text-gray-500">Loading...</div>
                    ) : (
                        vocabs.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">No Vocabulary found.</div>
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
                                                <td className="px-6 py-4 whitespace-wrap max-w-xs text-gray-600 truncate">{v.meaning}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${levelColor(v.jlpt_level)}`}>N{v.jlpt_level}</span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <Link href={`/kotoba/${v.id}`} target="_blank" className="text-emerald-600 hover:text-emerald-900 mr-4 no-underline">Lihat</Link>
                                                    <Link href={`/admin/kotoba/${v.id}`} className="text-indigo-600 hover:text-indigo-900 mr-4 no-underline">Edit</Link>
                                                    <button onClick={(e) => handleDelete(e, v.id)} className="text-red-600 hover:text-red-900">Delete</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {/* Mobile Cards */}
                                <div className="md:hidden divide-y divide-gray-100">
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
                        )
                    )}
                </div>

                {/* Pagination Controls */}
                {!loading && pagination.pages > 1 && (
                    <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between sm:px-6">
                        <div className="flex-1 flex justify-between sm:hidden">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(pagination.pages, p + 1))}
                                disabled={currentPage === pagination.pages}
                                className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 ${currentPage === pagination.pages ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                Next
                            </button>
                        </div>
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-700">
                                    Showing page <span className="font-medium">{pagination.page}</span> of <span className="font-medium">{pagination.pages}</span> (<span className="font-medium">{pagination.total}</span> total results)
                                </p>
                            </div>
                            <div>
                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <span className="sr-only">Previous</span>
                                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                    
                                    <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                        {currentPage}
                                    </span>

                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(pagination.pages, p + 1))}
                                        disabled={currentPage === pagination.pages}
                                        className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 ${currentPage === pagination.pages ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <span className="sr-only">Next</span>
                                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </nav>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}