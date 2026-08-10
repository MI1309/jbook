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

    const initialSearch = searchParams.get('search') || '';
    const initialLevels = searchParams.get('level')?.split(',').filter(Boolean) || [];
    const initialType = searchParams.get('word_type') || '';

    const [searchTerm, setSearchTerm] = useState(initialSearch);
    const [selectedLevels, setSelectedLevels] = useState(initialLevels);
    const [wordType, setWordType] = useState(initialType);

    // Sync state with URL changes (e.g. back button)
    useEffect(() => {
        setSearchTerm(searchParams.get('search') || '');
        setSelectedLevels(searchParams.get('level')?.split(',').filter(Boolean) || []);
        setWordType(searchParams.get('word_type') || '');
    }, [searchParams]);

    // Debounce search term to avoid too many URL updates (500ms delay)
    const [debouncedSearch] = useDebounce(searchTerm, 500);

    // Update URL when search term, level, or type changes
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

        if (wordType) {
            params.set('word_type', wordType);
        } else {
            params.delete('word_type');
        }

        const currentSearch = searchParams.get('search') || '';
        const currentLevel = searchParams.get('level') || '';
        const currentType = searchParams.get('word_type') || '';

        // Only push if changed
        if (debouncedSearch !== currentSearch || selectedLevels.join(',') !== currentLevel || wordType !== currentType) {
            params.delete('page'); // Reset pagination on new search/filter
            router.push(`/kotoba?${params.toString()}`, { scroll: false });
        }

    }, [debouncedSearch, selectedLevels, wordType, router, searchParams]);

    const textColor = !mounted ? 'text-black' : (theme === 'dark' ? 'text-white' : 'text-black');
    const subTextColor = !mounted ? 'text-black/50' : (theme === 'dark' ? 'text-white/50' : 'text-black/50');

    return (
        <div className="bg-[var(--card-bg)] p-6 rounded-[2.5rem] border border-[var(--border-color)] shadow-xl shadow-accent-blue/5 transition-all duration-300 w-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-5 items-start">
                {/* Search Box */}
                <div className="sm:col-span-2 lg:col-span-5">
                    <label className="block font-black mb-2 flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-gray-500 dark:text-gray-400">
                        <span>🔍</span> Cari Kosakata
                    </label>
                    <div className="relative group">
                        <input
                            type="text"
                            placeholder="Masukan kata, huruf, atau arti..."
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
                    <p className="text-[10px] font-bold text-gray-400 mt-1.5 px-1">
                        Tips: Ketik "neko", "猫", "ねこ", atau "kucing"
                    </p>
                </div>

                {/* Level Filter: 3-2 Grid Layout */}
                <div className="sm:col-span-1 lg:col-span-4">
                    <label className="block font-black mb-2 uppercase text-[11px] tracking-widest text-gray-500 dark:text-gray-400 text-center sm:text-left">
                        Level
                    </label>
                    <div className="grid grid-cols-6 gap-1.5 w-full">
                        {[5, 4, 3, 2, 1].map((levelItem) => {
                            const isSelected = selectedLevels.includes(levelItem.toString());
                            const spanClass = [5, 4, 3].includes(levelItem) ? 'col-span-2' : 'col-span-3';
                            return (
                                <button
                                    key={levelItem}
                                    type="button"
                                    onClick={() => {
                                        const stringLevel = levelItem.toString();
                                        if (selectedLevels.includes(stringLevel)) {
                                            setSelectedLevels(selectedLevels.filter(l => l !== stringLevel));
                                        } else {
                                            setSelectedLevels([...selectedLevels, stringLevel]);
                                        }
                                    }}
                                    className={`${spanClass} py-2 rounded-xl border font-black text-xs transition-all duration-200 flex items-center justify-center ${
                                        isSelected
                                            ? 'bg-gradient-to-r from-accent-blue to-accent-green text-white border-transparent shadow-md shadow-accent-blue/20 scale-[1.02]'
                                            : 'bg-[var(--background)] text-gray-600 dark:text-gray-400 border-[var(--border-color)] hover:border-accent-blue/40 hover:text-accent-blue hover:bg-accent-blue/5'
                                    }`}
                                >
                                    N{levelItem}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Type Select */}
                <div className="sm:col-span-1 lg:col-span-3">
                    <label className="block font-black mb-2 uppercase text-[11px] tracking-widest text-gray-500 dark:text-gray-400 text-center sm:text-left">
                        Tipe
                    </label>
                    <div className="relative">
                        <select
                            className="w-full px-4 py-2.5 bg-[var(--background)] text-[var(--foreground)] border border-[var(--border-color)] focus:outline-none focus:ring-2 focus:ring-accent-blue/40 focus:border-accent-blue transition-all cursor-pointer rounded-2xl text-sm font-semibold appearance-none pr-8"
                            value={wordType}
                            onChange={(e) => setWordType(e.target.value)}
                        >
                            <option value="">Semua Tipe</option>
                            <option value="noun">Noun</option>
                            <option value="verb">Verb</option>
                            <option value="adjective">Adjective</option>
                            <option value="suffix">Suffix</option>
                            <option value="particle">Particle</option>
                            <option value="counter">Counter</option>
                            <option value="conjunction">Conjunction</option>
                            <option value="interjection">Interjection</option>
                            <option value="pronoun">Pronoun</option>
                        </select>
                        <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-[10px]">
                            ▼
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function KotobaFilter() {
    return (
        <Suspense fallback={<div className="bg-[var(--card-bg)] p-6 rounded-[2.5rem] border border-[var(--border-color)] w-full h-32 animate-pulse"></div>}>
            <FilterContent />
        </Suspense>
    );
}
