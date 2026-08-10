'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useDebounce } from 'use-debounce';
import { useTheme } from '@/context/ThemeContext';

function FilterContent() {
    const { theme, mounted } = useTheme();
    const router = useRouter();
    const searchParams = useSearchParams();

    // Initialize state from URL params
    const initialSearch = searchParams.get('search') || '';
    const initialLevels = searchParams.get('level')?.split(',').filter(Boolean) || [];
    const initialChapter = searchParams.get('chapter') || '';

    const [searchTerm, setSearchTerm] = useState(initialSearch);
    const [selectedLevels, setSelectedLevels] = useState(initialLevels);
    const [selectedChapter, setSelectedChapter] = useState(initialChapter);

    // Debounce search term to avoid too many URL updates
    const [debouncedSearch] = useDebounce(searchTerm, 500);
    const [debouncedChapter] = useDebounce(selectedChapter, 500);

    // Update URL when filters change
    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());

        if (debouncedSearch) {
            params.set('search', debouncedSearch);
        } else {
            params.delete('search');
        }

        if (selectedLevels.length) {
            params.set('level', selectedLevels.join(','));
        } else {
            params.delete('level');
        }

        if (debouncedChapter) {
            params.set('chapter', debouncedChapter);
        } else {
            params.delete('chapter');
        }

        // Reset page when filter changes, IF search/level/chapter changed
        const currentSearch = searchParams.get('search') || '';
        const currentLevel = searchParams.get('level') || '';
        const currentChapter = searchParams.get('chapter') || '';

        if (debouncedSearch !== currentSearch || selectedLevels.join(',') !== currentLevel || debouncedChapter !== currentChapter) {
            params.delete('page'); // Reset pagination
            router.push(`/bunpo?${params.toString()}`, { scroll: false });
        }

    }, [debouncedSearch, selectedLevels, debouncedChapter, router, searchParams]);

    const handleLevelClick = (level) => {
        const stringLevel = level.toString();
        if (selectedLevels.includes(stringLevel)) {
            setSelectedLevels(selectedLevels.filter(l => l !== stringLevel));
        } else {
            setSelectedLevels([...selectedLevels, stringLevel]);
        }
    };

    const textColor = !mounted ? 'text-black' : (theme === 'dark' ? 'text-white' : 'text-black');
    const subTextColor = !mounted ? 'text-black/50' : (theme === 'dark' ? 'text-white/50' : 'text-black/50');

    return (
        <div className="bg-[var(--card-bg)] p-6 rounded-[2.5rem] border border-[var(--border-color)] shadow-xl shadow-accent-blue/5 transition-all duration-300 w-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-5 items-start">
                {/* Search Bunpo */}
                <div className="sm:col-span-2 lg:col-span-5">
                    <label className="block font-black mb-2 flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-gray-500 dark:text-gray-400">
                        <span>🔍</span> Cari Bunpo
                    </label>
                    <div className="relative group">
                        <input
                            type="text"
                            placeholder="Cari struktur, judul, atau penjelasan..."
                            className="w-full px-4 py-2.5 bg-[var(--background)] text-[var(--foreground)] border border-[var(--border-color)] focus:outline-none focus:ring-2 focus:ring-accent-blue/40 focus:border-accent-blue transition-all group-hover:border-accent-blue/30 rounded-2xl text-sm font-semibold"
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

                {/* Level Filter: 3-2 Grid */}
                <div className="sm:col-span-1 lg:col-span-4">
                    <label className="block font-black mb-2 uppercase text-[11px] tracking-widest text-gray-500 dark:text-gray-400 text-center sm:text-left">
                        Filter Level JLPT
                    </label>
                    <div className="grid grid-cols-6 gap-1.5 w-full">
                        {[5, 4, 3, 2, 1].map((level) => {
                            const isSelected = selectedLevels.includes(level.toString());
                            const spanClass = [5, 4, 3].includes(level) ? 'col-span-2' : 'col-span-3';
                            return (
                                <button
                                    key={level}
                                    type="button"
                                    onClick={() => handleLevelClick(level)}
                                    className={`${spanClass} py-2 rounded-xl border font-black text-xs transition-all duration-200 flex items-center justify-center ${
                                        isSelected
                                            ? 'bg-gradient-to-r from-accent-blue to-accent-green text-white border-transparent shadow-md shadow-accent-blue/20 scale-[1.02]'
                                            : 'bg-[var(--background)] text-gray-600 dark:text-gray-400 border-[var(--border-color)] hover:border-accent-blue/40 hover:text-accent-blue hover:bg-accent-blue/5'
                                    }`}
                                >
                                    N{level}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Chapter Filter */}
                <div className="sm:col-span-1 lg:col-span-3">
                    <label className="block font-black mb-2 uppercase text-[11px] tracking-widest text-gray-500 dark:text-gray-400 text-center sm:text-left">
                        Filter Chapter
                    </label>
                    <div className="relative group">
                        <input
                            type="number"
                            min="1"
                            placeholder="Contoh: 1"
                            className="w-full px-4 py-2.5 bg-[var(--background)] text-[var(--foreground)] border border-[var(--border-color)] focus:outline-none focus:ring-2 focus:ring-accent-blue/40 focus:border-accent-blue transition-all group-hover:border-accent-blue/30 rounded-2xl text-sm font-semibold"
                            value={selectedChapter}
                            onChange={(e) => setSelectedChapter(e.target.value)}
                        />
                        {selectedChapter && (
                            <button
                                onClick={() => setSelectedChapter('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-xs text-gray-400 hover:text-red-500 hover:bg-gray-200 dark:hover:bg-gray-800 transition-all"
                            >
                                ✕
                            </button>
                        )}
                    </div>
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
