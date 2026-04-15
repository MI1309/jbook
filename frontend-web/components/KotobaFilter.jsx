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
    const initialLevel = searchParams.get('level') || '';
    const initialType = searchParams.get('word_type') || '';

    const [searchTerm, setSearchTerm] = useState(initialSearch);
    const [level, setLevel] = useState(initialLevel);
    const [wordType, setWordType] = useState(initialType);

    // Sync state with URL changes (e.g. back button)
    useEffect(() => {
        setSearchTerm(searchParams.get('search') || '');
        setLevel(searchParams.get('level') || '');
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

        if (level) {
            params.set('level', level);
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
        if (debouncedSearch !== currentSearch || level !== currentLevel || wordType !== currentType) {
            params.delete('page'); // Reset pagination on new search/filter
            router.push(`/kotoba?${params.toString()}`);
        }

    }, [debouncedSearch, level, wordType, router, searchParams]);

    const textColor = !mounted ? 'text-black' : (theme === 'dark' ? 'text-white' : 'text-black');
    const subTextColor = !mounted ? 'text-black/50' : (theme === 'dark' ? 'text-white/50' : 'text-black/50');
    const inputBg = !mounted ? 'bg-background' : (theme === 'dark' ? 'bg-black/40' : 'bg-background');

    return (
        <div className={`bg-card card-texture p-6 rounded-3xl shadow-lg mb-8 max-w-4xl mx-auto border transition-all ${theme === 'dark' ? 'border-red-950 shadow-red-950/5' : 'border-gray-100 shadow-red-100/20'}`}>
            <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-[2]">
                    <label className={`block font-black mb-2 flex items-center gap-2 text-xs uppercase tracking-widest transition-colors ${subTextColor}`}>
                        <span>🔍</span> Cari Kosakata
                    </label>
                    <div className="relative group">
                        <input
                            type="text"
                            placeholder="Masukan kata, huruf, atau arti..."
                            className={`w-full px-5 py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition-all group-hover:border-brand/30 ${inputBg} ${textColor} ${theme === 'dark' ? 'border-red-950' : 'border-gray-100'}`}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className={`absolute right-4 top-1/2 transform -translate-y-1/2 transition-colors rounded-full w-6 h-6 flex items-center justify-center text-xs ${theme === 'dark' ? 'bg-red-950/40 text-red-400 hover:text-red-300' : 'bg-gray-100 text-gray-400 hover:text-red-500'}`}
                            >
                                ✕
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex-1">
                    <label className={`block font-black mb-2 flex items-center gap-2 text-xs uppercase tracking-widest transition-colors ${subTextColor}`}>
                        Level
                    </label>
                    <select
                        className={`w-full px-5 py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition-all cursor-pointer appearance-none ${inputBg} ${textColor} ${theme === 'dark' ? 'border-red-950' : 'border-gray-100'}`}
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

                <div className="flex-1">
                    <label className={`block font-black mb-2 flex items-center gap-2 text-xs uppercase tracking-widest transition-colors ${subTextColor}`}>
                        Tipe
                    </label>
                    <select
                        className={`w-full px-5 py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition-all cursor-pointer appearance-none ${inputBg} ${textColor} ${theme === 'dark' ? 'border-red-950' : 'border-gray-100'}`}
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
