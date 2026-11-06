'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDebounce } from 'use-debounce';
import { ArrowRight, Search, X } from 'lucide-react';
import { getKotobaCategoryByType } from '@/components/kotoba/kotobaCategories';
import KotobaCategoryCard from '@/components/kotoba/KotobaCategoryCard';
import { searchKotoba } from '@/app/kotoba/actions';

const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue';

export default function KotobaLanding({ total, categories: initialCategories }) {
    const router = useRouter();
    const searchRef = useRef(null);
    const [query, setQuery] = useState('');
    const [debouncedQuery] = useDebounce(query, 300);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const categories = initialCategories;

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
        searchKotoba({ query: debouncedQuery.trim() })
            .then((result) => { if (!cancelled) setSuggestions(result); })
            .catch(() => { if (!cancelled) setSuggestions([]); });
        return () => { cancelled = true; };
    }, [debouncedQuery]);

    const categoryCount = useMemo(() => categories.filter((category) => category.count > 0).length, [categories]);

    const submit = (event) => {
        event.preventDefault();
        const firstResult = suggestions[0];
        if (!firstResult) return;
        const category = getKotobaCategoryByType(firstResult.word_type);
        if (!category) {
            router.push(`/kotoba/${firstResult.id}`);
        } else {
            router.push(`/kotoba/${category.slug}?search=${encodeURIComponent(query.trim())}`);
        }
        setShowSuggestions(false);
    };

    return (
        <main className="washi-texture min-h-screen bg-[var(--background)] text-[var(--foreground)]">
            <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
                <header className="grid min-w-0 gap-6 border-b border-[var(--border-color)] pb-8 sm:pb-10 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,0.82fr)] lg:items-center lg:gap-10">
                    <div className="min-w-0">
                        <span className="inline-flex items-center rounded-full border border-accent-blue/25 bg-accent-blue/10 px-3 py-1 text-xs font-bold text-accent-blue">語彙 · ごい</span>
                        <h1 className="mt-4 break-words font-japanese text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">語彙 Kotoba</h1>
                        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-600 dark:text-gray-300 sm:text-base">Kamus kosakata Jepang, dari N5 sampai N1, dikelompokkan per kategori agar belajar lebih terarah.</p>
                        <p className="mt-3 text-sm text-gray-500">{total.toLocaleString('id-ID')} kata · {categoryCount} kategori</p>
                    </div>

                    <div ref={searchRef} className="relative min-w-0 w-full">
                        <form id="kotoba-search-form" onSubmit={submit} role="search">
                            <div className="group relative">
                                <Search aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-accent-blue" />
                                <input
                                    type="search"
                                    role="combobox"
                                    value={query}
                                    onChange={(event) => setQuery(event.target.value)}
                                    onFocus={() => setShowSuggestions(true)}
                                    aria-label="Cari kosakata Jepang"
                                    aria-autocomplete="list"
                                    aria-haspopup="listbox"
                                    aria-controls="kotoba-suggestions"
                                    aria-expanded={showSuggestions && debouncedQuery.trim().length >= 2}
                                    placeholder="Cari kata, bacaan, atau arti..."
                                    className={`min-h-12 w-full min-w-0 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] py-3.5 pl-12 pr-12 text-sm text-foreground shadow-sm transition hover:border-accent-blue/40 focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/30 sm:text-base ${focusRing}`}
                                />
                                {query && <button type="button" onClick={() => { setQuery(''); setShowSuggestions(false); }} aria-label="Hapus pencarian" className={`absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-gray-500 transition hover:bg-[var(--background)] hover:text-foreground ${focusRing}`}><X aria-hidden="true" className="h-4 w-4" /></button>}
                            </div>
                        </form>
                        {showSuggestions && debouncedQuery.trim().length >= 2 && (
                            <div id="kotoba-suggestions" role="listbox" aria-label="Saran kosakata" className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 max-h-[min(70vh,28rem)] overflow-x-hidden overflow-y-auto rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-2 text-left shadow-2xl">
                                {suggestions.length ? suggestions.map((word) => (
                                    <Link key={word.id} href={`/kotoba/${word.id}`} role="option" onClick={() => setShowSuggestions(false)} className={`flex min-h-11 min-w-0 items-start justify-between gap-3 rounded-lg px-3 py-2.5 transition hover:bg-accent-blue/5 focus:bg-accent-blue/5 ${focusRing}`}>
                                        <span className="min-w-0"><span className="block break-words font-japanese text-sm font-bold">{word.word} <span className="font-sans font-normal text-gray-500">({word.reading})</span></span><span className="mt-0.5 block line-clamp-2 break-words text-xs text-gray-600 dark:text-gray-400">{word.meaning}</span></span>
                                        <span className="shrink-0 rounded border border-[var(--border-color)] px-2 py-0.5 text-[10px] font-bold">N{word.jlpt_level}</span>
                                    </Link>
                                )) : <p className="px-3 py-4 text-sm text-gray-600 dark:text-gray-300">Tidak ditemukan kosakata untuk “{debouncedQuery.trim()}”.</p>}
                                {suggestions.length > 0 && <button type="submit" form="kotoba-search-form" className="flex min-h-11 w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-bold text-accent-blue transition hover:bg-accent-blue/5">Lihat hasil di kategori terkait <ArrowRight aria-hidden="true" className="h-4 w-4" /></button>}
                            </div>
                        )}
                    </div>
                </header>

                <section aria-labelledby="kotoba-categories-title" className="pt-8 sm:pt-10">
                    <div className="mb-6 flex min-w-0 flex-wrap items-end justify-between gap-3">
                        <div className="min-w-0">
                            <p className="text-xs font-bold uppercase tracking-[0.08em] text-accent-blue">Jelajahi kosakata</p>
                            <h2 id="kotoba-categories-title" className="mt-1 break-words font-japanese text-2xl font-black sm:text-3xl">Pilih kategori</h2>
                        </div>
                        <span className="rounded-full border border-[var(--border-color)] bg-[var(--card-bg)] px-3 py-1 text-sm font-semibold text-gray-600 dark:text-gray-300">{categoryCount} kategori tersedia</span>
                    </div>

                    <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {categories.filter((category) => category.count > 0).map((category) => <KotobaCategoryCard key={category.slug} category={category} />)}
                    </div>
                    {categoryCount === 0 && <p className="py-12 text-center text-sm text-gray-600 dark:text-gray-300">Kategori belum dapat dimuat.</p>}
                </section>
            </div>
        </main>
    );
}