'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useDebounce } from 'use-debounce';
import { getKanjiList, getGrammarList, getVocabList } from '@/lib/api';
import { 
    Search, 
    Compass, 
    ArrowRight, 
    CheckCircle, 
    Volume2,
    Copy,
    Award
} from 'lucide-react';

const kotobaPool = [
    {
        word: '一生懸命 (isshoukenmei)',
        meaning: 'Dengan segenap jiwa & raga (sungguh-sungguh)',
        reading: 'いっしょうけんめい',
        example: '日本語を一生懸命勉強します。',
        exampleMeaning: 'Saya akan belajar bahasa Jepang dengan bersungguh-sungguh.'
    },
    {
        word: '一期一会 (ichigo ichie)',
        meaning: 'Satu pertemuan, satu kesempatan seumur hidup',
        reading: 'いちごいちえ',
        example: '茶道は一期一会の精神を大切にします。',
        exampleMeaning: 'Upacara minum teh menghargai semangat satu pertemuan seumur hidup.'
    },
    {
        word: '木漏れ日 (komorebi)',
        meaning: 'Sinar matahari yang menyaring melalui celah dedaunan',
        reading: 'こもれび',
        example: '森の中で美しい木漏れ日を見ました。',
        exampleMeaning: 'Saya melihat sinar matahari yang indah menyaring melalui celah dedaunan di hutan.'
    },
    {
        word: '改善 (kaizen)',
        meaning: 'Perbaikan berkesinambungan (selangkah demi selangkah menjadi lebih baik)',
        reading: 'かいぜん',
        example: '日々の仕事の改善 to 改善を続けます。', // wait, let's keep it exact as in original: "日々の仕事の改善を続けます。"
        example: '日々の仕事の改善を続けます。',
        exampleMeaning: 'Kami terus melakukan perbaikan pada pekerjaan kami sehari-hari.'
    },
    {
        word: '心強い (kokorozuyoi)',
        meaning: 'Merasa aman / berbesar hati / terbantu',
        reading: 'こころづよい',
        example: '皆さんが応援してくれて心強いです。',
        exampleMeaning: 'Saya merasa sangat berbesar hati karena kalian semua mendukung saya.'
    }
];

