'use client';

import { useRef, useState } from 'react';
import Cookies from 'js-cookie';
import { API_URL } from '@/lib/api';
import { appToast as toast } from '@/components/common/AppMessage';

const SECTION_KEYS = [
    'mainFunction', 'sentencePattern', 'examples', 'comparison', 'nuance',
    'coreExplanation', 'commonMistakes', 'faq', 'conceptMap',
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
    conceptMap: { summary: '', nodes: [], edges: [] },
};

const SECTION_ARRAYS = new Set(['examples', 'commonMistakes', 'faq']);
const OPTIONAL_FIELDS = new Set(['structure', 'explanation', 'tags', 'sentences']);

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
                errors.push(`${prefix}: key '${key}' tidak valid. Key yang diharapkan: title, jlpt_level, slug, sections, structure, explanation, tags, sentences.`);
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
            toast.error('Validasi import gagal. Periksa detail pada panel.');
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
            toast.success(`Berhasil mengimport ${result.count ?? items.length} data Bunpo.`);
            onImported?.();
        } catch (error) {
            setMessage({ type: 'error', text: error.message || 'Import gagal karena kesalahan jaringan.' });
            toast.error('Import Bunpo gagal. Periksa detail pada panel.');
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
            toast.error('JSON sections tidak valid.');
            return;
        }

        await importItems([{
            title: singleForm.title,
            slug: singleForm.slug,
            jlpt_level: Number(singleForm.jlpt_level),
            structure: singleForm.structure,
            explanation: singleForm.explanation,
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
            toast.error('JSON tidak valid.');
            return;
        }
        if (!Array.isArray(items)) {
            setMessage({ type: 'error', text: 'Payload harus berupa array JSON: [ { ... }, { ... } ].' });
            toast.error('Payload harus berupa array JSON.');
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

    const inputClass = 'w-full rounded-xl border border-[var(--border-color)] bg-[var(--background)] px-3 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground)]/45 focus:border-[var(--accent-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]/20';
    const labelClass = 'mb-1.5 block text-xs font-bold text-[var(--foreground)]/75';

    return (
        <section id="bunpo-import" className="overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)]">
            <div className="flex border-b border-[var(--border-color)]" role="tablist" aria-label="Mode input Bunpo">
                {[['single', 'Form Satuan'], ['bulk', 'Bulk Import JSON']].map(([tab, label]) => (
                    <button
                        key={tab}
                        type="button"
                        role="tab"
                        aria-selected={activeTab === tab}
                        aria-controls={`bunpo-import-panel-${tab}`}
                        id={`bunpo-import-tab-${tab}`}
                        onClick={() => { setActiveTab(tab); setMessage(null); }}
                        className={`min-h-12 border-b-2 px-4 text-sm font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-red)] ${activeTab === tab ? 'border-[var(--brand-red)] text-[var(--foreground)]' : 'border-transparent text-[var(--foreground)]/55 hover:text-[var(--foreground)]'}`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {message && (
                <div role={message.type === 'error' ? 'alert' : 'status'} className={`mx-5 mt-5 whitespace-pre-wrap rounded-xl border px-4 py-3 text-sm ${message.type === 'error' ? 'border-[var(--brand-red)]/25 bg-[var(--brand-red-light)] text-[var(--foreground)]' : 'border-[var(--accent-green)]/25 bg-[var(--accent-green)]/10 text-[var(--foreground)]'}`}>
                    {message.text}
                </div>
            )}

            {activeTab === 'single' ? (
                <form id="bunpo-import-panel-single" role="tabpanel" aria-labelledby="bunpo-import-tab-single" onSubmit={submitSingle} className="space-y-4 p-5">
                    <div className="grid gap-4 md:grid-cols-2">
                        <label><span className={labelClass}>Judul materi</span><input required value={singleForm.title} onChange={(event) => setSingleForm({ ...singleForm, title: event.target.value })} className={inputClass} placeholder="～は～です" /></label>
                        <label><span className={labelClass}>Slug</span><input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={singleForm.slug} onChange={(event) => setSingleForm({ ...singleForm, slug: event.target.value })} className={inputClass} placeholder="wa-desu" /></label>
                        <label><span className={labelClass}>Level JLPT</span><select value={singleForm.jlpt_level} onChange={(event) => setSingleForm({ ...singleForm, jlpt_level: event.target.value })} className={inputClass}>{[5, 4, 3, 2, 1].map((level) => <option key={level} value={level}>N{level}</option>)}</select></label>
                    </div>
                    <label className="block"><span className={labelClass}>Struktur</span><input value={singleForm.structure} onChange={(event) => setSingleForm({ ...singleForm, structure: event.target.value })} className={inputClass} /></label>
                    <label className="block"><span className={labelClass}>Penjelasan legacy</span><textarea rows={3} value={singleForm.explanation} onChange={(event) => setSingleForm({ ...singleForm, explanation: event.target.value })} className={inputClass} /></label>
                    <label className="block"><span className={labelClass}>Sections JSON</span><textarea required spellCheck={false} rows={18} value={singleForm.sections} onChange={(event) => setSingleForm({ ...singleForm, sections: event.target.value })} className={`${inputClass} font-mono text-xs leading-relaxed`} /></label>
                    <button disabled={submitting} className="rounded-xl bg-[var(--brand-red)] px-5 py-3 text-sm font-semibold text-white transition-colors hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-red)] disabled:cursor-wait disabled:opacity-50">{submitting ? 'Menyimpan...' : 'Simpan Bunpo'}</button>
                </form>
            ) : (
                <form id="bunpo-import-panel-bulk" role="tabpanel" aria-labelledby="bunpo-import-tab-bulk" onSubmit={submitBulk} className="space-y-4 p-5">
                    <div className="flex flex-wrap items-center gap-3">
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="rounded-xl border border-[var(--border-color)] bg-[var(--background)] px-4 py-2.5 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--admin-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-red)]">Pilih file JSON</button>
                        <input ref={fileInputRef} type="file" accept=".json,application/json" className="sr-only" onChange={loadFile} />
                        <span className="text-xs text-[var(--foreground)]/55">atau tempel array JSON di bawah</span>
                    </div>
                    <label className="block"><span className={labelClass}>Array Bunpo</span><textarea required spellCheck={false} rows={20} value={bulkText} onChange={(event) => setBulkText(event.target.value)} className={`${inputClass} font-mono text-xs leading-relaxed`} placeholder={'[\n  {\n    "title": "～は～です",\n    "slug": "wa-desu",\n    "jlpt_level": 5,\n    "sections": { ... }\n  }\n]'} /></label>
                    <button disabled={submitting} className="rounded-xl bg-[var(--brand-red)] px-5 py-3 text-sm font-semibold text-white transition-colors hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-red)] disabled:cursor-wait disabled:opacity-50">{submitting ? 'Mengimport...' : 'Import JSON'}</button>
                </form>
            )}
        </section>
    );
}
