'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toHiragana, toKatakana } from 'wanakana';
import { hasKanji } from '@/lib/utils';
import { resolveContentId } from '@/lib/api';
import KanjiStrokeViewer from './KanjiStrokeViewer';
import { useAuth } from '@/context/AuthContext';
import { Edit2, Check, X, Trash, ArrowLeft, BookOpen, Layers, Sparkles } from 'lucide-react';
import Cookies from 'js-cookie';
import { appToast as toast } from '@/components/common/AppMessage';
import { getRadicalInfo } from '@/lib/radicals';

export default function KanjiDetailUI({ kanji: initialKanji, level = 'n5', backHref, backLabel }) {
    const router = useRouter();
    const { user } = useAuth();
    const [kanji, setKanji] = useState(initialKanji);
    const [isStrokeAnimating, setIsStrokeAnimating] = useState(false);
    const [fetchedSvg, setFetchedSvg] = useState(null);

    // Edit state untuk Admin
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({
        meaning: initialKanji?.meaning || '',
        onyomi: initialKanji?.onyomi || [],
        kunyomi: initialKanji?.kunyomi || [],
        strokes: initialKanji?.strokes || 0,
        jlpt_level: initialKanji?.jlpt_level || 5,
    });
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const isAdmin = Boolean(user?.is_staff || user?.is_superuser);

    // Data SVG kanji (dari database atau fallback)
    const kanjiSvg = fetchedSvg || kanji?.svg_data || kanji?.kanjivg || '';

    useEffect(() => {
        setKanji(initialKanji);
        setEditData({
            meaning: initialKanji?.meaning || '',
            onyomi: initialKanji?.onyomi || [],
            kunyomi: initialKanji?.kunyomi || [],
            strokes: initialKanji?.strokes || 0,
            jlpt_level: initialKanji?.jlpt_level || 5,
        });
    }, [initialKanji]);

    // Fallback: Jika data SVG tidak ada di API, ambil langsung dari KanjiVG GitHub
    useEffect(() => {
        if (!kanjiSvg && kanji?.character) {
            const unicodeHex = kanji.character.charCodeAt(0).toString(16).padStart(5, '0');
            const fallbackUrl = `https://raw.githubusercontent.com/KanjiVG/kanjivg/master/kanji/${unicodeHex}.svg`;

            fetch(fallbackUrl)
                .then((res) => {
                    if (res.ok) return res.text();
                    throw new Error('Failed to fetch from KanjiVG');
                })
                .then((svgText) => {
                    setFetchedSvg(svgText);
                })
                .catch(() => {
                    // Fallback gagal, silent
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

    const handleDelete = async () => {
        if (!confirm('Hapus Kanji ini? Tindakan ini tidak bisa dibatalkan.')) return;
        setDeleting(true);
        try {
            const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'https://japan.pythonanywhere.com/api').replace(/\/$/, '');
            const token = Cookies.get('access_token');
            const res = await fetch(`${baseUrl}/content/kanji/${kanji.id}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (res.ok) {
                toast.success('Kanji berhasil dihapus.');
                router.push(backHref || `/kanji/${level}`);
            } else {
                toast.error('Gagal menghapus Kanji. Pastikan Anda memiliki hak akses.');
            }
        } catch {
            toast.error('Terjadi kesalahan jaringan saat menghapus.');
        } finally {
            setDeleting(false);
        }
    };

    const handleSave = async () => {
        if (editData.meaning.includes('Error 500') || editData.meaning.includes('<!DOCTYPE html>')) {
            toast.error('Format arti tidak valid. Harap periksa kembali.');
            return;
        }

        setSaving(true);
        try {
            const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'https://japan.pythonanywhere.com/api').replace(/\/$/, '');
            const token = Cookies.get('access_token');

            const res = await fetch(`${baseUrl}/content/kanji/${kanji.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(editData),
            });

            if (res.ok) {
                const updated = await res.json();
                setKanji(updated);
                setIsEditing(false);
                toast.success('Berhasil memperbarui Kanji!');
            } else {
                toast.error('Gagal memperbarui data. Pastikan Anda Admin.');
            }
        } catch {
            toast.error('Terjadi kesalahan jaringan.');
        } finally {
            setSaving(false);
        }
    };

    const currentLevel = String(kanji?.jlpt_level || level || '5').replace(/^n/i, '');
    const radicalInfo = kanji?.radical ? getRadicalInfo(kanji.radical) : null;
    const safeBackHref = backHref || `/kanji/n${currentLevel}`;
    const safeBackLabel = backLabel || `Kembali ke daftar N${currentLevel}`;

    return (
        <main className="washi-texture min-h-screen bg-[var(--background)] text-[var(--foreground)]">
            <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
                {/* Breadcrumb Navigation */}
                <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center text-xs sm:text-sm text-gray-500">
                    <Link href="/" className="font-semibold hover:text-accent-blue hover:underline">
                        Beranda
                    </Link>
                    <span aria-hidden="true" className="px-2">/</span>
                    <Link href="/kanji" className="font-semibold hover:text-accent-blue hover:underline">
                        Kanji
                    </Link>
                    <span aria-hidden="true" className="px-2">/</span>
                    <Link href={safeBackHref} className="font-semibold hover:text-accent-blue hover:underline">
                        N{currentLevel}
                    </Link>
                    <span aria-hidden="true" className="px-2">/</span>
                    <span aria-current="page" className="font-bold font-japanese text-[var(--foreground)]">
                        {kanji?.character}
                    </span>
                </nav>

                {/* Hero / Header Card */}
                <header className="rounded-3xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6 sm:p-8 lg:p-10 shadow-sm relative overflow-hidden mb-8">
                    {/* Admin Action Buttons */}
                    {isAdmin && (
                        <div className="absolute top-6 right-6 z-30 flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setIsEditing(!isEditing)}
                                className={`p-2.5 rounded-xl transition ${
                                    isEditing
                                        ? 'bg-rose-500 text-white'
                                        : 'bg-[var(--background)] border border-[var(--border-color)] text-gray-600 dark:text-gray-300 hover:text-accent-blue'
                                }`}
                                title={isEditing ? 'Batal Edit' : 'Edit Kanji (Admin)'}
                            >
                                {isEditing ? <X className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
                            </button>
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={deleting || saving}
                                className="p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--background)] text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition"
                                title="Hapus Kanji"
                            >
                                <Trash className="h-4 w-4" />
                            </button>
                        </div>
                    )}

                    <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8 lg:gap-12">
                        {/* Huge Character Card & Stroke Animation Interactive */}
                        <div className="flex flex-col items-center gap-3 shrink-0">
                            <div
                                onClick={() => kanjiSvg && setIsStrokeAnimating(!isStrokeAnimating)}
                                className={`relative flex items-center justify-center rounded-3xl border-2 border-[var(--border-color)] bg-[var(--background)] p-6 shadow-md transition-all duration-300 w-48 h-48 sm:w-56 sm:h-56 lg:w-64 lg:h-64 select-none ${
                                    kanjiSvg ? 'cursor-pointer hover:border-accent-blue/50 hover:shadow-xl' : ''
                                }`}
                                title={kanjiSvg ? 'Klik untuk memutar animasi coretan' : ''}
                            >
                                {isStrokeAnimating && kanjiSvg ? (
                                    <div className="w-full h-full flex items-center justify-center animate-in fade-in zoom-in-95 duration-200">
                                        <KanjiStrokeViewer svgContent={kanjiSvg} size={180} isAnimating={true} />
                                    </div>
                                ) : (
                                    <span className="font-japanese text-7xl sm:text-8xl lg:text-9xl font-black text-[var(--foreground)] break-words">
                                        {kanji?.character}
                                    </span>
                                )}

                                {/* Stroke Count Badge */}
                                <div className="absolute bottom-3 right-3 rounded-full bg-accent-blue px-3 py-1 text-[10px] font-black uppercase text-white shadow-sm">
                                    {isEditing ? (
                                        <input
                                            type="number"
                                            value={editData.strokes}
                                            onChange={(e) => setEditData({ ...editData, strokes: parseInt(e.target.value, 10) || 0 })}
                                            className="w-8 bg-transparent text-center outline-none border-b border-white"
                                        />
                                    ) : (
                                        `${kanji?.strokes || 0} Coretan`
                                    )}
                                </div>
                            </div>

                            {kanjiSvg && (
                                <button
                                    type="button"
                                    onClick={() => setIsStrokeAnimating(!isStrokeAnimating)}
                                    className="inline-flex items-center gap-1.5 text-xs font-bold text-accent-blue hover:underline cursor-pointer"
                                >
                                    <Sparkles className="h-3.5 w-3.5" />
                                    <span>{isStrokeAnimating ? 'Tampilkan Karakter Statis' : 'Putar Animasi Coretan'}</span>
                                </button>
                            )}
                        </div>

                        {/* Title & Core Details */}
                        <div className="flex-1 text-center lg:text-left min-w-0 w-full">
                            {/* Badges row */}
                            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 mb-4">
                                <span className="rounded-full bg-accent-blue/15 border border-accent-blue/30 px-3.5 py-1 text-xs font-bold text-accent-blue">
                                    {isEditing ? (
                                        <select
                                            value={editData.jlpt_level}
                                            onChange={(e) => setEditData({ ...editData, jlpt_level: parseInt(e.target.value, 10) })}
                                            className="bg-transparent outline-none cursor-pointer text-foreground"
                                        >
                                            {[1, 2, 3, 4, 5].map((l) => (
                                                <option key={l} value={l} className="text-black">
                                                    JLPT N{l}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        `JLPT N${currentLevel}`
                                    )}
                                </span>

                                {kanji?.radical && (
                                    <Link
                                        href={`/kanji/n${currentLevel}?radical=${encodeURIComponent(kanji.radical)}`}
                                        className="rounded-full border border-[var(--border-color)] bg-[var(--background)] px-3.5 py-1 text-xs font-bold text-[var(--foreground)] hover:border-accent-blue transition inline-flex items-center gap-1.5"
                                        title={`Filter kanji dengan radikal ${kanji.radical}`}
                                    >
                                        <span className="text-gray-400">部首 (Radikal):</span>
                                        <span className="font-japanese text-sm font-black text-accent-blue">{kanji.radical}</span>
                                        {radicalInfo?.name && <span className="text-[11px] text-gray-500">({radicalInfo.name})</span>}
                                    </Link>
                                )}
                            </div>

                            {/* Main Meaning (H1) */}
                            {isEditing ? (
                                <div className="space-y-3 my-3">
                                    <textarea
                                        value={editData.meaning}
                                        onChange={(e) => setEditData({ ...editData, meaning: e.target.value })}
                                        className="w-full text-2xl font-bold p-3 rounded-xl border border-[var(--border-color)] bg-[var(--background)] text-[var(--foreground)]"
                                        rows={2}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="inline-flex items-center gap-2 rounded-xl bg-accent-green px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-accent-green/90"
                                    >
                                        <Check className="h-4 w-4" />
                                        <span>Simpan Perubahan</span>
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[var(--foreground)] break-words">
                                        {kanji?.meaning}
                                    </h1>
                                    <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed max-w-2xl">
                                        Karakter kanji <span className="font-japanese font-bold text-[var(--foreground)]">{kanji?.character}</span> memiliki arti utama &quot;{kanji?.meaning}&quot; dan merupakan materi penting untuk JLPT level N{currentLevel}.
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                {/* Detail Information Sections (Grid 3 Kolom) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                    {/* Kolom Kiri: Cara Baca (Onyomi, Kunyomi, Radikal) */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Onyomi Card */}
                        <section className="rounded-3xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6 shadow-sm">
                            <h2 className="text-xs font-bold uppercase tracking-wider text-accent-blue mb-4 flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-accent-blue" aria-hidden="true" />
                                Onyomi (音読み · Cara Baca China)
                            </h2>
                            <div className="flex flex-wrap gap-2">
                                {kanji?.onyomi && kanji.onyomi.length > 0 ? (
                                    kanji.onyomi.map((r, i) => (
                                        <span
                                            key={i}
                                            className="rounded-xl border border-[var(--border-color)] bg-[var(--background)] px-3.5 py-1.5 font-japanese text-base font-bold text-accent-blue shadow-xs"
                                        >
                                            {toKatakana(String(r).toUpperCase())}
                                        </span>
                                    ))
                                ) : (
                                    <span className="italic text-xs text-gray-400">Tidak ada onyomi umum</span>
                                )}
                            </div>
                        </section>

                        {/* Kunyomi Card */}
                        <section className="rounded-3xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6 shadow-sm">
                            <h2 className="text-xs font-bold uppercase tracking-wider text-accent-green mb-4 flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-accent-green" aria-hidden="true" />
                                Kunyomi (訓読み · Cara Baca Jepang)
                            </h2>
                            <div className="flex flex-wrap gap-2">
                                {kanji?.kunyomi && kanji.kunyomi.length > 0 ? (
                                    kanji.kunyomi.map((r, i) => (
                                        <span
                                            key={i}
                                            className="rounded-xl border border-[var(--border-color)] bg-[var(--background)] px-3.5 py-1.5 font-japanese text-base font-bold text-[var(--foreground)] shadow-xs"
                                        >
                                            {toHiragana(String(r).toLowerCase())}
                                        </span>
                                    ))
                                ) : (
                                    <span className="italic text-xs text-gray-400">Tidak ada kunyomi umum</span>
                                )}
                            </div>
                        </section>

                        {/* Radikal Info Card */}
                        {kanji?.radical && (
                            <section className="rounded-3xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6 shadow-sm">
                                <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4 flex items-center gap-2">
                                    <Layers className="h-4 w-4 text-accent-gold" />
                                    Radikal Utama (部首)
                                </h2>
                                <Link
                                    href={`/kanji/n${currentLevel}?radical=${encodeURIComponent(kanji.radical)}`}
                                    className="group flex items-center gap-4 rounded-2xl border border-[var(--border-color)] bg-[var(--background)] p-4 transition hover:border-accent-blue hover:shadow-md"
                                >
                                    <span className="font-japanese text-3xl font-black text-accent-blue group-hover:scale-110 transition-transform w-10 text-center">
                                        {kanji.radical}
                                    </span>
                                    <div className="min-w-0">
                                        <span className="block text-sm font-bold text-[var(--foreground)]">
                                            {radicalInfo?.name || 'Radikal'}
                                        </span>
                                        <span className="block text-xs text-gray-500 truncate">
                                            {radicalInfo?.meaning || 'Komponen pembentuk kanji'}
                                        </span>
                                    </div>
                                </Link>
                            </section>
                        )}
                    </div>

                    {/* Kolom Kanan: Contoh Kata (Kotoba) & Contoh Kalimat */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Contoh Kosakata (Kotoba) */}
                        <section className="rounded-3xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6 sm:p-8 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-base sm:text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
                                    <BookOpen className="h-5 w-5 text-accent-blue" />
                                    Contoh Kosakata (Kotoba Terkait)
                                </h2>
                                {kanji?.examples?.length > 0 && (
                                    <span className="text-xs text-gray-400 font-medium">
                                        {kanji.examples.length} contoh
                                    </span>
                                )}
                            </div>

                            {kanji?.examples && kanji.examples.length > 0 ? (
                                <div className="space-y-3">
                                    {kanji.examples.map((ex, i) => (
                                        <div
                                            key={i}
                                            onClick={() => handleExampleClick(ex.word)}
                                            className="group flex items-center justify-between gap-4 rounded-2xl border border-[var(--border-color)] bg-[var(--background)] p-4 transition hover:border-accent-blue/40 hover:shadow-md cursor-pointer"
                                        >
                                            <div className="min-w-0">
                                                <ruby className="font-japanese text-xl font-bold text-[var(--foreground)] group-hover:text-accent-blue transition-colors">
                                                    {ex.word}
                                                    {hasKanji(ex.word) && ex.reading && (
                                                        <rt className="text-[10px] font-bold text-accent-blue pb-0.5 select-none">
                                                            {ex.reading}
                                                        </rt>
                                                    )}
                                                </ruby>
                                                <p className="mt-1 text-xs sm:text-sm text-gray-600 dark:text-gray-300 font-medium line-clamp-2">
                                                    {ex.meaning}
                                                </p>
                                            </div>

                                            <span className="shrink-0 rounded-xl bg-accent-blue/10 px-3 py-1.5 text-xs font-bold text-accent-blue opacity-80 group-hover:opacity-100 group-hover:bg-accent-blue group-hover:text-white transition">
                                                Lihat Kotoba →
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="rounded-2xl border-2 border-dashed border-[var(--border-color)] p-8 text-center">
                                    <p className="text-sm text-gray-400 italic">
                                        Belum tersedia contoh kosakata spesifik untuk kanji ini di kurikulum.
                                    </p>
                                    <Link
                                        href={`/kotoba?search=${encodeURIComponent(kanji?.character || '')}`}
                                        className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-accent-blue hover:underline"
                                    >
                                        Cari kata yang memuat &quot;{kanji?.character}&quot; di kamus Kotoba →
                                    </Link>
                                </div>
                            )}
                        </section>

                        {/* Bagian Coretan & Catatan Belajar */}
                        <section className="rounded-3xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6 sm:p-8 shadow-sm">
                            <h2 className="text-base sm:text-lg font-bold text-[var(--foreground)] mb-3 flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-accent-green" />
                                Panduan Urutan Coretan (Kakijun)
                            </h2>
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                                Kanji <strong className="font-japanese">{kanji?.character}</strong> ditulis dalam{' '}
                                <strong className="text-accent-blue">{kanji?.strokes || 1} coretan</strong>. Mengikuti aturan umum kanji: dari kiri ke kanan, atas ke bawah, dan goresan horizontal sebelum vertikal.
                            </p>
                            <div className="flex flex-wrap items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (kanjiSvg) {
                                            setIsStrokeAnimating(true);
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }
                                    }}
                                    className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-accent-blue/30 bg-accent-blue/10 px-4 py-2 text-xs font-bold text-accent-blue hover:bg-accent-blue hover:text-white transition"
                                >
                                    <span>Tonton Animasi Coretan di Atas</span>
                                    <span>↑</span>
                                </button>
                                <Link
                                    href={`/kanji/n${currentLevel}`}
                                    className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--background)] px-4 py-2 text-xs font-bold text-[var(--foreground)] hover:border-accent-blue/40 transition"
                                >
                                    <span>Lihat Kanji Lain di N{currentLevel}</span>
                                </Link>
                            </div>
                        </section>
                    </div>
                </div>

                {/* Footer Back Navigation */}
                <div className="mt-10 border-t border-[var(--border-color)] pt-6">
                    <Link
                        href={safeBackHref}
                        className="inline-flex min-h-11 items-center gap-2 rounded-xl font-semibold text-accent-blue hover:underline"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span>{safeBackLabel}</span>
                    </Link>
                </div>
            </div>
        </main>
    );
}
