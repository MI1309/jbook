'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useDebounce } from 'use-debounce';

function FilterContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const initialSearch = searchParams.get('search') || '';
    const initialLevel = searchParams.get('level') || '';

    const [searchTerm, setSearchTerm] = useState(initialSearch);
    const [level, setLevel] = useState(initialLevel);

    // Debounce search term to avoid too many URL updates (500ms delay)
    const [debouncedSearch] = useDebounce(searchTerm, 500);

    // Update URL when search term or level changes
    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());

        if (debouncedSearch) {
            params.set('search', debouncedSearch);
        } else {
            params.delete('search');
        }

        if (level) {
            params.set('level', level);
        } else {
            params.delete('level');
        }

        const currentSearch = searchParams.get('search') || '';
        const currentLevel = searchParams.get('level') || '';

        // Only push if changed
        if (debouncedSearch !== currentSearch || level !== currentLevel) {
            params.delete('page'); // Reset pagination on new search/filter
            router.push(`/kotoba?${params.toString()}`);
        }

    }, [debouncedSearch, level, router, searchParams]);

    return (
        <div className="bg-white p-6 rounded-2xl shadow-md mb-8 max-w-xl mx-auto border border-gray-100">
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                    <label className="block text-gray-700 font-bold mb-2 flex items-center gap-2">
                        <span>🔍</span> Cari Kosakata
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Masukan kata, huruf, atau arti..."
                            className="w-full px-5 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all text-gray-900 bg-gray-50 focus:bg-white shadow-inner"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors bg-gray-100 hover:bg-red-100 rounded-full w-6 h-6 flex items-center justify-center text-xs"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                </div>

                <div className="w-full sm:w-1/3">
                    <label className="block text-gray-700 font-bold mb-2 flex items-center gap-2">
                        Level
                    </label>
                    <select
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all text-gray-900 bg-gray-50 cursor-pointer shadow-inner appearance-none"
                        value={level}
                        onChange={(e) => setLevel(e.target.value)}
                    >
                        <option value="">Semua Level</option>
                        <option value="5">N5</option>
                        <option value="4">N4</option>
                        <option value="3">N3</option>
                        <option value="2">N2</option>
                        <option value="1">N1</option>
                    </select>
                </div>
            </div>

            <p className="text-xs text-gray-400 mt-2 px-1">
                Tips: Ketik "neko", "猫", "ねこ", atau "kucing"
            </p>
        </div>
    );
}

export default function KotobaFilter() {
    return (
        <Suspense fallback={<div className="bg-white p-6 rounded-2xl shadow-md mb-8 max-w-xl mx-auto h-32 animate-pulse"></div>}>
            <FilterContent />
        </Suspense>
    );
}
