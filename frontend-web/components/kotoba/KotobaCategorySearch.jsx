'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDebounce } from 'use-debounce';
import { Search, X } from 'lucide-react';
import { searchKotoba } from '@/app/kotoba/actions';

export default function KotobaCategorySearch({ category, initialSearch = '', initialSuggestions = [] }) {
    const router = useRouter();
    const searchRef = useRef(null);
    const [query, setQuery] = useState(initialSearch);
    const [debouncedQuery] = useDebounce(query, 300);
    const [suggestions, setSuggestions] = useState(initialSuggestions);
    const [showSuggestions, setShowSuggestions] = useState(false);

    useEffect(() => {
        const handleOutsidePointer = (event) => {
            if (!searchRef.current?.contains(event.target)) setShowSuggestions(false);
        };
        document.addEventListener('pointerdown', handleOutsidePointer);
        return () => document.removeEventListener('pointerdown', handleOutsidePointer);
    }, []);

    useEffect(() => {
        let cancelled = false;
        if (debouncedQuery.trim().length < 2) {
            return () => { cancelled = true; };
        }
        searchKotoba({ wordType: category.wordType, query: debouncedQuery.trim() })
            .then((result) => { if (!cancelled) setSuggestions(result); })
            .catch(() => { if (!cancelled) setSuggestions([]); });
        return () => { cancelled = true; };
    }, [category.wordType, debouncedQuery]);

    const suggestionLabel = useMemo(() => `Saran kata dalam kategori ${category.name}`, [category.name]);

    const submit = (event) => {
        event.preventDefault();
        const params = new URLSearchParams();
        if (query.trim()) params.set('search', query.trim());
        setShowSuggestions(false);
        router.push(`/kotoba/${category.slug}${params.size ? `?${params}` : ''}`);
    };

    return (
        <div ref={searchRef} className="relative min-w-0 w-full">
            <form onSubmit={submit} role="search">
                <div className="group relative">
                    <Search aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 group-focus-within:text-accent-blue" />
                    <input
                        type="search"
                        role="combobox"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        onFocus={() => setShowSuggestions(true)}
                        aria-label={`Cari kata dalam kategori ${category.name}`}
                        aria-autocomplete="list"
                        aria-haspopup="listbox"
                        aria-controls="kotoba-category-suggestions"
                        aria-expanded={showSuggestions && debouncedQuery.trim().length >= 2}
                        placeholder="Cari kata atau arti..."
                        className="min-h-12 w-full min-w-0 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] py-3 pl-12 pr-12 text-sm text-foreground shadow-sm focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/30 sm:text-base"
                    />
                    {query && (
                        <button type="button" onClick={() => { setQuery(''); setShowSuggestions(false); }} aria-label="Hapus pencarian" className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-gray-500 hover:bg-[var(--background)] hover:text-foreground">
                            <X aria-hidden="true" className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </form>
            {showSuggestions && debouncedQuery.trim().length >= 2 && (
                <div id="kotoba-category-suggestions" role="listbox" aria-label={suggestionLabel} className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 max-h-[min(70vh,28rem)] overflow-x-hidden overflow-y-auto rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-2 shadow-2xl">
                    {suggestions.length ? suggestions.map((word) => (
                        <Link key={word.id} href={`/kotoba/${word.id}`} role="option" onClick={() => setShowSuggestions(false)} className="flex min-h-11 min-w-0 items-start justify-between gap-3 rounded-lg px-3 py-2.5 hover:bg-accent-blue/5 focus:bg-accent-blue/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-blue">
                            <span className="min-w-0">
                                <span className="block break-words font-japanese text-sm font-bold">{word.word} <span className="font-sans font-normal text-gray-500">({word.reading})</span></span>
                                <span className="mt-0.5 block line-clamp-2 break-words text-xs text-gray-600 dark:text-gray-400">{word.meaning}</span>
                            </span>
                            <span className="shrink-0 rounded border border-[var(--border-color)] px-2 py-0.5 text-[10px] font-bold">N{word.jlpt_level}</span>
                        </Link>
                    )) : <p className="px-3 py-4 text-sm text-gray-600 dark:text-gray-300">Tidak ditemukan kata dalam kategori ini.</p>}
                </div>
            )}
        </div>
    );
}