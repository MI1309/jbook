'use client';

import { useRef, useState } from 'react';
import Cookies from 'js-cookie';
import { API_URL } from '@/lib/api';

const SECTION_KEYS = [
    'mainFunction', 'sentencePattern', 'examples', 'comparison', 'nuance',
    'coreExplanation', 'commonMistakes', 'faq', 'miniPractice', 'conceptMap',
];

const SECTION_FIELDS = {
    mainFunction: ['summary', 'points'],
    sentencePattern: ['formula', 'variations', 'notes'],
    examples: ['jp', 'id', 'reading', 'level', 'expressions'],
    comparison: ['summary', 'items'],
    nuance: ['summary', 'points'],
    coreExplanation: ['summary', 'text'],
    commonMistakes: ['wrong', 'correct', 'reason'],
    faq: ['q', 'a'],
    miniPractice: ['type', 'question', 'options', 'answer', 'explanation'],
    conceptMap: ['summary', 'nodes', 'edges'],
};

const EMPTY_SECTIONS = {
    mainFunction: { summary: '', points: [] },
    sentencePattern: { formula: '', variations: [], notes: [] },
    examples: [],
    comparison: { summary: '', items: [] },
    nuance: { summary: '', points: [] },
    coreExplanation: { summary: '', text: '' },
    commonMistakes: [],
    faq: [],
    miniPractice: [],
    conceptMap: { summary: '', nodes: [], edges: [] },
};

const SECTION_ARRAYS = new Set(['examples', 'commonMistakes', 'faq', 'miniPractice']);
const OPTIONAL_FIELDS = new Set(['structure', 'explanation', 'tags', 'chapter', 'sentences']);

function validateImportItems(items) {
    const errors = [];
    if (!Array.isArray(items)) return ['Payload harus berupa array JSON.'];
    if (items.length === 0) return ['Array JSON tidak boleh kosong.'];

    items.forEach((item, index) => {
        const prefix = `Data ke-${index + 1}`;
        if (!item || typeof item !== 'object' || Array.isArray(item)) {
            errors.push(`${prefix}: setiap item harus berupa object.`);
            return;
        }

        for (const key of ['title', 'jlpt_level', 'slug', 'sections']) {
            if (!(key in item)) errors.push(`${prefix}: field wajib '${key}' belum diisi.`);
        }
        for (const key of Object.keys(item)) {
            if (!['title', 'jlpt_level', 'slug', 'sections', ...OPTIONAL_FIELDS].includes(key)) {
                errors.push(`${prefix}: key '${key}' tidak valid. Key yang diharapkan: title, jlpt_level, slug, sections, structure, explanation, tags, chapter, sentences.`);
            }
        }
        if (typeof item.title !== 'string' || !item.title.trim()) errors.push(`${prefix}: 'title' harus berupa string yang tidak kosong.`);
        if (typeof item.jlpt_level !== 'number') {
            errors.push(`${prefix}: 'jlpt_level' harus berupa angka, bukan ${typeof item.jlpt_level}.`);
        } else if (!Number.isInteger(item.jlpt_level) || item.jlpt_level < 1 || item.jlpt_level > 5) {
            errors.push(`${prefix}: 'jlpt_level' harus berupa angka bulat 1 sampai 5.`);
        }
        if (typeof item.slug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug)) errors.push(`${prefix}: 'slug' harus berformat huruf kecil dan tanda hubung, contoh 'wa-desu'.`);
        if (!item.sections || typeof item.sections !== 'object' || Array.isArray(item.sections)) {
            errors.push(`${prefix}: 'sections' harus berupa object.`);
            return;
        }

        for (const key of Object.keys(item.sections)) {
            if (!SECTION_KEYS.includes(key)) errors.push(`${prefix}: key section '${key}' tidak valid. Key yang diharapkan: ${SECTION_KEYS.join(', ')}.`);
        }
        for (const key of SECTION_KEYS) {
            const section = item.sections[key];
            if (section === undefined) {
                errors.push(`${prefix}: section wajib '${key}' belum diisi.`);
                continue;
            }
            if (SECTION_ARRAYS.has(key)) {
                if (!Array.isArray(section)) errors.push(`${prefix}: 'sections.${key}' harus berupa array.`);
                continue;
            }
            if (!section || typeof section !== 'object' || Array.isArray(section)) {
                errors.push(`${prefix}: 'sections.${key}' harus berupa object.`);
                continue;
            }
            for (const field of Object.keys(section)) {
                if (!SECTION_FIELDS[key].includes(field)) errors.push(`${prefix}: key 'sections.${key}.${field}' tidak valid. Key yang diharapkan: ${SECTION_FIELDS[key].join(', ')}.`);
            }
        }
    });

    return errors;
}

