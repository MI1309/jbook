'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { API_URL } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import Link from 'next/link';

export default function AdminDashboard() {
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [stats, setStats] = useState({ kanji_count: 0, bunpo_count: 0, blog_count: 0 });
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const router = useRouter();
    const { user } = useAuth();

    useEffect(() => {
        setMounted(true);
        fetchStats();
    }, []);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchQuery.length > 0) {
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
            const res = await fetch(`${API_URL}/admin/stats`, {
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
            const res = await fetch(`${API_URL}/admin/search?q=${encodeURIComponent(searchQuery)}`, {
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

    const handleExport = (type) => {
        router.push(`/admin/export?type=${type}`);
    };

    if (!mounted) return null;

    return (
        <div className="max-w-7xl mx-auto space-y-10 pb-20">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                <div className="animate-in fade-in slide-in-from-left-6 duration-700">
                    <h2 className={`text-6xl font-black tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        Admin <span className="text-red-600">Panel</span>
                    </h2>
                    <p className={`mt-4 text-sm font-bold uppercase tracking-[0.2em] flex items-center gap-2 ${theme === 'dark' ? 'text-neutral-500' : 'text-gray-400'}`}>
                        <span className="w-12 h-[2px] bg-red-600"></span>
                        Otoritas: <span className="text-red-600">{user?.username}</span>
                    </p>
                </div>
                
                <div className="flex flex-wrap gap-3">
                    {[
                        { id: 'kanji', icon: '🉐', label: 'Kanji' },
                        { id: 'kotoba', icon: '🗣️', label: 'Kotoba' },
                        { id: 'bunpo', icon: '📚', label: 'Bunpo' },
                        { id: 'particle', icon: '⚓', label: 'Partikel' }
                    ].map((item) => (
                        <button 
                            key={item.id}
                            onClick={() => handleExport(item.id)}
                            className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 border flex items-center gap-3 ${
                                theme === 'dark' 
                                ? 'bg-white/5 border-white/5 text-neutral-400 hover:text-white hover:border-white/20' 
                                : 'bg-white border-gray-100 text-gray-600 hover:border-red-200 hover:text-red-600 shadow-sm'
                            }`}
                        >
                            <span className="text-lg">{item.icon}</span>
                            {item.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats Grid - Vibrant & High Contrast */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Total Kanji', count: stats.kanji_count, icon: '🉐', color: 'from-blue-600 to-indigo-700', shadow: 'shadow-blue-500/20' },
                    { label: 'Total Bunpo', count: stats.bunpo_count, icon: '📚', color: 'from-red-600 to-rose-700', shadow: 'shadow-red-500/20' },
                    { label: 'Total Blog', count: stats.blog_count, icon: '✍️', color: 'from-amber-500 to-orange-600', shadow: 'shadow-amber-500/20' }
                ].map((stat, idx) => (
                    <div 
                        key={idx}
                        className={`relative overflow-hidden p-8 rounded-[2rem] bg-gradient-to-br ${stat.color} ${stat.shadow} text-white group hover:scale-[1.02] transition-all duration-500`}
                    >
                        <div className="absolute -right-4 -bottom-4 opacity-10 text-[10rem] font-black pointer-events-none group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-700">
                            {stat.icon}
                        </div>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">{stat.label}</h3>
                        <p className="text-6xl font-black mt-2 tracking-tighter">{stat.count}</p>
                        <div className="mt-8 flex items-center gap-2">
                            <div className="w-10 h-1 bg-white/30 rounded-full overflow-hidden">
                                <div className="h-full bg-white w-2/3"></div>
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-widest">Active Data</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Search Engine - Glassmorphism UI */}
            <div className={`backdrop-blur-xl border p-1 rounded-[3rem] transition-all duration-500 ${
                theme === 'dark' ? 'bg-white/5 border-white/5 shadow-2xl' : 'bg-white border-gray-100 shadow-xl shadow-gray-200/50'
            }`}>
                <div className="p-8 md:p-12">
                    <div className="flex items-center gap-4 mb-10 ml-2">
                        <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/20">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                            </svg>
                        </div>
                        <div>
                            <h3 className={`text-2xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>OmniSearch Engine</h3>
                            <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Global Database Query</p>
                        </div>
                    </div>

                    <div className="relative group">
                        <input
                            type="text"
                            className={`w-full p-8 pl-16 rounded-3xl transition-all text-2xl font-bold outline-none ring-0 ${
                                theme === 'dark' 
                                ? 'bg-neutral-900/50 text-white placeholder-neutral-700 focus:bg-neutral-900 focus:ring-2 focus:ring-red-600/50' 
                                : 'bg-gray-50 text-gray-800 placeholder:text-gray-300 focus:bg-white focus:ring-4 focus:ring-red-500/10 border-2 border-transparent focus:border-red-500'
                            }`}
                            placeholder="Ketik Kanji, Bunpo, atau konten Blog..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <div className="absolute top-1/2 left-8 -translate-y-1/2 text-neutral-600 group-focus-within:text-red-500 transition-colors">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0012 20c4.478 0 8.268-2.943 9.542-7H12M12 4c2.21 0 4 1.79 4 4s-1.79 4-4 4-4-1.79-4-4 1.79-4 4-4z" />
                            </svg>
                        </div>
                        {isSearching && (
                            <div className="absolute top-1/2 right-8 -translate-y-1/2">
                                <div className="animate-spin h-6 w-6 border-4 border-red-600/20 border-t-red-600 rounded-full"></div>
                            </div>
                        )}
                    </div>

                    {/* Search Results - Refined Grid */}
                    {searchResults.length > 0 && (
                        <div className="mt-12 space-y-6 animate-in fade-in zoom-in-95 duration-500">
                            <div className="flex items-center justify-between px-2">
                                <h4 className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">Hasil Pencarian ({searchResults.length})</h4>
                                <button onClick={() => setSearchQuery('')} className="text-[10px] font-black text-red-600 uppercase tracking-widest hover:underline">Reset</button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {searchResults.map((result) => (
                                    <Link href={`/admin/${result.type}/${result.id}`} key={result.id} className="group">
                                        <div className={`p-6 rounded-[2rem] border transition-all active:scale-[0.98] ${
                                            theme === 'dark'
                                            ? 'bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/10'
                                            : 'bg-white border-gray-100 hover:border-red-100 hover:shadow-xl hover:shadow-red-500/5'
                                        }`}>
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-5">
                                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black shadow-lg ${
                                                        result.type === 'kanji' ? 'bg-blue-600 text-white shadow-blue-600/20' :
                                                        result.type === 'bunpo' ? 'bg-red-600 text-white shadow-red-600/20' :
                                                        'bg-amber-500 text-white shadow-amber-500/20'
                                                    }`}>
                                                        {result.title[0]}
                                                    </div>
                                                    <div>
                                                        <h5 className={`text-xl font-black group-hover:text-red-500 transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{result.title}</h5>
                                                        <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mt-1">{result.type}</p>
                                                    </div>
                                                </div>
                                                <div className="text-neutral-700 group-hover:text-red-500 transition-colors">
                                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
