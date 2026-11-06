'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/lib/api';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { appToast as toast } from '@/components/common/AppMessage';
import ExpressionPicker from '@/components/bunpo/ExpressionPicker';
import { ArrowLeft, Plus, Save, Trash2 } from 'lucide-react';

export default function BunpoForm({ id, isNew: isNewRoute = false }) {
    const router = useRouter();
    const { authenticatedFetch } = useAuth();
    const isNew = isNewRoute || id === 'new';

    const [loading, setLoading] = useState(!isNew);
    const [fetchError, setFetchError] = useState('');
    const [saving, setSaving] = useState(false);
    const [sectionsJson, setSectionsJson] = useState('{}');
    const [formData, setFormData] = useState({
        title: '',
        structure: '',
        explanation: '',
        chapter: 1,
        jlpt_level: 5,
        sentences: []
    });
    // Temporary state for a new sentence
    const [newSentence, setNewSentence] = useState({ jp: '', id: '', expressions: [] });
    const [activeTab, setActiveTab] = useState('info');

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
                if (!cancelled) setFormData({
                    title: data.title,
                    structure: data.structure,
                    explanation: data.explanation,
                    chapter: data.chapter,
                    jlpt_level: data.jlpt_level,
                    sections: data.sections || null,
                    sentences: (data.sentences || []).map((sentence) => ({
                        ...sentence,
                        expressions: sentence.expressions || [],
                    }))
                });
                if (!cancelled) setSectionsJson(JSON.stringify(data.sections || {}, null, 2));
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

    const handleAddSentence = () => {
        if (newSentence.jp.trim() && newSentence.id.trim()) {
            setFormData((current) => ({
                ...current,
                sentences: [...current.sentences, newSentence]
            }));
            setNewSentence({ jp: '', id: '', expressions: [] });
        }
    };

    const updateSentence = (index, updates) => {
        setFormData((current) => ({
            ...current,
            sentences: current.sentences.map((sentence, sentenceIndex) =>
                sentenceIndex === index ? { ...sentence, ...updates } : sentence
            ),
        }));
    };

    const removeSentence = (index) => {
        setFormData((current) => ({
            ...current,
            sentences: current.sentences.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        let sections;
        try {
            sections = sectionsJson.trim() ? JSON.parse(sectionsJson) : null;
            if (sections !== null && (typeof sections !== 'object' || Array.isArray(sections))) {
                throw new Error('Sections harus berupa objek JSON.');
            }
        } catch (error) {
            setActiveTab('content');
            toast.error(error.message || 'JSON sections tidak valid.');
            return;
        }
        if (!formData.title.trim() || !formData.structure.trim()) {
            setActiveTab('info');
            toast.error('Judul dan struktur wajib diisi.');
            return;
        }
        if (!formData.explanation.trim()) {
            setActiveTab('content');
            toast.error('Penjelasan wajib diisi.');
            return;
        }
        if (formData.chapter === '') {
            setActiveTab('metadata');
            toast.error('Bab wajib diisi.');
            return;
        }
        setSaving(true);
        try {
            const payload = {
                ...formData,
                sections,
                chapter: parseInt(formData.chapter),
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
                router.push('/admin/bunpo');
            } else {
                const errorData = await res.json().catch(() => null);
                const detail = res.status === 401
                    ? 'Sesi admin sudah berakhir. Silakan masuk kembali, lalu ulangi penyimpanan.'
                    : errorData?.detail || errorData?.message || `HTTP ${res.status}`;
                console.error('Failed to save Bunpo', errorData);
                toast.error(`Gagal menyimpan Bunpo: ${detail}`);
            }
        } catch (error) {
            console.error("Save error", error);
            toast.error('Tidak dapat terhubung ke server saat menyimpan.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="mx-auto max-w-4xl animate-pulse space-y-5"><div className="h-9 w-56 rounded-lg bg-[var(--border-color)]" /><div className="h-[520px] rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)]" /></div>;

    if (fetchError) return <div className="mx-auto max-w-3xl rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-8 text-center"><h1 className="text-xl font-semibold text-[var(--foreground)]">Tidak dapat membuka Bunpo</h1><p role="alert" className="mt-2 text-sm text-[var(--foreground)]/65">{fetchError}</p><Link href="/admin/bunpo" className="mt-6 inline-flex items-center gap-2 rounded-xl border border-[var(--border-color)] px-4 py-2.5 text-sm font-medium transition-colors hover:bg-[var(--background)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-red)]"><ArrowLeft size={16} /> Kembali ke daftar</Link></div>;

    return (
        <div className="mx-auto max-w-4xl space-y-6 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/admin/bunpo" aria-label="Kembali ke daftar Bunpo" className="rounded-xl p-2 text-[var(--foreground)]/60 transition-colors hover:bg-[var(--card-bg)] hover:text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-red)]">
                        <ArrowLeft size={20} />
                    </Link>
                    <div><p className="text-sm text-[var(--foreground)]/55">Koleksi / Bunpo</p><h1 className="mt-1 text-2xl font-semibold text-[var(--foreground)]">{isNew ? 'Tambah Bunpo' : 'Edit Bunpo'}</h1></div>
                </div>
            </div>

            {/* Form */}
            <div className="overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)]">
                <form onSubmit={handleSubmit} className="space-y-7 p-5 sm:p-7">
                    <div className="flex gap-1 overflow-x-auto border-b border-[var(--border-color)]" role="tablist" aria-label="Bagian formulir Bunpo">
                        {[
                            ['info', 'Info Dasar'],
                            ['content', 'Konten Detail'],
                            ['metadata', 'Metadata'],
                        ].map(([tab, label]) => (
                            <button
                                key={tab}
                                type="button"
                                role="tab"
                                id={`bunpo-tab-${tab}`}
                                aria-selected={activeTab === tab}
                                aria-controls={`bunpo-panel-${tab}`}
                                onClick={() => setActiveTab(tab)}
                                className={`shrink-0 border-b-2 px-4 py-3 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-red)] ${activeTab === tab ? 'border-[var(--brand-red)] text-[var(--brand-red)]' : 'border-transparent text-[var(--foreground)]/55 hover:text-[var(--foreground)]'}`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    <section id="bunpo-panel-info" role="tabpanel" aria-labelledby="bunpo-tab-info" hidden={activeTab !== 'info'} className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div className="space-y-2 col-span-full md:col-span-1">
                            <label className="text-sm font-medium text-[var(--foreground)]" htmlFor="bunpo-title">Judul</label>
                            <input
                                id="bunpo-title"
                                type="text"
                                className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--background)] p-3.5 text-sm text-[var(--foreground)] outline-none transition-colors placeholder:text-[var(--foreground)]/40 focus-visible:border-[var(--accent-blue)] focus-visible:ring-2 focus-visible:ring-[var(--accent-blue)]/20"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2 col-span-full md:col-span-1">
                            <label className="text-sm font-medium text-[var(--foreground)]" htmlFor="bunpo-structure">Struktur</label>
                            <input
                                id="bunpo-structure"
                                type="text"
                                className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--background)] p-3.5 text-sm text-[var(--foreground)] outline-none transition-colors placeholder:text-[var(--foreground)]/40 focus-visible:border-[var(--accent-blue)] focus-visible:ring-2 focus-visible:ring-[var(--accent-blue)]/20"
                                value={formData.structure}
                                onChange={(e) => setFormData({ ...formData, structure: e.target.value })}
                            />
                        </div>
                    </section>

                    <section id="bunpo-panel-content" role="tabpanel" aria-labelledby="bunpo-tab-content" hidden={activeTab !== 'content'} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-[var(--foreground)]" htmlFor="bunpo-explanation">Penjelasan</label>
                        <textarea
                            id="bunpo-explanation"
                            rows="6"
                            className="w-full resize-y rounded-xl border border-[var(--border-color)] bg-[var(--background)] p-3.5 text-sm leading-6 text-[var(--foreground)] outline-none transition-colors focus-visible:border-[var(--accent-blue)] focus-visible:ring-2 focus-visible:ring-[var(--accent-blue)]/20"
                            value={formData.explanation}
                            onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-[var(--foreground)]" htmlFor="bunpo-sections">Materi Terstruktur (JSON)</label>
                        <p className="text-sm text-[var(--foreground)]/55">Isi kategori: mainFunction, sentencePattern, examples, comparison, nuance, coreExplanation, commonMistakes, faq, miniPractice, conceptMap.</p>
                        <textarea
                            id="bunpo-sections"
                            rows="18"
                            spellCheck="false"
                            className="w-full resize-y rounded-xl border border-[var(--border-color)] bg-[var(--background)] p-3.5 font-mono text-sm leading-6 text-[var(--foreground)] outline-none transition-colors focus-visible:border-[var(--accent-blue)] focus-visible:ring-2 focus-visible:ring-[var(--accent-blue)]/20"
                            value={sectionsJson}
                            onChange={(event) => setSectionsJson(event.target.value)}
                        />
                    </div>

                    </section>

                    <section id="bunpo-panel-metadata" role="tabpanel" aria-labelledby="bunpo-tab-metadata" hidden={activeTab !== 'metadata'} className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-[var(--foreground)]" htmlFor="bunpo-chapter">Bab</label>
                            <input
                                id="bunpo-chapter"
                                type="number"
                                className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--background)] p-3.5 text-sm text-[var(--foreground)] outline-none transition-colors focus-visible:border-[var(--accent-blue)] focus-visible:ring-2 focus-visible:ring-[var(--accent-blue)]/20"
                                value={formData.chapter}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    if (e.target.value === '' || (!isNaN(val) && val >= 0)) {
                                        setFormData({ ...formData, chapter: e.target.value });
                                    }
                                }}
                                min={0}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-[var(--foreground)]" htmlFor="bunpo-level">Level JLPT</label>
                            <select
                                id="bunpo-level"
                                className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--background)] p-3.5 text-sm text-[var(--foreground)] outline-none transition-colors focus-visible:border-[var(--accent-blue)] focus-visible:ring-2 focus-visible:ring-[var(--accent-blue)]/20"
                                value={formData.jlpt_level}
                                onChange={(e) => setFormData({ ...formData, jlpt_level: e.target.value })}
                            >
                                {[5,4,3,2,1].map(l => <option key={l} value={l}>N{l}</option>)}
                            </select>
                        </div>
                    </section>

                    <section hidden={activeTab !== 'content'} aria-label="Contoh kalimat" className="space-y-4 border-t border-[var(--border-color)] pt-6">
                        <div><h3 className="text-base font-semibold text-[var(--foreground)]">Contoh Kalimat</h3><p className="mt-1 text-sm text-[var(--foreground)]/55">Kalimat dan ekspresi terkait untuk menjelaskan pola.</p></div>
                        {formData.sentences.map((sent, idx) => (
                            <div key={idx} className="space-y-4 rounded-xl border border-[var(--border-color)] bg-[var(--background)] p-4">
                                <div className="flex items-start gap-3">
                                    <div className="min-w-0 flex-1 space-y-2">
                                        <input
                                            type="text"
                                            aria-label="Kalimat bahasa Jepang"
                                            className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] p-3 text-sm font-medium text-[var(--foreground)] outline-none transition-colors focus-visible:border-[var(--accent-blue)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent-blue)]"
                                            value={sent.jp || ''}
                                            onChange={(event) => updateSentence(idx, { jp: event.target.value })}
                                        />
                                        <input
                                            type="text"
                                            aria-label="Terjemahan bahasa Indonesia"
                                            className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] p-3 text-sm text-[var(--foreground)]/75 outline-none transition-colors focus-visible:border-[var(--accent-blue)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent-blue)]"
                                            value={sent.id || ''}
                                            onChange={(event) => updateSentence(idx, { id: event.target.value })}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeSentence(idx)}
                                        aria-label="Hapus contoh kalimat"
                                        className="rounded-lg p-2 text-[var(--brand-red)] transition-colors hover:bg-[var(--brand-red)]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-red)]"
                                    >
                                        <Trash2 size={17} />
                                    </button>
                                </div>
                                <ExpressionPicker
                                    selected={sent.expressions || []}
                                    onChange={(expressions) => updateSentence(idx, { expressions })}
                                />
                            </div>
                        ))}

                        <div className="space-y-3 rounded-xl border border-dashed border-[var(--border-color)] p-4">
                            <h4 className="text-sm font-semibold text-[var(--foreground)]">Tambah kalimat</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                <input
                                    type="text"
                                    placeholder="Kalimat Bahasa Jepang"
                                    aria-label="Kalimat bahasa Jepang baru"
                                    className="rounded-lg border border-[var(--border-color)] bg-[var(--background)] p-3 text-sm text-[var(--foreground)] outline-none transition-colors focus-visible:border-[var(--accent-blue)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent-blue)]"
                                    value={newSentence.jp}
                                    onChange={(e) => setNewSentence({ ...newSentence, jp: e.target.value })}
                                />
                                <input
                                    type="text"
                                    placeholder="Terjemahan Bahasa Indonesia"
                                    aria-label="Terjemahan bahasa Indonesia baru"
                                    className="rounded-lg border border-[var(--border-color)] bg-[var(--background)] p-3 text-sm text-[var(--foreground)] outline-none transition-colors focus-visible:border-[var(--accent-blue)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent-blue)]"
                                    value={newSentence.id}
                                    onChange={(e) => setNewSentence({ ...newSentence, id: e.target.value })}
                                />
                            </div>
                            <div className="mb-3">
                                <ExpressionPicker
                                    selected={newSentence.expressions}
                                    onChange={(expressions) => setNewSentence((current) => ({ ...current, expressions }))}
                                />
                            </div>
                            <button
                                type="button"
                                onClick={handleAddSentence}
                                disabled={!newSentence.jp.trim() || !newSentence.id.trim()}
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border-color)] px-4 py-2.5 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--background)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-red)] disabled:cursor-not-allowed disabled:opacity-45"
                            >
                                <Plus size={16} /> Tambah kalimat
                            </button>
                        </div>
                    </section>

                    <div className="sticky bottom-0 -mx-5 -mb-5 flex flex-col-reverse gap-3 border-t border-[var(--border-color)] bg-[var(--card-bg)]/95 p-5 backdrop-blur sm:-mx-7 sm:-mb-7 sm:flex-row sm:justify-end sm:px-7">
                        <Link href="/admin/bunpo" className="rounded-xl border border-[var(--border-color)] px-5 py-2.5 text-center text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--background)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-red)]">
                            Batal
                        </Link>
                        <button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--brand-red)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-red)] disabled:cursor-wait disabled:opacity-60">
                            <Save size={16} />{saving ? 'Menyimpan...' : isNew ? 'Buat Bunpo' : 'Simpan perubahan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