export default function Home() {
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery] = useDebounce(searchQuery, 400);
    const [searchResults, setSearchResults] = useState({ kanji: [], grammar: [], vocab: [] });
    const [isSearching, setIsSearching] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Random Kotoba state
    const [todayKotoba, setTodayKotoba] = useState({
        word: '一歩一歩 (ippo ippo)',
        meaning: 'Selangkah demi selangkah',
        reading: 'いっぽいっぽ',
        example: '日本語の勉強は一歩一歩進みます。',
        exampleMeaning: 'Belajar bahasa Jepang maju selangkah demi selangkah.'
    });
    const [copied, setCopied] = useState(false);

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

    // Pick random kotoba on mount
    useEffect(() => {
        const randomIndex = Math.floor(Math.random() * kotobaPool.length);
        setTodayKotoba(kotobaPool[randomIndex]);
    }, []);

    // Text to Speech for Kotoba
    const speakJapanese = (text) => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'ja-JP';
            utterance.rate = 0.8;
            window.speechSynthesis.speak(utterance);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const hasResults = searchResults.kanji.length > 0 || searchResults.grammar.length > 0 || searchResults.vocab.length > 0;

    return (
        <div className="relative min-h-screen washi-texture bg-background text-foreground transition-colors duration-300 pb-20 overflow-hidden">
            {/* CSS Sakura Petals Overlay inside Hero */}
            <div className="absolute inset-0 pointer-events-none z-0">
                <div className="sakura-petal w-3 h-3" style={{ top: '10%', left: '5%', animation: 'sakura-fall 12s linear infinite', animationDelay: '0s' }}></div>
                <div className="sakura-petal w-2 h-4" style={{ top: '5%', left: '40%', animation: 'sakura-fall 15s linear infinite', animationDelay: '2s' }}></div>
                <div className="sakura-petal w-4 h-3" style={{ top: '15%', left: '75%', animation: 'sakura-fall 10s linear infinite', animationDelay: '5s' }}></div>
                <div className="sakura-petal w-3 h-2" style={{ top: '25%', left: '90%', animation: 'sakura-fall 18s linear infinite', animationDelay: '1s' }}></div>
                <div className="sakura-petal w-2.5 h-3" style={{ top: '8%', left: '60%', animation: 'sakura-fall 14s linear infinite', animationDelay: '4s' }}></div>
            </div>

            {/* Side calligraphy elements - Cozy Japanese aesthetic */}
            <div className="hidden xl:flex flex-col absolute left-8 top-1/4 space-y-8 select-none text-[#212127]/20 dark:text-[#f2f2f7]/5 font-japanese text-3xl font-black tracking-widest pointer-events-none">
                <span className="writing-vertical">日本語辞典</span>
                <span className="text-xl">辞書</span>
            </div>
            <div className="hidden xl:flex flex-col absolute right-8 top-1/4 space-y-8 select-none text-[#212127]/20 dark:text-[#f2f2f7]/5 font-japanese text-3xl font-black tracking-widest pointer-events-none">
                <span className="writing-vertical">練習問題</span>
                <span className="text-xl">学習</span>
            </div>

            {/* Container */}
            <div className="container mx-auto px-6 max-w-5xl relative z-10 pt-10 md:pt-16">
                
                {/* HERO SECTION */}
                <header className="flex flex-col items-center text-center space-y-6 mb-12">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[var(--border-color)] bg-[var(--card-bg)] text-xs font-bold tracking-widest uppercase text-accent-blue shadow-sm">
                        <Search className="w-4 h-4 text-accent-blue" />
                        Kamus & Latihan Online
                    </div>

                    <h1 className="text-4xl md:text-6xl font-japanese font-black tracking-tight leading-tight max-w-3xl mt-4">
                        JBook: <span className="text-accent-blue dark:text-accent-blue drop-shadow-[0_0_15px_rgba(56,189,248,0.15)]">Kamus Jepang</span>
                    </h1>

                    <p className="text-base md:text-lg text-gray-500 dark:text-gray-400 max-w-2xl font-light mt-4">
                        Cari kosakata, kanji, dan tata bahasa, atau mulai latihan interaktif untuk menguji kemampuan Anda.
                    </p>

                    {/* SEARCH INTERACTIVE */}
                    <div className="w-full max-w-xl relative mt-4">
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
                                placeholder="Cari topik bahasa Jepang, kanji, tata bahasa..."
                                className="w-full py-4 pl-12 pr-4 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-[1.5rem] focus-glow shadow-md hover:shadow-lg transition-all duration-300 placeholder-gray-400 text-sm md:text-base"
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
                                                        href={`/kanji/${item.id}`}
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



                {/* QUICK LINKS */}
                <section className="mb-16 flex justify-center gap-4 flex-wrap">
                    <Link href="/kanji" className="px-6 py-3 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl hover:border-accent-blue transition-all font-bold text-sm shadow-sm flex items-center gap-2">
                        <span className="text-accent-blue">漢字</span> Kanji
                    </Link>
                    <Link href="/kotoba" className="px-6 py-3 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl hover:border-accent-blue transition-all font-bold text-sm shadow-sm flex items-center gap-2">
                        <span className="text-accent-blue">語彙</span> Kotoba
                    </Link>
                    <Link href="/bunpo" className="px-6 py-3 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl hover:border-accent-blue transition-all font-bold text-sm shadow-sm flex items-center gap-2">
                        <span className="text-accent-blue">文法</span> Bunpo
                    </Link>
                    <Link href="/practice" className="px-6 py-3 bg-accent-blue text-white rounded-2xl hover:bg-accent-blue/90 transition-all font-bold text-sm shadow-sm flex items-center gap-2">
                        Latihan <ArrowRight className="w-4 h-4" />
                    </Link>
                </section>

                {/* WIDGET KOTOBA HARI INI */}
                <section className="max-w-xl mx-auto">
                    <div className="relative bg-[var(--card-bg)] border border-[var(--border-color)] rounded-[2rem] p-6 md:p-8 shadow-lg overflow-hidden border-t-4 border-t-accent-gold">
                        <div className="absolute top-4 right-4 flex items-center gap-1.5 text-accent-gold text-[10px] font-bold uppercase tracking-widest font-japanese">
                            <Compass className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
                            Kotoba Hari Ini
                        </div>

                        <div className="space-y-4">
                            <div>
                                <div className="text-2xl md:text-3xl font-japanese font-black text-foreground mb-1 flex items-center gap-2">
                                    <span>{todayKotoba.word}</span>
                                    <button 
                                        onClick={() => speakJapanese(todayKotoba.word.split(' ')[0])}
                                        className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-accent-blue transition-colors"
                                        title="Dengarkan Suara"
                                    >
                                        <Volume2 className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="text-xs text-gray-500 font-light">Cara Baca: {todayKotoba.reading}</div>
                            </div>

                            <div className="p-4 bg-white/5 border border-[var(--border-color)] rounded-2xl">
                                <div className="text-xs font-bold text-gray-400 mb-1">Arti:</div>
                                <div className="text-sm font-semibold">{todayKotoba.meaning}</div>
                            </div>

                            <div className="text-xs text-gray-400 leading-relaxed font-light">
                                <span className="font-bold text-accent-gold block mb-1">Contoh Kalimat:</span>
                                <div className="font-japanese font-semibold text-foreground mb-1">{todayKotoba.example}</div>
                                <div className="italic">{todayKotoba.exampleMeaning}</div>
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button 
                                    onClick={() => copyToClipboard(todayKotoba.word)}
                                    className="flex items-center gap-2 px-4 py-2 border border-[var(--border-color)] rounded-xl text-[10px] font-bold hover:border-accent-blue hover:text-accent-blue transition-all"
                                >
                                    <Copy className="w-3 h-3" />
                                    {copied ? 'Tersalin!' : 'Salin Kosakata'}
                                </button>
                                <Link 
                                    href="/kotoba" 
                                    className="flex items-center gap-2 px-4 py-2 border border-transparent bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-bold text-gray-400 hover:text-foreground transition-all ml-auto"
                                >
                                    <span>Lihat Semua Kosakata</span>
                                    <ArrowRight className="w-3 h-3" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}
