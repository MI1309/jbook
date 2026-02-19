'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useDebounce } from 'use-debounce';

function FilterContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const initialSearch = searchParams.get('search') || '';
    const [searchTerm, setSearchTerm] = useState(initialSearch);

    // Debounce search term to avoid too many URL updates (500ms delay)
    const [debouncedSearch] = useDebounce(searchTerm, 500);

    // Update URL when search term changes
    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());

        if (debouncedSearch) {
            params.set('search', debouncedSearch);
        } else {
            params.delete('search');
        }

        const currentSearch = searchParams.get('search') || '';

        // Only push if changed
        if (debouncedSearch !== currentSearch) {
            params.delete('page'); // Reset pagination on new search
            router.push(`/kotoba?${params.toString()}`);
        }

    }, [debouncedSearch, router, searchParams]);

    return (
        <div className="bg-white p-6 rounded-2xl shadow-md mb-8 max-w-xl mx-auto border border-gray-100">
            <label className="block text-gray-700 font-bold mb-2 flex items-center gap-2">
                <span>🔍</span> Cari Kosakata
            </label>
            <div className="relative">
                <input
                    type="text"
                    placeholder="Masukan kata, hiragana/katakana, romaji, atau arti..."
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
