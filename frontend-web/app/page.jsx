'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getKanjiHref } from '@/lib/kanji-route';
import AboutSections, { learners } from '@/components/home/hero';
import { useDebounce } from 'use-debounce';
import { getKanjiList, getGrammarList, getVocabList } from '@/lib/api';
import { Search, ArrowRight, Brain, Gamepad2, ChartNoAxesCombined, CalendarDays } from 'lucide-react';

// Materi inti, urut dari dasar ke lanjut
const materials = [
    {
        glyph: 'かな',
        title: 'Kana',
        description: 'Hiragana dan Katakana lewat tabel huruf interaktif.',
        href: '/kana',
        tone: 'red',
        levels: false,
    },
    {
        glyph: '漢字',
        title: 'Kanji',
        description: 'Arti, bacaan, dan contoh dengan penjelasan bahasa Indonesia.',
        href: '/kanji',
        tone: 'blue',
        levels: true,
    },
    {
        glyph: '語彙',
        title: 'Kotoba',
        description: 'Kosakata Jepang lengkap dengan bacaan dan maknanya.',
        href: '/kotoba',
        tone: 'green',
        levels: true,
    },
    {
        glyph: '文法',
        title: 'Bunpo',
        description: 'Pola tata bahasa beserta contoh penggunaannya.',
        href: '/bunpo',
        tone: 'gold',
        levels: true,
    },
];

const tools = [
    { icon: Brain, title: 'Latihan soal', description: 'Uji Kanji, kosakata, tata bahasa', href: '/practice' },
    { icon: Gamepad2, title: 'Game TTS', description: 'Teka-teki silang kosakata', href: '/tts' },
    { icon: ChartNoAxesCombined, title: 'Dashboard', description: 'Pantau progres belajarmu', href: '/dashboard' },
];

const beginnerSteps = [
    {
        step: 1,
        title: 'Kana',
        description: 'Kenali Hiragana & Katakana.',
        href: '/kana',
        badgeClass: 'bg-accent-blue/10 text-accent-blue',
        hoverBorder: 'hover:border-accent-blue/50',
    },
    {
        step: 2,
        title: 'Kotoba Dasar',
        description: 'Hafalkan kata sehari-hari.',
        href: '/kotoba',
        badgeClass: 'bg-accent-green/10 text-accent-green',
        hoverBorder: 'hover:border-accent-green/50',
    },
    {
        step: 3,
        title: 'Bunpo Dasar',
        description: 'Pahami pola kalimat dasar.',
        href: '/bunpo',
        badgeClass: 'bg-accent-gold/10 text-accent-gold',
        hoverBorder: 'hover:border-accent-gold/50',
    },
    {
        step: 4,
        title: 'Latihan',
        description: 'Uji pemahaman dengan soal.',
        href: '/practice',
        badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
        hoverBorder: 'hover:border-rose-500/50',
    },
];

const levels = [5, 4, 3];

const toneClasses = {
    blue: 'bg-accent-blue/10 text-accent-blue',
    green: 'bg-accent-green/10 text-accent-green',
    gold: 'bg-accent-gold/10 text-accent-gold',
    red: 'bg-red-500/10 text-red-600 dark:text-red-400',
};

const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue';

const levelLabel = (level) => `N${level || 5}`;

function HighlightMatch({ text, query }) {
    const value = String(text ?? '');
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = value.split(new RegExp(`(${escapedQuery})`, 'ig'));

    return parts.map((part, index) => (
        part.toLocaleLowerCase() === query.toLocaleLowerCase()
            ? <mark key={index} className="bg-accent-gold/30 text-inherit">{part}</mark>
            : <span key={index}>{part}</span>
    ));
}

function ResultGroup({ title, titleClass, children }) {
    return (
        <div>
            <h4 className={`mb-2 font-japanese text-xs font-black ${titleClass}`}>{title}</h4>
            <div className="grid grid-cols-1 gap-1">{children}</div>
        </div>
    );
}

const resultRow = 'flex items-center justify-between gap-3 rounded-lg border border-transparent p-2 transition-colors hover:border-[var(--border-color)] hover:bg-accent-blue/5';
const levelBadge = 'shrink-0 rounded border border-[var(--border-color)] px-2 py-0.5 text-[10px] font-bold text-gray-500';

