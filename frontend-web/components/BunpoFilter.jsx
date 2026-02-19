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

    return (
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                    <label className="block text-gray-700 font-bold mb-2">Cari Bunpo</label>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Cari struktur, judul, atau penjelasan..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors text-gray-900 bg-white"
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
                    <label className="block text-gray-700 font-bold mb-2">Filter Level JLPT</label>
                    <div className="flex flex-wrap gap-2">
                        {[5, 4, 3, 2, 1].map((level) => (
                            <button
                                key={level}
                                onClick={() => handleLevelClick(level)}
                                className={`px-4 py-2 rounded-lg border transition-colors font-medium ${selectedLevel === level.toString()
                                    ? 'bg-red-600 text-white border-red-600'
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                    }`}
                            >
                                N{level}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-gray-700 font-bold mb-2">Filter Chapter</label>
                    <input
                        type="number"
                        min="1"
                        placeholder="Contoh: 1"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors text-gray-900 bg-white"
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
