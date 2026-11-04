'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDebounce } from 'use-debounce';
import { ArrowRight, Crown, Leaf, Mountain, Search, Sprout, TreePine, X } from 'lucide-react';
import { getBunpoSlug } from '@/data/bunpoSlugs';
import { BUNPO_LEVELS } from '@/data/bunpoLevels';

const icons = { Sprout, Leaf, TreePine, Mountain, Crown };
const sequence = ['①', '②', '③', '④', '⑤'];
const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue';

function normalize(value) {
    return String(value ?? '').toLocaleLowerCase('id');
}

export default function BunpoLanding({ patterns }) {
    const router = useRouter();
    const searchRef = useRef(null);
    const [query, setQuery] = useState('');
    const [debouncedQuery] = useDebounce(query, 300);
    const [showSuggestions, setShowSuggestions] = useState(false);

    useEffect(() => {
        const handleOutsidePointer = (event) => {
            if (!searchRef.current?.contains(event.target)) setShowSuggestions(false);
        };
        document.addEventListener('pointerdown', handleOutsidePointer);
        return () => document.removeEventListener('pointerdown', handleOutsidePointer);
    }, []);

    const suggestions = useMemo(() => {
        const searchTerm = normalize(debouncedQuery.trim());
        if (searchTerm.length < 2) return [];

        return patterns.filter((pattern) => [pattern.title, pattern.structure, pattern.explanation]
            .some((value) => normalize(value).includes(searchTerm)))
            .slice(0, 8);
    }, [debouncedQuery, patterns]);

    const counts = useMemo(() => patterns.reduce((result, pattern) => {
        const key = `n${pattern.jlpt_level}`;
        result[key] = (result[key] || 0) + 1;
        return result;
    }, {}), [patterns]);

    const handleSubmit = (event) => {
        event.preventDefault();
        const searchTerm = query.trim();
        if (!searchTerm) return;
        setShowSuggestions(false);
        router.push(`/bunpo/n5?q=${encodeURIComponent(searchTerm)}`);
    };

    return (
        <main className="washi-texture min-h-screen bg-[var(--background)] text-[var(--foreground)]">
            <div className="mx-auto w-full max-w-5xl px-4 pb-16 pt-8 sm:px-6 sm:pt-12 lg:px-8">
                <header className="border-b border-[var(--border-color)] pb-8 sm:pb-10">
                    <span className="inline-flex items-center rounded-full border border-accent-blue/25 bg-accent-blue/10 px-3 py-1 text-xs font-bold text-accent-blue">
                        文法 · ぶんぽう
                    </span>
                    <h1 className="mt-4 font-japanese text-3xl font-black leading-tight sm:text-4xl xl:text-5xl">
                        文法 Bunpo
                    </h1>
                    <p className="mt-3 max-w-2xl text-base leading-relaxed text-gray-600 dark:text-gray-300 sm:text-lg">
                        Kuasai tata bahasa Jepang, dari N5 sampai N1.
                    </p>

                    <div ref={searchRef} className="relative mt-6 max-w-2xl">
                        <form onSubmit={handleSubmit} role="search">
                            <div className="group relative">
                                <Search aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-accent-blue" />
                                <input
                                    type="search"
                                    role="combobox"
                                    value={query}
                                    onChange={(event) => setQuery(event.target.value)}
                                    onFocus={() => setShowSuggestions(true)}
                                    aria-label="Cari pola bunpo"
                                    aria-autocomplete="list"
                                    aria-haspopup="listbox"
                                    aria-controls="bunpo-suggestions"
                                    aria-expanded={showSuggestions && debouncedQuery.trim().length >= 2}
                                    placeholder="Cari pola bunpo..."
                                    className={`w-full rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] py-3.5 pl-12 pr-12 text-sm text-foreground shadow-sm transition hover:border-accent-blue/40 focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/30 sm:text-base ${focusRing}`}
                                />
                                {query && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setQuery('');
                                            setShowSuggestions(false);
                                        }}
                                        aria-label="Hapus pencarian"
                                        title="Hapus pencarian"
                                        className={`absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-gray-500 transition hover:bg-[var(--background)] hover:text-foreground ${focusRing}`}
                                    >
                                        <X aria-hidden="true" className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        </form>

                        {showSuggestions && debouncedQuery.trim().length >= 2 && (
                            <div id="bunpo-suggestions" role="listbox" aria-label="Saran pola bunpo" className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 max-h-[min(70vh,28rem)] overflow-y-auto rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-2 text-left shadow-2xl">
                                {suggestions.length > 0 ? suggestions.map((pattern) => {
                                    const level = `n${pattern.jlpt_level}`;
                                    const slug = getBunpoSlug(pattern.title);
                                    const href = slug ? `/bunpo/${level}/${slug}` : `/bunpo/${level}`;
                                    return (
                                        <Link
                                            key={pattern.id}
                                            href={href}
                                            role="option"
                                            aria-label={`${pattern.title}, level ${level.toUpperCase()}`}
                                            onClick={() => setShowSuggestions(false)}
                                            className={`flex items-start justify-between gap-3 rounded-lg px-3 py-2.5 transition hover:bg-accent-blue/5 focus:bg-accent-blue/5 ${focusRing}`}
                                        >
                                            <span className="min-w-0">
                                                <span className="block font-japanese text-sm font-bold">{pattern.title}</span>
                                                <span className="mt-0.5 block line-clamp-1 text-xs text-gray-600 dark:text-gray-400">{pattern.structure}</span>
                                            </span>
                                            <span className="shrink-0 rounded border border-[var(--border-color)] px-2 py-0.5 text-[10px] font-bold text-gray-600 dark:text-gray-300">{level.toUpperCase()}</span>
                                        </Link>
                                    );
                                }) : (
                                    <p className="px-3 py-4 text-sm text-gray-600 dark:text-gray-300">
                                        Tidak ditemukan pola untuk &quot;{debouncedQuery.trim()}&quot;.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    <p className="mt-3 text-sm text-gray-500">
                        {patterns.length} pola · 5 level · N5 → N1
                    </p>
                </header>

                <section aria-labelledby="roadmap-heading" className="pt-8 sm:pt-10">
                    <div className="mb-6 flex items-end justify-between gap-4">
                        <div>
                            <p className="text-xs font-bold uppercase text-accent-blue">Peta belajar</p>
                            <h2 id="roadmap-heading" className="mt-1 font-japanese text-2xl font-black sm:text-3xl">Pilih levelmu</h2>
                        </div>
                        <span className="hidden text-sm text-gray-500 sm:block">Dari dasar sampai mahir</span>
                    </div>

                    <ol className="relative space-y-4 before:absolute before:bottom-8 before:left-[1.4rem] before:top-8 before:w-px before:bg-[var(--border-color)] sm:space-y-5">
                        {BUNPO_LEVELS.map((item, index) => {
                            const Icon = icons[item.icon];
                            const count = counts[item.level];
                            return (
                                <li key={item.level}>
                                    <Link
                                        href={`/bunpo/${item.level}`}
                                        aria-label={`Lihat semua pola Bunpo level ${item.level.toUpperCase()}, ${item.title}`}
                                        className={`group relative flex min-h-40 items-start gap-4 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-accent-blue/40 hover:shadow-lg sm:gap-6 sm:p-5 ${focusRing}`}
                                    >
                                        <span className={`relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[var(--border-color)] bg-[var(--background)] text-sm font-black ${item.accent}`} aria-hidden="true">
                                            {sequence[index]}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                                <span className={`font-japanese text-2xl font-black ${item.accent}`}>{item.level.toUpperCase()}</span>
                                                <h3 className="text-base font-bold text-foreground sm:text-lg">{item.title}</h3>
                                                {item.beta && <span className="rounded border border-[var(--border-color)] bg-[var(--background)] px-2 py-0.5 text-[10px] font-bold text-gray-600 dark:text-gray-300">🔒 Beta</span>}
                                            </div>
                                            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-600 dark:text-gray-300">{item.description}</p>
                                            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                                                <span className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-300">
                                                    <Icon aria-hidden="true" className={`h-4 w-4 ${item.accent}`} />
                                                    {count ? `${count} pola` : 'Lihat semua pola'}
                                                </span>
                                                <span className={`inline-flex items-center gap-1 text-sm font-bold ${item.accent}`}>
                                                    Lihat Pola {item.level.toUpperCase()} <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                </li>
                            );
                        })}
                    </ol>
                </section>
            </div>
        </main>
    );
}