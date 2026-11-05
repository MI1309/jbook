'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDebounce } from 'use-debounce';
import { Search, X, Filter } from 'lucide-react';
import KanjiCard from '@/components/kanji/KanjiCard';
import Pagination from '@/components/common/Pagination';
import { getKanjiList } from '@/lib/api';
import { POPULAR_RADICALS, RADICALS_BY_STROKES, getRadicalInfo } from '@/lib/radicals';

export default function KanjiLevelSearch({ levelConfig, initialData }) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const paramSearch = searchParams.get('search') || '';
    const paramRadical = searchParams.get('radical') || '';
    const paramPage = parseInt(searchParams.get('page'), 10) || 1;

    const [search, setSearch] = useState(paramSearch);
    const [debouncedSearch] = useDebounce(search, 400);
    const [radical, setRadical] = useState(paramRadical);
    const [data, setData] = useState(initialData || { items: [], total: 0, pages: 1, page: 1 });
    const [loading, setLoading] = useState(false);
    const [showRadicalModal, setShowAllRadicalsModal] = useState(false);
    const [selectedStrokeTab, setSelectedStrokeTab] = useState(1);

    const isFirstRender = useRef(true);

    const updateUrlParams = useCallback((newSearch, newRadical, newPage = 1) => {
        const params = new URLSearchParams();
        if (newSearch) params.set('search', newSearch);
        if (newRadical) params.set('radical', newRadical);
        if (newPage > 1) params.set('page', String(newPage));

        const query = params.toString();
        router.push(query ? `/kanji/${levelConfig.level}?${query}` : `/kanji/${levelConfig.level}`, { scroll: false });
    }, [levelConfig.level, router]);

    // Fetch data ketika filter / page berubah
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            // Jika searchParams awal kosong dan initialData sudah ada, tidak perlu fetch ulang
            if (!paramSearch && !paramRadical && paramPage === 1 && initialData?.items?.length) {
                return;
            }
        }

        async function fetchFilteredKanji() {
            setLoading(true);
            try {
                const res = await getKanjiList({
                    level: levelConfig.number,
                    search: debouncedSearch,
                    radical,
                    limit: 30,
                    page: paramPage,
                });
                setData(res || { items: [], total: 0, pages: 1, page: 1 });
            } catch (err) {
                console.error('[KanjiLevelSearch] Failed to fetch kanji list:', err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchFilteredKanji();
    }, [levelConfig.number, debouncedSearch, radical, paramPage, initialData, paramSearch, paramRadical]);

    // Sinkronkan debouncedSearch dengan URL
    useEffect(() => {
        if (debouncedSearch !== paramSearch) {
            updateUrlParams(debouncedSearch, radical, 1);
        }
    }, [debouncedSearch, paramSearch, radical, updateUrlParams]);

    const handleSelectRadical = (rad) => {
        const nextRad = radical === rad ? '' : rad;
        setRadical(nextRad);
        updateUrlParams(debouncedSearch, nextRad, 1);
        setShowAllRadicalsModal(false);
    };

    const handleClearRadical = () => {
        setRadical('');
        updateUrlParams(debouncedSearch, '', 1);
    };

    const handlePageChange = (targetPage) => {
        updateUrlParams(debouncedSearch, radical, targetPage);
    };

    const totalCount = data.total || 0;
    const kanjiList = data.items || [];
    const totalPages = data.pages || 1;
    const currentPage = data.page || paramPage;

    return (
        <div className="min-w-0">
            {/* Header: Dua Kolom di lg (Kiri Judul Level, Kanan Search Box) */}
            <header className="grid gap-6 border-b border-[var(--border-color)] pb-6 sm:pb-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)] lg:items-center lg:gap-10">
                <div className="min-w-0">
                    <span className={`inline-flex rounded-full border border-[var(--border-color)] bg-[var(--card-bg)] px-3 py-1 text-xs font-bold ${levelConfig.accent}`}>
                        {levelConfig.level.toUpperCase()} · 漢字
                    </span>
                    <h1 className="mt-3 break-words font-japanese text-2xl font-black leading-tight sm:text-3xl lg:text-4xl text-[var(--foreground)]">
                        漢字 Kanji {levelConfig.level.toUpperCase()}
                    </h1>
                    <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-gray-600 dark:text-gray-300 sm:text-base">
                        <span className="font-bold text-[var(--foreground)]">{levelConfig.title}.</span> {levelConfig.description}
                    </p>
                    <p className="mt-3 text-xs sm:text-sm text-gray-500 font-medium">
                        {totalCount} kanji · JLPT {levelConfig.level.toUpperCase()}
                        {radical && <span> • Filter radikal: <span className="font-bold font-japanese text-[var(--foreground)]">{radical}</span></span>}
                        {search && <span> • Kata kunci: &quot;{search}&quot;</span>}
                    </p>
                </div>

                {/* Kolom Kanan: Input Pencarian Kanji (WAJIB) */}
                <div className="relative w-full min-w-0">
                    <label htmlFor="kanji-level-search" className="sr-only">
                        Cari kanji {levelConfig.level.toUpperCase()}
                    </label>
                    <div className="group relative">
                        <Search
                            aria-hidden="true"
                            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-accent-blue"
                        />
                        <input
                            id="kanji-level-search"
                            type="search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={`Cari kanji di ${levelConfig.level.toUpperCase()} (arti, romaji, kanji)...`}
                            className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] py-3 pl-12 pr-12 text-sm text-[var(--foreground)] shadow-sm transition hover:border-accent-blue/40 focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/30 sm:text-base"
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearch('');
                                    updateUrlParams('', radical, 1);
                                }}
                                aria-label="Hapus pencarian"
                                className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 hover:text-[var(--foreground)]"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* Filter Radikal Panel Terpisah di Bawah Header */}
            <div className="border-b border-[var(--border-color)] py-4 sm:py-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider">
                            <Filter className="h-3.5 w-3.5 text-accent-blue" />
                            Radikal:
                        </span>

                        {/* Tombol 'Semua' */}
                        <button
                            type="button"
                            onClick={handleClearRadical}
                            className={`min-h-9 rounded-xl px-3 py-1 text-xs font-bold transition ${
                                !radical
                                    ? 'bg-accent-blue text-white shadow-sm'
                                    : 'border border-[var(--border-color)] bg-[var(--card-bg)] text-gray-600 dark:text-gray-300 hover:border-accent-blue/40'
                            }`}
                        >
                            Semua
                        </button>

                        {/* Jika ada radikal aktif yang terpilih */}
                        {radical && (
                            <div className="inline-flex items-center gap-1.5 rounded-xl border border-accent-blue bg-accent-blue/15 px-3 py-1 text-xs font-bold text-accent-blue">
                                <span className="font-japanese text-sm">{radical}</span>
                                <span className="text-[10px] text-gray-500">({getRadicalInfo(radical)?.name || 'Radikal'})</span>
                                <button
                                    type="button"
                                    onClick={handleClearRadical}
                                    title="Hapus filter radikal"
                                    className="ml-1 rounded-full p-0.5 hover:bg-accent-blue/20"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        )}

                        {/* Quick Popular Radicals */}
                        <div className="hidden sm:flex items-center gap-1.5 overflow-x-auto py-1">
                            {POPULAR_RADICALS.slice(0, 10).map((rad) => {
                                const isSelected = radical === rad;
                                return (
                                    <button
                                        key={rad}
                                        type="button"
                                        onClick={() => handleSelectRadical(rad)}
                                        className={`min-h-9 rounded-xl border px-2.5 py-1 font-japanese text-sm font-bold transition ${
                                            isSelected
                                                ? 'border-accent-blue bg-accent-blue text-white'
                                                : 'border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--foreground)] hover:border-accent-blue/40 hover:text-accent-blue'
                                        }`}
                                    >
                                        {rad}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => setShowAllRadicalsModal(!showRadicalModal)}
                        className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] px-3 py-1.5 text-xs font-bold text-[var(--foreground)] transition hover:border-accent-blue/40 hover:text-accent-blue"
                    >
                        <span>Pilih Radikal Lengkap</span>
                        <span className="text-[10px]">{showRadicalModal ? '▲' : '▼'}</span>
                    </button>
                </div>

                {/* Radikal Picker Drawer / Dropdown */}
                {showRadicalModal && (
                    <div className="mt-4 rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4 shadow-xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="mb-3 flex flex-wrap gap-1.5 border-b border-[var(--border-color)] pb-3">
                            <span className="self-center text-xs font-bold text-gray-400 mr-2">Coretan:</span>
                            {RADICALS_BY_STROKES.map((g) => (
                                <button
                                    key={String(g.strokes)}
                                    type="button"
                                    onClick={() => setSelectedStrokeTab(g.strokes)}
                                    className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                                        selectedStrokeTab === g.strokes
                                            ? 'bg-accent-blue text-white'
                                            : 'border border-[var(--border-color)] bg-[var(--background)] text-gray-500 hover:text-[var(--foreground)]'
                                    }`}
                                >
                                    {g.strokes}
                                </button>
                            ))}
                        </div>

                        {RADICALS_BY_STROKES.filter((g) => g.strokes === selectedStrokeTab).map((g) => (
                            <div key={String(g.strokes)} className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                                {g.radicals.map((r) => {
                                    const isSelected = radical === r.char;
                                    return (
                                        <button
                                            key={r.char}
                                            type="button"
                                            onClick={() => handleSelectRadical(r.char)}
                                            className={`flex flex-col items-center justify-center rounded-xl p-2 text-center transition ${
                                                isSelected
                                                    ? 'bg-accent-blue text-white shadow-md'
                                                    : 'border border-[var(--border-color)] bg-[var(--background)] hover:border-accent-blue hover:bg-accent-blue/10 text-[var(--foreground)]'
                                            }`}
                                        >
                                            <span className="font-japanese text-xl font-black">{r.char}</span>
                                            <span className="mt-0.5 line-clamp-1 text-[9px] font-bold opacity-80">{r.name}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Hasil Pencarian & Grid Kartu Kanji */}
            <div className="py-6 sm:py-8">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <div className="text-5xl font-japanese animate-bounce mb-3 text-accent-blue">漢</div>
                        <p className="text-xs uppercase font-bold tracking-widest animate-pulse">Memuat kanji...</p>
                    </div>
                ) : kanjiList.length > 0 ? (
                    <>
                        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {kanjiList.map((k) => (
                                <KanjiCard
                                    key={k.id}
                                    id={k.id}
                                    character={k.character}
                                    meaning={k.meaning}
                                    onyomi={k.onyomi}
                                    kunyomi={k.kunyomi}
                                    level={k.jlpt_level || levelConfig.number}
                                    radical={k.radical}
                                    strokes={k.strokes}
                                />
                            ))}
                        </div>

                        {totalPages > 1 && (
                            <div className="mt-10">
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={handlePageChange}
                                />
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-16 sm:py-20 bg-[var(--card-bg)] rounded-3xl border-2 border-dashed border-[var(--border-color)] p-6">
                        <div className="text-5xl mb-4 opacity-40">🔍</div>
                        <h2 className="text-lg sm:text-xl font-black text-[var(--foreground)] mb-2">
                            Kanji Tidak Ditemukan
                        </h2>
                        <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto mb-6">
                            Tidak ditemukan kanji di level {levelConfig.level.toUpperCase()}
                            {radical ? ` dengan radikal "${radical}"` : ''}
                            {search ? ` dan kata kunci "${search}"` : ''}.
                        </p>
                        <button
                            type="button"
                            onClick={() => {
                                setSearch('');
                                setRadical('');
                                updateUrlParams('', '', 1);
                            }}
                            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-accent-blue px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-accent-blue/90"
                        >
                            Reset Semua Filter
                        </button>
                    </div>
                )}
            </div>

            {/* Link Kembali ke Landing Kanji */}
            <div className="border-t border-[var(--border-color)] pt-6">
                <Link
                    href="/kanji"
                    className="inline-flex min-h-11 items-center gap-2 font-semibold text-accent-blue underline underline-offset-4 hover:text-accent-blue/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue"
                >
                    ← Kembali ke semua level Kanji
                </Link>
            </div>
        </div>
    );
}