function getNextJlptInfo(currentDate = new Date()) {
    const year = currentDate.getFullYear();
    const getFirstSunday = (y, m) => {
        const firstDay = new Date(y, m, 1);
        const dayOfWeek = firstDay.getDay();
        const offset = (7 - dayOfWeek) % 7;
        return new Date(y, m, 1 + offset, 23, 59, 59);
    };

    const julyExam = getFirstSunday(year, 6);
    const decExam = getFirstSunday(year, 11);

    let targetExam;
    let periodName;

    if (currentDate <= julyExam) {
        targetExam = julyExam;
        periodName = `Juli ${year}`;
    } else if (currentDate <= decExam) {
        targetExam = decExam;
        periodName = `Desember ${year}`;
    } else {
        targetExam = getFirstSunday(year + 1, 6);
        periodName = `Juli ${year + 1}`;
    }

    const msPerDay = 1000 * 60 * 60 * 24;
    const startOfToday = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
    const startOfExam = new Date(targetExam.getFullYear(), targetExam.getMonth(), targetExam.getDate());
    const diffMs = startOfExam.getTime() - startOfToday.getTime();
    const daysLeft = Math.max(0, Math.ceil(diffMs / msPerDay));

    const monthsIndo = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const daysIndo = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

    const dayName = daysIndo[targetExam.getDay()];
    const dateNum = targetExam.getDate();
    const monthName = monthsIndo[targetExam.getMonth()];
    const examYear = targetExam.getFullYear();

    return {
        period: periodName,
        daysLeft,
        formattedDate: `${dayName}, ${dateNum} ${monthName} ${examYear}`,
        shortDate: `${dateNum} ${monthName.slice(0, 3)} ${examYear}`,
    };
}

