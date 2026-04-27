'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { API_URL } from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { cacheGet, cacheSet } from '@/lib/cache-store';

export default function KanjiAdmin() {
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const { user } = useAuth();
    const [kanjiList, setKanjiList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterLevel, setFilterLevel] = useState('');
    const [search, setSearch] = useState('');
    const router = useRouter();

    useEffect(() => { 
        setMounted(true);
        fetchKanjis(); 
    }, [filterLevel, search]);

    const fetchKanjis = async () => {
        setLoading(true);

        if (typeof navigator !== 'undefined' && !navigator.onLine) {
            const cached = cacheGet('admin-kanji-all');
            if (cached) { setKanjiList(cached); setLoading(false); return; }
            alert('Tidak ada koneksi internet dan data admin belum tersedia secara offline.');
            setLoading(false);
            return;
        }

        try {
            const token = Cookies.get('access_token');
            let url = `${API_URL}/admin/kanji`;

            const queryParams = new URLSearchParams();
            if (filterLevel && filterLevel !== 'all') queryParams.append('level', filterLevel);
            if (search) queryParams.append('search', search);

            const queryString = queryParams.toString();
            if (queryString) url += `?${queryString}`;

            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setKanjiList(data);
                if (!filterLevel && !search) cacheSet('admin-kanji-all', data);
            } else {
                const cached = cacheGet('admin-kanji-all');
                if (cached) { setKanjiList(cached); return; }
                alert(`Gagal mengambil data Kanji: ${res.status} ${res.statusText}`);
            }
        } catch (error) {
            console.error("Failed to fetch", error);
            const cached = cacheGet('admin-kanji-all');
            if (cached) { setKanjiList(cached); return; }
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (!window.confirm("Yakin ingin menghapus Kanji ini?")) return;
        try {
            const token = Cookies.get('access_token');
            const res = await fetch(`${API_URL}/admin/kanji/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) fetchKanjis();
            else alert('Failed to delete');
        } catch (error) {
            console.error("Delete error", error);
        }
    };

    const handleExport = async () => {
        try {
            const token = Cookies.get('access_token');
            const queryParams = new URLSearchParams();
            if (filterLevel && filterLevel !== 'all') queryParams.append('level', filterLevel);
            if (search) queryParams.append('search', search);
            
            const res = await fetch(`${API_URL}/admin/kanji/export/csv?${queryParams.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `kanji_export_${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
            } else {
                alert("Gagal mengekspor data.");
            }
        } catch (error) {
            console.error("Export failed", error);
        }
    };

    if (!mounted) return null;

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className={`text-5xl font-black tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        Kanji <span className="text-red-600">Management</span>
                    </h1>
                    <p className="text-xs font-bold text-neutral-500 uppercase tracking-[0.2em] mt-3">Total: {kanjiList.length} Entitas</p>
                </div>
                <Link 
                    href="/admin/kanji/new" 
                    className="bg-red-600 hover:bg-red-500 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-red-600/20 active:scale-95 text-center"
                >
                    + Tambah Kanji Baru
                </Link>
            </div>

            {/* Filter & Actions Bar */}
            <div className={`p-6 rounded-[2rem] border backdrop-blur-xl transition-all ${
                theme === 'dark' ? 'bg-white/5 border-white/5 shadow-2xl' : 'bg-white border-gray-100 shadow-xl shadow-gray-200/50'
            }`}>
                <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="relative flex-1 w-full">
                        <input 
                            type="text" 
                            placeholder="Cari berdasarkan karakter atau arti..." 
                            className={`w-full p-4 pl-12 rounded-2xl font-bold text-sm transition-all outline-none ${
                                theme === 'dark' ? 'bg-neutral-900/50 text-white border-white/5 focus:bg-neutral-900 focus:ring-2 focus:ring-red-600/50' : 'bg-gray-50 border-gray-100 focus:bg-white focus:border-red-500'
                            }`}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <select 
                            className={`flex-1 md:w-32 p-4 rounded-2xl font-bold text-sm outline-none cursor-pointer ${
                                theme === 'dark' ? 'bg-neutral-900/50 text-white border-white/5' : 'bg-gray-50 border-gray-100'
                            }`}
                            value={filterLevel} 
                            onChange={(e) => setFilterLevel(e.target.value)}
                        >
                            <option value="">Semua Level</option>
                            {[5, 4, 3, 2, 1].map(l => <option key={l} value={l}>N{l}</option>)}
                        </select>
                        
                        <button 
                            onClick={handleExport}
                            className={`p-4 rounded-2xl transition-all active:scale-95 ${
                                theme === 'dark' ? 'bg-emerald-600/10 text-emerald-500 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                            }`}
                            title="Export to CSV"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Table Section */}
            <div className={`rounded-[2.5rem] border overflow-hidden transition-all ${
                theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-white border-gray-100 shadow-sm'
            }`}>
                {loading ? (
                    <div className="p-20 text-center">
                        <div className="w-12 h-12 border-4 border-red-600/20 border-t-red-600 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Menarik Data...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-white/5">
                            <thead className={theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}>
                                <tr>
                                    <th className="px-8 py-6 text-left text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">Karakter</th>
                                    <th className="px-8 py-6 text-left text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">Arti & Detail</th>
                                    <th className="px-8 py-6 text-left text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">Level</th>
                                    <th className="px-8 py-6 text-right text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {kanjiList.map((k) => (
                                    <tr key={k.id} className={`transition-colors ${theme === 'dark' ? 'hover:bg-white/[0.02]' : 'hover:bg-gray-50'}`}>
                                        <td className="px-8 py-6 whitespace-nowrap">
                                            <div className={`text-4xl font-black ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{k.character}</div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className={`font-black text-lg ${theme === 'dark' ? 'text-neutral-200' : 'text-gray-900'}`}>{k.meaning}</div>
                                            <div className="flex flex-wrap gap-x-4 mt-1">
                                                <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest"><span className="text-red-500">音:</span> {k.onyomi.join(', ')}</div>
                                                <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest"><span className="text-blue-500">訓:</span> {k.kunyomi.join(', ')}</div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 whitespace-nowrap">
                                            <span className="px-4 py-1.5 text-[10px] font-black rounded-full bg-red-600/10 text-red-500 border border-red-500/20">N{k.jlpt_level}</span>
                                        </td>
                                        <td className="px-8 py-6 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link 
                                                    href={`/kanji/${k.id}`} 
                                                    target="_blank" 
                                                    className="p-3 rounded-xl bg-neutral-900/50 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all"
                                                    title="Lihat Publik"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                </Link>
                                                <Link 
                                                    href={`/admin/kanji/${k.id}`} 
                                                    className="p-3 rounded-xl bg-indigo-600/10 text-indigo-500 hover:bg-indigo-600 hover:text-white transition-all"
                                                    title="Edit Data"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                </Link>
                                                <button 
                                                    onClick={(e) => handleDelete(e, k.id)} 
                                                    className="p-3 rounded-xl bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white transition-all"
                                                    title="Hapus Data"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}