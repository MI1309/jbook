'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getKanjiHref } from '@/lib/kanji-route';
import AboutSections from '@/components/home/hero';
import { useDebounce } from 'use-debounce';
import { getKanjiList, getGrammarList, getVocabList } from '@/lib/api';
import { 
    Search, 
    ArrowRight, 
    Gamepad2,
} from 'lucide-react';

const quickLinks = [
    { label: 'Kana', href: '/kana', className: 'border-[var(--border-color)] text-foreground hover:border-accent-blue hover:text-accent-blue' },
    { label: 'Kanji', href: '/kanji', className: 'border-accent-blue/40 text-accent-blue hover:bg-accent-blue/10', searchable: true },
    { label: 'Kotoba', href: '/kotoba', className: 'border-accent-green/40 text-accent-green hover:bg-accent-green/10', searchable: true },
    { label: 'Bunpo', href: '/bunpo', className: 'border-accent-gold/50 text-accent-gold hover:bg-accent-gold/10', searchable: true },
    { label: 'Latihan', href: '/practice', className: 'border-[var(--border-color)] text-foreground hover:border-accent-blue hover:text-accent-blue' },
    { label: 'TTS', href: '/tts', className: 'border-[var(--border-color)] text-foreground hover:border-accent-green hover:text-accent-green' },
];

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

