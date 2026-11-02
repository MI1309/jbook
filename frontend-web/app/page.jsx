'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getKanjiHref } from '@/lib/kanji-route';
import { useDebounce } from 'use-debounce';
import { getKanjiList, getGrammarList, getVocabList } from '@/lib/api';
import { 
    Search, 
    ArrowRight, 
    BookOpen,
    Brain,
    Gamepad2,
    Languages,
} from 'lucide-react';

export default function Home() {
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery] = useDebounce(searchQuery, 400);
    const [searchResults, setSearchResults] = useState({ kanji: [], grammar: [], vocab: [] });
    const [isSearching, setIsSearching] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);

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
                <span className="writing-vertical">日本語辞典</span>
                <span className="text-xl">辞書</span>
            </div>
            <div className="hidden xl:flex flex-col absolute right-8 top-1/4 space-y-8 select-none text-[#212127]/20 dark:text-[#f2f2f7]/5 font-japanese text-3xl font-black tracking-widest pointer-events-none">
                <span className="writing-vertical">練習問題</span>
                <span className="text-xl">学習</span>
            </div>
            <div aria-hidden="true" className="pointer-events-none absolute left-2 top-[12%] z-0 select-none font-japanese text-xl font-black text-[#212127]/20 dark:text-[#f2f2f7]/5 xl:hidden">
                <span className="writing-vertical">日本語辞典</span>
            </div>
            <div aria-hidden="true" className="pointer-events-none absolute bottom-5 right-2 z-0 select-none font-japanese text-xl font-black text-[#212127]/20 dark:text-[#f2f2f7]/5 xl:hidden">
                <span className="writing-vertical">練習問題</span>
            </div>

            {/* Container */}
            <div className="container relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-4 pt-4 xl:justify-between xl:px-6 xl:pt-16">
                
                {/* HERO SECTION */}
                <header className="mb-8 flex w-full flex-col items-center space-y-5 text-center xl:mb-10 xl:space-y-6">
                    <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-color)] bg-[var(--card-bg)] px-4 py-1.5 text-xs font-bold uppercase text-accent-blue shadow-sm">
                        <span className="font-japanese text-base" aria-hidden="true">日本語辞典</span>
                        <span aria-hidden="true">·</span>
                        <span>辞書</span>
                    </div>

                    <h1 className="max-w-4xl text-3xl font-japanese font-black leading-tight text-foreground sm:text-4xl xl:text-6xl">
                        <span className="block">Kamus Bahasa Jepang</span>
                        <span className="mt-1 block text-accent-blue">Latihan &amp; Game TTS</span>
                    </h1>
    
                    <p className="max-w-2xl text-base font-medium leading-relaxed text-gray-600 dark:text-gray-300 sm:text-lg">
                        Dari Kana sampai N1. Kamus interaktif, latihan soal, game teka-teki silang Kanji & kotoba, dan SRS flashcard untuk belajar bahasa Jepang dalam satu tempat.
                    </p>

                    <div className="flex w-full flex-col justify-center gap-3 pt-1 sm:w-auto sm:flex-row">
                        <Link
                            href="/practice"
                            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-accent-blue px-6 py-3 text-sm font-bold text-white shadow-lg shadow-accent-blue/20 transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue"
                        >
                            Mulai Belajar <ArrowRight aria-hidden="true" className="h-4 w-4" />
                        </Link>
                        <Link
                            href="/tts"
                            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] px-6 py-3 text-sm font-bold text-foreground transition hover:border-accent-green hover:text-accent-green focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-green"
                        >
                            <Gamepad2 aria-hidden="true" className="h-4 w-4" /> Main TTS
                        </Link>
                    </div>

                    {/* SEARCH INTERACTIVE */}
                    <div className="relative mt-2 w-full min-w-0 max-w-xl">
                        <div className="relative group">
                            <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-accent-blue transition-colors duration-200">
                                <Search className="w-5 h-5" />
                            </span>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setShowSuggestions(true);
                                }}
                                onFocus={() => setShowSuggestions(true)}
                                placeholder="Cari materi bahasa Jepang..."
                                className="w-full min-w-0 rounded-[1.5rem] border border-[var(--border-color)] bg-[var(--card-bg)] py-4 pl-12 pr-4 text-sm text-foreground shadow-md transition-all duration-300 placeholder-gray-400 hover:shadow-lg focus-glow xl:text-base"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => {
                                        setSearchQuery('');
                                        setSearchResults({ kanji: [], grammar: [], vocab: [] });
                                    }}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 hover:text-accent-blue transition-colors"
                                >
                                    Batal
                                </button>
                            )}
                        </div>

                        {/* Search Suggestion Dropdown */}
                        {showSuggestions && searchQuery.trim() && (
                            <div className="absolute top-[105%] left-0 right-0 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-[1.5rem] shadow-2xl p-5 z-50 text-left animate-[slide-up_0.2s_ease-out]">
                                <div className="flex justify-between items-center pb-3 border-b border-[var(--border-color)] mb-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
                                    <span>Hasil Pencarian</span>
                                    {isSearching && <span className="animate-pulse text-accent-blue">🏮 Menyaring...</span>}
                                </div>

                                <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                                    {/* Kanji Results */}
                                    {searchResults.kanji.length > 0 && (
                                        <div>
                                            <h4 className="text-[10px] font-black uppercase text-accent-blue tracking-widest mb-2 font-japanese">漢字 Kanji</h4>
                                            <div className="grid grid-cols-1 gap-2">
                                                {searchResults.kanji.map((item) => (
                                                    <Link 
                                                        key={item.id} 
                                                        href={getKanjiHref(item)}
                                                        className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-[var(--border-color)]"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-xl font-japanese font-bold text-accent-gold w-8 h-8 flex items-center justify-center bg-accent-gold/10 rounded-lg">{item.character}</span>
                                                            <div>
                                                                <div className="text-sm font-semibold">{item.meaning}</div>
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
                                                        className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-[var(--border-color)]"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-base font-japanese font-bold text-accent-green w-8 h-8 flex items-center justify-center bg-accent-green/10 rounded-lg">文</span>
                                                            <div>
                                                                <div className="text-sm font-semibold">{item.title}</div>
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
                                                        className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-[var(--border-color)]"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-base font-japanese font-bold text-brand w-8 h-8 flex items-center justify-center bg-brand-light/20 rounded-lg">語</span>
                                                            <div>
                                                                <div className="text-sm font-semibold">{item.word} ({item.reading})</div>
                                                                <div className="text-[10px] text-gray-500 font-light">{item.meaning}</div>
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



                <section aria-label="Jelajahi fitur JBook" className="mb-5 w-full">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <Link href="/kana" className="group rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] p-4 text-left transition hover:-translate-y-0.5 hover:border-accent-blue/50 hover:shadow-lg hover:shadow-accent-blue/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue">
                            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-accent-blue/10 text-accent-blue">
                                <Languages aria-hidden="true" className="h-5 w-5" />
                            </div>
                            <h2 className="text-sm font-bold text-foreground">Huruf Jepang</h2>
                            <p className="mt-1 text-xs leading-relaxed text-gray-600 dark:text-gray-400">Kenali Hiragana dan Katakana lewat tabel interaktif.</p>
                            <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-accent-blue">Kana <ArrowRight aria-hidden="true" className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" /></span>
                        </Link>

                        <Link href="/kotoba" className="group rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] p-4 text-left transition hover:-translate-y-0.5 hover:border-accent-green/50 hover:shadow-lg hover:shadow-accent-green/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-green">
                            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-accent-green/10 text-accent-green">
                                <BookOpen aria-hidden="true" className="h-5 w-5" />
                            </div>
                            <h2 className="text-sm font-bold text-foreground">Kamus &amp; Kosakata</h2>
                            <p className="mt-1 text-xs leading-relaxed text-gray-600 dark:text-gray-400">Cari arti, bacaan, dan contoh kosakata Jepang.</p>
                            <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-accent-green">Kotoba + Kanji <ArrowRight aria-hidden="true" className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" /></span>
                        </Link>

                        <Link href="/practice" className="group rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] p-4 text-left transition hover:-translate-y-0.5 hover:border-accent-gold/60 hover:shadow-lg hover:shadow-accent-gold/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-gold">
                            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-accent-gold/10 text-accent-gold">
                                <Brain aria-hidden="true" className="h-5 w-5" />
                            </div>
                            <h2 className="text-sm font-bold text-foreground">Latihan Soal</h2>
                            <p className="mt-1 text-xs leading-relaxed text-gray-600 dark:text-gray-400">Uji pemahaman Kanji, Kotoba, dan Bunpo.</p>
                            <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-accent-gold">Mulai Latihan <ArrowRight aria-hidden="true" className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" /></span>
                        </Link>

                        <Link href="/tts" className="group rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] p-4 text-left transition hover:-translate-y-0.5 hover:border-rose-500/50 hover:shadow-lg hover:shadow-rose-500/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500">
                            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
                                <Gamepad2 aria-hidden="true" className="h-5 w-5" />
                            </div>
                            <h2 className="text-sm font-bold text-foreground">Game TTS</h2>
                            <p className="mt-1 text-xs leading-relaxed text-gray-600 dark:text-gray-400">Susun jawaban di teka-teki silang interaktif.</p>
                            <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400">Main TTS <ArrowRight aria-hidden="true" className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" /></span>
                        </Link>
                    </div>
                </section>

                <aside className="mb-4 flex w-full flex-col gap-2 rounded-lg border border-accent-gold/30 bg-accent-gold/5 px-4 py-3 text-left sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                        <span className="font-japanese text-lg text-accent-gold" aria-hidden="true">漢字</span>
                        <div>
                            <p className="text-xs font-bold uppercase text-accent-gold">Materi populer</p>
                            <p className="text-sm font-semibold text-foreground">Mulai mengenal Kanji lewat kamus interaktif</p>
                        </div>
                    </div>
                    <Link href="/kanji" className="inline-flex items-center gap-1 self-start text-sm font-bold text-accent-blue transition hover:gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue sm:self-auto">
                        Jelajahi Kanji <ArrowRight aria-hidden="true" className="h-4 w-4" />
                    </Link>
                </aside>

            </div>
        </div>
    );
}
