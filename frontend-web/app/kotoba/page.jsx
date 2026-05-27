'use client';

import { useState, useEffect, Suspense } from 'react';
import { getVocabList } from '@/lib/api';
import KotobaFilter from '@/components/kotoba/KotobaFilter';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import KotobaDetailModal from '@/components/kotoba/KotobaDetailModal';

import { getScriptTypes } from '@/lib/utils';
import { useTheme } from '@/context/ThemeContext';
import { Volume2 } from 'lucide-react';

function HighlightText({ text, query, active = true }) {
    if (!query || !active) return <span>{text}</span>;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
        <span>
            {parts.map((part, i) => 
                part.toLowerCase() === query.toLowerCase() ? 
                <mark key={i} className="bg-yellow-200 dark:bg-yellow-900/50 text-gray-900 dark:text-yellow-200 rounded-px px-0.5 no-underline">{part}</mark> : 
                part
            )}
        </span>
    );
}

function KotobaContent() {
    const { theme, mounted } = useTheme();
    const searchParams = useSearchParams();
    const router = useRouter();
    const detailId = searchParams.get('detail');
    const [data, setData] = useState({ items: [], total: 0, pages: 1 });
    const [loading, setLoading] = useState(true);
    const [playingId, setPlayingId] = useState(null);

    const page = parseInt(searchParams.get('page')) || 1;
    const level = searchParams.get('level');
    const search = searchParams.get('search');
    const word_type = searchParams.get('word_type');
    const limit = 30;

    const scriptTypes = getScriptTypes(search);

    const playAudioCard = (vocab, e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (playingId) return;
        setPlayingId(vocab.id);
        
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const audioUrl = `${baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl}/api/content/vocab/${vocab.id}/audio`;
        
        const audio = new Audio(audioUrl);
        audio.onended = () => setPlayingId(null);
        audio.onerror = () => {
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
                let cleanWord = vocab.word.split(' ')[0].split('(')[0].split('（')[0];
                let textToSpeak = vocab.reading || cleanWord;
                const utterance = new SpeechSynthesisUtterance(textToSpeak);
                utterance.lang = 'ja-JP';
                utterance.rate = 0.8;
                utterance.onend = () => setPlayingId(null);
                utterance.onerror = () => setPlayingId(null);
                window.speechSynthesis.speak(utterance);
            } else {
                setPlayingId(null);
            }
        };
        audio.play().catch(() => {
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
                let cleanWord = vocab.word.split(' ')[0].split('(')[0].split('（')[0];
                let textToSpeak = vocab.reading || cleanWord;
                const utterance = new SpeechSynthesisUtterance(textToSpeak);
                utterance.lang = 'ja-JP';
                utterance.rate = 0.8;
                utterance.onend = () => setPlayingId(null);
                utterance.onerror = () => setPlayingId(null);
                window.speechSynthesis.speak(utterance);
            } else {
                setPlayingId(null);
            }
        });
    };

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const result = await getVocabList({ level, search, word_type, limit, page });
                setData(result || { items: [], total: 0, pages: 1 });
            } catch (err) {
                console.error('[jbook-client] Gagal memuat Kotoba:', err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [page, level, search, word_type]);

    const items = data.items || [];
    const totalPages = data.pages || 1;
    const hasMore = page < totalPages;
    const totalCount = data.total || 0;

    const getLevelColor = (level) => {
        switch (level) {
            case 1: return 'from-blue-50/50 to-white dark:from-blue-900/10 dark:to-card text-blue-600 dark:text-blue-400';
            case 2: return 'from-amber-50/50 to-white dark:from-amber-900/10 dark:to-card text-amber-600 dark:text-amber-400';
            case 3: return 'from-yellow-50/50 to-white dark:from-yellow-900/10 dark:to-card text-yellow-600 dark:text-yellow-400';
            case 4: return 'from-cyan-50/50 to-white dark:from-cyan-900/10 dark:to-card text-cyan-600 dark:text-cyan-400';
            case 5: return 'from-emerald-50/50 to-white dark:from-emerald-900/10 dark:to-card text-emerald-600 dark:text-emerald-400';
            default: return 'from-gray-50/50 to-white dark:from-gray-800 dark:to-card text-gray-600 dark:text-gray-400';
        }
    };

    if (loading) return <div className="py-32 text-center animate-pulse text-gray-400 dark:text-gray-600 font-black transition-colors">🏮 MEMUAT KOTOBA...</div>;

    return (
        <>
            {detailId && <KotobaDetailModal id={detailId} />}
            <div className="flex justify-between items-center mb-6 text-[10px] font-black uppercase tracking-[0.2em] transition-colors text-gray-500 dark:text-gray-400">
                <span>Total: {totalCount} Kata</span>
                <span>Halaman {page} dari {totalPages}</span>
            </div>

            {items.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-16 px-1 transition-all">
                    {items.map((vocab) => (
                        <Link
                            key={vocab.id}
                            href={`/kotoba/${vocab.id}`}
                            onClick={(e) => {
                                if (typeof navigator !== 'undefined' && !navigator.onLine) {
                                    e.preventDefault();
                                    const params = new URLSearchParams(searchParams.toString());
                                    params.set('detail', vocab.id);
                                    router.push(`?${params.toString()}`);
                                }
                            }}
                            className="group flex flex-col p-6 bg-[var(--card-bg)] rounded-[2rem] border border-[var(--border-color)] transition-all duration-300 hover:shadow-xl hover:shadow-accent-blue/10 hover:border-accent-blue/30 active:scale-95 relative overflow-hidden h-full justify-between"
                        >
                            <div className="flex justify-between items-start mb-4 transition-colors">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 px-3 py-1 bg-[var(--background)] border border-[var(--border-color)] rounded-xl inline-block">N{vocab.jlpt_level}</span>
                                    <button
                                        onClick={(e) => playAudioCard(vocab, e)}
                                        className={`p-1.5 rounded-xl transition-all ${
                                            playingId === vocab.id 
                                                ? 'bg-red-500 text-white animate-pulse' 
                                                : 'bg-[var(--background)] border border-[var(--border-color)] text-gray-500 hover:text-red-600 hover:border-red-500/30'
                                        }`}
                                        title="Dengarkan Suara"
                                    >
                                        <Volume2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                                
                                <div className="flex flex-col gap-1 items-end">
                                    <div className="flex gap-1">
                                        {scriptTypes.map(type => (
                                            <span key={type} className="text-[7px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-tighter transition-colors bg-[var(--background)] border border-[var(--border-color)] text-gray-500">
                                                {type}
                                            </span>
                                        ))}
                                    </div>
                                    {vocab.word_type && <span className="text-[9px] font-black px-2 py-0.5 rounded-lg border border-[var(--border-color)] bg-[var(--background)]/50 uppercase tracking-widest leading-none transition-colors text-gray-400">{vocab.word_type}</span>}
                                </div>
                            </div>

                            <div className="text-center mb-6 mt-2">
                                <h2 className="text-4xl font-japanese font-bold leading-none mb-3 tracking-tighter group-hover:text-accent-blue transition-all duration-300 text-foreground">
                                    <HighlightText text={vocab.word} query={search} active={vocab._matchTarget === 'word'} />
                                </h2>
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] transition-colors group-hover:text-accent-blue/80 text-gray-500">
                                    <HighlightText text={vocab.reading || ''} query={search} active={vocab._matchTarget === 'reading'} />
                                </p>
                            </div>
                            
                            <div className="mt-auto min-h-[4rem] flex flex-col items-center justify-center p-4 rounded-2xl bg-[var(--background)]/50 text-center text-sm font-semibold leading-relaxed transition-colors border border-[var(--border-color)]/50 group-hover:border-accent-blue/20 transition-all">
                                <p className="truncate-multiline text-foreground">
                                    <HighlightText text={vocab.meaning} query={search} active={vocab._matchTarget === 'meaning'} />
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className={`text-center py-32 rounded-[3rem] border-4 border-dashed max-w-2xl mx-auto shadow-inner transition-colors ${cardBg} ${theme === 'dark' ? 'border-red-950/20' : 'border-gray-100'}`}>
                    <div className="text-7xl mb-6 grayscale opacity-20 dark:opacity-40 transition-opacity">🪐</div>
                    <h2 className={`text-2xl font-black mb-2 transition-colors ${textColor}`}>Kosakata Tidak Ditemukan</h2>
                    <p className={`font-bold mb-8 uppercase text-[10px] tracking-widest transition-colors ${subTextColor}`}>Coba kata kunci lain atau ubah filter level.</p>
                </div>
            )}

            <div className="flex justify-center items-center gap-6 mt-8">
                {page > 1 && <Link href={`?page=${page - 1}`} className="bg-white dark:bg-[var(--card-bg)] border-2 border-gray-100 dark:border-[var(--border-color)] text-gray-500 dark:text-gray-400 hover:text-accent-blue dark:hover:text-accent-blue hover:border-accent-blue/20 px-6 py-3 rounded-2xl font-black text-sm transition-all shadow-sm active:scale-95">← Prev</Link>}
                <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-blue to-accent-green text-white flex items-center justify-center font-black text-sm shadow-lg shadow-accent-blue/20 dark:shadow-accent-blue/10 transition-colors">{page}</span>
                {hasMore && <Link href={`?page=${page + 1}`} className="bg-gradient-to-r from-accent-blue to-accent-green text-white border-2 border-accent-blue/50 hover:opacity-90 px-6 py-3 rounded-2xl font-black text-sm transition-all shadow-xl shadow-accent-blue/20 dark:shadow-accent-blue/10 active:scale-95">Next →</Link>}
            </div>
        </>
    );
}

export default function KotobaPage() {
    const { theme, mounted } = useTheme();
    const textColor = !mounted ? 'text-black' : (theme === 'dark' ? 'text-white' : 'text-black');
    const subTextColor = !mounted ? 'text-black/50' : (theme === 'dark' ? 'text-white/50' : 'text-black/50');

    return (
        <div className="container mx-auto px-6 py-12 max-w-7xl transition-colors duration-300">
            <header className="mb-12 text-center md:text-left flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-100 dark:border-[var(--border-color)] pb-12 transition-colors">
                <div>
                     <h1 className={`text-5xl font-japanese font-black tracking-tight leading-none transition-colors ${textColor}`}>言葉 <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-blue to-accent-green ml-2">Kotoba</span></h1>
                     <div className="h-1 w-16 bg-gradient-to-r from-accent-blue to-accent-green rounded-full mt-3 mb-1" />
                     <p className={`font-black mt-2 tracking-wide uppercase text-xs transition-colors ${subTextColor}`}>Perdalam kosa kata bahasa Jepang Anda</p>
                </div>
                <Suspense fallback={<div className="h-12 w-full md:w-96 bg-gray-50 dark:bg-gray-800 rounded-2xl animate-pulse" />}>
                     <KotobaFilter />
                </Suspense>
            </header>

            <Suspense fallback={<div className="py-32 text-center animate-pulse">Memuat...</div>}>
                <KotobaContent />
            </Suspense>
        </div>
    );
}