export default function Home() {
    const router = useRouter();
    const searchRef = useRef(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery] = useDebounce(searchQuery, 400);
    const [searchResults, setSearchResults] = useState({ kanji: [], grammar: [], vocab: [] });
    const [isSearching, setIsSearching] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);

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

    const getQuickLinkHref = ({ href, searchable }) => {
        const query = searchQuery.trim();
        return searchable && query ? `${href}?search=${encodeURIComponent(query)}` : href;
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
                // Fetch in parallel
                const [kanjiRes, grammarRes, vocabRes] = await Promise.all([
                    getKanjiList({ search: debouncedQuery, limit: 3 }).catch(() => ({ items: [] })),
                    getGrammarList({ search: debouncedQuery, limit: 3 }).catch(() => ({ items: [] })),
                    getVocabList({ search: debouncedQuery, limit: 3 }).catch(() => ({ items: [] }))
                ]);

                setSearchResults({
                    kanji: kanjiRes?.items || [],
                    grammar: grammarRes?.items || [],
                    vocab: vocabRes?.items || []
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

    return (
        <div className="relative flex min-h-[calc(100svh-4rem)] w-full flex-col overflow-hidden bg-background pb-4 text-foreground transition-colors duration-300 xl:pb-8 washi-texture">
            
            {/* Side calligraphy elements - Cozy Japanese aesthetic */}
            <div className="hidden xl:flex flex-col absolute left-8 top-1/4 space-y-8 select-none text-[#212127]/20 dark:text-[#f2f2f7]/5 font-japanese text-3xl font-black tracking-widest pointer-events-none">
                <span style={{ writingMode: 'vertical-rl' }}>日本語辞典</span>
                <span className="text-xl">辞書</span>
            </div>
            <div className="hidden xl:flex flex-col absolute right-8 top-1/4 space-y-8 select-none text-[#212127]/20 dark:text-[#f2f2f7]/5 font-japanese text-3xl font-black tracking-widest pointer-events-none">
                <span style={{ writingMode: 'vertical-rl' }}>練習問題</span>
                <span className="text-xl">学習</span>
            </div>
            <div aria-hidden="true" className="pointer-events-none absolute left-2 top-[12%] z-0 hidden select-none font-japanese text-xl font-black text-[#212127]/10 dark:text-[#f2f2f7]/5 min-[360px]:block xl:hidden">
                <span style={{ writingMode: 'vertical-rl' }}>日本語辞典</span>
            </div>
            <div aria-hidden="true" className="pointer-events-none absolute bottom-5 right-2 z-0 hidden select-none font-japanese text-xl font-black text-[#212127]/10 dark:text-[#f2f2f7]/5 min-[400px]:block xl:hidden">
                <span style={{ writingMode: 'vertical-rl' }}>練習問題</span>
            </div>

            {/* Container */}
            <div className="container relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-4 pt-4 xl:justify-between xl:px-6 xl:pt-16">
                
                {/* HERO SECTION */}
                <header className="mb-5 flex w-full flex-col items-center space-y-3 text-center sm:space-y-4 xl:mb-8">
                    <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-color)] bg-[var(--card-bg)] px-4 py-1.5 text-xs font-bold uppercase text-accent-blue shadow-sm">
                        <span className="font-japanese text-base" aria-hidden="true">日本語辞典</span>
                        <span aria-hidden="true">·</span>
                        <span>辞書</span>
                    </div>

                    <h1 className="max-w-3xl text-3xl font-japanese font-black leading-tight text-foreground sm:text-4xl xl:text-5xl">
                        Kamus Jepang, Latihan,{' '}
                        <span className="text-accent-blue">dan Game TTS</span>
                    </h1>
    
                    <p className="max-w-2xl text-base font-medium leading-relaxed text-gray-600 dark:text-gray-300 sm:text-lg">
                        Dari Kana sampai N1. Kamus interaktif, latihan soal, game teka-teki silang Kanji &amp; kotoba, dan SRS flashcard untuk belajar bahasa Jepang dalam satu tempat.
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs text-gray-500" aria-label="Informasi layanan JBook">
                        <span>Kana Lengkap</span><span aria-hidden="true">·</span>
                        <span>N5–N3 Tersedia</span><span aria-hidden="true">·</span>
                        <span>Game TTS Interaktif</span><span aria-hidden="true">·</span>
                        <span>100% Gratis</span>
                    </div>

                    <div className="flex w-full flex-col justify-center gap-2 pt-1 sm:w-auto sm:flex-row sm:gap-3">
                        <Link
                            href="/practice"
                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-accent-blue px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-accent-blue/20 transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue"
                        >
                            Mulai Belajar <ArrowRight aria-hidden="true" className="h-4 w-4" />
                        </Link>
                        <Link
                            href="/tts"
                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] px-5 py-2.5 text-sm font-bold text-foreground transition hover:border-accent-green hover:text-accent-green focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-green"
                        >
                            <Gamepad2 aria-hidden="true" className="h-4 w-4" /> Main TTS
                        </Link>
                        <Link
                            href="/register"
                            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-accent-blue/40 px-5 py-2.5 text-sm font-bold text-accent-blue transition hover:bg-accent-blue/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue"
                        >
                            Daftar Gratis
                        </Link>
                    </div>

                    {/* SEARCH INTERACTIVE */}
                    <div
                        ref={searchRef}
                        className="relative mt-1 w-full min-w-0 max-w-xl"
                        onKeyDown={(event) => {
                            if (event.key === 'Escape') setShowSuggestions(false);
                        }}
                    >
                        <form onSubmit={handleSearchSubmit} role="search">
                            <div className="relative group">
                                <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-accent-blue transition-colors duration-200">
                                    <Search aria-hidden="true" className="w-5 h-5" />
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
                                    placeholder="Cari materi bahasa Jepang..."
                                    className="w-full min-w-0 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] py-3 pl-12 pr-16 text-sm text-foreground shadow-md transition-all duration-300 placeholder-gray-400 hover:shadow-lg focus-glow xl:text-base"
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearchQuery('');
                                            setSearchResults({ kanji: [], grammar: [], vocab: [] });
                                            setShowSuggestions(false);
                                        }}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500 transition-colors hover:text-accent-blue"
                                    >
                                        Batal
                                    </button>
                                )}
                            </div>
                        </form>

                        <nav aria-label="Jelajahi materi" className="mt-2 flex flex-wrap justify-center gap-2">
                            {quickLinks.map((item) => (
                                <Link
                                    key={item.label}
                                    href={getQuickLinkHref(item)}
                                    className={`rounded-full border px-3 py-1 text-xs font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue ${item.className}`}
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </nav>

                        {/* Search Suggestion Dropdown */}
                        {showSuggestions && searchQuery.trim() && (
                            <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-3 text-left shadow-2xl animate-[slide-up_0.2s_ease-out] sm:p-4">
                                <div className="flex justify-between items-center pb-3 border-b border-[var(--border-color)] mb-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
                                    <span>Hasil Pencarian</span>
                                    {isSearching && <span className="animate-pulse text-accent-blue">🏮 Menyaring...</span>}
                                </div>

                                <div role="listbox" aria-label="Saran pencarian" className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                                    {/* Kanji Results */}
                                    {searchResults.kanji.length > 0 && (
                                        <div>
                                            <h4 className="text-[10px] font-black uppercase text-accent-blue tracking-widest mb-2 font-japanese">漢字 Kanji</h4>
                                            <div className="grid grid-cols-1 gap-2">
                                                {searchResults.kanji.map((item) => (
                                                    <Link 
                                                        key={item.id} 
                                                        href={getKanjiHref(item)}
                                                        role="option"
                                                        className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-[var(--border-color)]"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-xl font-japanese font-bold text-accent-gold w-8 h-8 flex items-center justify-center bg-accent-gold/10 rounded-lg">{item.character}</span>
                                                            <div>
                                                                <div className="text-sm font-semibold"><HighlightMatch text={item.meaning} query={searchQuery.trim()} /></div>
                                                                <div className="text-[10px] text-gray-500 uppercase">Onyomi: {item.onyomi} | Kunyomi: {item.kunyomi}</div>
                                                            </div>
                                                        </div>
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-[var(--border-color)] text-gray-400 uppercase">N{item.jlpt_level || 'N5'}</span>
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Bunpo Results */}
                                    {searchResults.grammar.length > 0 && (
                                        <div>
                                            <h4 className="text-[10px] font-black uppercase text-accent-green tracking-widest mb-2 font-japanese">文法 Tata Bahasa</h4>
                                            <div className="grid grid-cols-1 gap-2">
                                                {searchResults.grammar.map((item) => (
                                                    <Link 
                                                        key={item.id} 
                                                        href={`/bunpo/${item.id}`}
                                                        role="option"
                                                        className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-[var(--border-color)]"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-base font-japanese font-bold text-accent-green w-8 h-8 flex items-center justify-center bg-accent-green/10 rounded-lg">文</span>
                                                            <div>
                                                                <div className="text-sm font-semibold"><HighlightMatch text={item.title} query={searchQuery.trim()} /></div>
                                                                <div className="text-[10px] text-gray-500 font-light truncate max-w-[280px]">{item.explanation}</div>
                                                            </div>
                                                        </div>
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-[var(--border-color)] text-gray-400 uppercase">N{item.jlpt_level || 'N4'}</span>
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Vocab Results */}
                                    {searchResults.vocab.length > 0 && (
                                        <div>
                                            <h4 className="text-[10px] font-black uppercase text-brand tracking-widest mb-2 font-japanese">語彙 Kotoba</h4>
                                            <div className="grid grid-cols-1 gap-2">
                                                {searchResults.vocab.map((item) => (
                                                    <Link 
                                                        key={item.id} 
                                                        href={`/kotoba/${item.id}`}
                                                        role="option"
                                                        className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-[var(--border-color)]"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-base font-japanese font-bold text-brand w-8 h-8 flex items-center justify-center bg-brand-light/20 rounded-lg">語</span>
                                                            <div>
                                                                <div className="text-sm font-semibold"><HighlightMatch text={item.word} query={searchQuery.trim()} /> ({item.reading})</div>
                                                                <div className="text-[10px] text-gray-500 font-light"><HighlightMatch text={item.meaning} query={searchQuery.trim()} /></div>
                                                            </div>
                                                        </div>
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-[var(--border-color)] text-gray-400 uppercase">N{item.jlpt_level || 'N4'}</span>
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {!isSearching && !hasResults && (
                                        <div className="text-center py-6 text-gray-400 text-xs">
                                            Tidak ditemukan materi untuk &quot;{searchQuery}&quot;
                                        </div>
                                    )}
                                </div>
                                
                                <div className="mt-4 pt-3 border-t border-[var(--border-color)] flex justify-end">
                                    <button
                                        type="button"
                                        onClick={() => setShowSuggestions(false)}
                                        className="text-xs font-bold text-accent-blue hover:underline"
                                    >
                                        Tutup Panel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </header>



                <aside className="mb-4 flex w-full flex-col gap-3 rounded-lg border border-accent-gold/30 bg-accent-gold/5 px-4 py-3 text-left sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                        <span className="font-japanese text-lg text-accent-gold" aria-hidden="true">漢字</span>
                        <div>
                            <p className="text-xs font-bold uppercase text-accent-gold">Materi populer</p>
                            <p className="text-sm font-semibold text-foreground">Mulai belajar dari materi N5</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Link href="/kanji?level=5" className="rounded-full border border-accent-blue/40 px-3 py-1 text-xs font-bold text-accent-blue transition hover:bg-accent-blue/10">Kanji N5</Link>
                        <Link href="/kotoba?level=5" className="rounded-full border border-accent-green/40 px-3 py-1 text-xs font-bold text-accent-green transition hover:bg-accent-green/10">Kosakata N5</Link>
                        <Link href="/bunpo?level=5" className="rounded-full border border-accent-gold/50 px-3 py-1 text-xs font-bold text-accent-gold transition hover:bg-accent-gold/10">Tata Bahasa N5</Link>
                    </div>
                </aside>

                <AboutSections />

            </div>
        </div>
    );
}
