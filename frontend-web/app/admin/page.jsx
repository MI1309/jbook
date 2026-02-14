'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

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
            const token = localStorage.getItem('access_token');
            const res = await fetch('http://localhost:8000/api/admin/stats', {
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
            const token = localStorage.getItem('access_token');
            const res = await fetch(`http://localhost:8000/api/admin/search?q=${encodeURIComponent(searchQuery)}`, {
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

    return (
        <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Welcome back, {user?.username}</h2>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
                    <h3 className="text-gray-500 text-sm font-medium uppercase">Total Kanji</h3>
                    <p className="text-3xl font-bold text-gray-800 mt-2">{stats.kanji_count}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
                    <h3 className="text-gray-500 text-sm font-medium uppercase">Total Bunpo</h3>
                    <p className="text-3xl font-bold text-gray-800 mt-2">{stats.bunpo_count}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
                    <h3 className="text-gray-500 text-sm font-medium uppercase">Total Blog Posts</h3>
                    <p className="text-3xl font-bold text-gray-800 mt-2">{stats.blog_count}</p>
                </div>
            </div>

            {/* Best Search Engine */}
            <div className="bg-white p-8 rounded-lg shadow-lg">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <svg className="w-6 h-6 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    Best Search Engine
                </h3>
                <div className="relative">
                    <input
                        type="text"
                        className="w-full p-4 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-lg shadow-sm"
                        placeholder="Search anything (Kanji, Grammar, Blog content)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <div className="absolute top-4 left-4 text-gray-400">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    </div>
                    {isSearching && (
                        <div className="absolute top-4 right-4 animate-spin text-red-600">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        </div>
                    )}
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                    <div className="mt-6 space-y-4">
                        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Results ({searchResults.length})</h4>
                        {searchResults.map((result) => (
                            <Link href={`/admin/${result.type}/${result.id}`} key={result.id} className="block group">
                                <div className="p-4 border border-gray-200 rounded-lg hover:bg-red-50 hover:border-red-200 transition-colors cursor-pointer">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center space-x-2">
                                                <span className={`px-2 py-1 text-xs font-bold rounded uppercase ${result.type === 'kanji' ? 'bg-blue-100 text-blue-800' :
                                                        result.type === 'bunpo' ? 'bg-green-100 text-green-800' :
                                                            'bg-purple-100 text-purple-800'
                                                    }`}>
                                                    {result.type}
                                                </span>
                                                <h5 className="text-lg font-bold text-gray-900 group-hover:text-red-700">{result.title}</h5>
                                            </div>
                                            <p className="mt-1 text-gray-600">{result.subtitle}</p>
                                        </div>
                                        <div className="flex space-x-2">
                                            {result.tags.map((tag, idx) => (
                                                <span key={idx} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {searchQuery.length > 2 && searchResults.length === 0 && !isSearching && (
                    <div className="mt-6 text-center text-gray-500 py-8">
                        No results found for "{searchQuery}"
                    </div>
                )}
            </div>
        </div>
    );
}
