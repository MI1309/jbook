'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { API_URL } from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDebounce } from 'use-debounce';
import Cookies from 'js-cookie';
import { cacheGet, cacheSet } from '@/lib/cache-store';
import { toast } from 'react-toastify';
import ConfirmationModal from '@/components/common/ConfirmationModal';

export default function BunpoAdmin() {
    const { user } = useAuth();
    const [bunpos, setBunpos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterLevel, setFilterLevel] = useState('');
    const [filterChapter, setFilterChapter] = useState('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const LIMIT = 20;
    const [pendingDelete, setPendingDelete] = useState(null);
    const router = useRouter();

    const [allBunpos, setAllBunpos] = useState([]);

    const [debouncedChapter] = useDebounce(filterChapter, 500);
    const [debouncedSearch] = useDebounce(search, 500);

    useEffect(() => { setPage(1); }, [filterLevel, debouncedChapter, debouncedSearch]);
    
    useEffect(() => { fetchAllBunpos(); }, []);

    useEffect(() => {
        applyFiltersAndPagination();
    }, [allBunpos, filterLevel, debouncedChapter, debouncedSearch, page]);

    const fetchAllBunpos = async () => {
        setLoading(true);

        if (typeof navigator !== 'undefined' && !navigator.onLine) {
            const cached = cacheGet('admin-bunpo-all');
            if (cached) { setAllBunpos(cached); setLoading(false); return; }
            toast.error('Tidak ada koneksi internet dan data admin belum tersedia secara offline.');
            setLoading(false);
            return;
        }

        try {
            const token = Cookies.get('access_token');
            const url = `${API_URL}/admin/grammar`;
            const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) {
                const data = await res.json();
                const items = Array.isArray(data) ? data : (data.items || []);
                setAllBunpos(items);
                cacheSet('admin-bunpo-all', items);
            } else {
                const cached = cacheGet('admin-bunpo-all');
                if (cached) { setAllBunpos(cached); return; }
                toast.error(`Gagal mengambil data Bunpo: ${res.status} ${res.statusText}`);
            }
        } catch (error) {
            console.error("Failed to fetch bunpos", error);
            const cached = cacheGet('admin-bunpo-all');
            if (cached) { setAllBunpos(cached); return; }
            toast.error(`Terjadi kesalahan jaringan.`);
        } finally {
            setLoading(false);
        }
    };

    const applyFiltersAndPagination = () => {
        let filtered = [...allBunpos];

        if (filterLevel) {
            filtered = filtered.filter(b => b.jlpt_level == filterLevel);
        }
        if (debouncedChapter && !isNaN(parseInt(debouncedChapter))) {
            const ch = parseInt(debouncedChapter);
            filtered = filtered.filter(b => b.chapter === ch);
        }
        if (debouncedSearch) {
            const ls = debouncedSearch.toLowerCase();
            filtered = filtered.filter(b => 
                (b.title && b.title.toLowerCase().includes(ls)) ||
                (b.structure && b.structure.toLowerCase().includes(ls)) ||
                (b.explanation && b.explanation.toLowerCase().includes(ls))
            );
        }

        const totalItems = filtered.length;
        const totalPages = Math.max(1, Math.ceil(totalItems / LIMIT));
        const safePage = Math.min(page, totalPages);
        
        if (safePage !== page) {
            setPage(safePage);
        }

        const offset = (safePage - 1) * LIMIT;
        setBunpos(filtered.slice(offset, offset + LIMIT));
    };

    const handleDelete = (e, id) => {
        e.stopPropagation();
        setPendingDelete(id);
    };

    const confirmDelete = async () => {
        if (!pendingDelete) return;
        try {
            const token = Cookies.get('access_token');
            const res = await fetch(`${API_URL}/admin/grammar/${pendingDelete}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                toast.success('Grammar deleted successfully');
                fetchAllBunpos();
            } else {
                toast.error('Failed to delete');
            }
        } catch (error) {
            console.error("Delete error", error);
            toast.error('Network error while deleting');
        } finally {
            setPendingDelete(null);
        }
    };

    const handleExport = async () => {
        try {
            const token = Cookies.get('access_token');
            const queryParams = new URLSearchParams();
            if (filterLevel) queryParams.append('level', filterLevel);
            if (filterChapter) queryParams.append('chapter', filterChapter);
            if (search) queryParams.append('search', search);
            
            const res = await fetch(`${API_URL}/admin/grammar/export/csv?${queryParams.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `grammar_export_${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
            } else {
                toast.error("Gagal mengekspor data.");
            }
        } catch (error) {
            console.error("Export failed", error);
            toast.error("Terjadi kesalahan saat mengekspor.");
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Bunpo Management</h1>
                <Link href="/admin/bunpo/new" className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 font-medium no-underline text-sm">
                    + New Grammar
                </Link>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                {/* Filters */}
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col md:flex-row md:justify-between md:items-center gap-3">
                    <h3 className="font-bold text-gray-700">Grammar List</h3>
                    <div className="flex flex-wrap gap-2">
                        <input
                            type="text"
                            placeholder="Search title, structure..."
                            className="border border-gray-300 rounded-md text-sm p-2 flex-1 min-w-0 md:w-64"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <select
                            className="border border-gray-300 rounded-md text-sm p-2"
                            value={filterLevel}
                            onChange={(e) => setFilterLevel(e.target.value)}
                        >
                            <option value="">All Level</option>
                            {[5, 4, 3, 2, 1].map(l => <option key={l} value={l}>N{l}</option>)}
                        </select>
                        <input
                            type="number" min="1"
                            className="border border-gray-300 rounded-md text-sm p-2 w-20"
                            value={filterChapter}
                            onChange={(e) => {
                                const val = parseInt(e.target.value);
                                if (e.target.value === '' || (!isNaN(val) && val >= 1)) setFilterChapter(e.target.value);
                            }}
                            placeholder="Ch"
                        />
                        <button 
                            onClick={handleExport}
                            className="bg-emerald-600 text-white px-3 py-2 rounded-md hover:bg-emerald-700 text-xs font-bold transition-all shadow-sm flex items-center gap-1"
                        >
                            <span>📥</span> Export
                        </button>
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
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">N{b.jlpt_level}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Ch {b.chapter}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <Link href={`/bunpo/${b.id}`} target="_blank" className="text-emerald-600 hover:text-emerald-900 mr-4">Lihat</Link>
                                            <Link href={`/admin/bunpo/${b.id}`} className="text-indigo-600 hover:text-indigo-900 mr-4">Edit</Link>
                                            <button onClick={(e) => handleDelete(e, b.id)} className="text-red-600 hover:text-red-900">Delete</button>
                                        </td>
                                    </tr>
                                ))}
                                {bunpos.length === 0 && (
                                    <tr><td colSpan="5" className="px-6 py-4 text-center text-gray-500">No Grammar points found.</td></tr>
                                )}
                            </tbody>
                        </table>

                        {/* Mobile Cards */}
                        <div className="md:hidden divide-y divide-gray-100">
                            {bunpos.length === 0 && <div className="p-6 text-center text-gray-500">No Grammar points found.</div>}
                            {bunpos.map((b) => (
                                <div key={b.id} className="flex items-center">
                                    {/* Tap area → public detail page */}
                                    <div
                                        className="flex items-center gap-3 flex-1 min-w-0 px-4 py-3 active:bg-gray-50 transition-colors cursor-pointer"
                                        onClick={() => router.push(`/bunpo/${b.id}`)}
                                    >
                                        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                                            <span className="text-xs font-bold text-blue-700">N{b.jlpt_level}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-semibold text-gray-900 text-sm truncate">{b.title}</div>
                                            <div className="text-xs text-gray-400 truncate">{b.structure}</div>
                                            <div className="text-xs text-gray-400">Ch {b.chapter}</div>
                                        </div>
                                        <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>

                                    {/* Right side: edit + delete */}
                                    <div className="flex items-center gap-1 px-3 border-l border-gray-100 flex-shrink-0">
                                        <Link
                                            href={`/admin/bunpo/${b.id}`}
                                            className="p-2 rounded-lg text-indigo-500 active:bg-indigo-50 transition-colors"
                                            title="Edit"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </Link>
                                        <button
                                            onClick={(e) => handleDelete(e, b.id)}
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

                        {/* Pagination */}
                        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                            <div className="text-sm text-gray-500">Page {page}</div>
                            <div className="flex gap-2">
                                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                                    className={`px-3 py-1 rounded border text-sm ${page === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
                                    Previous
                                </button>
                                <button onClick={() => setPage(p => p + 1)} disabled={bunpos.length < LIMIT}
                                    className={`px-3 py-1 rounded border text-sm ${bunpos.length < LIMIT ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
                                    Next
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            <ConfirmationModal
                isOpen={!!pendingDelete}
                onClose={() => setPendingDelete(null)}
                onConfirm={confirmDelete}
                title="Hapus Bunpo?"
                message="Are you sure you want to delete this Grammar point? Tindakan ini tidak dapat dibatalkan."
                confirmText="Hapus"
                cancelText="Batal"
                type="danger"
            />
        </div>
    );
}