function emptySingleForm() {
    return {
        title: '',
        slug: '',
        jlpt_level: '5',
        structure: '',
        explanation: '',
        chapter: '0',
        sections: JSON.stringify(EMPTY_SECTIONS, null, 2),
    };
}

export default function BunpoImportPanel({ onImported }) {
    const [activeTab, setActiveTab] = useState('single');
    const [singleForm, setSingleForm] = useState(emptySingleForm);
    const [bulkText, setBulkText] = useState('');
    const [message, setMessage] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const fileInputRef = useRef(null);

    const importItems = async (items) => {
        const validationErrors = validateImportItems(items);
        if (validationErrors.length) {
            setMessage({ type: 'error', text: validationErrors.join('\n') });
            return;
        }

        setSubmitting(true);
        setMessage(null);
        try {
            const token = Cookies.get('access_token');
            const response = await fetch(`${API_URL}/content/grammar/bulk-import`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify(items),
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok) {
                const detail = result.detail;
                const details = detail?.errors || (Array.isArray(detail) ? detail : null);
                const text = details?.join('\n') || detail?.message || (typeof detail === 'string' ? detail : null) || `Import gagal (${response.status}).`;
                throw new Error(text);
            }

            setMessage({ type: 'success', text: `Berhasil mengimport ${result.count ?? items.length} data. Halaman publik dan sitemap dapat memerlukan hingga 1 jam untuk diperbarui.` });
            onImported?.();
        } catch (error) {
            setMessage({ type: 'error', text: error.message || 'Import gagal karena kesalahan jaringan.' });
        } finally {
            setSubmitting(false);
        }
    };

    const submitSingle = async (event) => {
        event.preventDefault();
        let sections;
        try {
            sections = JSON.parse(singleForm.sections);
        } catch {
            setMessage({ type: 'error', text: 'JSON sections tidak valid. Periksa tanda kurung dan koma.' });
            return;
        }

        await importItems([{
            title: singleForm.title,
            slug: singleForm.slug,
            jlpt_level: Number(singleForm.jlpt_level),
            structure: singleForm.structure,
            explanation: singleForm.explanation,
            chapter: Number(singleForm.chapter || 0),
            sections,
        }]);
    };

    const submitBulk = async (event) => {
        event.preventDefault();
        let items;
        try {
            items = JSON.parse(bulkText);
        } catch {
            setMessage({ type: 'error', text: 'JSON tidak valid. Periksa tanda kurung dan koma.' });
            return;
        }
        if (!Array.isArray(items)) {
            setMessage({ type: 'error', text: 'Payload harus berupa array JSON: [ { ... }, { ... } ].' });
            return;
        }
        await importItems(items);
    };

    const loadFile = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        try {
            setBulkText(await file.text());
            setMessage({ type: 'success', text: `File ${file.name} berhasil dimuat. Periksa JSON, lalu tekan Import JSON.` });
            setActiveTab('bulk');
        } catch {
            setMessage({ type: 'error', text: 'File tidak dapat dibaca.' });
        } finally {
            event.target.value = '';
        }
    };

    const inputClass = 'w-full rounded-xl border border-white/10 bg-neutral-800 px-3 py-2.5 text-sm text-white placeholder-neutral-500 focus:border-red-500/60 focus:outline-none focus:ring-2 focus:ring-red-500/20';
    const labelClass = 'mb-1.5 block text-xs font-bold text-neutral-300';

    return (
        <section id="bunpo-import" className="overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/50">
            <div className="flex border-b border-white/10" role="tablist" aria-label="Mode input Bunpo">
                {[['single', 'Form Satuan'], ['bulk', 'Bulk Import JSON']].map(([tab, label]) => (
                    <button
                        key={tab}
                        type="button"
                        role="tab"
                        aria-selected={activeTab === tab}
                        onClick={() => { setActiveTab(tab); setMessage(null); }}
                        className={`min-h-12 border-b-2 px-4 text-sm font-bold transition-colors ${activeTab === tab ? 'border-red-500 text-white' : 'border-transparent text-neutral-500 hover:text-neutral-200'}`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {message && (
                <div role={message.type === 'error' ? 'alert' : 'status'} className={`mx-5 mt-5 whitespace-pre-wrap rounded-xl border px-4 py-3 text-sm ${message.type === 'error' ? 'border-red-500/30 bg-red-500/10 text-red-200' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'}`}>
                    {message.text}
                </div>
            )}

            {activeTab === 'single' ? (
                <form onSubmit={submitSingle} className="space-y-4 p-5">
                    <div className="grid gap-4 md:grid-cols-2">
                        <label><span className={labelClass}>Judul materi</span><input required value={singleForm.title} onChange={(event) => setSingleForm({ ...singleForm, title: event.target.value })} className={inputClass} placeholder="～は～です" /></label>
                        <label><span className={labelClass}>Slug</span><input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={singleForm.slug} onChange={(event) => setSingleForm({ ...singleForm, slug: event.target.value })} className={inputClass} placeholder="wa-desu" /></label>
                        <label><span className={labelClass}>Level JLPT</span><select value={singleForm.jlpt_level} onChange={(event) => setSingleForm({ ...singleForm, jlpt_level: event.target.value })} className={inputClass}>{[5, 4, 3, 2, 1].map((level) => <option key={level} value={level}>N{level}</option>)}</select></label>
                        <label><span className={labelClass}>Bab</span><input type="number" min="0" value={singleForm.chapter} onChange={(event) => setSingleForm({ ...singleForm, chapter: event.target.value })} className={inputClass} /></label>
                    </div>
                    <label className="block"><span className={labelClass}>Struktur</span><input value={singleForm.structure} onChange={(event) => setSingleForm({ ...singleForm, structure: event.target.value })} className={inputClass} /></label>
                    <label className="block"><span className={labelClass}>Penjelasan legacy</span><textarea rows={3} value={singleForm.explanation} onChange={(event) => setSingleForm({ ...singleForm, explanation: event.target.value })} className={inputClass} /></label>
                    <label className="block"><span className={labelClass}>Sections JSON</span><textarea required spellCheck={false} rows={18} value={singleForm.sections} onChange={(event) => setSingleForm({ ...singleForm, sections: event.target.value })} className={`${inputClass} font-mono text-xs leading-relaxed`} /></label>
                    <button disabled={submitting} className="rounded-xl bg-red-600 px-5 py-3 text-sm font-black text-white transition-colors hover:bg-red-500 disabled:cursor-wait disabled:opacity-50">{submitting ? 'Menyimpan...' : 'Simpan Bunpo'}</button>
                </form>
            ) : (
                <form onSubmit={submitBulk} className="space-y-4 p-5">
                    <div className="flex flex-wrap items-center gap-3">
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="rounded-xl border border-white/10 bg-neutral-800 px-4 py-2.5 text-sm font-bold text-neutral-200 transition-colors hover:bg-neutral-700">Pilih file JSON</button>
                        <input ref={fileInputRef} type="file" accept=".json,application/json" className="sr-only" onChange={loadFile} />
                        <span className="text-xs text-neutral-500">atau tempel array JSON di bawah</span>
                    </div>
                    <label className="block"><span className={labelClass}>Array Bunpo</span><textarea required spellCheck={false} rows={20} value={bulkText} onChange={(event) => setBulkText(event.target.value)} className={`${inputClass} font-mono text-xs leading-relaxed`} placeholder={'[\n  {\n    "title": "～は～です",\n    "slug": "wa-desu",\n    "jlpt_level": 5,\n    "sections": { ... }\n  }\n]'} /></label>
                    <button disabled={submitting} className="rounded-xl bg-red-600 px-5 py-3 text-sm font-black text-white transition-colors hover:bg-red-500 disabled:cursor-wait disabled:opacity-50">{submitting ? 'Mengimport...' : 'Import JSON'}</button>
                </form>
            )}
        </section>
    );
}
