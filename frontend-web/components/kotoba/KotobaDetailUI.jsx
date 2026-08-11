'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { hasKanji, extractKanji } from '@/lib/utils';
import { resolveContentId, API_URL } from '@/lib/api';
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
    const { theme, mounted } = useTheme();
    const { user } = useAuth();
    const [vocab, setVocab] = useState(initialVocab);
    const [kanjiDetails, setKanjiDetails] = useState([]);
    const [playing, setPlaying] = useState(false);

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

            const uniqueKanjis = extractKanji(vocab.word);
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

    // ✅ Early return SETELAH semua hook
    if (!vocab) return null;

    const characters = (vocab.word || '').split('');
    const uniqueKanjis = extractKanji(vocab.word || '');

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
        <div className={`${cardBg} min-h-screen py-8 flex flex-col items-center justify-center transition-colors duration-300`}>
            <div className="container mx-auto px-4 w-full max-w-2xl">
                {onClose ? (
                    <button onClick={onClose} className={`inline-flex items-center font-black transition-all mb-8 hover:text-blue-600 ${subTextColor}`}>
                        &larr; Kembali ke Daftar
                    </button>
                ) : (
                    <Link href="/kotoba" className={`inline-flex items-center font-black transition-all mb-8 hover:text-blue-600 ${subTextColor}`}>
                        &larr; Kembali ke Daftar
                    </Link>
                )}

                <div className={`${cardBg} rounded-[2.5rem] shadow-2xl p-6 sm:p-8 md:p-12 text-center border-t-8 border-blue-600 relative overflow-hidden w-full transition-all border-b border-x ${borderStyle}`}>
                    {/* Admin Edit Button */}
                    {isAdmin && (
                            <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-30 flex gap-2">
                                <button
                                    onClick={(e) => { e.stopPropagation(); setIsEditing(!isEditing); }}
                                    className={`p-2 sm:p-3 rounded-xl transition-all ${
                                        isEditing
                                            ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                                            : 'bg-blue-600/10 text-blue-600 hover:bg-blue-600 hover:text-white shadow-sm'
                                    }`}
                                    title={isEditing ? "Batal Edit" : "Edit Kotoba (Admin)"}
                                >
                                    {isEditing ? <X className="w-4 h-4 sm:w-5 sm:h-5" /> : <Edit2 className="w-4 h-4 sm:w-5 sm:h-5" />}
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                                    className="p-2 sm:p-3 rounded-xl bg-red-600 text-white shadow-lg shadow-red-500/20 hover:bg-red-700 transition-all"
                                    title="Hapus Kotoba"
                                    disabled={deleting || saving}
                                >
                                    <Trash className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                    )}

                    <div className="absolute top-0 right-0 p-3 sm:p-4 opacity-5 text-7xl sm:text-9xl font-serif select-none pointer-events-none text-blue-900 leading-none">
                        言
                    </div>

                    <div className={`relative z-10 text-left sm:text-center transition-colors ${textColor}`}>
                        <span className={`text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] mb-3 sm:mb-4 block text-center ${subTextColor}`}>Vocabulary</span>

                        <div className="mb-6 sm:mb-8 flex items-center justify-center gap-4 w-full px-2 pt-6 flex-wrap">
                            <div className="flex flex-col items-center">
                                {isEditing ? (
                                    <div className="flex flex-col gap-2 mb-4 w-full max-w-xs">
                                        <input
                                            type="text"
                                            value={editData.word}
                                            onChange={(e) => setEditData({...editData, word: e.target.value})}
                                            className={`text-center text-sm p-2 rounded-xl border-2 ${borderStyle} ${cardBg} font-black focus:border-blue-500 outline-none`}
                                            placeholder="Kata / Judul Kotoba"
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
                                ) : null}
                                <ruby className={`text-3xl sm:text-4xl md:text-5xl font-black tracking-wider transition-colors ${textColor}`}>
                                    {characters.map((char, index) => (
                                        hasKanji(char) ? (
                                            <span
                                                key={index}
                                                onClick={() => handleKanjiClick(char)}
                                                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-white cursor-pointer transition-all duration-200 border-b-4 border-transparent hover:border-blue-600 dark:hover:border-white px-1 rounded-t-xl"
                                            >
                                                {char}
                                            </span>
                                        ) : (
                                            <span key={index} className="px-0.5">{char}</span>
                                        )
                                    ))}
                                    {!isEditing && hasKanji(vocab.word) && (
                                        <rt className="text-base sm:text-lg md:text-xl text-gray-900 dark:text-white font-black leading-none">
                                            {vocab.furigana || vocab.reading || ''}
                                        </rt>
                                    )}
                                </ruby>
                            </div>
                            <button
                                onClick={playAudio}
                                className={`p-3 rounded-2xl transition-all duration-300 ${
                                    playing
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-95 animate-pulse'
                                        : `${theme === 'dark' ? 'bg-blue-950/20 text-blue-300 hover:bg-blue-950/40 hover:text-blue-200' : 'bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800'} hover:scale-110 active:scale-95`
                                } flex items-center justify-center cursor-pointer shadow-sm`}
                                title="Putar Suara"
                            >
                                <Volume2 className={`w-6 h-6 ${playing ? 'scale-110' : ''}`} />
                            </button>
                        </div>

                        <div className={`${sectionBg} p-5 sm:p-6 md:p-8 rounded-2xl border ${theme === 'dark' ? 'border-blue-950/30' : 'border-blue-100'} shadow-inner mb-8 text-left transition-colors relative`}>
                            <h3 className="text-[10px] sm:text-xs font-black text-blue-600 dark:text-blue-300 uppercase tracking-[0.2em] mb-2 sm:mb-3">Arti / Makna</h3>
                            {isEditing ? (
                                <textarea
                                    value={editData.meaning}
                                    onChange={(e) => setEditData({...editData, meaning: e.target.value})}
                                    className={`w-full text-lg sm:text-xl md:text-2xl font-black leading-relaxed tracking-tight p-4 rounded-xl border-2 ${borderStyle} ${cardBg} focus:border-blue-500 outline-none`}
                                    rows={2}
                                />
                            ) : (
                                <p className={`text-lg sm:text-xl md:text-2xl font-black leading-relaxed tracking-tight ${textColor}`}>{vocab.meaning || 'Tidak ada arti'}</p>
                            )}
                        </div>

                        {isEditing && (
                            <div className="mb-8 flex justify-center">
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="flex items-center gap-2 bg-green-600 text-white px-8 py-3 rounded-2xl font-black shadow-lg shadow-green-600/20 hover:bg-green-700 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {saving ? (
                                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <Check className="w-5 h-5" />
                                    )}
                                    Simpan Perubahan
                                </button>
                            </div>
                        )}

                        {uniqueKanjis.length > 0 && (
                            <div className="mb-10 text-left">
                                <h3 className={`text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-2 transition-colors ${subTextColor}`}>
                                    <span className="w-2 h-2 rounded-full bg-blue-600 shadow-lg shadow-blue-500/20"></span>
                                    Bedah Kanji (Karakter Penyusun)
                                </h3>
                                <div className="grid grid-cols-1 gap-3">
                                    {uniqueKanjis.map((char, i) => {
                                        const detail = kanjiDetails.find(kd => kd.character === char);
                                        return (
                                            <button
                                                key={i}
                                                onClick={() => handleKanjiClick(char)}
                                                className={`group flex items-center gap-4 ${theme === 'dark' ? 'bg-blue-950/10 hover:bg-blue-950/20' : 'bg-gray-50 hover:bg-white'} border ${borderStyle} hover:border-blue-600 p-4 rounded-2xl transition-all shadow-sm active:scale-95 text-left`}
                                            >
                                                <span className={`text-4xl font-serif group-hover:text-blue-600 transition-colors w-12 text-center ${textColor}`}>{char}</span>
                                                <div className="flex-1">
                                                    <p className={`text-sm font-black leading-snug ${textColor}`}>
                                                        {detail?.meaning || 'Tidak ditemukan'}
                                                    </p>
                                                    <p className={`text-[10px] font-black uppercase tracking-tighter mt-0.5 transition-colors ${subTextColor}`}>
                                                        {detail ? (detail.onyomi?.[0] || detail.kunyomi?.[0] || 'N/A') : '-'} • Klik untuk detail
                                                    </p>
                                                </div>
                                                <span className="text-xl text-gray-400 group-hover:text-blue-400 transition-colors">→</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* ✅ Section konjugasi HANYA muncul jika isVerbType true.
                            Ini gate utama: apapun isi vocab.conjugations_complete atau
                            hasil hitungan lokal, kalau word_type bukan kata kerja,
                            React tidak akan pernah sampai ke sini. */}
                        {isVerbType && conjugationData && conjugationData.forms && conjugationData.forms.length > 0 && (
                            <div className="mb-10 text-left">
                                <h3 className={`text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-2 transition-colors ${subTextColor}`}>
                                    <span className="w-2 h-2 rounded-full bg-blue-600 shadow-lg shadow-blue-500/20"></span>
                                    Perubahan Bentuk Kata Kerja (9 Bentuk)
                                </h3>
                                {/* Toggle Buttons */}
                                <div className="flex flex-wrap gap-2 mb-4">
                                    <button
                                        onClick={() => setIsFormal(!isFormal)}
                                        className={`px-4 py-2 rounded-full font-black text-xs uppercase tracking-widest transition-all border ${
                                            isFormal
                                                ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20'
                                                : `${theme === 'dark' ? 'bg-blue-950/10 text-blue-300 border-blue-900/30' : 'bg-gray-100 text-gray-600 border-gray-200'} hover:border-blue-500`
                                        }`}
                                    >
                                        Sopan
                                    </button>
                                    <button
                                        onClick={() => setIsNegative(!isNegative)}
                                        className={`px-4 py-2 rounded-full font-black text-xs uppercase tracking-widest transition-all border ${
                                            isNegative
                                                ? 'bg-red-600 text-white border-red-600 shadow-lg shadow-red-500/20'
                                                : `${theme === 'dark' ? 'bg-red-950/10 text-red-300 border-red-900/30' : 'bg-gray-100 text-gray-600 border-gray-200'} hover:border-red-500`
                                        }`}
                                    >
                                        Negatif
                                    </button>
                                    <button
                                        onClick={() => setIsPast(!isPast)}
                                        className={`px-4 py-2 rounded-full font-black text-xs uppercase tracking-widest transition-all border ${
                                            isPast
                                                ? 'bg-yellow-600 text-white border-yellow-600 shadow-lg shadow-yellow-500/20'
                                                : `${theme === 'dark' ? 'bg-yellow-950/10 text-yellow-300 border-yellow-900/30' : 'bg-gray-100 text-gray-600 border-gray-200'} hover:border-yellow-500`
                                        }`}
                                    >
                                        Lampau
                                    </button>
                                </div>
                                {/* Display Forms */}
                                <div className="grid grid-cols-1 gap-3">
                                    {conjugationData.forms.map((formGroup, groupIdx) => {
                                        const activeVariant = formGroup.variants[getActiveVariantKey];
                                        if (!activeVariant) return null;
                                        return (
                                            <div key={groupIdx} className={`p-4 rounded-2xl border ${borderStyle} ${theme === 'dark' ? 'bg-blue-950/5' : 'bg-blue-50/30'} flex items-center justify-between`}>
                                                <h4 className="text-xs font-black text-blue-600 dark:text-blue-300 uppercase tracking-widest">
                                                    {formGroup.name}
                                                </h4>
                                                <div className="text-right">
                                                    <span className={`text-lg font-black ${textColor}`}>{activeVariant.kanji}</span>
                                                    <span className={`text-xs font-bold ${subTextColor} ml-2`}>{activeVariant.kana}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                        {/* Fallback ke format lama — HANYA jika kata kerja juga.
                            Ini sebelumnya bisa nyala untuk noun/adjective jika field
                            vocab.conjugations lama masih ada di data lama (legacy),
                            jadi harus di-gate juga dengan isVerbType. */}
                        {isVerbType && (!conjugationData || !conjugationData.forms) && vocab.conjugations && vocab.conjugations.length > 0 && (
                            <div className="mb-10 text-left">
                                <h3 className={`text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-2 transition-colors ${subTextColor}`}>
                                    <span className="w-2 h-2 rounded-full bg-blue-600 shadow-lg shadow-blue-500/20"></span>
                                    Perubahan Bentuk Kata Kerja (9 Bentuk N5 & N4)
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {vocab.conjugations.map((conj, idx) => (
                                        <div
                                            key={idx}
                                            className={`p-4 rounded-2xl border ${borderStyle} ${theme === 'dark' ? 'bg-blue-950/5' : 'bg-blue-50/30'} flex flex-col justify-between`}
                                        >
                                            <span className="text-[10px] font-black text-blue-600 dark:text-blue-300 uppercase tracking-widest mb-1">{conj.form}</span>
                                            <div className="flex justify-between items-baseline gap-2">
                                                <span className={`text-xl font-black ${textColor}`}>{conj.kanji}</span>
                                                <span className={`text-xs font-bold ${subTextColor}`}>{conj.kana}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-center gap-4 flex-wrap mt-4">
                            <span className={`px-4 py-2 ${theme === 'dark' ? 'bg-blue-950/20 text-blue-300' : 'bg-gray-100 text-gray-600'} rounded-full font-black text-xs uppercase tracking-widest`}>
                                JLPT N{vocab.jlpt_level}
                            </span>
                            {vocab.word_type && (
                                <span className={`px-4 py-2 ${theme === 'dark' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700'} rounded-full font-black text-xs uppercase tracking-widest border border-blue-100 dark:border-blue-900/30 transition-colors shadow-sm`}>
                                    {vocab.word_type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}