export default function Home() {
    const router = useRouter();
    const searchRef = useRef(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery] = useDebounce(searchQuery, 400);
    const [searchResults, setSearchResults] = useState({ kanji: [], grammar: [], vocab: [] });
    const [isSearching, setIsSearching] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [jlptInfo, setJlptInfo] = useState(() => getNextJlptInfo());

    useEffect(() => {
        setJlptInfo(getNextJlptInfo());
    }, []);

    useEffect(() => {
        const handleOutsideMouseDown = (event) => {
            if (!searchRef.current?.contains(event.target)) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleOutsideMouseDown);
        return () => document.removeEventListener('mousedown', handleOutsideMouseDown);
    }, []);

    const handleSearchSubmit = (event) => {
        event.preventDefault();
        const query = searchQuery.trim();
        if (!query) return;
        router.push(`/kanji?search=${encodeURIComponent(query)}`);
    };

    // Dynamic search suggestions
    useEffect(() => {
        if (!debouncedQuery.trim()) {
            setSearchResults({ kanji: [], grammar: [], vocab: [] });
            setIsSearching(false);
            return;
        }

        async function performSearch() {
            setIsSearching(true);
            try {
                const [kanjiRes, grammarRes, vocabRes] = await Promise.all([
                    getKanjiList({ search: debouncedQuery, limit: 3 }).catch(() => ({ items: [] })),
                    getGrammarList({ search: debouncedQuery, limit: 3 }).catch(() => ({ items: [] })),
                    getVocabList({ search: debouncedQuery, limit: 3 }).catch(() => ({ items: [] })),
                ]);

                setSearchResults({
                    kanji: kanjiRes?.items || [],
                    grammar: grammarRes?.items || [],
                    vocab: vocabRes?.items || [],
                });
            } catch (error) {
                console.error('Error fetching suggestions:', error);
            } finally {
                setIsSearching(false);
            }
        }

        performSearch();
    }, [debouncedQuery]);

    const hasResults = searchResults.kanji.length > 0 || searchResults.grammar.length > 0 || searchResults.vocab.length > 0;
    const trimmedQuery = searchQuery.trim();

    return (
        <div className="washi-texture relative flex w-full flex-col overflow-hidden bg-background pb-8 text-foreground transition-colors duration-300">
            <div className="container relative z-10 mx-auto w-full max-w-6xl px-4 xl:px-6">

                {/* HERO */}
                <header className="grid items-start gap-8 pb-10 pt-8 sm:pt-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 lg:pt-16">

                    {/* Kiri: pesan utama + pencarian */}
                    <div className="min-w-0 text-left">
                        <div className="flex flex-wrap items-center gap-2">
                            <p className="font-japanese text-sm font-bold text-accent-blue" lang="ja">日本語辞典</p>
                            <span className="text-gray-300 dark:text-gray-700" aria-hidden="true">•</span>
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent-gold/40 bg-accent-gold/10 px-2.5 py-0.5 text-xs font-semibold text-accent-gold">
                                <span className="relative flex h-2 w-2">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-gold opacity-75"></span>
                                    <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-gold"></span>
                                </span>
                                <span suppressHydrationWarning>JLPT {jlptInfo.period}: {jlptInfo.daysLeft} hari lagi</span>
                            </span>
                        </div>
                        <h1 className="mt-3 max-w-xl font-japanese text-3xl font-black leading-tight sm:text-4xl xl:text-5xl">
                            Belajar bahasa Jepang. semua materi di satu tempat
                        </h1>
                        <p className="mt-4 max-w-xl text-base leading-relaxed text-gray-600 dark:text-gray-300">
                            Kamus Kanji, kosakata, dan tata bahasa dengan penjelasan bahasa Indonesia, lengkap dengan latihan soal dan game TTS. Gratis, dari Kana sampai level N3.
                        </p>

                        {/* Pencarian */}
                        <div
                            ref={searchRef}
                            className="relative mt-6 w-full max-w-xl"
                            onKeyDown={(event) => {
                                if (event.key === 'Escape') setShowSuggestions(false);
                            }}
                        >
                            <form onSubmit={handleSearchSubmit} role="search">
                                <div className="group relative">
                                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 transition-colors duration-200 group-focus-within:text-accent-blue">
                                        <Search aria-hidden="true" className="h-5 w-5" />
                                    </span>
                                    <input
                                        type="search"
                                        value={searchQuery}
                                        onChange={(e) => {
                                            setSearchQuery(e.target.value);
                                            setShowSuggestions(true);
                                        }}
                                        onFocus={() => setShowSuggestions(true)}
                                        aria-label="Cari materi bahasa Jepang"
                                        placeholder="Cari kanji, kata, atau pola tata bahasa"
                                        className="focus-glow w-full min-w-0 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] py-3.5 pl-12 pr-20 text-sm text-foreground shadow-md transition-all duration-300 placeholder-gray-400 hover:shadow-lg sm:text-base"
                                    />
                                    {searchQuery && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSearchQuery('');
                                                setSearchResults({ kanji: [], grammar: [], vocab: [] });
                                                setShowSuggestions(false);
                                            }}
                                            className={`absolute right-4 top-1/2 -translate-y-1/2 rounded text-xs font-bold text-gray-500 transition-colors hover:text-accent-blue ${focusRing}`}
                                        >
                                            Hapus
                                        </button>
                                    )}
                                </div>

                            </form>

                            {/* Saran pencarian */}
                            {showSuggestions && trimmedQuery && (
                                <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-3 text-left shadow-2xl animate-[slide-up_0.2s_ease-out] sm:p-4">
                                    <div className="mb-3 flex items-center justify-between border-b border-[var(--border-color)] pb-3 text-xs font-bold text-gray-500">
                                        <span>Hasil pencarian</span>
                                        {isSearching && <span className="animate-pulse text-accent-blue" role="status">Mencari...</span>}
                                    </div>

                                    <div role="listbox" aria-label="Saran pencarian" className="max-h-[350px] space-y-4 overflow-y-auto pr-1">
                                        {searchResults.kanji.length > 0 && (
                                            <ResultGroup title="漢字 Kanji" titleClass="text-accent-blue">
                                                {searchResults.kanji.map((item) => (
                                                    <Link key={item.id} href={getKanjiHref(item)} role="option" className={resultRow}>
                                                        <div className="flex min-w-0 items-center gap-3">
                                                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-gold/10 font-japanese text-xl font-bold text-accent-gold">{item.character}</span>
                                                            <div className="min-w-0">
                                                                <div className="truncate text-sm font-semibold"><HighlightMatch text={item.meaning} query={trimmedQuery} /></div>
                                                                <div className="truncate text-xs text-gray-500">Onyomi: {item.onyomi} | Kunyomi: {item.kunyomi}</div>
                                                            </div>
                                                        </div>
                                                        <span className={levelBadge}>{levelLabel(item.jlpt_level)}</span>
                                                    </Link>
                                                ))}
                                            </ResultGroup>
                                        )}

                                        {searchResults.vocab.length > 0 && (
                                            <ResultGroup title="語彙 Kotoba" titleClass="text-accent-green">
                                                {searchResults.vocab.map((item) => (
                                                    <Link key={item.id} href={`/kotoba/${item.id}`} role="option" className={resultRow}>
                                                        <div className="flex min-w-0 items-center gap-3">
                                                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-green/10 font-japanese text-base font-bold text-accent-green">語</span>
                                                            <div className="min-w-0">
                                                                <div className="truncate text-sm font-semibold"><HighlightMatch text={item.word} query={trimmedQuery} /> ({item.reading})</div>
                                                                <div className="truncate text-xs text-gray-500"><HighlightMatch text={item.meaning} query={trimmedQuery} /></div>
                                                            </div>
                                                        </div>
                                                        <span className={levelBadge}>{levelLabel(item.jlpt_level)}</span>
                                                    </Link>
                                                ))}
                                            </ResultGroup>
                                        )}

                                        {searchResults.grammar.length > 0 && (
                                            <ResultGroup title="文法 Tata Bahasa" titleClass="text-accent-gold">
                                                {searchResults.grammar.map((item) => (
                                                    <Link key={item.id} href={`/bunpo/${item.id}`} role="option" className={resultRow}>
                                                        <div className="flex min-w-0 items-center gap-3">
                                                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-gold/10 font-japanese text-base font-bold text-accent-gold">文</span>
                                                            <div className="min-w-0">
                                                                <div className="truncate text-sm font-semibold"><HighlightMatch text={item.title} query={trimmedQuery} /></div>
                                                                <div className="max-w-[280px] truncate text-xs text-gray-500">{item.explanation}</div>
                                                            </div>
                                                        </div>
                                                        <span className={levelBadge}>{levelLabel(item.jlpt_level)}</span>
                                                    </Link>
                                                ))}
                                            </ResultGroup>
                                        )}

                                        {!isSearching && !hasResults && (
                                            <div className="py-6 text-center text-xs text-gray-500">
                                                Tidak ditemukan materi untuk &quot;{searchQuery}&quot;
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-3 flex items-center justify-between border-t border-[var(--border-color)] pt-3">
                                        <Link
                                            href={`/kanji?search=${encodeURIComponent(trimmedQuery)}`}
                                            className={`rounded text-xs font-bold text-accent-blue hover:underline ${focusRing}`}
                                        >
                                            Lihat semua hasil Kanji
                                        </Link>
                                        <button
                                            type="button"
                                            onClick={() => setShowSuggestions(false)}
                                            className={`rounded text-xs font-bold text-gray-500 hover:text-accent-blue ${focusRing}`}
                                        >
                                            Tutup
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* CTA: satu utama, satu pendukung */}
                        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
                            <Link
                                href="/practice"
                                className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-accent-blue px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-accent-blue/20 transition hover:brightness-110 ${focusRing}`}
                            >
                                Mulai latihan <ArrowRight aria-hidden="true" className="h-4 w-4" />
                            </Link>
                            <Link
                                href="/register"
                                className={`inline-flex min-h-11 items-center justify-center rounded-lg px-2 text-sm font-bold text-accent-blue underline-offset-4 hover:underline ${focusRing}`}
                            >
                                Daftar gratis untuk simpan progres
                            </Link>
                        </div>

                        {/* Hitung Mundur JLPT */}
                        <div className="mt-6 max-w-xl rounded-xl border border-accent-gold/30 bg-accent-gold/5 p-4 transition-colors hover:border-accent-gold/50">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-gold/15 text-accent-gold shadow-sm">
                                        <CalendarDays aria-hidden="true" className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold uppercase tracking-wider text-accent-gold">Hitung Mundur JLPT</span>
                                            <span className="rounded-full bg-accent-gold/20 px-2 py-0.5 text-[10px] font-bold text-accent-gold">
                                                {jlptInfo.period}
                                            </span>
                                        </div>
                                        <p className="mt-0.5 text-xs text-gray-600 dark:text-gray-400" suppressHydrationWarning>
                                            {jlptInfo.formattedDate}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between border-t border-accent-gold/20 pt-2 sm:border-t-0 sm:pt-0 sm:flex-col sm:items-end sm:justify-center">
                                    <div className="font-japanese text-xl font-black text-foreground sm:text-2xl" suppressHydrationWarning>
                                        {jlptInfo.daysLeft === 0 ? (
                                            <span className="text-accent-gold">Hari ini!</span>
                                        ) : (
                                            <>
                                                {jlptInfo.daysLeft} <span className="text-xs font-semibold text-gray-500">hari lagi</span>
                                            </>
                                        )}
                                    </div>
                                    <Link
                                        href="/practice"
                                        className={`inline-flex items-center gap-1 text-xs font-bold text-accent-blue transition hover:underline ${focusRing}`}
                                    >
                                        Siapkan latihan <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Kanan: materi tertata */}
                    <div className="min-w-0">
                        <h2 className="mb-3 font-japanese text-lg font-black">Pilih materi</h2>
                        <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2">
                            {materials.map(({ glyph, title, description, href, tone, levels: hasLevels }) => (
                                <article
                                    key={title}
                                    className="flex flex-col rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4"
                                >
                                    <Link href={href} className={`group rounded-md ${focusRing}`}>
                                        <span className={`inline-flex h-12 min-w-12 items-center justify-center rounded-lg px-2 font-japanese text-2xl font-black ${toneClasses[tone]}`} aria-hidden="true">
                                            {glyph}
                                        </span>
                                        <h3 className="mt-3 text-base font-bold group-hover:underline">{title}</h3>
                                        <p className="mt-1 text-sm leading-relaxed text-gray-600 dark:text-gray-400">{description}</p>
                                    </Link>

                                    <div className="mt-auto flex flex-wrap gap-1.5 pt-3">
                                        {hasLevels ? (
                                            levels.map((level) => (
                                                <Link
                                                    key={level}
                                                    href={`${href}?level=${level}`}
                                                    aria-label={`${title} level N${level}`}
                                                    className={`rounded-full border border-[var(--border-color)] px-2.5 py-0.5 text-xs font-bold transition-colors hover:border-accent-blue hover:text-accent-blue ${focusRing}`}
                                                >
                                                    N{level}
                                                </Link>
                                            ))
                                        ) : (
                                            <Link
                                                href={href}
                                                className={`rounded-full border border-[var(--border-color)] px-2.5 py-0.5 text-xs font-bold transition-colors hover:border-accent-blue hover:text-accent-blue ${focusRing}`}
                                            >
                                                Mulai dari sini
                                            </Link>
                                        )}
                                    </div>
                                </article>
                            ))}
                        </div>

                        {/* Alat belajar */}
                        <h2 className="mb-3 mt-6 font-japanese text-lg font-black">Latihan dan pantau</h2>
                        <ul className="grid grid-cols-1 gap-2 min-[480px]:grid-cols-3">
                            {tools.map(({ icon: Icon, title, description, href }) => (
                                <li key={title}>
                                    <Link
                                        href={href}
                                        className={`flex h-full items-start gap-3 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] p-3 transition-colors hover:border-accent-blue min-[480px]:flex-col ${focusRing}`}
                                    >
                                        <Icon aria-hidden="true" className="h-5 w-5 shrink-0 text-accent-blue" />
                                        <span>
                                            <span className="block text-sm font-bold">{title}</span>
                                            <span className="mt-0.5 block text-xs leading-snug text-gray-600 dark:text-gray-400">{description}</span>
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </header>

                {/* Untuk siapa: bukan urutan, jadi tanpa penomoran */}
                      <section aria-labelledby="audience-title" className="border-t border-[var(--border-color)] pt-8">
                        <h2 id="audience-title" className="mb-5 font-japanese text-2xl font-black sm:text-3xl">Untuk Siapa JBook?</h2>
                        <div className="grid gap-4 md:grid-cols-3">
                          {learners.map(({ icon: Icon, title, description }) => (
                            <article key={title} className="flex gap-4 border-t-2 border-accent-blue/30 py-4">
                              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-blue/10 text-accent-blue">
                                <Icon aria-hidden="true" className="h-5 w-5" />
                              </span>
                              <div>
                                <h3 className="text-base font-bold">{title}</h3>
                                <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">{description}</p>
                              </div>
                            </article>
                          ))}
                        </div>
                      </section>

                {/* Section Mulai Belajar dari Nol */}
                <section aria-labelledby="start-from-zero" className="mb-5 w-full">
                    <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-5 sm:p-6">
                        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-accent-blue">Untuk Pemula</p>
                                <h2 id="start-from-zero" className="text-lg font-bold text-foreground sm:text-xl">
                                    Belum pernah belajar bahasa Jepang? Mulai dari Nol
                                </h2>
                            </div>
                            <Link
                                href="/kana"
                                className={`inline-flex items-center gap-1 text-xs font-bold text-accent-blue transition hover:underline ${focusRing}`}
                            >
                                Mulai dari Kana →
                            </Link>
                        </div>
                        <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            {beginnerSteps.map(({ step, title, description, href, badgeClass, hoverBorder }) => (
                                <li key={step}>
                                    <Link
                                        href={href}
                                        className={`group flex h-full flex-col justify-between rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm ${hoverBorder} ${focusRing}`}
                                    >
                                        <div>
                                            <div className="flex items-center justify-between">
                                                <span
                                                    aria-hidden="true"
                                                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-black ${badgeClass}`}
                                                >
                                                    {step}
                                                </span>
                                                <ArrowRight
                                                    aria-hidden="true"
                                                    className="h-3.5 w-3.5 text-gray-400 transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
                                                />
                                            </div>
                                            <h3 className="mt-3 text-sm font-bold text-foreground group-hover:underline">
                                                {title}
                                            </h3>
                                            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                                                {description}
                                            </p>
                                        </div>
                                    </Link>
                                </li>
                            ))}
                        </ol>
                    </div>
                </section>

                <AboutSections />
            </div>
        </div>
    );
}