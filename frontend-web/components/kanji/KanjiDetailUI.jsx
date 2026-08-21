'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toHiragana, toKatakana } from 'wanakana';
import { hasKanji } from '@/lib/utils';
import { resolveContentId } from '@/lib/api';
import { getRadicalInfo } from '@/lib/radicals';
import { useTheme } from '@/context/ThemeContext';
import KanjiStrokeViewer from './KanjiStrokeViewer'; 
import { useAuth } from '@/context/AuthContext';
import { Edit2, Check, X, Trash } from 'lucide-react';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';

export default function KanjiDetailUI({ kanji: initialKanji, onClose }) {
    const router = useRouter();
    const { theme, mounted } = useTheme();
    const { user } = useAuth();
    const [kanji, setKanji] = useState(initialKanji);
    const [isStrokeAnimating, setIsStrokeAnimating] = useState(false);
    const [fetchedSvg, setFetchedSvg] = useState(null);

    // Edit state
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({
        meaning: initialKanji?.meaning || '',
        onyomi: initialKanji?.onyomi || [],
        kunyomi: initialKanji?.kunyomi || [],
        strokes: initialKanji?.strokes || 0,
        jlpt_level: initialKanji?.jlpt_level || 5
    });
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const isAdmin = user?.is_staff || user?.is_superuser;

    console.log('[jbook-debug] Admin check:', {
        user: user?.username,
        is_staff: user?.is_staff,
        is_superuser: user?.is_superuser,
        isAdmin
    });

    // Ambil string data SVG dari database backend kamu
    const kanjiSvg = fetchedSvg || kanji?.svg_data || kanji?.kanjivg || '';

    useEffect(() => {
        setKanji(initialKanji);
        setEditData({
            meaning: initialKanji?.meaning || '',
            onyomi: initialKanji?.onyomi || [],
            kunyomi: initialKanji?.kunyomi || [],
            strokes: initialKanji?.strokes || 0,
            jlpt_level: initialKanji?.jlpt_level || 5
        });
    }, [initialKanji]);

    // Fallback: Jika data SVG tidak ada, coba ambil langsung dari KanjiVG GitHub
    useEffect(() => {
        if (!kanjiSvg && kanji?.character) {
            const unicodeHex = kanji.character.charCodeAt(0).toString(16).padStart(5, '0');
            const fallbackUrl = `https://raw.githubusercontent.com/KanjiVG/kanjivg/master/kanji/${unicodeHex}.svg`;
            
            console.log(`[jbook-debug] SVG data kosong, mencoba fallback ke: ${fallbackUrl}`);
            
            fetch(fallbackUrl)
                .then(res => {
                    if (res.ok) return res.text();
                    throw new Error("Failed to fetch from KanjiVG");
                })
                .then(svgText => {
                    console.log(`[jbook-debug] Berhasil mengambil SVG dari fallback!`);
                    setFetchedSvg(svgText);
                })
                .catch(err => {
                    console.warn(`[jbook-debug] Fallback gagal:`, err.message);
                });
        }
    }, [kanji?.character, kanjiSvg]);

    // Handle klik pada contoh kata (Kotoba)
    const handleExampleClick = async (word) => {
        const id = await resolveContentId('vocab', word);
        if (id) {
            router.push(`/kotoba/${id}`);
        } else {
            router.push(`/kotoba?search=${encodeURIComponent(word)}`);
        }
    };

    // Logger untuk mengecek interaksi klik pada kartu kanji besar
    const handleHugeKanjiClick = () => {
        console.log(`[jbook-debug] Kanji "${kanji?.character}" ditekan! Memicu interaksi.`);
        console.log(`[jbook-debug] kanjiSvg length: ${kanjiSvg?.length || 0}`);
        if (kanjiSvg) {
            setIsStrokeAnimating(prev => !prev);
        } else {
            console.warn("[jbook-debug] kanjiSvg is empty, cannot animate.");
        }
    };

    const handleDelete = async () => {
        if (!confirm('Hapus Kanji ini? Tindakan ini tidak bisa dibatalkan.')) return;
        setDeleting(true);
        try {
            const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'https://imronm.pythonanywhere.com/api')
                .replace(/\/$/, '');
            const token = Cookies.get('access_token');
            const res = await fetch(`${baseUrl}/content/kanji/${kanji.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (res.ok) {
                toast.success('Kanji berhasil dihapus.');
                if (onClose) {
                    onClose();
                } else {
                    router.push('/kanji');
                }
            } else {
                toast.error('Gagal menghapus Kanji. Pastikan Anda memiliki hak akses.');
            }
        } catch (err) {
            toast.error('Terjadi kesalahan jaringan saat menghapus.');
        } finally {
            setDeleting(false);
        }
    };

    const handleSave = async () => {
        // Safeguard: Prevent saving error messages or extremely long HTML-like strings
        if (editData.meaning.includes('Error 500') || editData.meaning.includes('<!DOCTYPE html>')) {
            toast.error('Format arti tidak valid. Harap periksa kembali.');
            return;
        }

        setSaving(true);
        try {
            const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'https://imronm.pythonanywhere.com/api')
                .replace(/\/$/, '');
            const token = Cookies.get('access_token');

            const res = await fetch(`${baseUrl}/content/kanji/${kanji.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(editData)
            });

            if (res.ok) {
                const updated = await res.json();
                setKanji(updated);
                setIsEditing(false);
                toast.success('Berhasil memperbarui Kanji!');
            } else {
                toast.error('Gagal memperbarui data. Pastikan Anda Admin.');
            }
        } catch (err) {
            toast.error('Terjadi kesalahan jaringan.');
        } finally {
            setSaving(false);
        }
    };

    // Tema & Styling Tokit (dari blueprint aslimu)
    const textColor = !mounted ? 'text-black' : (theme === 'dark' ? 'text-white' : 'text-black');
    const subTextColor = !mounted ? 'text-gray-400' : (theme === 'dark' ? 'text-gray-500' : 'text-gray-400');
    const cardBg = !mounted ? 'bg-white' : (theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-white');
    const sectionBg = !mounted ? 'bg-blue-50' : (theme === 'dark' ? 'bg-blue-950/10' : 'bg-blue-50');
    const borderStyle = !mounted ? 'border-gray-100' : (theme === 'dark' ? 'border-blue-950/20' : 'border-gray-100');

    return (
        <div className={`${cardBg} min-h-screen transition-colors duration-300`}>
            {/* Premium Header / Hero Section */}
            <div className={`bg-gradient-to-b ${theme === 'dark' ? 'from-black to-[#0a0a0a]' : 'from-gray-50 to-white'} pt-12 pb-20 border-b ${borderStyle}`}>
                <div className="container mx-auto px-6 max-w-5xl">
                    <button onClick={() => onClose ? onClose() : router.back()} className={`inline-flex items-center gap-2 text-sm font-black transition-all mb-12 group active:scale-95 ${subTextColor} hover:text-blue-600`}>
                        <span className="group-hover:-translate-x-1 transition-transform">←</span> Kembali
                    </button>

                    <div className="flex flex-col md:flex-row items-center md:items-start gap-12 lg:gap-20">
                        {/* Huge Character Card & Stroke Viewer Integrated */}
                        <div 
                            className="relative group flex flex-col items-center gap-4 cursor-pointer"
                        >
                            {/* Admin Edit Button */}
                            {isAdmin && (
                                <div className="absolute -top-4 right-0 sm:-right-4 md:top-0 md:right-auto md:-left-20 z-30 flex gap-2">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setIsEditing(!isEditing); }}
                                        className={`p-3 rounded-2xl transition-all ${
                                            isEditing 
                                                ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' 
                                                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20'
                                        }`}
                                        title={isEditing ? "Batal Edit" : "Edit Kanji (Admin)"}
                                    >
                                        {isEditing ? <X className="w-5 h-5" /> : <Edit2 className="w-5 h-5" />}
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                                        className="p-3 rounded-2xl bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-500/20 transition-all"
                                        title="Hapus Kanji"
                                        disabled={deleting || saving}
                                    >
                                        <Trash className="w-5 h-5" />
                                    </button>
                                </div>
                            )}

                            <div className="absolute inset-x-0 bottom-0 top-12 bg-blue-600 rounded-[3rem] blur-3xl opacity-10 group-hover:opacity-20 transition-opacity"></div>
                            <div 
                                onClick={handleHugeKanjiClick}
                                className={`relative ${cardBg} border-4 ${borderStyle} rounded-[3rem] shadow-2xl p-12 w-[280px] h-[280px] lg:w-[360px] lg:h-[360px] flex items-center justify-center select-none overflow-hidden transition-all duration-300 ${textColor}`}
                            >
                                
                                {isStrokeAnimating && kanjiSvg ? (
                                    <div className="w-full h-full flex items-center justify-center animate-in fade-in zoom-in duration-300">
                                        <KanjiStrokeViewer 
                                            svgContent={kanjiSvg} 
                                            size={mounted && window.innerWidth < 1024 ? 220 : 280} 
                                            isAnimating={true} 
                                        />
                                    </div>
                                ) : (
                                    <span className="text-[140px] lg:text-[180px] font-serif leading-none group-hover:scale-110 transition-transform duration-500">
                                        {kanji.character}
                                    </span>
                                )}

                                {/* Stroking count badge */}
                                <div className="absolute bottom-6 right-6 bg-blue-600 text-white text-[10px] font-black px-4 py-2 rounded-full shadow-lg z-10">
                                    {isEditing ? (
                                        <input 
                                            type="number"
                                            value={editData.strokes}
                                            onChange={(e) => setEditData({...editData, strokes: parseInt(e.target.value)})}
                                            className="bg-transparent w-8 text-center outline-none border-b border-white/30"
                                        />
                                    ) : (
                                        kanji.strokes || 0
                                    )} STROKES
                                </div>
                            </div>
                            
                            {kanjiSvg ? (
                                <div className="flex flex-col items-center gap-1">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-blue-600 transition-colors">
                                        {isStrokeAnimating ? 'Klik untuk kembali ke teks' : 'Klik karakter untuk animasi'}
                                    </span>
                                </div>
                            ) : null}
                        </div>

                        {/* Title & Core Info */}
                        <div className="flex-1 text-center md:text-left py-4">
                             <div className="inline-flex items-center gap-2.5 mb-6 flex-wrap justify-center md:justify-start">
                                <span className="bg-blue-600 text-white text-xs font-black px-4 py-1.5 rounded-full shadow-lg shadow-blue-500/10">
                                    {isEditing ? (
                                        <select 
                                            value={editData.jlpt_level}
                                            onChange={(e) => setEditData({...editData, jlpt_level: parseInt(e.target.value)})}
                                            className="bg-transparent outline-none cursor-pointer"
                                        >
                                            {[1,2,3,4,5].map(l => <option key={l} value={l} className="text-black">JLPT N{l}</option>)}
                                        </select>
                                    ) : `JLPT N${kanji.jlpt_level}`}
                                </span>

                                {kanji.radical && (
                                    <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs font-black px-4 py-1.5 rounded-full inline-flex items-center gap-1.5 shadow-sm">
                                        <span className="text-[10px] font-black uppercase text-gray-400">部首 (Radikal):</span>
                                        <span className="font-japanese font-black text-sm">{kanji.radical}</span>
                                        {getRadicalInfo(kanji.radical)?.meaning && (
                                            <span className="font-bold text-[11px] opacity-80">({getRadicalInfo(kanji.radical).meaning})</span>
                                        )}
                                    </span>
                                )}
                             </div>
                            
                            {isEditing ? (
                                <div className="flex flex-col gap-4">
                                    <textarea 
                                        value={editData.meaning}
                                        onChange={(e) => setEditData({...editData, meaning: e.target.value})}
                                        className={`w-full text-3xl md:text-4xl lg:text-5xl font-black p-4 rounded-2xl border-2 ${borderStyle} ${cardBg} focus:border-blue-500 outline-none ${textColor}`}
                                        rows={2}
                                    />
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="inline-flex items-center justify-center gap-2 bg-green-600 text-white px-8 py-4 rounded-2xl font-black shadow-lg shadow-green-600/20 hover:bg-green-700 transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        {saving ? (
                                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <Check className="w-6 h-6" />
                                        )}
                                        Simpan Perubahan
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <h1 className={`text-4xl md:text-5xl lg:text-7xl font-black mb-4 tracking-tight leading-tight transition-colors ${textColor}`}>
                                        {kanji.meaning}
                                    </h1>
                                    
                                    <p className={`${subTextColor} text-lg font-bold max-w-lg transition-colors`}>
                                        Karakter dasar penting untuk level N{kanji.jlpt_level}. Pelajari cara baca dan penggunaannya di bawah.
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Detailed Info Sections */}
            <div className={`container mx-auto px-6 py-20 max-w-5xl transition-colors ${textColor}`}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Read Alignments (On/Kun) & Radikal */}
                    <div className="lg:col-span-1 space-y-8">
                        {/* Radikal Info Card */}
                        {kanji.radical && (
                            <section className={`${sectionBg} rounded-3xl p-6 border ${borderStyle}`}>
                                <h3 className={`text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2 ${subTextColor}`}>
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                                    Radikal Utama (部首)
                                </h3>
                                {(() => {
                                    const rad = getRadicalInfo(kanji.radical);
                                    return (
                                        <div 
                                            onClick={() => router.push(`/kanji?radical=${encodeURIComponent(kanji.radical)}`)}
                                            className={`group flex items-center gap-4 ${cardBg} border ${borderStyle} hover:border-blue-600 p-4 rounded-2xl transition-all shadow-sm active:scale-95 cursor-pointer`}
                                            title="Klik untuk filter kanji dengan radikal ini"
                                        >
                                            <span className="text-4xl font-japanese font-black text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform w-12 text-center">
                                                {kanji.radical}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-black leading-snug truncate ${textColor}`}>
                                                    {rad?.meaning || 'Radikal Dasar'}
                                                </p>
                                                <p className={`text-[10px] font-black uppercase tracking-tighter mt-0.5 ${subTextColor}`}>
                                                    {rad?.name ? `${rad.name} (${rad.reading})` : 'Klik untuk filter kanji'}
                                                </p>
                                            </div>
                                            <span className="text-gray-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all text-sm font-black">→</span>
                                        </div>
                                    );
                                })()}
                                <p className="text-[10px] font-bold text-gray-400 mt-3 px-1">
                                    💡 Radikal membantu mengingat pola bentuk & makna dasar kanji.
                                </p>
                            </section>
                        )}

                        {/* Onyomi */}
                        <section className={`${sectionBg} rounded-3xl p-8 border ${borderStyle}`}>
                            <h3 className={`text-xs font-black uppercase tracking-widest mb-6 flex items-center gap-2 ${subTextColor}`}>
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                                Onyomi (Cara Baca China)
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {kanji.onyomi && kanji.onyomi.length > 0 ? (
                                    kanji.onyomi.map((reading, index) => (
                                        <div key={index} className={`${cardBg} ${borderStyle} border px-4 py-2 rounded-2xl shadow-sm text-lg font-black text-blue-600 dark:text-blue-400`}>
                                            {toKatakana(reading.toUpperCase())}
                                        </div>
                                    ))
                                ) : (
                                    <span className={`font-bold italic ${subTextColor}`}>Bebas Onyomi</span>
                                )}
                            </div>
                        </section>
 
                        {/* Kunyomi */}
                        <section className={`${sectionBg} rounded-3xl p-8 border ${borderStyle}`}>
                            <h3 className={`text-xs font-black uppercase tracking-widest mb-6 flex items-center gap-2 ${subTextColor}`}>
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                                Kunyomi (Cara Baca Jepang)
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {kanji.kunyomi && kanji.kunyomi.length > 0 ? (
                                    kanji.kunyomi.map((reading, index) => (
                                        <div key={index} className={`${cardBg} ${borderStyle} border px-4 py-2 rounded-2xl shadow-sm text-lg font-black ${textColor}`}>
                                            {toHiragana(reading.toLowerCase())}
                                        </div>
                                    ))
                                ) : (
                                    <span className={`font-bold italic ${subTextColor}`}>Bebas Kunyomi</span>
                                )}
                            </div>
                        </section>
                    </div>
 
                    {/* Examples Section */}
                    <div className="lg:col-span-2">
                        <section className={`${cardBg} rounded-[2.5rem] border ${borderStyle} p-8 shadow-2xl shadow-blue-500/5 h-full transition-colors`}>
                            <h3 className={`text-lg font-black mb-6 flex items-center gap-3 transition-colors ${textColor}`}>
                                <span className="p-2.5 bg-blue-600 text-white rounded-xl text-sm">🔖</span>
                                Contoh Kata (Kotoba)
                            </h3>
                            
                            <div className="space-y-3">
                                {kanji.examples && kanji.examples.length > 0 ? (
                                    kanji.examples.slice(0, 4).map((ex, i) => (
                                        <div 
                                            key={i} 
                                            onClick={() => handleExampleClick(ex.word)}
                                            className={`group p-4 ${sectionBg} hover:${cardBg} rounded-2xl border ${theme === 'dark' ? 'border-blue-950/20' : 'border-gray-100'} hover:border-blue-600 transition-all cursor-pointer`}
                                        >
                                            <div className="flex justify-between items-center gap-3">
                                                <div>
                                                    <ruby className={`text-xl font-black transition-colors ${textColor} group-hover:text-blue-600`}>
                                                        {ex.word}
                                                        {hasKanji(ex.word) && (
                                                            <rt className={`text-[10px] font-black pb-1 select-none ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>{ex.reading}</rt>
                                                        )}
                                                    </ruby>
                                                    <p className={`mt-1 text-xs font-bold ${subTextColor}`}>{ex.meaning}</p>
                                                </div>
                                                <div className="opacity-0 group-hover:opacity-100 p-2 bg-blue-600 text-white rounded-xl transition-opacity active:scale-95 shadow-lg shadow-blue-500/20 font-black text-[10px] flex-shrink-0">
                                                    Detail →
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className={`text-center py-12 ${sectionBg} rounded-3xl border-2 border-dashed ${borderStyle}`}>
                                        <p className={`font-bold italic text-sm ${subTextColor}`}>Belum tersedia contoh kata.</p>
                                    </div>
                                )}
                            </div>
                            {kanji.examples && kanji.examples.length > 4 && (
                                <p className={`text-[10px] font-bold mt-4 text-center ${subTextColor}`}>
                                    +{kanji.examples.length - 4} contoh lainnya tersedia di detail kotoba
                                </p>
                            )}
                        </section>
                    </div>
                </div>
            </div>
            
        </div>
    );
}