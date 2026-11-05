'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDebounce } from 'use-debounce';
import { Search, X, ArrowRight, Sprout, Leaf, TreePine, Mountain, Crown, Layers, BookOpen, Compass } from 'lucide-react';
import { KANJI_LEVELS } from '@/data/kanjiLevels';
import { POPULAR_RADICALS, RADICALS_BY_STROKES, getRadicalInfo } from '@/lib/radicals';
import { getKanjiHref } from '@/lib/kanji-route';

const icons = { Sprout, Leaf, TreePine, Mountain, Crown };
const sequence = ['①', '②', '③', '④', '⑤'];
const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue';

export default function KanjiLanding({ kanjiIndex = [], counts = {} }) {
    const router = useRouter();
    const searchRef = useRef(null);
    const [query, setQuery] = useState('');
    const [debouncedQuery] = useDebounce(query, 300);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [showAllRadicals, setShowAllRadicals] = useState(false);
    const [selectedStrokeTab, setSelectedStrokeTab] = useState(1);

    useEffect(() => {
        const handleOutsidePointer = (event) => {
            if (!searchRef.current?.contains(event.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('pointerdown', handleOutsidePointer);
        return () => document.removeEventListener('pointerdown', handleOutsidePointer);
    }, []);

    // Filter saran kanji secara cepat dari index
    const suggestions = useMemo(() => {
        const term = debouncedQuery.trim().toLowerCase();
        if (term.length < 1) return [];

        return kanjiIndex
            .filter((k) => {
                const char = String(k.character || '').toLowerCase();
                const meaning = String(k.meaning || '').toLowerCase();
                const on = (k.onyomi || []).join(' ').toLowerCase();
                const kun = (k.kunyomi || []).join(' ').toLowerCase();
                return char.includes(term) || meaning.includes(term) || on.includes(term) || kun.includes(term);
            })
            .slice(0, 8);
    }, [debouncedQuery, kanjiIndex]);

    const handleSubmit = (e) => {
        e.preventDefault();
        const term = query.trim();
        if (!term) return;
        setShowSuggestions(false);
        router.push(`/kanji/n5?search=${encodeURIComponent(term)}`);
    };

    const handleSelectRadical = (rad) => {
        router.push(`/kanji/n5?radical=${encodeURIComponent(rad)}`);
    };

    const totalActiveKanji = Object.values(counts).reduce((acc, curr) => acc + (Number(curr) || 0), 0);

    return (
        <main className="washi-texture min-h-screen bg-[var(--background)] text-[var(--foreground)]">
            <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-16 pt-6 sm:px-6 sm:pt-8 lg:px-8 lg:pt-10">
                {/* Header & Hero Search */}
                <header className="grid gap-6 border-b border-[var(--border-color)] pb-8 sm:pb-10 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,0.85fr)] lg:items-center lg:gap-10">
                    <div className="min-w-0">
                        <span className="inline-flex items-center rounded-full border border-accent-blue/25 bg-accent-blue/10 px-3 py-1 text-xs font-bold text-accent-blue">
                            漢字 · かんじ
                        </span>
                        <h1 className="mt-4 break-words font-japanese text-3xl font-black leading-tight sm:text-4xl xl:text-5xl">
                            漢字 Kanji
                        </h1>
                        <p className="mt-3 max-w-2xl text-base leading-relaxed text-gray-600 dark:text-gray-300 sm:text-lg">
                            Kuasai kanji Jepang, dari N5 sampai N1. Pelajari arti, cara baca onyomi & kunyomi, urutan coretan, dan radikal.
                        </p>
                        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-gray-500 sm:text-sm">
                            <span className="inline-flex items-center gap-1.5 font-semibold text-[var(--foreground)]">
                                <BookOpen className="h-4 w-4 text-accent-blue" aria-hidden="true" />
                                {totalActiveKanji > 0 ? `${totalActiveKanji}+ kanji aktif` : '5.800+ kanji lengkap'}
                            </span>
                            <span>•</span>
                            <span className="inline-flex items-center gap-1.5 font-semibold text-[var(--foreground)]">
                                <Compass className="h-4 w-4 text-accent-green" aria-hidden="true" />
                                214 radikal Kangxi
                            </span>
                            <span>•</span>
                            <span className="inline-flex items-center gap-1.5 font-semibold text-[var(--foreground)]">
                                <Layers className="h-4 w-4 text-accent-gold" aria-hidden="true" />
                                5 level JLPT (N5 → N1)
                            </span>
                        </div>
                    </div>

                    {/* Search Input Box */}
                    <div ref={searchRef} className="relative w-full min-w-0">
                        <form onSubmit={handleSubmit} role="search">
                            <div className="group relative">
                                <Search
                                    aria-hidden="true"
                                    className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-accent-blue"
                                />
                                <input
                                    type="search"
                                    role="combobox"
                                    value={query}
                                    onChange={(e) => {
                                        setQuery(e.target.value);
                                        setShowSuggestions(true);
                                    }}
                                    onFocus={() => setShowSuggestions(true)}
                                    aria-label="Cari kanji berdasarkan arti, romaji, kana, atau karakter"
                                    aria-autocomplete="list"
                                    aria-haspopup="listbox"
                                    aria-controls="kanji-suggestions"
                                    aria-expanded={showSuggestions && debouncedQuery.trim().length >= 1}
                                    placeholder="Cari kanji (mis. 日, nichi, matahari)..."
                                    className={`w-full rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] py-3.5 pl-12 pr-12 text-sm text-[var(--foreground)] shadow-sm transition hover:border-accent-blue/40 focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/30 sm:text-base ${focusRing}`}
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
                                        className={`absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-gray-500 transition hover:bg-[var(--background)] hover:text-foreground ${focusRing}`}
                                    >
                                        <X aria-hidden="true" className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        </form>

                        {/* Suggestion Dropdown */}
                        {showSuggestions && debouncedQuery.trim().length >= 1 && (
                            <div
                                id="kanji-suggestions"
                                role="listbox"
                                aria-label="Saran kanji"
                                className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-40 max-h-[min(70vh,28rem)] overflow-y-auto rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-2 text-left shadow-2xl backdrop-blur-md"
                            >
                                {suggestions.length > 0 ? (
                                    suggestions.map((k) => {
                                        const href = getKanjiHref(k);
                                        return (
                                            <Link
                                                key={k.id}
                                                href={href}
                                                role="option"
                                                aria-label={`${k.character} (${k.meaning})`}
                                                onClick={() => setShowSuggestions(false)}
                                                className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 transition hover:bg-accent-blue/10 focus:bg-accent-blue/10 ${focusRing}`}
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <span className="font-japanese text-2xl font-black text-[var(--foreground)] w-8 text-center shrink-0">
                                                        {k.character}
                                                    </span>
                                                    <div className="min-w-0">
                                                        <span className="block truncate text-sm font-bold text-[var(--foreground)]">
                                                            {k.meaning}
                                                        </span>
                                                        <span className="block truncate text-xs text-gray-500">
                                                            {k.onyomi?.join(', ') || k.kunyomi?.join(', ') || '-'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <span className="shrink-0 rounded-lg border border-[var(--border-color)] bg-[var(--background)] px-2 py-0.5 text-[10px] font-bold text-accent-blue">
                                                    N{k.jlpt_level || 5}
                                                </span>
                                            </Link>
                                        );
                                    })
                                ) : (
                                    <p className="px-4 py-4 text-sm text-gray-500 text-center">
                                        Tidak ditemukan kanji untuk &quot;{debouncedQuery.trim()}&quot;. Tekan Enter untuk cari di N5.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </header>

                {/* Filter Radikal Panel (WAJIB Dipertahankan) */}
                <section aria-labelledby="radicals-heading" className="border-b border-[var(--border-color)] py-6 sm:py-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-accent-blue">Filter Radikal (部首)</p>
                            <h2 id="radicals-heading" className="text-lg sm:text-xl font-black text-[var(--foreground)]">
                                Cari Kanji Berdasarkan Bentuk & Radikal
                            </h2>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowAllRadicals(!showAllRadicals)}
                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] px-4 py-2 text-xs font-bold text-[var(--foreground)] transition hover:border-accent-blue/40 hover:text-accent-blue"
                        >
                            <span>{showAllRadicals ? 'Tutup Daftar Radikal' : 'Lihat 214 Radikal Lengkap'}</span>
                            <span className="text-xs">{showAllRadicals ? '▲' : '▼'}</span>
                        </button>
                    </div>

                    {/* Popular Radicals Chips */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                        <span className="text-xs font-bold text-gray-400 mr-1">Radikal Populer:</span>
                        {POPULAR_RADICALS.map((rad) => {
                            const info = getRadicalInfo(rad);
                            return (
                                <button
                                    key={rad}
                                    type="button"
                                    onClick={() => handleSelectRadical(rad)}
                                    title={`${info?.name || rad} (${info?.meaning || 'Radikal'})`}
                                    className="group inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] px-3 py-2 text-base font-japanese font-black text-[var(--foreground)] transition-all hover:-translate-y-0.5 hover:border-accent-blue hover:bg-accent-blue/10 hover:text-accent-blue"
                                >
                                    <span>{rad}</span>
                                    <span className="ml-1.5 hidden text-[10px] font-sans font-medium text-gray-400 group-hover:text-accent-blue sm:inline">
                                        {info?.name}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Extended 214 Kangxi Radicals Drawer */}
                    {showAllRadicals && (
                        <div className="mt-6 rounded-3xl border border-[var(--border-color)] bg-[var(--card-bg)] p-5 shadow-inner sm:p-6 animate-in fade-in zoom-in-95 duration-200">
                            <div className="mb-4 flex flex-wrap gap-2 border-b border-[var(--border-color)] pb-4">
                                <span className="self-center text-xs font-bold uppercase text-gray-400 mr-2">Jumlah Coretan:</span>
                                {RADICALS_BY_STROKES.map((group) => (
                                    <button
                                        key={String(group.strokes)}
                                        type="button"
                                        onClick={() => setSelectedStrokeTab(group.strokes)}
                                        className={`min-h-9 rounded-lg px-3 py-1 text-xs font-bold transition ${
                                            selectedStrokeTab === group.strokes
                                                ? 'bg-accent-blue text-white shadow-sm'
                                                : 'border border-[var(--border-color)] bg-[var(--background)] text-gray-600 dark:text-gray-300 hover:text-accent-blue'
                                        }`}
                                    >
                                        {group.strokes} {group.strokes === '7+' ? 'Coretan' : 'Garis'}
                                    </button>
                                ))}
                            </div>

                            {/* Radicals Grid for selected stroke count */}
                            {RADICALS_BY_STROKES.filter((g) => g.strokes === selectedStrokeTab).map((group) => (
                                <div key={String(group.strokes)} className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
                                    {group.radicals.map((r) => {
                                        const radDetail = getRadicalInfo(r.char);
                                        return (
                                            <button
                                                key={r.char}
                                                type="button"
                                                onClick={() => handleSelectRadical(r.char)}
                                                className="group flex flex-col items-center justify-center rounded-xl border border-[var(--border-color)] bg-[var(--background)] p-3 text-center transition hover:border-accent-blue hover:bg-accent-blue/10"
                                            >
                                                <span className="font-japanese text-2xl font-black text-[var(--foreground)] group-hover:text-accent-blue">
                                                    {r.char}
                                                </span>
                                                <span className="mt-1 line-clamp-1 text-[11px] font-bold text-gray-500 group-hover:text-foreground">
                                                    {radDetail?.name || r.name}
                                                </span>
                                                <span className="line-clamp-1 text-[9px] text-gray-400">
                                                    {radDetail?.meaning}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Level Roadmap N5 -> N1 (Mengikuti Pola Bunpo) */}
                <section aria-labelledby="kanji-roadmap-heading" className="pt-8 sm:pt-10">
                    <div className="mb-6 flex items-end justify-between gap-4">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-accent-blue">Peta Belajar Kanji</p>
                            <h2 id="kanji-roadmap-heading" className="mt-1 font-japanese text-2xl font-black text-[var(--foreground)] sm:text-3xl">
                                Pilih Level JLPT
                            </h2>
                        </div>
                        <span className="hidden text-sm text-gray-500 sm:block">Dari dasar sehari-hari sampai literatur mahir</span>
                    </div>

                    <ol className="relative space-y-4 before:absolute before:bottom-8 before:left-[1.4rem] before:top-8 before:w-px before:bg-[var(--border-color)] sm:space-y-5">
                        {KANJI_LEVELS.map((item, index) => {
                            const Icon = icons[item.icon];
                            const count = counts[item.level] ?? counts[item.number];
                            return (
                                <li key={item.level}>
                                    <Link
                                        href={`/kanji/${item.level}`}
                                        aria-label={`Lihat semua kanji level ${item.level.toUpperCase()}, ${item.title}`}
                                        className={`group relative flex min-h-40 items-start gap-4 rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-accent-blue/40 hover:shadow-lg sm:gap-6 sm:p-6 ${focusRing}`}
                                    >
                                        <span
                                            className={`relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[var(--border-color)] bg-[var(--background)] text-sm font-black ${item.accent}`}
                                            aria-hidden="true"
                                        >
                                            {sequence[index]}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                                <span className={`font-japanese text-2xl font-black ${item.accent}`}>
                                                    {item.level.toUpperCase()}
                                                </span>
                                                <h3 className="text-base font-bold text-[var(--foreground)] sm:text-lg">
                                                    {item.title}
                                                </h3>
                                                {item.beta && (
                                                    <span className="rounded-md border border-[var(--border-color)] bg-[var(--background)] px-2 py-0.5 text-[10px] font-bold text-gray-600 dark:text-gray-300">
                                                        🔒 Beta / Segera
                                                    </span>
                                                )}
                                            </div>
                                            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                                                {item.description}
                                            </p>
                                            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                                                <span className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-300">
                                                    <Icon aria-hidden="true" className={`h-4 w-4 ${item.accent}`} />
                                                    {count ? `${count} kanji siap dipelajari` : 'Jelajahi daftar kanji'}
                                                </span>
                                                <span className={`inline-flex items-center gap-1 text-sm font-bold ${item.accent}`}>
                                                    Buka Level {item.level.toUpperCase()}{' '}
                                                    <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform group-hover:translate-x-1" />
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
