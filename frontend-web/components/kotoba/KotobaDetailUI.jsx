'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { hasKanji, extractKanji } from '@/lib/utils';
import { resolveContentId, API_URL } from '@/lib/api';
import { dbGetAll } from '@/lib/offline-db';
import { useTheme } from '@/context/ThemeContext';
import { Volume2, Edit2, Check, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';

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
        meaning: initialVocab?.meaning || '',
        reading: initialVocab?.reading || '',
        furigana: initialVocab?.furigana || '',
        word_type: initialVocab?.word_type || ''
    });
    const [saving, setSaving] = useState(false);

    const isAdmin = user?.is_staff || user?.is_superuser;

    // ✅ useEffect HARUS di atas early return
    useEffect(() => {
        setVocab(initialVocab);
        setEditData({
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

    const handleSave = async () => {
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
                        <div className="absolute top-6 left-6 z-20">
                            <button
                                onClick={() => setIsEditing(!isEditing)}
                                className={`p-2 rounded-xl transition-all ${
                                    isEditing 
                                        ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' 
                                        : 'bg-blue-600/10 text-blue-600 hover:bg-blue-600 hover:text-white shadow-sm'
                                }`}
                                title={isEditing ? "Batal Edit" : "Edit Kotoba (Admin)"}
                            >
                                {isEditing ? <X className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                            </button>
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