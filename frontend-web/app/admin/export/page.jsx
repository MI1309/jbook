'use client';

import { useState, Suspense } from 'react';
import { API_URL } from '@/lib/api';
import { useSearchParams } from 'next/navigation';
import Cookies from 'js-cookie';
import Link from 'next/link';
import { appToast as toast } from '@/components/common/AppMessage';
import { Anchor, AudioLines, BookOpen, BookOpenCheck, Download, Layers, Languages } from 'lucide-react';

function ExportContent() {
    const searchParams = useSearchParams();
    
    const [type, setType] = useState(searchParams.get('type') || 'kanji');
    const [level, setLevel] = useState('');
    const [search, setSearch] = useState('');
    const [chapter, setChapter] = useState('');
    const [loading, setLoading] = useState(false);

    const handleExport = async () => {
        setLoading(true);
        try {
            const token = Cookies.get('access_token');
            const queryParams = new URLSearchParams();
            if (level) queryParams.append('level', level);
            if (search) queryParams.append('search', search);
            if (chapter) queryParams.append('chapter', chapter);
            
            const endpoint = type === 'vocab' || type === 'kotoba' ? 'vocab' : (type === 'bunpo' ? 'bunpo' : type);
            const res = await fetch(`${API_URL}/admin/${endpoint}/export/csv?${queryParams.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${type}_export_${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
                toast.success('File CSV berhasil diekspor.');
            } else {
                toast.error("Gagal mengekspor data.");
            }
        } catch (error) {
            console.error("Export failed", error);
            toast.error('Ekspor gagal karena koneksi bermasalah.');
        } finally {
            setLoading(false);
        }
    };

    const handleKanjiPrint = async (format) => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            toast.error('Izinkan pop-up untuk membuat dokumen Kanji.');
            return;
        }

        setLoading(true);
        try {
            const token = Cookies.get('access_token');
            const queryParams = new URLSearchParams();
            if (level) queryParams.append('level', level);
            if (search) queryParams.append('search', search);
            const res = await fetch(`${API_URL}/admin/kanji?${queryParams.toString()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Gagal mengambil data Kanji.');

            const responseData = await res.json();
            const items = Array.isArray(responseData) ? responseData : responseData.items || [];
            if (!items.length) throw new Error('Tidak ada data Kanji untuk diekspor.');

            const title = format === 'workbook' ? 'Materi latihan Kanji' : 'Flashcard Kanji';
            printWindow.addEventListener('load', () => printWindow.print(), { once: true });
            printWindow.document.open();
            printWindow.document.write(format === 'workbook'
                ? buildKanjiWorkbookHtml(items, level, search)
                : buildKanjiFlashcardsHtml(items, level));
            printWindow.document.close();
            printWindow.document.title = `JBook - ${title}`;
            printWindow.focus();
        } catch (error) {
            printWindow.close();
            toast.error(error.message || 'Gagal membuat dokumen Kanji.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`relative z-10 rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-5 transition-opacity sm:p-7 ${loading ? 'opacity-70' : ''}`}>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <div className="space-y-6">
                    <label className="ml-1 block text-sm font-semibold text-[var(--foreground)]">Kategori data</label>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { id: 'kanji', label: 'Kanji', icon: Languages },
                            { id: 'vocab', label: 'Kotoba', icon: AudioLines },
                            { id: 'bunpo', label: 'Bunpo', icon: BookOpen },
                            { id: 'particle', label: 'Partikel', icon: Anchor }
                        ].map((cat) => (
                            <button 
                                key={cat.id} 
                                type="button"
                                aria-pressed={type === cat.id}
                                onClick={() => setType(cat.id)} 
                                className={`group relative flex min-h-28 flex-col items-center justify-center gap-3 overflow-hidden rounded-xl border p-4 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-red)] ${
                                    type === cat.id 
                                        ? 'border-[var(--brand-red)]/40 bg-[var(--brand-red)]/10 text-[var(--brand-red)]'
                                        : 'border-[var(--border-color)] bg-[var(--background)] text-[var(--foreground)]/60 hover:bg-[var(--admin-hover)]'
                                }`}
                            >
                                <cat.icon size={20} aria-hidden="true" />
                                <span className="text-sm font-medium">{cat.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="group">
                        <label className="mb-2 ml-1 block text-sm font-medium text-[var(--foreground)]">Level JLPT</label>
                        <div className="relative">
                            <select 
                                className="w-full appearance-none rounded-xl border border-[var(--border-color)] bg-[var(--background)] p-3.5 text-sm text-[var(--foreground)] transition-colors hover:bg-[var(--admin-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent-blue)]"
                                value={level} 
                                onChange={(e) => setLevel(e.target.value)}
                            >
                                <option value="">Semua Level</option>
                                <option value="5">N5 - Dasar</option>
                                <option value="4">N4 - Dasar Lanjut</option>
                                <option value="3">N3 - Menengah</option>
                                <option value="2">N2 - Menengah Lanjut</option>
                                <option value="1">N1 - Mahir</option>
                            </select>
                            <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[var(--foreground)]/45">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                            </div>
                        </div>
                    </div>

                    <div className="group">
                        <label className="mb-2 ml-1 block text-sm font-medium text-[var(--foreground)]">Pencarian kata/arti</label>
                        <input 
                            type="text" 
                            placeholder="Contoh: Taberu..." 
                            className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--background)] p-3.5 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground)]/40 transition-colors hover:bg-[var(--admin-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent-blue)]"
                            value={search} 
                            onChange={(e) => setSearch(e.target.value)} 
                        />
                    </div>

                    {type === 'bunpo' && (
                        <div className="group animate-in fade-in slide-in-from-top-4 duration-500">
                            <label className="mb-2 ml-1 block text-sm font-medium text-[var(--foreground)]">Bab</label>
                            <input 
                                type="number" 
                                placeholder="Nomor Bab" 
                                className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--background)] p-3.5 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground)]/40 transition-colors hover:bg-[var(--admin-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent-blue)]"
                                value={chapter} 
                                onChange={(e) => setChapter(e.target.value)} 
                            />
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-8 flex flex-col items-center border-t border-[var(--border-color)] pt-7">
                {type === 'kanji' ? (
                    <div className="w-full space-y-4">
                        <div className="text-center">
                            <h2 className="text-sm font-semibold text-[var(--foreground)]">Pilih format ekspor Kanji</h2>
                            <p className="mt-1 text-xs text-[var(--foreground)]/55">Dokumen cetak dapat disimpan sebagai PDF dari dialog cetak.</p>
                        </div>
                        <div className="grid w-full gap-3 md:grid-cols-3">
                            {[
                                { id: 'workbook', label: 'Latihan + contoh', detail: 'Materi, contoh kata, dan latihan menulis', icon: BookOpenCheck, action: () => handleKanjiPrint('workbook') },
                                { id: 'csv', label: 'Kanji saja', detail: 'Data Kanji dalam CSV standar', icon: Languages, action: handleExport },
                                { id: 'flashcards', label: 'Flashcard', detail: 'Kartu Kanji siap dicetak', icon: Layers, action: () => handleKanjiPrint('flashcards') }
                            ].map(({ id, label, detail, icon: Icon, action }) => (
                                <button
                                    key={id}
                                    type="button"
                                    onClick={action}
                                    disabled={loading}
                                    className="flex min-h-28 flex-col items-start gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--background)] p-4 text-left transition-colors hover:border-[var(--brand-red)]/45 hover:bg-[var(--admin-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-red)] disabled:cursor-wait disabled:opacity-55"
                                >
                                    <span className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]"><Icon size={18} className="text-[var(--brand-red)]" aria-hidden="true" />{loading ? 'Memproses...' : label}</span>
                                    <span className="text-xs leading-5 text-[var(--foreground)]/55">{detail}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="mb-6 flex items-center gap-2 rounded-xl bg-[var(--background)] px-4 py-2 text-sm text-[var(--foreground)]/65">
                            <span className="size-2 rounded-full bg-[var(--accent-green)]" aria-hidden="true" />
                            <span>CSV standar tanpa ID</span>
                        </div>
                        <button
                            onClick={handleExport}
                            disabled={loading}
                            className={`group relative inline-flex min-h-12 w-full items-center justify-center overflow-hidden rounded-xl px-5 py-3 text-sm font-semibold text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-red)] md:w-64 ${loading ? 'cursor-wait bg-[var(--foreground)]/35' : 'bg-[var(--brand-red)] hover:opacity-90'}`}
                        >
                            <span className="flex items-center justify-center gap-3">
                                <Download size={18} aria-hidden="true" />
                                {loading ? 'Mengekspor...' : 'Download CSV'}
                            </span>
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (character) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[character]);
}

function buildKanjiWorkbookHtml(items, selectedLevel, selectedSearch) {
    const entries = items.map((item) => {
        const examples = Array.isArray(item.examples) ? item.examples : [];
        return `<article class="entry"><header><span>JBOOK / MATERI KANJI</span><span>JLPT N${escapeHtml(item.jlpt_level)}</span></header><div class="hero"><strong lang="ja">${escapeHtml(item.character)}</strong><div><h2>${escapeHtml(item.meaning)}</h2><p>音読み · <span lang="ja">${escapeHtml((item.onyomi || []).join('、') || 'Belum tersedia')}</span></p><p>訓読み · <span lang="ja">${escapeHtml((item.kunyomi || []).join('、') || 'Belum tersedia')}</span></p></div></div><h3>Contoh kata</h3>${examples.length ? `<ul>${examples.map((example) => `<li><strong lang="ja">${escapeHtml(example.word)}</strong> <span lang="ja">${escapeHtml(example.reading)}</span> · ${escapeHtml(example.meaning)}</li>`).join('')}</ul>` : '<p class="muted">Belum ada contoh kata.</p>'}<h3>Latihan menulis</h3><div class="practice">${'<span></span>'.repeat(6)}</div></article>`;
    }).join('');
    const levelLabel = selectedLevel ? `N${escapeHtml(selectedLevel)}` : 'Semua Level';
    return `<!doctype html><html lang="id"><head><meta charset="utf-8"><title>Materi Kanji ${levelLabel}</title><style>@page{size:A4;margin:16mm}*{box-sizing:border-box}body{font:12px/1.6 Arial,sans-serif;color:#24302e}.cover{min-height:250mm;display:flex;flex-direction:column;justify-content:space-between;border-top:8px solid #bd342b;padding:24px 8px}.cover h1{font:bold 42px Georgia,serif}.cover p{color:#65716e}.entry{break-inside:avoid;border-bottom:1px solid #cbd2ce;padding:0 0 24px;margin-bottom:26px}.entry header{display:flex;justify-content:space-between;border-bottom:1px solid #dce1dc;padding:0 0 8px;color:#bd342b;font-weight:bold}.hero{display:flex;align-items:center;gap:24px;padding:18px 0}.hero>strong{font:80px/1.1 "Noto Serif CJK JP",serif;color:#bd342b;min-width:100px;text-align:center}.hero h2{font:26px Georgia,serif;margin:0 0 6px}.hero p{margin:3px 0}.entry h3{margin:14px 0 6px;font-size:11px;text-transform:uppercase;color:#596561}.entry ul{padding-left:20px}.muted{color:#75807d}.practice{display:grid;grid-template-columns:repeat(3,1fr)}.practice span{height:74px;border:1px solid #cbd2ce;background:linear-gradient(45deg,transparent 49.5%,#e6eae6 50%,transparent 50.5%),linear-gradient(-45deg,transparent 49.5%,#e6eae6 50%,transparent 50.5%)}@media print{.entry{break-inside:avoid}}</style></head><body><section class="cover"><div><b>JBOOK / BELAJAR BAHASA JEPANG</b><h1>Materi Kanji ${levelLabel}</h1><p>${items.length} kanji · Kenali arti, cara baca, contoh kata, lalu berlatih menulis.</p>${selectedSearch ? `<p>Hasil pencarian: ${escapeHtml(selectedSearch)}</p>` : ''}</div><p>Materi belajar JBook</p></section>${entries}</body></html>`;
}

function buildKanjiFlashcardsHtml(items, selectedLevel) {
    const cards = items.map((item) => {
        const example = Array.isArray(item.examples) ? item.examples[0] : null;
        return `<article class="card"><div class="front"><small>JBOOK · KANJI N${escapeHtml(item.jlpt_level)}</small><strong lang="ja">${escapeHtml(item.character)}</strong><span>Kanji</span></div><div class="back"><small>JBOOK · FLASHCARD</small><h2>${escapeHtml(item.meaning)}</h2><p><b>音読み</b> <span lang="ja">${escapeHtml((item.onyomi || []).join('、') || '—')}</span></p><p><b>訓読み</b> <span lang="ja">${escapeHtml((item.kunyomi || []).join('、') || '—')}</span></p>${example ? `<div class="example"><b lang="ja">${escapeHtml(example.word)}</b><span lang="ja">${escapeHtml(example.reading)}</span><span>${escapeHtml(example.meaning)}</span></div>` : ''}</div></article>`;
    }).join('');
    return `<!doctype html><html lang="id"><head><meta charset="utf-8"><title>Flashcard Kanji</title><style>@page{size:A4;margin:12mm}*{box-sizing:border-box}body{font:12px/1.5 Arial,sans-serif;color:#24302e}.intro{border-top:7px solid #bd342b;padding:14px 4px;margin-bottom:18px}.intro h1{font:bold 28px Georgia,serif;margin:0 0 4px}.intro p{margin:0;color:#65716e}.grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.card{height:122mm;border:1px solid #bac5c0;border-radius:8px;overflow:hidden;break-inside:avoid;display:grid;grid-template-rows:1fr 1fr}.front,.back{padding:15px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}.front{background:#f3f5f1;border-bottom:1px dashed #9aa8a2}.front small,.back small{align-self:flex-start;color:#bd342b;font-size:9px;font-weight:bold;letter-spacing:1px}.front strong{font:100px/1.1 "Noto Serif CJK JP",serif;color:#bd342b;margin:14px 0}.front span{color:#65716e}.back h2{font:bold 25px Georgia,serif;margin:14px 0}.back p{margin:4px 0}.example{width:100%;margin-top:12px;padding-top:10px;border-top:1px solid #dce1dc;display:grid;grid-template-columns:1fr 1fr;gap:4px}.example b{font-size:17px}.example span:last-child{grid-column:1/-1;color:#65716e}.card:nth-child(2n){break-after:page}@media print{.card{break-inside:avoid}}</style></head><body><header class="intro"><h1>Flashcard Kanji ${selectedLevel ? `N${escapeHtml(selectedLevel)}` : 'Semua Level'}</h1><p>${items.length} kartu · Potong pada garis tengah untuk memisahkan sisi Kanji dan jawabannya.</p></header><main class="grid">${cards}</main></body></html>`;
}

export default function ExportPage() {
    return (
        <div className="mx-auto max-w-5xl space-y-6">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                    <p className="text-sm text-[var(--foreground)]/55">Workspace / Ekspor</p>
                    <h1 className="mt-1 text-2xl font-semibold text-[var(--foreground)]">Ekspor data</h1>
                    <p className="mt-1 text-sm text-[var(--foreground)]/60">Ekspor Kanji sebagai materi latihan, data CSV, atau flashcard. Data lain tersedia dalam format CSV.</p>
                </div>
            </div>

            <Suspense fallback={
                <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)]"><div className="animate-pulse space-y-4 p-6"><div className="h-5 w-40 rounded bg-[var(--border-color)]" /><div className="h-40 rounded-xl bg-[var(--background)]" /><div className="h-12 rounded-xl bg-[var(--background)]" /></div></div>
            }>
                <ExportContent />
            </Suspense>

            <div className="pt-2">
                <Link href="/admin" className="inline-flex items-center gap-2 rounded-lg text-sm text-[var(--foreground)]/60 transition-colors hover:text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-red)]">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    Kembali ke Dashboard
                </Link>
            </div>
        </div>
    );
}

