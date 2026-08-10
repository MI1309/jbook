'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { getVocabList, API_URL } from '@/lib/api';
import KotobaFilter from '@/components/kotoba/KotobaFilter';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import KotobaDetailModal from '@/components/kotoba/KotobaDetailModal';

import { getScriptTypes } from '@/lib/utils';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { Volume2, Plus, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import Cookies from 'js-cookie';

function HighlightText({ text, query, active = true }) {
    if (text === null || text === undefined) return null;
    const textStr = String(text);
    const trimmedQuery = String(query || '').trim();
    if (!trimmedQuery || !active) return <span>{textStr}</span>;
    // Escape special regex characters in query to prevent crash
    const escapedQuery = trimmedQuery.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    if (!escapedQuery) return <span>{textStr}</span>;
    const parts = textStr.split(new RegExp(`(${escapedQuery})`, 'gi'));
    return (
        <span>
            {parts.map((part, i) => 
                part.toLowerCase() === trimmedQuery.toLowerCase() ? 
                <mark key={i} className="bg-yellow-200 dark:bg-yellow-900/50 text-gray-900 dark:text-yellow-200 rounded-px px-0.5 no-underline">{part}</mark> : 
                part
            )}
        </span>
    );
}

// ── Add Kotoba Modal ──────────────────────────────────────────────────────────
const WORD_TYPES = [
    { value: '', label: '-- Tanpa Tipe --' },
    { value: 'noun', label: 'Noun (Kata Benda)' },
    { value: 'godan', label: 'Godan Verb (Golongan 1)' },
    { value: 'ichidan', label: 'Ichidan Verb (Golongan 2)' },
    { value: 'suru', label: 'Suru Verb (Golongan 3)' },
    { value: 'intransitive', label: 'Intransitive Verb' },
    { value: 'transitive', label: 'Transitive Verb' },
    { value: 'i_adj', label: 'I-Adjective (い形)' },
    { value: 'na_adj', label: 'Na-Adjective (な形)' },
    { value: 'adverb', label: 'Adverb (Kata Keterangan)' },
    { value: 'particle', label: 'Particle (Partikel)' },
    { value: 'suffix', label: 'Suffix (Akhiran)' },
    { value: 'conjunction', label: 'Conjunction (Kata Sambung)' },
    { value: 'interjection', label: 'Interjection (Kata Seru)' },
    { value: 'pronoun', label: 'Pronoun (Kata Ganti)' },
    { value: 'counter', label: 'Counter (Kata Bantu Bilangan)' },
    { value: 'other', label: 'Lain-lain' },
];

const EMPTY_FORM = { word: '', reading: '', meaning: '', word_type: '', jlpt_level: 5 };

function AddKotobaModal({ onClose, onSuccess, theme }) {
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const firstInputRef = useRef(null);

    // Focus first input on mount
    useEffect(() => {
        const t = setTimeout(() => firstInputRef.current?.focus(), 80);
        return () => clearTimeout(t);
    }, []);

    // Close on Escape
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);

    const isDark = theme === 'dark';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        try {
            const token = Cookies.get('access_token');
            const res = await fetch(`${API_URL}/admin/vocab`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                setSuccess(true);
                setTimeout(() => {
                    onSuccess();
                    onClose();
                }, 900);
            } else {
                const data = await res.json().catch(() => ({}));
                setError(data.detail || data.message || data.error || `Gagal menyimpan (${res.status})`);
            }
        } catch (err) {
            setError('Koneksi gagal. Mohon periksa internet Anda.');
        } finally {
            setSaving(false);
        }
    };

    const set = (key) => (e) => setFormData(prev => ({ ...prev, [key]: e.target.value }));

    const inputClass = `w-full px-4 py-2.5 rounded-2xl border text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-accent-blue/40 focus:border-accent-blue ${
        isDark
            ? 'bg-black/40 border-white/10 text-white placeholder-white/20'
            : 'bg-white border-gray-200 text-gray-900 placeholder-gray-300'
    }`;

    const labelClass = `block text-[10px] font-black uppercase tracking-widest mb-1.5 ${
        isDark ? 'text-white/40' : 'text-gray-400'
    }`;

    return (
        /* Backdrop */
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            {/* Blur overlay */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />

            {/* Panel */}
            <div
                className={`relative w-full max-w-md rounded-[2rem] shadow-2xl border transition-all duration-300 animate-in fade-in zoom-in-95 ${
                    isDark
                        ? 'bg-[#0e0e0e]/95 border-white/10 shadow-black/60'
                        : 'bg-white/95 border-gray-200 shadow-gray-200/80'
                }`}
                role="dialog"
                aria-modal="true"
                aria-label="Tambah Kotoba Baru"
            >
                {/* Header */}
                <div className={`flex items-center justify-between px-7 pt-7 pb-5 border-b ${isDark ? 'border-white/5' : 'border-gray-100'}`}>
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-blue to-accent-green flex items-center justify-center shadow-lg shadow-accent-blue/20">
                            <span className="text-lg font-black text-white leading-none">語</span>
                        </div>
                        <div>
                            <h2 className={`text-sm font-black tracking-wide ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                Tambah Kotoba
                            </h2>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-0.5">Staff Only</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 ${
                            isDark ? 'bg-white/5 text-white/40 hover:text-white hover:bg-white/10' : 'bg-gray-100 text-gray-400 hover:text-gray-700 hover:bg-gray-200'
                        }`}
                        aria-label="Tutup modal"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="px-7 py-6 space-y-4">
                    {/* Word */}
                    <div>
                        <label className={labelClass}>🈳 Word / Kanji <span className="text-red-400">*</span></label>
                        <input
                            ref={firstInputRef}
                            id="add-kotoba-word"
                            type="text"
                            required
                            placeholder="例：猫、食べる"
                            className={`${inputClass} text-lg font-japanese`}
                            value={formData.word}
                            onChange={set('word')}
                        />
                    </div>

                    {/* Reading */}
                    <div>
                        <label className={labelClass}>🔤 Reading (Kana) <span className="text-red-400">*</span></label>
                        <input
                            id="add-kotoba-reading"
                            type="text"
                            required
                            placeholder="例：ねこ、たべる"
                            className={inputClass}
                            value={formData.reading}
                            onChange={set('reading')}
                        />
                    </div>

                    {/* Meaning */}
                    <div>
                        <label className={labelClass}>🇮🇩 Meaning <span className="text-red-400">*</span></label>
                        <input
                            id="add-kotoba-meaning"
                            type="text"
                            required
                            placeholder="Arti dalam bahasa Indonesia"
                            className={inputClass}
                            value={formData.meaning}
                            onChange={set('meaning')}
                        />
                    </div>

                    {/* Word Type + Level side by side */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={labelClass}>🏷 Tipe</label>
                            <select
                                id="add-kotoba-word-type"
                                className={`${inputClass} cursor-pointer`}
                                value={formData.word_type}
                                onChange={set('word_type')}
                            >
                                {WORD_TYPES.map(({ value, label }) => (
                                    <option key={value} value={value}>{label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>📊 JLPT Level</label>
                            <select
                                id="add-kotoba-level"
                                className={`${inputClass} cursor-pointer`}
                                value={formData.jlpt_level}
                                onChange={(e) => setFormData(prev => ({ ...prev, jlpt_level: parseInt(e.target.value) }))}
                            >
                                {[5, 4, 3, 2, 1].map(l => (
                                    <option key={l} value={l}>N{l}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-semibold">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Success */}
                    {success && (
                        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-semibold">
                            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                            <span>Kotoba berhasil ditambahkan!</span>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className={`flex-1 py-2.5 rounded-2xl text-sm font-black uppercase tracking-widest transition-all active:scale-95 ${
                                isDark
                                    ? 'bg-white/5 text-white/40 hover:text-white hover:bg-white/10'
                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                        >
                            Batal
                        </button>
                        <button
                            id="add-kotoba-submit"
                            type="submit"
                            disabled={saving || success}
                            className="flex-[2] py-2.5 rounded-2xl text-sm font-black uppercase tracking-widest bg-gradient-to-r from-accent-blue to-accent-green text-white shadow-lg shadow-accent-blue/20 hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                        >
                            {saving ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</>
                            ) : success ? (
                                <><CheckCircle2 className="w-4 h-4" /> Tersimpan!</>
                            ) : (
                                'Simpan Kotoba'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── KotobaContent ─────────────────────────────────────────────────────────────
function KotobaContent({ onRefreshRequest, refreshKey }) {
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
    }, [page, level, search, word_type, refreshKey]);

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
                                                ? 'bg-blue-600 text-white animate-pulse' 
                                                : 'bg-[var(--background)] border border-[var(--border-color)] text-gray-500 hover:text-blue-600 hover:border-blue-500/30'
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
                <div className="text-center py-32 rounded-[3rem] border-4 border-dashed max-w-2xl mx-auto shadow-inner transition-colors bg-[var(--card-bg)] border-[var(--border-color)]">
                    <div className="text-7xl mb-6 grayscale opacity-20 dark:opacity-40 transition-opacity">🪐</div>
                    <h2 className="text-2xl font-black mb-2 transition-colors text-[var(--foreground)]">Kosakata Tidak Ditemukan</h2>
                    <p className="font-bold mb-8 uppercase text-[10px] tracking-widest text-gray-500 dark:text-gray-400">Coba kata kunci lain atau ubah filter level.</p>
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

// ── KotobaPage ────────────────────────────────────────────────────────────────
export default function KotobaPage() {
    const { theme, mounted } = useTheme();
    const { user } = useAuth();
    const [showAddModal, setShowAddModal] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    const textColor = !mounted ? 'text-black' : (theme === 'dark' ? 'text-white' : 'text-black');
    const subTextColor = !mounted ? 'text-black/50' : (theme === 'dark' ? 'text-white/50' : 'text-black/50');

    const isStaff = user?.is_staff || user?.email === 'imronm1309@gmail.com';

    const handleSuccess = () => {
        setRefreshKey(k => k + 1);
    };

    return (
        <div className="container mx-auto px-6 py-12 max-w-7xl transition-colors duration-300">
            <header className="mb-12 text-center lg:text-left flex flex-col lg:flex-row lg:items-center justify-between gap-8 border-b border-[var(--border-color)] pb-12 transition-colors">
                <div className="shrink-0 lg:max-w-xs">
                     <h1 className={`text-5xl font-japanese font-black tracking-tight leading-none transition-colors ${textColor}`}>言葉 <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-blue to-accent-green ml-2">Kotoba</span></h1>
                     <div className="h-1 w-16 bg-gradient-to-r from-accent-blue to-accent-green rounded-full mt-3 mb-1 mx-auto lg:mx-0" />
                     <p className={`font-black mt-2 tracking-wide uppercase text-xs transition-colors ${subTextColor}`}>Perdalam kosa kata bahasa Jepang Anda</p>
                </div>
                <div className="flex-1 w-full">
                    <Suspense fallback={<div className="h-28 w-full bg-[var(--card-bg)] rounded-[2.5rem] animate-pulse" />}>
                         <KotobaFilter />
                    </Suspense>
                </div>
            </header>

            <Suspense fallback={<div className="py-32 text-center animate-pulse">Memuat...</div>}>
                <KotobaContent refreshKey={refreshKey} />
            </Suspense>

            {/* ── Staff FAB: Tambah Kotoba ── */}
            {isStaff && (
                <button
                    id="staff-add-kotoba-fab"
                    onClick={() => setShowAddModal(true)}
                    title="Tambah Kotoba Baru (Staff)"
                    className="fixed bottom-8 right-8 z-40 group flex items-center gap-3 px-5 py-4 rounded-[2rem] bg-gradient-to-br from-accent-blue to-accent-green text-white font-black text-sm shadow-2xl shadow-accent-blue/30 hover:shadow-accent-blue/50 hover:scale-105 active:scale-95 transition-all duration-300"
                >
                    <Plus className="w-5 h-5 transition-transform group-hover:rotate-90 duration-300" />
                    <span className="uppercase tracking-widest text-[11px]">Tambah Kotoba</span>
                </button>
            )}

            {/* ── Add Modal ── */}
            {showAddModal && (
                <AddKotobaModal
                    theme={theme}
                    onClose={() => setShowAddModal(false)}
                    onSuccess={handleSuccess}
                />
            )}
        </div>
    );
}
