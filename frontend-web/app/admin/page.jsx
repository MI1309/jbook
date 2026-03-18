'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import Cookies from 'js-cookie';

export default function AdminDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState({ kanji_count: 0, bunpo_count: 0, blog_count: 0 });
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        fetchStats();
    }, []);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchQuery.length > 2) {
                performSearch();
            } else {
                setSearchResults([]);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    const fetchStats = async () => {
        try {
            const token = Cookies.get('access_token');
            const res = await fetch('https://imronm.pythonanywhere.com/api/admin/stats', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (error) {
            console.error("Failed to fetch stats", error);
        }
    };

    const performSearch = async () => {
        setIsSearching(true);
        try {
            const token = Cookies.get('access_token');
            const res = await fetch(`https://imronm.pythonanywhere.com/api/admin/search?q=${encodeURIComponent(searchQuery)}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setSearchResults(data);
            }
        } catch (error) {
            console.error("Search failed", error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleExport = async (type) => {
        try {
            const token = Cookies.get('access_token');
            const res = await fetch(`https://imronm.pythonanywhere.com/api/admin/${type}/export/csv`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${type}_export_${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
            } else {
                alert("Gagal mengekspor data.");
            }
        } catch (error) {
            console.error("Export failed", error);
            alert("Terjadi kesalahan saat mengekspor.");
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-10">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">Dashboard</h2>
                    <p className="text-gray-500 mt-1 font-medium">Welcome back, <span className="text-red-600">{user?.username}</span> 👋</p>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button 
                        onClick={() => handleExport('kanji')}
                        className="bg-white hover:bg-red-50 text-gray-700 border border-gray-200 hover:border-red-200 px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 shadow-sm active:scale-95"
                    >
                        <span className="text-lg">🉐</span> Kanji
                    </button>
                    <button 
                        onClick={() => handleExport('bunpo')}
                        className="bg-white hover:bg-red-50 text-gray-700 border border-gray-200 hover:border-red-200 px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 shadow-sm active:scale-95"
                    >
                        <span className="text-lg">📚</span> Bunpo
                    </button>
                    <button 
                        onClick={() => handleExport('vocab')}
                        className="bg-white hover:bg-red-50 text-gray-700 border border-gray-200 hover:border-red-200 px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 shadow-sm active:scale-95"
                    >
                        <span className="text-lg">🗣️</span> Kotoba
                    </button>
                    <button 
                        onClick={() => handleExport('particle')}
                        className="bg-white hover:bg-red-50 text-gray-700 border border-gray-200 hover:border-red-200 px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 shadow-sm active:scale-95"
                    >
                        <span className="text-lg">⚓</span> Partikel
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="absolute top-0 right-0 p-3 opacity-5 text-6xl group-hover:scale-110 transition-transform">🉐</div>
                    <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Total Kanji</h3>
                    <p className="text-3xl font-black text-gray-900 mt-1">{stats.kanji_count}</p>
                    <div className="h-1 w-12 bg-blue-500 mt-4 rounded-full"></div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="absolute top-0 right-0 p-3 opacity-5 text-6xl group-hover:scale-110 transition-transform">📚</div>
                    <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Total Bunpo</h3>
                    <p className="text-3xl font-black text-gray-900 mt-1">{stats.bunpo_count}</p>
                    <div className="h-1 w-12 bg-green-500 mt-4 rounded-full"></div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="absolute top-0 right-0 p-3 opacity-5 text-6xl group-hover:scale-110 transition-transform">✍️</div>
                    <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Total Blog</h3>
                    <p className="text-3xl font-black text-gray-900 mt-1">{stats.blog_count}</p>
                    <div className="h-1 w-12 bg-purple-500 mt-4 rounded-full"></div>
                </div>
            </div>

            {/* Premium Search Engine */}
            <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                <div className="p-8 md:p-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                            <h3 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                                <span className="p-2 bg-red-50 text-red-600 rounded-xl">🔍</span>
                                Search Engine
                            </h3>
                            <p className="text-sm text-gray-500 font-medium mt-1">Cari apa saja di database JBook</p>
                        </div>
                    </div>

                    <div className="relative group">
                        <input
                            type="text"
                            className="w-full p-6 pl-14 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all text-xl font-medium text-gray-800 placeholder:text-gray-400 shadow-inner"
                            placeholder="Ketik Kanji, Bunpo, atau konten Blog..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <div className="absolute top-1/2 left-6 -translate-y-1/2 text-gray-400 group-focus-within:text-red-500 transition-colors">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                            </svg>
                        </div>
                        {isSearching && (
                            <div className="absolute top-1/2 right-6 -translate-y-1/2">
                                <div className="animate-spin h-6 w-6 border-2 border-red-500 border-t-transparent rounded-full"></div>
                            </div>
                        )}
                    </div>

                    {/* Search Results */}
                    {searchResults.length > 0 && (
                        <div className="mt-10 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
                                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Matching Results ({searchResults.length})</h4>
                                <button onClick={() => setSearchQuery('')} className="text-xs font-bold text-gray-400 hover:text-red-600 transition-colors">Clear</button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {searchResults.map((result) => (
                                    <Link href={`/admin/${result.type}/${result.id}`} key={result.id} className="group">
                                        <div className="p-5 bg-white border border-gray-100 rounded-2xl hover:border-red-200 hover:shadow-lg hover:shadow-red-500/5 transition-all active:scale-[0.98]">
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-start gap-4">
                                                    <div className={`p-3 rounded-xl font-black text-xs uppercase tracking-wider ${
                                                        result.type === 'kanji' ? 'bg-blue-50 text-blue-600' :
                                                        result.type === 'bunpo' ? 'bg-green-50 text-green-600' :
                                                        'bg-purple-50 text-purple-600'
                                                    }`}>
                                                        {result.type[0]}
                                                    </div>
                                                    <div>
                                                        <h5 className="text-lg font-black text-gray-900 group-hover:text-red-600 transition-colors">{result.title}</h5>
                                                        <p className="text-sm text-gray-500 font-medium line-clamp-1">{result.subtitle}</p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap gap-1 justify-end max-w-[100px]">
                                                    {result.tags.slice(0, 2).map((tag, idx) => (
                                                        <span key={idx} className="bg-gray-50 text-gray-500 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tighter">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {searchQuery.length > 2 && searchResults.length === 0 && !isSearching && (
                        <div className="mt-10 text-center py-12 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                            <div className="text-4xl mb-4">🌪️</div>
                            <p className="text-gray-500 font-bold italic">No results found for "{searchQuery}"</p>
                            <p className="text-xs text-gray-400 mt-1">Coba kata kunci lain atau periksa ejaan.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
