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
    const initialLevel = searchParams.get('level') || '';
    const initialChapter = searchParams.get('chapter') || '';

    const [searchTerm, setSearchTerm] = useState(initialSearch);
    const [selectedLevel, setSelectedLevel] = useState(initialLevel);
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

        if (selectedLevel) {
            params.set('level', selectedLevel);
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

        if (debouncedSearch !== currentSearch || selectedLevel !== currentLevel || debouncedChapter !== currentChapter) {
            params.delete('page'); // Reset pagination
            router.push(`/bunpo?${params.toString()}`);
        }

    }, [debouncedSearch, selectedLevel, debouncedChapter, router, searchParams]);

    const handleLevelClick = (level) => {
        if (selectedLevel === level.toString()) {
            setSelectedLevel('');
        } else {
            setSelectedLevel(level.toString());
        }
    };

    const textColor = !mounted ? 'text-black' : (theme === 'dark' ? 'text-white' : 'text-black');
    const subTextColor = !mounted ? 'text-black/50' : (theme === 'dark' ? 'text-white/50' : 'text-black/50');
    const inputBg = !mounted ? 'bg-background' : (theme === 'dark' ? 'bg-black/40' : 'bg-background');

    return (
        <div className={`bg-card card-texture p-6 rounded-3xl border shadow-md mb-8 transition-colors ${theme === 'dark' ? 'border-red-950 shadow-red-950/5' : 'border-gray-100 shadow-red-100/20'}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                    <label className={`block font-black mb-2 uppercase text-xs tracking-widest transition-colors ${subTextColor}`}>Cari Bunpo</label>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Cari struktur, judul, atau penjelasan..."
                            className={`w-full px-5 py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition-all group-hover:border-brand/30 ${inputBg} ${textColor} ${theme === 'dark' ? 'border-red-950' : 'border-gray-100'}`}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                </div>

                <div>
                    <label className={`block font-black mb-2 uppercase text-xs tracking-widest transition-colors ${subTextColor}`}>Filter Level JLPT</label>
                    <div className="flex flex-wrap gap-2">
                        {[5, 4, 3, 2, 1].map((level) => (
                            <button
                                key={level}
                                onClick={() => handleLevelClick(level)}
                                className={`px-5 py-2.5 rounded-xl border-2 transition-all font-black text-sm ${selectedLevel === level.toString()
                                    ? 'bg-brand text-white border-brand shadow-lg shadow-brand/20 scale-105'
                                    : `${theme === 'dark' ? 'bg-black/40 text-gray-400 border-red-950 hover:border-red-500' : 'bg-background text-gray-500 border-gray-100 hover:border-brand/40 hover:bg-brand-light/10'}`
                                    }`}
                            >
                                N{level}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className={`block font-black mb-2 uppercase text-xs tracking-widest transition-colors ${subTextColor}`}>Filter Chapter</label>
                    <input
                        type="number"
                        min="1"
                        placeholder="Contoh: 1"
                        className={`w-full px-5 py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition-all group-hover:border-brand/30 ${inputBg} ${textColor} ${theme === 'dark' ? 'border-red-950' : 'border-gray-100'}`}
                        value={selectedChapter}
                        onChange={(e) => setSelectedChapter(e.target.value)}
                    />
                    {selectedChapter && (
                        <button
                            onClick={() => setSelectedChapter('')}
                            className="mt-2 text-sm text-red-600 hover:underline"
                        >
                            Hapus Filter Chapter
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function BunpoFilter() {
    return (
        <Suspense fallback={<div className="p-6 bg-white rounded-lg shadow-md mb-8 h-48 animate-pulse"></div>}>
            <FilterContent />
        </Suspense>
    );
}
