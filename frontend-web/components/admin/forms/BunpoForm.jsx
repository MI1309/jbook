'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/lib/api';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { appToast as toast } from '@/components/common/AppMessage';
import { ArrowLeft, Eye, Save, X } from 'lucide-react';
import DynamicStringList from '@/components/admin/form/DynamicStringList';
import DynamicObjectList from '@/components/admin/form/DynamicObjectList';
import BunpoDetailUI from '@/components/bunpo/BunpoDetailUI';

function objectOrEmpty(value) {
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function textValue(value) {
    return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
}

function normalizeRows(value, fields) {
    return Array.isArray(value)
        ? value.map((item) => {
            const row = objectOrEmpty(item);
            return Object.fromEntries(fields.map((key) => [key, textValue(row[key])]));
        })
        : [];
}

function normalizeSections(value) {
    let source = value;
    if (typeof source === 'string') {
        try {
            source = JSON.parse(source);
        } catch {
            source = {};
        }
    }
    source = objectOrEmpty(source);
    const mainFunction = objectOrEmpty(source.mainFunction);
    const sentencePattern = objectOrEmpty(source.sentencePattern);
    const comparison = objectOrEmpty(source.comparison);
    const nuance = objectOrEmpty(source.nuance);
    const coreExplanation = objectOrEmpty(source.coreExplanation);
    const conceptMap = objectOrEmpty(source.conceptMap);

    return {
        mainFunction: { summary: textValue(mainFunction.summary), points: Array.isArray(mainFunction.points) ? mainFunction.points.map(textValue) : [] },
        sentencePattern: {
            formula: textValue(sentencePattern.formula),
            variations: normalizeRows(sentencePattern.variations, ['label', 'formula', 'example']),
            notes: Array.isArray(sentencePattern.notes) ? sentencePattern.notes.map(textValue) : [],
        },
        examples: Array.isArray(source.examples) ? source.examples.map((item) => {
            const row = objectOrEmpty(item);
            return {
                jp: textValue(row.jp), reading: textValue(row.reading), id: textValue(row.id),
                level: textValue(row.level), expressions: Array.isArray(row.expressions) ? row.expressions : [],
            };
        }) : [],
        comparison: { summary: textValue(comparison.summary), items: normalizeRows(comparison.items, ['vs', 'difference', 'example']) },
        nuance: { summary: textValue(nuance.summary), points: Array.isArray(nuance.points) ? nuance.points.map(textValue) : [] },
        coreExplanation: { summary: textValue(coreExplanation.summary), text: textValue(coreExplanation.text) },
        commonMistakes: normalizeRows(source.commonMistakes, ['wrong', 'correct', 'reason']),
        faq: normalizeRows(source.faq, ['q', 'a']),
        conceptMap: {
            summary: textValue(conceptMap.summary),
            nodes: normalizeRows(conceptMap.nodes, ['id', 'label', 'type']),
            edges: normalizeRows(conceptMap.edges, ['from', 'to', 'label']),
        },
    };
}

const field = (name, label, type = 'text', options = {}) => ({ name, label, type, ...options });

export default function BunpoForm({ id, isNew: isNewRoute = false }) {
    const router = useRouter();
    const { authenticatedFetch } = useAuth();
    const isNew = isNewRoute || id === 'new';

    const [loading, setLoading] = useState(!isNew);
    const [fetchError, setFetchError] = useState('');
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [previewOpen, setPreviewOpen] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [dirty, setDirty] = useState(false);
    const initialDataRef = useRef(null);
    const [formData, setFormData] = useState({
        title: '',
        structure: '',
        explanation: '',
        chapter: '',
        jlpt_level: 5,
        sections: normalizeSections({}),
        sentences: []
    });
    const [activeTab, setActiveTab] = useState('basic');

    useEffect(() => {
        const handleBeforeUnload = (event) => {
            if (!dirty || saving) return;
            event.preventDefault();
            event.returnValue = '';
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [dirty, saving]);

    useEffect(() => {
        if (!previewOpen) return undefined;
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') setPreviewOpen(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [previewOpen]);

    useEffect(() => {
        if (!initialDataRef.current && isNew) {
            initialDataRef.current = JSON.stringify(formData);
            return;
        }
        if (initialDataRef.current) setDirty(JSON.stringify(formData) !== initialDataRef.current);
    }, [formData, isNew]);

    useEffect(() => {
        if (isNew) return;
        let cancelled = false;
        const fetchBunpo = async () => {
            setLoading(true);
            setFetchError('');
            try {
            const res = await authenticatedFetch(`${API_URL}/admin/bunpo/${id}`, {
                headers: {},
            });

            if (res.ok) {
                const data = await res.json();
                if (!cancelled) {
                    const nextData = {
                    ...data,
                    title: data.title || '',
                    structure: data.structure,
                    explanation: data.explanation,
                    chapter: data.chapter > 0 ? String(data.chapter) : '',
                    jlpt_level: data.jlpt_level,
                    sections: normalizeSections(data.sections),
                    sentences: (data.sentences || []).map((sentence) => ({
                        ...sentence,
                        expressions: sentence.expressions || [],
                    }))
                    };
                    setFormData(nextData);
                    initialDataRef.current = JSON.stringify(nextData);
                }
            } else {
                const message = res.status === 404
                    ? 'Bunpo tidak ditemukan. Data mungkin sudah dihapus atau tautannya tidak valid.'
                    : res.status === 401 || res.status === 403
                        ? 'Sesi admin tidak valid atau tidak memiliki akses.'
                        : `Gagal memuat Bunpo (${res.status}).`;
                if (!cancelled) setFetchError(message);
            }
            } catch (error) {
                console.error('Fetch Bunpo error', error);
                if (!cancelled) setFetchError('Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        fetchBunpo();
        return () => { cancelled = true; };
    }, [id, isNew, authenticatedFetch]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitted(true);
        setSaveError('');
        if (!formData.title.trim() || !formData.structure.trim() || !formData.explanation.trim()) {
            setActiveTab('basic');
            toast.error('Judul, struktur, dan penjelasan wajib diisi.');
            return;
        }
        setSaving(true);
        try {
            const { miniPractice: _ignoredMiniPractice, ...sectionsWithoutMiniPractice } = formData.sections;
            const payload = {
                ...formData,
                sections: sectionsWithoutMiniPractice,
                chapter: formData.chapter === '' ? 0 : Number(formData.chapter),
                jlpt_level: parseInt(formData.jlpt_level),
                sentences: formData.sentences.map(({ expressions = [], ...sentence }) => ({
                    ...sentence,
                    expression_ids: expressions.map((expression) => expression.id),
                })),
            };

            const url = isNew
                ? `${API_URL}/admin/bunpo`
                : `${API_URL}/admin/bunpo/${id}`;
            const method = isNew ? 'POST' : 'PUT';

            const res = await authenticatedFetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                toast.success(isNew ? 'Grammar created!' : 'Grammar updated!');
                initialDataRef.current = JSON.stringify(formData);
                setDirty(false);
                router.push('/admin/bunpo');
            } else {
                const errorData = await res.json().catch(() => null);
                const detail = res.status === 401
                    ? 'Sesi admin sudah berakhir. Silakan masuk kembali, lalu ulangi penyimpanan.'
                    : errorData?.detail || errorData?.message || `HTTP ${res.status}`;
                console.error('Failed to save Bunpo', errorData);
                setSaveError(detail);
                toast.error(`Gagal menyimpan Bunpo: ${detail}`);
            }
        } catch (error) {
            console.error("Save error", error);
            setSaveError('Tidak dapat terhubung ke server saat menyimpan.');
            toast.error('Tidak dapat terhubung ke server saat menyimpan.');
        } finally {
            setSaving(false);
        }
    };

    const leaveForm = (event) => {
        if (dirty && !window.confirm('Perubahan belum disimpan. Tetap tinggalkan halaman?')) {
            event.preventDefault();
        }
    };

    const tabHasContent = {
        basic: Boolean(formData.title.trim() && formData.structure.trim() && formData.explanation.trim()),
        function: Boolean(formData.sections.mainFunction.summary || formData.sections.mainFunction.points.length || formData.sections.sentencePattern.formula || formData.sections.coreExplanation.text || formData.sections.coreExplanation.summary),
        examples: Boolean(formData.sentences.length || formData.sections.examples.length || formData.sections.comparison.summary || formData.sections.comparison.items.length || formData.sections.nuance.summary || formData.sections.nuance.points.length),
        faq: Boolean(formData.sections.commonMistakes.length || formData.sections.faq.length),
        practice: Boolean(formData.sections.conceptMap.summary || formData.sections.conceptMap.nodes.length || formData.sections.conceptMap.edges.length),
    };

    const tabs = [
        ['basic', 'Dasar'], ['function', 'Fungsi & Pola'], ['examples', 'Contoh & Perbandingan'],
        ['faq', 'Kesalahan & FAQ'], ['practice', 'Latihan & Peta'],
    ];
    const basicErrors = [
        !formData.title.trim() && 'Judul',
        !formData.structure.trim() && 'Struktur',
        !formData.explanation.trim() && 'Penjelasan',
    ].filter(Boolean);

    if (loading) return <div className="mx-auto max-w-4xl animate-pulse space-y-5"><div className="h-9 w-56 rounded-lg bg-[var(--border-color)]" /><div className="h-[520px] rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)]" /></div>;

    if (fetchError) return <div className="mx-auto max-w-3xl rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-8 text-center"><h1 className="text-xl font-semibold text-[var(--foreground)]">Tidak dapat membuka Bunpo</h1><p role="alert" className="mt-2 text-sm text-[var(--foreground)]/65">{fetchError}</p><Link href="/admin/bunpo" className="mt-6 inline-flex items-center gap-2 rounded-xl border border-[var(--border-color)] px-4 py-2.5 text-sm font-medium transition-colors hover:bg-[var(--background)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-red)]"><ArrowLeft size={16} /> Kembali ke daftar</Link></div>;

    return (
        <div className="mx-auto max-w-4xl space-y-6 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/admin/bunpo" onClick={leaveForm} aria-label="Kembali ke daftar Bunpo" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl p-2 text-[var(--foreground)]/60 transition-colors hover:bg-[var(--card-bg)] hover:text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-red)]">
                        <ArrowLeft size={20} />
                    </Link>
                    <div><p className="text-sm text-[var(--foreground)]/55">Admin / Bunpo / {isNew ? 'Tambah' : 'Edit'}</p><h1 className="mt-1 text-2xl font-semibold text-[var(--foreground)]">{isNew ? 'Tambah Bunpo' : 'Edit Bunpo'}</h1></div>
                </div>
                {!isNew && <button type="button" onClick={() => setPreviewOpen(true)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--border-color)] px-4 py-2.5 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--background)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent-blue)]"><Eye size={16} /> Preview</button>}
            </div>

            {/* Form */}
            <div className="overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)]">
                <form onSubmit={handleSubmit} className="space-y-7 p-5 sm:p-7">
                    {submitted && basicErrors.length > 0 && <div role="alert" className="rounded-xl border border-[var(--brand-red)]/30 bg-[var(--brand-red-light)] p-4 text-sm text-[var(--foreground)]">Periksa field wajib: {basicErrors.join(', ')}.</div>}
                    <div className="flex gap-1 overflow-x-auto border-b border-[var(--border-color)]" role="tablist" aria-label="Bagian formulir Bunpo">
                        {tabs.map(([tab, label]) => (
                            <button
                                key={tab}
                                type="button"
                                role="tab"
                                id={`bunpo-tab-${tab}`}
                                aria-selected={activeTab === tab}
                                aria-controls="bunpo-panel-content"
                                onClick={() => setActiveTab(tab)}
                                className={`flex min-h-11 shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-red)] ${activeTab === tab ? 'border-[var(--brand-red)] text-[var(--brand-red)]' : 'border-transparent text-[var(--foreground)]/65 hover:text-[var(--foreground)]'}`}
                            >
                                {label}<span aria-label={tabHasContent[tab] ? 'terisi' : 'opsional, masih kosong'} className={`size-2 rounded-full ${tabHasContent[tab] ? 'bg-[var(--accent-green)]' : 'bg-[var(--foreground)]/25'}`} />
                            </button>
                        ))}
                    </div>

                    <section id="bunpo-panel-basic" role="tabpanel" aria-labelledby="bunpo-tab-basic" hidden={activeTab !== 'basic'} className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div className="space-y-2 col-span-full md:col-span-1">
                            <label className="text-sm font-medium text-[var(--foreground)]" htmlFor="bunpo-title">Judul <span aria-hidden="true">*</span></label>
                            <input
                                id="bunpo-title"
                                type="text"
                                required
                                aria-invalid={submitted && !formData.title.trim()}
                                aria-describedby={submitted && !formData.title.trim() ? 'bunpo-title-error' : undefined}
                                onBlur={() => setSubmitted(true)}
                                className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--background)] p-3.5 text-sm text-[var(--foreground)] outline-none transition-colors placeholder:text-[var(--foreground)]/40 focus-visible:border-[var(--accent-blue)] focus-visible:ring-2 focus-visible:ring-[var(--accent-blue)]/20"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            />
                            {submitted && !formData.title.trim() && <p id="bunpo-title-error" className="text-xs text-[var(--brand-red)]">Judul wajib diisi.</p>}
                        </div>
                        <div className="space-y-2 col-span-full md:col-span-1">
                            <label className="text-sm font-medium text-[var(--foreground)]" htmlFor="bunpo-structure">Struktur</label>
                            <input
                                id="bunpo-structure"
                                type="text"
                                className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--background)] p-3.5 text-sm text-[var(--foreground)] outline-none transition-colors placeholder:text-[var(--foreground)]/40 focus-visible:border-[var(--accent-blue)] focus-visible:ring-2 focus-visible:ring-[var(--accent-blue)]/20"
                                value={formData.structure}
                                required
                                aria-invalid={submitted && !formData.structure.trim()}
                                aria-describedby={submitted && !formData.structure.trim() ? 'bunpo-structure-error' : undefined}
                                onBlur={() => setSubmitted(true)}
                                onChange={(e) => setFormData({ ...formData, structure: e.target.value })}
                            />
                            {submitted && !formData.structure.trim() && <p id="bunpo-structure-error" className="text-xs text-[var(--brand-red)]">Struktur wajib diisi.</p>}
                        </div>
                        <div className="space-y-2 col-span-full">
                            <label className="text-sm font-medium text-[var(--foreground)]" htmlFor="bunpo-explanation">Penjelasan</label>
                            <textarea id="bunpo-explanation" rows="5" required aria-invalid={submitted && !formData.explanation.trim()} aria-describedby={submitted && !formData.explanation.trim() ? 'bunpo-explanation-error' : undefined} onBlur={() => setSubmitted(true)} className="w-full resize-y rounded-xl border border-[var(--border-color)] bg-[var(--background)] p-3.5 text-sm leading-6 text-[var(--foreground)] outline-none focus-visible:border-[var(--accent-blue)] focus-visible:ring-2 focus-visible:ring-[var(--accent-blue)]/20" value={formData.explanation || ''} onChange={(e) => setFormData({ ...formData, explanation: e.target.value })} />
                            {submitted && !formData.explanation.trim() && <p id="bunpo-explanation-error" className="text-xs text-[var(--brand-red)]">Penjelasan wajib diisi.</p>}
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-[var(--foreground)]" htmlFor="bunpo-level">Level JLPT</label>
                            <select id="bunpo-level" className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--background)] p-3.5 text-sm text-[var(--foreground)] outline-none focus-visible:border-[var(--accent-blue)] focus-visible:ring-2 focus-visible:ring-[var(--accent-blue)]/20" value={formData.jlpt_level} onChange={(e) => setFormData({ ...formData, jlpt_level: e.target.value })}>
                                {[5, 4, 3, 2, 1].map((level) => <option key={level} value={level}>N{level}</option>)}
                            </select>
                        </div>
                    </section>

                    <section id="bunpo-panel-content" role="tabpanel" aria-labelledby={`bunpo-tab-${activeTab}`} hidden={activeTab === 'basic'} className="space-y-4">
                    <div className="space-y-3">
                        <h2 className="text-base font-semibold text-[var(--foreground)]">Materi Terstruktur</h2>
                        <p className="text-sm text-[var(--foreground)]/55">Bagian yang tidak digunakan boleh dibiarkan kosong.</p>

                        <details hidden={activeTab !== 'function'} open className="group rounded-xl border border-[var(--border-color)]">
                            <summary className="cursor-pointer list-none px-4 py-3.5 text-sm font-semibold text-[var(--foreground)] marker:hidden">1. Fungsi Utama</summary>
                            <div className="space-y-4 border-t border-[var(--border-color)] p-4">
                                <label className="block space-y-1.5"><span className="text-sm font-medium">Ringkasan</span><textarea rows={2} className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--background)] p-3 text-sm text-[var(--foreground)] outline-none focus-visible:border-[var(--accent-blue)]" value={formData.sections.mainFunction.summary} onChange={(event) => setFormData((current) => ({ ...current, sections: { ...current.sections, mainFunction: { ...current.sections.mainFunction, summary: event.target.value } } }))} /></label>
                                <DynamicStringList label="Poin" addLabel="Tambah Poin" value={formData.sections.mainFunction.points} onChange={(points) => setFormData((current) => ({ ...current, sections: { ...current.sections, mainFunction: { ...current.sections.mainFunction, points } } }))} />
                            </div>
                        </details>

                        <details hidden={activeTab !== 'function'} className="rounded-xl border border-[var(--border-color)]">
                            <summary className="cursor-pointer list-none px-4 py-3.5 text-sm font-semibold text-[var(--foreground)]">2. Pola Kalimat</summary>
                            <div className="space-y-4 border-t border-[var(--border-color)] p-4">
                                <label className="block space-y-1.5"><span className="text-sm font-medium">Formula</span><input className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--background)] p-3 text-sm text-[var(--foreground)] outline-none focus-visible:border-[var(--accent-blue)]" value={formData.sections.sentencePattern.formula} onChange={(event) => setFormData((current) => ({ ...current, sections: { ...current.sections, sentencePattern: { ...current.sections.sentencePattern, formula: event.target.value } } }))} /></label>
                                <DynamicObjectList label="Variasi" addLabel="Tambah Variasi" fields={[field('label', 'Label'), field('formula', 'Formula'), field('example', 'Contoh', 'textarea')]} value={formData.sections.sentencePattern.variations} onChange={(variations) => setFormData((current) => ({ ...current, sections: { ...current.sections, sentencePattern: { ...current.sections.sentencePattern, variations } } }))} />
                                <DynamicStringList label="Catatan" addLabel="Tambah Catatan" value={formData.sections.sentencePattern.notes} onChange={(notes) => setFormData((current) => ({ ...current, sections: { ...current.sections, sentencePattern: { ...current.sections.sentencePattern, notes } } }))} />
                            </div>
                        </details>

                        <details hidden={activeTab !== 'examples'} className="rounded-xl border border-[var(--border-color)]">
                            <summary className="cursor-pointer list-none px-4 py-3.5 text-sm font-semibold text-[var(--foreground)]">3. Contoh Kalimat</summary>
                            <div className="border-t border-[var(--border-color)] p-4">
                                <DynamicObjectList label="Contoh" addLabel="Tambah Contoh" fields={[field('jp', 'Kalimat Jepang'), field('reading', 'Cara Baca'), field('id', 'Terjemahan Indonesia', 'textarea'), field('level', 'Level')]} value={formData.sections.examples} onChange={(examples) => setFormData((current) => ({ ...current, sections: { ...current.sections, examples } }))} />
                            </div>
                        </details>

                        <details hidden={activeTab !== 'examples'} className="rounded-xl border border-[var(--border-color)]">
                            <summary className="cursor-pointer list-none px-4 py-3.5 text-sm font-semibold text-[var(--foreground)]">4. Perbandingan</summary>
                            <div className="space-y-4 border-t border-[var(--border-color)] p-4">
                                <label className="block space-y-1.5"><span className="text-sm font-medium">Ringkasan</span><textarea rows={2} className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--background)] p-3 text-sm text-[var(--foreground)] outline-none focus-visible:border-[var(--accent-blue)]" value={formData.sections.comparison.summary} onChange={(event) => setFormData((current) => ({ ...current, sections: { ...current.sections, comparison: { ...current.sections.comparison, summary: event.target.value } } }))} /></label>
                                <DynamicObjectList label="Perbandingan" addLabel="Tambah Perbandingan" fields={[field('vs', 'Dibandingkan dengan'), field('difference', 'Perbedaan', 'textarea'), field('example', 'Contoh', 'textarea')]} value={formData.sections.comparison.items} onChange={(items) => setFormData((current) => ({ ...current, sections: { ...current.sections, comparison: { ...current.sections.comparison, items } } }))} />
                            </div>
                        </details>

                        <details hidden={activeTab !== 'examples'} className="rounded-xl border border-[var(--border-color)]">
                            <summary className="cursor-pointer list-none px-4 py-3.5 text-sm font-semibold text-[var(--foreground)]">5. Nuansa</summary>
                            <div className="space-y-4 border-t border-[var(--border-color)] p-4">
                                <label className="block space-y-1.5"><span className="text-sm font-medium">Ringkasan</span><textarea rows={2} className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--background)] p-3 text-sm text-[var(--foreground)] outline-none focus-visible:border-[var(--accent-blue)]" value={formData.sections.nuance.summary} onChange={(event) => setFormData((current) => ({ ...current, sections: { ...current.sections, nuance: { ...current.sections.nuance, summary: event.target.value } } }))} /></label>
                                <DynamicStringList label="Poin nuansa" addLabel="Tambah Poin" value={formData.sections.nuance.points} onChange={(points) => setFormData((current) => ({ ...current, sections: { ...current.sections, nuance: { ...current.sections.nuance, points } } }))} />
                            </div>
                        </details>

                        <details hidden={activeTab !== 'function'} className="rounded-xl border border-[var(--border-color)]">
                            <summary className="cursor-pointer list-none px-4 py-3.5 text-sm font-semibold text-[var(--foreground)]">6. Penjelasan Inti</summary>
                            <div className="space-y-4 border-t border-[var(--border-color)] p-4">
                                <label className="block space-y-1.5"><span className="text-sm font-medium">Ringkasan</span><input className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--background)] p-3 text-sm text-[var(--foreground)] outline-none focus-visible:border-[var(--accent-blue)]" value={formData.sections.coreExplanation.summary} onChange={(event) => setFormData((current) => ({ ...current, sections: { ...current.sections, coreExplanation: { ...current.sections.coreExplanation, summary: event.target.value } } }))} /></label>
                                <label className="block space-y-1.5"><span className="text-sm font-medium">Penjelasan</span><textarea rows={5} className="w-full resize-y rounded-lg border border-[var(--border-color)] bg-[var(--background)] p-3 text-sm leading-6 text-[var(--foreground)] outline-none focus-visible:border-[var(--accent-blue)]" value={formData.sections.coreExplanation.text} onChange={(event) => setFormData((current) => ({ ...current, sections: { ...current.sections, coreExplanation: { ...current.sections.coreExplanation, text: event.target.value } } }))} /></label>
                            </div>
                        </details>

                        <details hidden={activeTab !== 'faq'} className="rounded-xl border border-[var(--border-color)]">
                            <summary className="cursor-pointer list-none px-4 py-3.5 text-sm font-semibold text-[var(--foreground)]">7. Kesalahan Umum</summary>
                            <div className="border-t border-[var(--border-color)] p-4">
                                <DynamicObjectList label="Kesalahan" addLabel="Tambah Kesalahan" fields={[field('wrong', 'Bentuk yang salah', 'textarea'), field('correct', 'Bentuk yang benar', 'textarea'), field('reason', 'Alasan', 'textarea')]} value={formData.sections.commonMistakes} onChange={(commonMistakes) => setFormData((current) => ({ ...current, sections: { ...current.sections, commonMistakes } }))} />
                            </div>
                        </details>

                        <details hidden={activeTab !== 'faq'} className="rounded-xl border border-[var(--border-color)]">
                            <summary className="cursor-pointer list-none px-4 py-3.5 text-sm font-semibold text-[var(--foreground)]">8. Tanya Jawab</summary>
                            <div className="border-t border-[var(--border-color)] p-4">
                                <DynamicObjectList label="Tanya Jawab" addLabel="Tambah Tanya Jawab" fields={[field('q', 'Pertanyaan', 'textarea'), field('a', 'Jawaban', 'textarea')]} value={formData.sections.faq} onChange={(faq) => setFormData((current) => ({ ...current, sections: { ...current.sections, faq } }))} />
                            </div>
                        </details>

                        <details hidden={activeTab !== 'practice'} className="rounded-xl border border-[var(--border-color)]">
                            <summary className="cursor-pointer list-none px-4 py-3.5 text-sm font-semibold text-[var(--foreground)]">9. Peta Materi</summary>
                            <div className="space-y-4 border-t border-[var(--border-color)] p-4">
                                <label className="block space-y-1.5"><span className="text-sm font-medium">Ringkasan</span><textarea rows={2} className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--background)] p-3 text-sm text-[var(--foreground)] outline-none focus-visible:border-[var(--accent-blue)]" value={formData.sections.conceptMap.summary} onChange={(event) => setFormData((current) => ({ ...current, sections: { ...current.sections, conceptMap: { ...current.sections.conceptMap, summary: event.target.value } } }))} /></label>
                                <DynamicObjectList label="Node" addLabel="Tambah Node" fields={[field('id', 'ID'), field('label', 'Label'), field('type', 'Tipe')]} value={formData.sections.conceptMap.nodes} onChange={(nodes) => setFormData((current) => ({ ...current, sections: { ...current.sections, conceptMap: { ...current.sections.conceptMap, nodes } } }))} />
                                <DynamicObjectList label="Relasi" addLabel="Tambah Relasi" fields={[field('from', 'Dari'), field('to', 'Ke'), field('label', 'Label')]} value={formData.sections.conceptMap.edges} onChange={(edges) => setFormData((current) => ({ ...current, sections: { ...current.sections, conceptMap: { ...current.sections.conceptMap, edges } } }))} />
                            </div>
                        </details>
                    </div>

                    </section>

                    <div className="sticky bottom-0 -mx-5 -mb-5 flex flex-col-reverse gap-3 border-t border-[var(--border-color)] bg-[var(--card-bg)]/95 p-5 backdrop-blur sm:-mx-7 sm:-mb-7 sm:flex-row sm:justify-end sm:px-7">
                        <p role="status" aria-live="polite" className="mr-auto self-center text-xs text-[var(--foreground)]/60">{saving ? 'Menyimpan...' : saveError ? `Gagal menyimpan: ${saveError}` : dirty ? 'Perubahan belum disimpan' : 'Tersimpan'}</p>
                        <Link href="/admin/bunpo" onClick={leaveForm} className="min-h-11 rounded-xl border border-[var(--border-color)] px-5 py-2.5 text-center text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--background)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-red)]">
                            Batal
                        </Link>
                        <button type="submit" disabled={saving || (activeTab === 'basic' && basicErrors.length > 0)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--brand-red)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-red)] disabled:cursor-not-allowed disabled:opacity-60">
                            <Save size={16} />{saving ? 'Menyimpan...' : isNew ? 'Buat Bunpo' : 'Simpan perubahan'}
                        </button>
                    </div>
                </form>
            </div>
            {previewOpen && <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-black/65 p-3 sm:p-6" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setPreviewOpen(false); }}>
                <section role="dialog" aria-modal="true" aria-label="Preview Bunpo" className="relative w-full max-w-6xl overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--background)] shadow-2xl">
                    <button type="button" onClick={() => setPreviewOpen(false)} aria-label="Tutup preview" className="fixed right-5 top-5 z-[75] inline-flex size-11 items-center justify-center rounded-full border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--foreground)] shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent-blue)]"><X size={20} /></button>
                    <BunpoDetailUI grammar={{ ...formData, jlpt_level: Number(formData.jlpt_level), meaning: formData.structure }} onClose={() => setPreviewOpen(false)} backLabel="Tutup preview" />
                </section>
            </div>}
        </div>
    );
}
