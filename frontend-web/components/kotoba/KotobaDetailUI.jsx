'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { hasKanji, extractKanji, generateFuriganaMap } from '@/lib/utils';
import { resolveContentId } from '@/lib/api';
import { getRadicalInfo } from '@/lib/radicals';
import { dbGetAll } from '@/lib/offline-db';
import { useTheme } from '@/context/ThemeContext';
import { Volume2, Edit2, Check, X, Trash } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-toastify';
import Cookies from 'js-cookie';
import { conjugateVerbComplete } from '@/utils/conjugation';

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

// ✅ HANYA tipe kata kerja ini yang boleh menampilkan tabel konjugasi.
// Kalau word_type kosong / noun / i_adj / na_adj / dll -> section tidak pernah dihitung ataupun dirender.
const VERB_WORD_TYPES = new Set(['godan', 'ichidan', 'suru', 'intransitive', 'transitive']);

export default function KotobaDetailUI({ vocab: initialVocab, onClose }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { theme, mounted } = useTheme();
    const { user } = useAuth();
    const [vocab, setVocab] = useState(initialVocab);
    const [kanjiDetails, setKanjiDetails] = useState([]);
    const [playing, setPlaying] = useState(false);

    const handleBack = (e) => {
        if (e) e.preventDefault();
        if (onClose) {
            onClose();
            return;
        }
        if (typeof window !== 'undefined' && window.history.length > 1) {
            router.back();
        } else {
            const query = searchParams?.toString();
            const saved = query || (typeof window !== 'undefined' ? sessionStorage.getItem('kotoba_filter_params') : '');
            router.push(saved ? `/kotoba?${saved}` : '/kotoba');
        }
    };

    // Edit state
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({
        word: initialVocab?.word || '',
        meaning: initialVocab?.meaning || '',
        reading: initialVocab?.reading || '',
        furigana: initialVocab?.furigana || '',
        word_type: initialVocab?.word_type || ''
    });
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const isAdmin = user?.is_staff || user?.is_superuser;

    // ✅ useEffect HARUS di atas early return
    useEffect(() => {
        setVocab(initialVocab);
        setEditData({
            word: initialVocab?.word || '',
            meaning: initialVocab?.meaning || '',
            reading: initialVocab?.reading || '',
            furigana: initialVocab?.furigana || '',
            word_type: initialVocab?.word_type || ''
        });
    }, [initialVocab]);

    useEffect(() => {
        async function fetchKanjiDetails() {
            if (!vocab?.word) return;

            const normalizedWord = (vocab.word || '').normalize('NFKC');
            const uniqueKanjis = extractKanji(normalizedWord);
            if (uniqueKanjis.length === 0) return;

            try {
                // 1. Coba dari IndexedDB lokal dulu
                const allKanjis = await dbGetAll('kanji');
                let foundKanjis = [];
                if (allKanjis && allKanjis.length > 0) {
                    foundKanjis = allKanjis.filter(k => uniqueKanjis.includes(k.character));
                }

                // 2. Fetch dari API untuk yang belum ketemu di lokal
                const missing = uniqueKanjis.filter(char => !foundKanjis.some(fk => fk.character === char));
                if (missing.length > 0) {
                    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'https://imronm.pythonanywhere.com/api')
                        .replace(/\/$/, '');

                    const fetchPromises = missing.map(async (char) => {
                        try {
                            // Coba resolveContentId dulu (IndexedDB → API search)
                            const id = await resolveContentId('kanji', char);
                            if (id) {
                                const res = await fetch(`${baseUrl}/content/kanji/${id}`);
                                if (res.ok) return await res.json();
                            }
                            // Fallback langsung search by karakter
                            const res = await fetch(`${baseUrl}/content/kanji?search=${encodeURIComponent(char)}&limit=1`);
                            if (res.ok) {
                                const data = await res.json();
                                return data.items?.[0] || null;
                            }
                        } catch (e) {
                            return null;
                        }
                        return null;
                    });

                    const apiResults = (await Promise.all(fetchPromises)).filter(Boolean);
                    foundKanjis = [...foundKanjis, ...apiResults];
                }

                setKanjiDetails(foundKanjis);
            } catch (err) {
                console.warn('[jbook-vocab] Failed to fetch kanji details:', err);
            }
        }

        fetchKanjiDetails();
    }, [vocab?.word]);

    // Conjugation toggles
    const [isFormal, setIsFormal] = useState(false);
    const [isNegative, setIsNegative] = useState(false);
    const [isPast, setIsPast] = useState(false);

    // ✅ Apakah kata ini termasuk kata kerja? Dicek SEBELUM apa pun dihitung.
    const isVerbType = useMemo(() => {
        return !!vocab?.word_type && VERB_WORD_TYPES.has(vocab.word_type);
    }, [vocab?.word_type]);

    // Calculate conjugations — HANYA jika word_type benar-benar kata kerja.
    const conjugationData = useMemo(() => {
        if (!isVerbType) return null;

        // First try backend's complete conjugations
        if (vocab?.conjugations_complete) {
            return vocab.conjugations_complete;
        }
        // Fallback to calculating locally
        if (!vocab?.word || !vocab?.reading) return null;
        return conjugateVerbComplete(vocab.word, vocab.reading, vocab.word_type);
    }, [isVerbType, vocab?.word, vocab?.reading, vocab?.word_type, vocab?.conjugations_complete]);

    // Determine which variant to show based on toggles
    const getActiveVariantKey = useMemo(() => {
        let key = '';
        if (isFormal) key += 'formal_';
        if (isNegative) key += 'negative_';
        if (isPast) key += 'past_';
        // Remove trailing underscore
        key = key.slice(0, -1);
        // Default to plain present
        if (key === '') return 'default';
        // Handle special cases for formal negative, formal past, etc.
        const validKeys = {
            'formal': 'formal',
            'negative': 'negative',
            'past': 'past',
            'formal_negative': 'formal_negative',
            'formal_past': 'formal_past',
            'negative_past': 'negative_past',
            'formal_negative_past': 'formal_negative_past'
        };
        return validKeys[key] || 'default';
    }, [isFormal, isNegative, isPast]);

    // Compute furigana map for accurate per-character alignment
    const furiganaMap = useMemo(() => {
        if (!vocab?.word) return [];
        return generateFuriganaMap(vocab.word, vocab.reading, vocab.furigana, vocab.furigana_map);
    }, [vocab?.word, vocab?.reading, vocab?.furigana, vocab?.furigana_map]);

    // ✅ Early return SETELAH semua hook
    if (!vocab) return null;

    const normalizedWord = (vocab.word || '').normalize('NFKC');
    const characters = normalizedWord.split('');
    const uniqueKanjis = extractKanji(normalizedWord);

    const playAudio = () => {
        if (playing) return;
        setPlaying(true);

        const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'https://imronm.pythonanywhere.com/api')
            .replace(/\/$/, '');
        const audioUrl = `${baseUrl}/content/vocab/${vocab.id}/audio`;

        const audio = new Audio(audioUrl);
        audio.onended = () => setPlaying(false);

        const speakFallback = () => {
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
                const cleanWord = vocab.word.split(' ')[0].split('(')[0].split('（')[0];
                const utterance = new SpeechSynthesisUtterance(vocab.reading || cleanWord);
                utterance.lang = 'ja-JP';
                utterance.rate = 0.8;
                utterance.onend = () => setPlaying(false);
                utterance.onerror = () => setPlaying(false);
                window.speechSynthesis.speak(utterance);
            } else {
                setPlaying(false);
            }
        };

        audio.onerror = speakFallback;
        audio.play().catch(speakFallback);
    };

    const handleKanjiClick = async (char) => {
        const id = await resolveContentId('kanji', char);
        if (id) {
            router.push(`/kanji/${id}`);
        } else {
            router.push(`/kanji?search=${encodeURIComponent(char)}`);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Hapus Kotoba ini? Tindakan ini tidak bisa dibatalkan.')) return;
        setDeleting(true);
        try {
            const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'https://imronm.pythonanywhere.com/api')
                .replace(/\/$/, '');
            const token = Cookies.get('access_token');
            const res = await fetch(`${baseUrl}/content/vocab/${vocab.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (res.ok) {
                toast.success('Kotoba berhasil dihapus.');
                if (onClose) {
                    onClose();
                } else {
                    router.push('/kotoba');
                }
            } else {
                toast.error('Gagal menghapus Kotoba. Pastikan Anda memiliki hak akses.');
            }
        } catch (err) {
            toast.error('Terjadi kesalahan jaringan saat menghapus.');
        } finally {
            setDeleting(false);
        }
    };

    const handleSave = async () => {
        // Safeguard: Prevent saving error messages or extremely long HTML-like strings
        if (!editData.word?.trim()) {
            toast.error('Kata utama tidak boleh kosong.');
            return;
        }
        if (!editData.reading?.trim()) {
            toast.error('Reading tidak boleh kosong.');
            return;
        }
        if (editData.meaning.includes('Error 500') || editData.meaning.includes('<!DOCTYPE html>')) {
            toast.error('Format arti tidak valid. Harap periksa kembali.');
            return;
        }

        setSaving(true);
        try {
            const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'https://imronm.pythonanywhere.com/api')
                .replace(/\/$/, '');
            const token = Cookies.get('access_token');

            const res = await fetch(`${baseUrl}/content/vocab/${vocab.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(editData)
            });

            if (res.ok) {
                const updated = await res.json();
                setVocab(updated);
                setEditData({
                    word: updated.word || editData.word,
                    meaning: updated.meaning || editData.meaning,
                    reading: updated.reading || editData.reading,
                    furigana: updated.furigana || editData.furigana,
                    word_type: updated.word_type || editData.word_type
                });
                setIsEditing(false);
                toast.success('Berhasil memperbarui Kotoba!');
            } else {
                toast.error('Gagal memperbarui data. Pastikan Anda Admin.');
            }
        } catch (err) {
            toast.error('Terjadi kesalahan jaringan.');
        } finally {
            setSaving(false);
        }
    };

    const textColor = !mounted ? 'text-black' : (theme === 'dark' ? 'text-white' : 'text-black');
    const subTextColor = !mounted ? 'text-gray-400' : (theme === 'dark' ? 'text-gray-500' : 'text-gray-400');
    const cardBg = !mounted ? 'bg-white' : (theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-white');
    const sectionBg = !mounted ? 'bg-blue-50' : (theme === 'dark' ? 'bg-blue-950/10' : 'bg-blue-50');
    const borderStyle = !mounted ? 'border-gray-100' : (theme === 'dark' ? 'border-blue-950/20' : 'border-gray-100');

    return (
        <div className={`${cardBg} min-h-screen transition-colors duration-300`}>
            {/* Premium Header / Hero Section (matches KanjiDetailUI layout) */}
            <div className={`bg-gradient-to-b ${theme === 'dark' ? 'from-black to-[#0a0a0a]' : 'from-gray-50 to-white'} pt-12 pb-16 border-b ${borderStyle}`}>
                <div className="container mx-auto px-6 max-w-5xl">
                    <button
                        type="button"
                        onClick={handleBack}
                        className={`inline-flex items-center gap-2 text-sm font-black transition-all mb-10 group active:scale-95 ${subTextColor} hover:text-blue-600 cursor-pointer`}
                    >
                        <span className="group-hover:-translate-x-1 transition-transform">←</span> Kembali ke Daftar
                    </button>

                    <div className="flex flex-col md:flex-row items-center md:items-start gap-10 lg:gap-16">
                        {/* Left: Main Kotoba Hero Card */}
                        <div className="relative group flex flex-col items-center gap-4 w-full max-w-[340px] md:w-[320px] lg:w-[360px]">
                            {/* Admin Edit & Delete Buttons */}
                            {isAdmin && (
                                <div className="absolute -top-4 right-0 sm:-right-4 md:top-0 md:right-auto md:-left-20 z-30 flex gap-2">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setIsEditing(!isEditing); }}
                                        className={`p-3 rounded-2xl transition-all ${
                                            isEditing
                                                ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                                                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20'
                                        }`}
                                        title={isEditing ? "Batal Edit" : "Edit Kotoba (Admin)"}
                                    >
                                        {isEditing ? <X className="w-5 h-5" /> : <Edit2 className="w-5 h-5" />}
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                                        className="p-3 rounded-2xl bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-500/20 transition-all"
                                        title="Hapus Kotoba"
                                        disabled={deleting || saving}
                                    >
                                        <Trash className="w-5 h-5" />
                                    </button>
                                </div>
                            )}

                            {/* Glow Background */}
                            <div className="absolute inset-x-0 bottom-0 top-12 bg-blue-600 rounded-[3rem] blur-3xl opacity-10 group-hover:opacity-20 transition-opacity"></div>
                            
                            {/* Word Card */}
                            <div className={`relative ${cardBg} border-4 ${borderStyle} rounded-[3rem] shadow-2xl p-8 w-full min-h-[260px] lg:min-h-[300px] flex flex-col items-center justify-center select-none overflow-hidden transition-all duration-300 ${textColor}`}>
                                {/* Watermark */}
                                <div className="absolute top-2 right-4 opacity-5 text-8xl font-serif select-none pointer-events-none text-blue-900 leading-none">
                                    言
                                </div>

                                {isEditing ? (
                                    <div className="flex flex-col gap-2 w-full z-10">
                                        <input
                                            type="text"
                                            value={editData.word}
                                            onChange={(e) => setEditData({...editData, word: e.target.value})}
                                            className={`text-center text-base p-2.5 rounded-xl border-2 ${borderStyle} ${cardBg} font-black focus:border-blue-500 outline-none`}
                                            placeholder="Kata Utama"
                                        />
                                        <input
                                            type="text"
                                            value={editData.reading}
                                            onChange={(e) => setEditData({...editData, reading: e.target.value})}
                                            className={`text-center text-sm p-2 rounded-xl border-2 ${borderStyle} ${cardBg} font-black focus:border-blue-500 outline-none`}
                                            placeholder="Reading (Hiragana/Katakana)"
                                        />
                                        <input
                                            type="text"
                                            value={editData.furigana}
                                            onChange={(e) => setEditData({...editData, furigana: e.target.value})}
                                            className={`text-center text-xs p-2 rounded-xl border-2 ${borderStyle} ${cardBg} font-bold focus:border-blue-500 outline-none`}
                                            placeholder="Furigana (Optional)"
                                        />
                                        <select
                                            value={editData.word_type || ''}
                                            onChange={(e) => setEditData({...editData, word_type: e.target.value})}
                                            className={`text-center text-xs p-2 rounded-xl border-2 ${borderStyle} ${cardBg} font-bold focus:border-blue-500 outline-none`}
                                        >
                                            {WORD_TYPES.map(({ value, label }) => (
                                                <option key={value} value={value}>{label}</option>
                                            ))}
                                        </select>
                                    </div>
                                ) : (
                                    <div className="z-10 text-center w-full px-2 py-4">
                                        <p className="text-center tracking-wider font-japanese font-black text-3xl sm:text-4xl lg:text-5xl leading-relaxed" style={{ lineHeight: '4.5rem' }}>
                                            {characters.map((char, index) => {
                                                const isK = hasKanji(char);
                                                const seg = furiganaMap[index] || '';
                                                if (isK) {
                                                    return (
                                                        <ruby
                                                            key={index}
                                                            onClick={() => handleKanjiClick(char)}
                                                            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-white cursor-pointer transition-colors"
                                                        >
                                                            {char}
                                                            {seg ? (
                                                                <rt className="text-gray-600 dark:text-gray-300 font-bold select-none" style={{ fontSize: '0.45em', letterSpacing: 'normal' }}>
                                                                    {seg}
                                                                </rt>
                                                            ) : null}
                                                        </ruby>
                                                    );
                                                }
                                                return (
                                                    <span key={index} className={`transition-colors ${textColor}`}>
                                                        {char}
                                                    </span>
                                                );
                                            })}
                                        </p>
                                    </div>
                                )}

                                {/* Audio Button */}
                                <button
                                    onClick={playAudio}
                                    className={`absolute bottom-5 right-5 p-3 rounded-2xl transition-all duration-300 ${
                                        playing
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-95 animate-pulse'
                                            : `${theme === 'dark' ? 'bg-blue-950/30 text-blue-300 hover:bg-blue-950/60 hover:text-blue-200' : 'bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800'} hover:scale-110 active:scale-95`
                                    } flex items-center justify-center cursor-pointer shadow-md z-20`}
                                    title="Putar Suara"
                                >
                                    <Volume2 className={`w-5 h-5 ${playing ? 'scale-110' : ''}`} />
                                </button>
                            </div>
                        </div>

                        {/* Right: Title & Core Info */}
                        <div className="flex-1 text-center md:text-left py-2 w-full">
                            <div className="flex items-center gap-2.5 mb-6 justify-center md:justify-start flex-wrap">
                                <span className="bg-blue-600 text-white text-xs font-black px-4 py-1.5 rounded-full shadow-lg shadow-blue-500/10">
                                    {isEditing ? (
                                        <select
                                            value={editData.jlpt_level}
                                            onChange={(e) => setEditData({...editData, jlpt_level: parseInt(e.target.value)})}
                                            className="bg-transparent outline-none cursor-pointer"
                                        >
                                            {[1, 2, 3, 4, 5].map(l => <option key={l} value={l} className="text-black">JLPT N{l}</option>)}
                                        </select>
                                    ) : `JLPT N${vocab.jlpt_level}`}
                                </span>
                                {vocab.word_type && (
                                    <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-wider">
                                        {vocab.word_type.replace(/_/g, ' ')}
                                    </span>
                                )}
                            </div>

                            {isEditing ? (
                                <div className="flex flex-col gap-4">
                                    <textarea
                                        value={editData.meaning}
                                        onChange={(e) => setEditData({...editData, meaning: e.target.value})}
                                        className={`w-full text-2xl sm:text-3xl md:text-4xl font-black p-4 rounded-2xl border-2 ${borderStyle} ${cardBg} focus:border-blue-500 outline-none ${textColor}`}
                                        rows={2}
                                        placeholder="Arti / Makna Kata"
                                    />
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="inline-flex items-center justify-center gap-2 bg-green-600 text-white px-8 py-3.5 rounded-2xl font-black shadow-lg shadow-green-600/20 hover:bg-green-700 transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        {saving ? (
                                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <Check className="w-5 h-5" />
                                        )}
                                        Simpan Perubahan
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <h1 className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-3 tracking-tight leading-tight transition-colors ${textColor}`}>
                                        {vocab.meaning || 'Tidak ada arti'}
                                    </h1>
                                    
                                    {vocab.reading && (
                                        <p className="text-xl sm:text-2xl font-black font-japanese text-blue-600 dark:text-blue-400 mb-4 tracking-wide">
                                            {vocab.reading}
                                        </p>
                                    )}

                                    <p className={`${subTextColor} text-sm sm:text-base font-bold max-w-lg transition-colors`}>
                                        Kosakata penting untuk level N{vocab.jlpt_level}. Pelajari kanji penyusun dan perubahan bentuknya di bawah.
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Detailed Info Sections (matches KanjiDetailUI 3-column layout) */}
            <div className={`container mx-auto px-6 py-16 max-w-5xl transition-colors ${textColor}`}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* Left Column: Bedah Kanji & Info Cards */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Bedah Kanji */}
                        {uniqueKanjis.length > 0 && (
                            <section className={`${sectionBg} rounded-3xl p-6 border ${borderStyle}`}>
                                <h3 className={`text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2 ${subTextColor}`}>
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                                    Bedah Kanji ({uniqueKanjis.length} Karakter)
                                </h3>
                                <div className="space-y-3">
                                    {uniqueKanjis.map((char, i) => {
                                        const detail = kanjiDetails.find(kd => kd.character === char);
                                        const radInfo = detail?.radical ? getRadicalInfo(detail.radical) : null;
                                        return (
                                            <div
                                                key={i}
                                                onClick={() => handleKanjiClick(char)}
                                                className={`group flex items-start gap-3.5 ${cardBg} border ${borderStyle} hover:border-blue-600 p-4 rounded-2xl transition-all shadow-sm active:scale-95 cursor-pointer text-left`}
                                            >
                                                <span className="text-3xl sm:text-4xl font-serif font-black text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform w-10 sm:w-12 text-center pt-0.5">
                                                    {char}
                                                </span>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm font-black leading-snug truncate ${textColor}`}>
                                                        {detail?.meaning || 'Lihat Detail Kanji'}
                                                    </p>
                                                    
                                                    {/* Radikal Tag */}
                                                    {detail?.radical && (
                                                        <div className="inline-flex items-center gap-1 bg-blue-500/10 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 px-2 py-0.5 rounded-md text-[10px] font-black mt-1">
                                                            <span className="text-gray-400">部首:</span>
                                                            <span className="font-japanese font-black">{detail.radical}</span>
                                                            {radInfo?.meaning && (
                                                                <span className="opacity-80 font-bold">({radInfo.meaning})</span>
                                                            )}
                                                        </div>
                                                    )}

                                                    <p className={`text-[10px] font-black uppercase tracking-tighter mt-1 ${subTextColor}`}>
                                                        {detail ? (detail.onyomi?.[0] || detail.kunyomi?.[0] || 'N/A') : 'Klik untuk detail'}
                                                    </p>
                                                </div>
                                                <span className="text-gray-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all text-sm font-black mt-1">→</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                        )}

                        {/* Quick Info Card */}
                        <section className={`${cardBg} rounded-3xl p-6 border ${borderStyle} shadow-sm space-y-3`}>
                            <h4 className={`text-[10px] font-black uppercase tracking-widest ${subTextColor}`}>Detail Info</h4>
                            <div className="flex justify-between items-center text-xs font-bold py-1.5 border-b border-gray-100 dark:border-gray-800">
                                <span className={subTextColor}>Level JLPT</span>
                                <span className="font-black text-blue-600 dark:text-blue-400">N{vocab.jlpt_level}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs font-bold py-1.5 border-b border-gray-100 dark:border-gray-800">
                                <span className={subTextColor}>Tipe Kata</span>
                                <span className="font-black">{vocab.word_type ? vocab.word_type.replace(/_/g, ' ').toUpperCase() : '-'}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs font-bold py-1.5">
                                <span className={subTextColor}>Karakter Kanji</span>
                                <span className="font-black">{uniqueKanjis.length > 0 ? uniqueKanjis.join(', ') : 'Kana Saja'}</span>
                            </div>
                            {kanjiDetails.length > 0 && kanjiDetails.some(kd => kd.radical) && (
                                <div className="flex justify-between items-start text-xs font-bold py-1.5 border-b border-gray-100 dark:border-gray-800 gap-2">
                                    <span className={subTextColor}>部首 (Radikal)</span>
                                    <div className="flex gap-1.5 flex-wrap justify-end">
                                        {kanjiDetails.filter(kd => kd.radical).map((kd, i) => (
                                            <span
                                                key={i}
                                                title={getRadicalInfo(kd.radical)?.meaning || kd.radical}
                                                className="font-japanese font-black text-blue-600 dark:text-blue-400 text-base leading-none"
                                            >
                                                {kd.radical}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </section>
                    </div>

                    {/* Right Column: Konjugasi & Contoh Kalimat (atau info pengganti jika bukan kata kerja) */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Perubahan Bentuk Kata Kerja */}
                        {isVerbType && conjugationData && conjugationData.forms && conjugationData.forms.length > 0 && (
                            <section className={`${cardBg} rounded-[2.5rem] border ${borderStyle} p-8 shadow-xl shadow-blue-500/5 transition-colors`}>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                    <h3 className={`text-xl font-black flex items-center gap-3 transition-colors ${textColor}`}>
                                        <span className="p-2.5 bg-blue-600 text-white rounded-xl text-sm">⚡</span>
                                        Perubahan Bentuk (Konjugasi)
                                    </h3>
                                    {/* Toggle Buttons */}
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setIsFormal(!isFormal)}
                                            className={`px-3.5 py-1.5 rounded-full font-black text-[11px] uppercase tracking-wider transition-all border cursor-pointer ${
                                                isFormal
                                                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                                                    : `${theme === 'dark' ? 'bg-blue-950/20 text-blue-300 border-blue-900/30' : 'bg-gray-100 text-gray-600 border-gray-200'} hover:border-blue-500`
                                            }`}
                                        >
                                            Sopan
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setIsNegative(!isNegative)}
                                            className={`px-3.5 py-1.5 rounded-full font-black text-[11px] uppercase tracking-wider transition-all border cursor-pointer ${
                                                isNegative
                                                    ? 'bg-red-600 text-white border-red-600 shadow-md shadow-red-500/20'
                                                    : `${theme === 'dark' ? 'bg-red-950/20 text-red-300 border-red-900/30' : 'bg-gray-100 text-gray-600 border-gray-200'} hover:border-red-500`
                                            }`}
                                        >
                                            Negatif
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setIsPast(!isPast)}
                                            className={`px-3.5 py-1.5 rounded-full font-black text-[11px] uppercase tracking-wider transition-all border cursor-pointer ${
                                                isPast
                                                    ? 'bg-yellow-600 text-white border-yellow-600 shadow-md shadow-yellow-500/20'
                                                    : `${theme === 'dark' ? 'bg-yellow-950/20 text-yellow-300 border-yellow-900/30' : 'bg-gray-100 text-gray-600 border-gray-200'} hover:border-yellow-500`
                                            }`}
                                        >
                                            Lampau
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {conjugationData.forms.map((formGroup, groupIdx) => {
                                        const activeVariant = formGroup.variants[getActiveVariantKey];
                                        if (!activeVariant) return null;
                                        return (
                                            <div key={groupIdx} className={`p-4 rounded-2xl border ${borderStyle} ${sectionBg} flex flex-col justify-between`}>
                                                <span className="text-[10px] font-black text-blue-600 dark:text-blue-300 uppercase tracking-widest mb-1">
                                                    {formGroup.name}
                                                </span>
                                                <div className="flex justify-between items-baseline gap-2">
                                                    <span className={`text-lg font-black ${textColor}`}>{activeVariant.kanji}</span>
                                                    <span className={`text-xs font-bold ${subTextColor}`}>{activeVariant.kana}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                        )}

                        {/* Fallback Legacy Conjugations */}
                        {isVerbType && (!conjugationData || !conjugationData.forms) && vocab.conjugations && vocab.conjugations.length > 0 && (
                            <section className={`${cardBg} rounded-[2.5rem] border ${borderStyle} p-8 shadow-xl shadow-blue-500/5 transition-colors`}>
                                <h3 className={`text-xl font-black mb-6 flex items-center gap-3 transition-colors ${textColor}`}>
                                    <span className="p-2.5 bg-blue-600 text-white rounded-xl text-sm">⚡</span>
                                    Perubahan Bentuk (9 Bentuk)
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {vocab.conjugations.map((conj, idx) => (
                                        <div
                                            key={idx}
                                            className={`p-4 rounded-2xl border ${borderStyle} ${sectionBg} flex flex-col justify-between`}
                                        >
                                            <span className="text-[10px] font-black text-blue-600 dark:text-blue-300 uppercase tracking-widest mb-1">{conj.form}</span>
                                            <div className="flex justify-between items-baseline gap-2">
                                                <span className={`text-lg font-black ${textColor}`}>{conj.kanji}</span>
                                                <span className={`text-xs font-bold ${subTextColor}`}>{conj.kana}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Non-verb: Tampilkan info radikal kanji penyusun (full detail) */}
                        {!isVerbType && uniqueKanjis.length > 0 && kanjiDetails.length > 0 && (
                            <section className={`${cardBg} rounded-[2.5rem] border ${borderStyle} p-8 shadow-xl shadow-blue-500/5 transition-colors`}>
                                <h3 className={`text-xl font-black mb-6 flex items-center gap-3 transition-colors ${textColor}`}>
                                    <span className="p-2.5 bg-blue-600 text-white rounded-xl text-sm">🔩</span>
                                    Radikal Pembentuk Kanji (部首)
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {kanjiDetails.map((kd, idx) => {
                                        const radInfo = kd.radical ? getRadicalInfo(kd.radical) : null;
                                        return (
                                            <div
                                                key={idx}
                                                onClick={() => handleKanjiClick(kd.character)}
                                                className={`group p-5 rounded-2xl border ${borderStyle} ${sectionBg} hover:border-blue-600 transition-all cursor-pointer active:scale-95`}
                                            >
                                                {/* Kanji Character + Meaning */}
                                                <div className="flex items-start gap-4 mb-4">
                                                    <span className="text-5xl font-serif font-black text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                                                        {kd.character}
                                                    </span>
                                                    <div className="flex-1">
                                                        <p className={`text-base font-black leading-snug ${textColor}`}>{kd.meaning}</p>
                                                        <p className={`text-xs font-bold mt-1 ${subTextColor}`}>
                                                            {kd.onyomi?.[0] && `音: ${kd.onyomi[0]}`}
                                                            {kd.onyomi?.[0] && kd.kunyomi?.[0] && ' · '}
                                                            {kd.kunyomi?.[0] && `訓: ${kd.kunyomi[0]}`}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Radikal Info */}
                                                {kd.radical && (
                                                    <div className={`flex items-center gap-3 mt-2 pt-3 border-t ${borderStyle}`}>
                                                        <div className="flex items-center gap-2 bg-blue-500/10 dark:bg-blue-950/30 border border-blue-500/20 px-3 py-2 rounded-xl flex-shrink-0">
                                                            <span className="text-[10px] font-black text-gray-400 uppercase">部首</span>
                                                            <span className="text-2xl font-japanese font-black text-blue-600 dark:text-blue-300">{kd.radical}</span>
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className={`text-sm font-black truncate ${textColor}`}>
                                                                {radInfo?.meaning || 'Radikal Dasar'}
                                                            </p>
                                                            {radInfo?.name && (
                                                                <p className={`text-[10px] font-bold uppercase tracking-tight ${subTextColor}`}>
                                                                    {radInfo.name} ({radInfo.reading})
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                <p className={`text-[10px] font-black uppercase tracking-wider mt-3 ${subTextColor} group-hover:text-blue-600 transition-colors`}>
                                                    Klik untuk lihat detail →
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                                <p className="text-[10px] font-bold text-gray-400 mt-4 px-1">
                                    💡 Memahami radikal (部首) membantu menghafal bentuk & arti kanji lebih cepat.
                                </p>
                            </section>
                        )}

                        {/* Non-verb dengan kata kana saja: tampilkan kartu panduan penggunaan */}
                        {!isVerbType && uniqueKanjis.length === 0 && (
                            <section className={`${cardBg} rounded-[2.5rem] border ${borderStyle} p-8 shadow-xl shadow-blue-500/5 transition-colors`}>
                                <h3 className={`text-xl font-black mb-6 flex items-center gap-3 transition-colors ${textColor}`}>
                                    <span className="p-2.5 bg-blue-600 text-white rounded-xl text-sm">📖</span>
                                    Tentang Kata Ini
                                </h3>
                                <div className={`p-6 rounded-2xl border ${borderStyle} ${sectionBg} space-y-4`}>
                                    <div className="flex items-center gap-4">
                                        <span className="text-5xl font-japanese font-black text-blue-600 dark:text-blue-400">
                                            {vocab.word}
                                        </span>
                                        <div>
                                            <p className={`text-lg font-black ${textColor}`}>{vocab.reading}</p>
                                            <p className={`text-xs font-bold uppercase tracking-wider ${subTextColor}`}>Kata Kana / Hiragana Murni</p>
                                        </div>
                                    </div>
                                    <p className={`text-sm font-bold ${subTextColor} border-t ${borderStyle} pt-4`}>
                                        Kata ini ditulis sepenuhnya dalam kana (hiragana/katakana) tanpa menggunakan karakter kanji.
                                        {vocab.word_type && ` Kategori: ${vocab.word_type.replace(/_/g, ' ')}.`}
                                    </p>
                                </div>
                            </section>
                        )}

                        {/* Contoh Kalimat */}
                        {vocab.examples && vocab.examples.length > 0 ? (
                            <section className={`${cardBg} rounded-[2.5rem] border ${borderStyle} p-8 shadow-xl shadow-blue-500/5 transition-colors`}>
                                <h3 className={`text-xl font-black mb-6 flex items-center gap-3 transition-colors ${textColor}`}>
                                    <span className="p-2.5 bg-blue-600 text-white rounded-xl text-sm">🔖</span>
                                    Contoh Kalimat
                                </h3>
                                <div className="space-y-4">
                                    {vocab.examples.map((ex, i) => (
                                        <div key={i} className={`p-5 rounded-2xl border ${borderStyle} ${sectionBg}`}>
                                            <p className={`text-base sm:text-lg font-black font-japanese ${textColor} mb-1.5`}>
                                                {ex.sentence || ex.jp || ex.japanese}
                                            </p>
                                            <p className={`text-xs sm:text-sm font-bold ${subTextColor}`}>
                                                {ex.meaning || ex.id || ex.indonesian || ex.translation}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
}