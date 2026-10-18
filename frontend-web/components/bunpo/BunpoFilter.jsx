'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useDebounce } from 'use-debounce';

function FilterContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Initialize state from URL params
    const initialSearch = searchParams.get('search') || '';
    const [searchTerm, setSearchTerm] = useState(initialSearch);
    const [jlptLevel, setJlptLevel] = useState(searchParams.get('level') || '');

    // Debounce search term to avoid too many URL updates
    const [debouncedSearch] = useDebounce(searchTerm, 500);
    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete('curriculum_level');
        params.delete('book');
        params.delete('unit');
        params.delete('chapter');
        if (debouncedSearch) params.set('search', debouncedSearch);
        else params.delete('search');
        if (debouncedSearch !== (searchParams.get('search') || '')) {
            params.delete('page');
            router.push(`/bunpo?${params.toString()}`, { scroll: false });
        }
    }, [debouncedSearch, router, searchParams]);

    const updateJlptLevel = (nextLevel) => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete('curriculum_level');
        params.delete('book');
        params.delete('unit');
        params.delete('chapter');
        if (nextLevel) params.set('level', nextLevel);
        else params.delete('level');
        params.delete('page');
        setJlptLevel(nextLevel);
        router.push(`/bunpo?${params.toString()}`, { scroll: false });
    };

    return (
        <div className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4 shadow-xl shadow-accent-blue/5 transition-all duration-300 sm:rounded-3xl sm:p-6">
            <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-[minmax(0,2fr)_minmax(10rem,1fr)] sm:gap-5 lg:grid-cols-12">
                {/* Search Bunpo */}
                <div className="w-full min-w-0 sm:col-span-1 lg:col-span-7">
                    <label className="mb-2 flex items-center gap-1.5 text-left text-[11px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">
                        <span>🔍</span> Cari Bunpo
                    </label>
                    <div className="relative group">
                        <input
                            type="text"
                            placeholder="Cari struktur, judul, atau penjelasan..."
                            className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--background)] px-4 py-2.5 text-left text-sm font-semibold text-[var(--foreground)] transition-all group-hover:border-accent-blue/30 focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/40"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-xs text-gray-400 hover:text-red-500 hover:bg-gray-200 dark:hover:bg-gray-800 transition-all"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                </div>

                <div className="w-full min-w-0 sm:col-span-1 lg:col-span-5">
                    <label className="mb-2 block text-left text-[11px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">Level JLPT</label>
                    <select value={jlptLevel} onChange={e => updateJlptLevel(e.target.value)} className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--background)] px-4 py-2.5 text-left text-sm font-semibold text-[var(--foreground)]">
                        <option value="">Semua level</option>
                        {[1, 2, 3, 4, 5].map(level => <option key={level} value={level}>N{level}</option>)}
                    </select>
                </div>
            </div>
        </div>
    );
}

export default function BunpoFilter() {
    return (
        <Suspense fallback={<div className="bg-[var(--card-bg)] p-6 rounded-[2.5rem] border border-[var(--border-color)] w-full h-32 animate-pulse"></div>}>
            <FilterContent />
        </Suspense>
    );
}
