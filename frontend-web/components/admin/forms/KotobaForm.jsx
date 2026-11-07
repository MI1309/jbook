'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Cookies from 'js-cookie';
import { API_URL } from '@/lib/api';
import { appToast as toast } from '@/components/common/AppMessage';
import AdminTabs from '@/components/admin/AdminTabs';
import { ArrowLeft, Plus, Save, Trash2 } from 'lucide-react';
import { WORD_TYPE_OPTIONS } from '@/components/kotoba/wordTypes';

const initialForm = { word: '', reading: '', meaning: '', word_type: '', jlpt_level: 5, examples: [], furigana: null, furigana_map: [] };
const fieldClass = 'w-full rounded-xl border border-[var(--border-color)] bg-[var(--background)] px-3.5 py-3 text-sm text-[var(--foreground)] outline-none transition-colors placeholder:text-[var(--foreground)]/40 focus-visible:border-[var(--accent-blue)] focus-visible:ring-2 focus-visible:ring-[var(--accent-blue)]/20';

export default function KotobaForm({ id, isNew: isNewRoute = false }) {
    const router = useRouter();
    const isNew = isNewRoute || id === 'new';
    const [formData, setFormData] = useState(initialForm);
    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('info');
    const [fetchError, setFetchError] = useState('');
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (isNew) return undefined;
        let cancelled = false;
        const loadVocab = async () => {
            setLoading(true);
            setFetchError('');
            try {
                const response = await fetch(`${API_URL}/admin/vocab/${id}`, { headers: { Authorization: `Bearer ${Cookies.get('access_token')}` } });
                if (!response.ok) {
                    const body = await response.json().catch(() => ({}));
                    throw new Error(body.detail || body.message || `Gagal memuat Kotoba (${response.status}).`);
                }
                const data = await response.json();
                if (!cancelled) setFormData({ ...initialForm, ...data, examples: Array.isArray(data.examples) ? data.examples : [] });
            } catch (error) {
                if (!cancelled) setFetchError(error.message || 'Tidak dapat terhubung ke server.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        loadVocab();
        return () => { cancelled = true; };
    }, [id, isNew]);

    const updateField = (field, value) => {
        setFormData(current => ({ ...current, [field]: value }));
        setErrors(current => ({ ...current, [field]: '' }));
    };
    const updateExample = (index, field, value) => setFormData(current => ({ ...current, examples: current.examples.map((example, itemIndex) => itemIndex === index ? { ...example, [field]: value } : example) }));

    const handleSubmit = async (event) => {
        event.preventDefault();
        const nextErrors = {};
        if (!formData.word.trim()) nextErrors.word = 'Kata wajib diisi.';
        if (!formData.reading.trim()) nextErrors.reading = 'Bacaan wajib diisi.';
        if (!formData.meaning.trim()) nextErrors.meaning = 'Arti wajib diisi.';
        if (!formData.word_type) nextErrors.word_type = 'Tipe kata wajib dipilih.';
        if (!formData.jlpt_level) nextErrors.jlpt_level = 'Level JLPT wajib dipilih.';
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length) {
            setActiveTab(nextErrors.word || nextErrors.reading ? 'info' : nextErrors.meaning ? 'content' : 'metadata');
            return;
        }
        setSaving(true);
        try {
            const response = await fetch(isNew ? `${API_URL}/admin/vocab` : `${API_URL}/admin/vocab/${id}`, {
                method: isNew ? 'POST' : 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${Cookies.get('access_token')}` },
                body: JSON.stringify({ ...formData, jlpt_level: Number(formData.jlpt_level), examples: formData.examples.filter(example => example.sentence?.trim() || example.meaning?.trim()) }),
            });
            if (!response.ok) {
                const body = await response.json().catch(() => ({}));
                throw new Error(body.detail || body.message || `Gagal menyimpan Kotoba (${response.status}).`);
            }
            toast.success(isNew ? 'Kotoba berhasil ditambahkan.' : 'Perubahan Kotoba berhasil disimpan.');
            router.push('/admin/kotoba');
        } catch (error) {
            toast.error(error.message || 'Tidak dapat menyimpan Kotoba.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="mx-auto max-w-4xl animate-pulse space-y-5"><div className="h-9 w-52 rounded-lg bg-[var(--border-color)]" /><div className="h-[520px] rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)]" /></div>;
    if (fetchError) return <div className="mx-auto max-w-3xl rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-8 text-center"><h1 className="text-xl font-semibold">Tidak dapat membuka Kotoba</h1><p role="alert" className="mt-2 text-sm text-[var(--foreground)]/60">{fetchError}</p><Link href="/admin/kotoba" className="mt-5 inline-flex items-center gap-2 rounded-xl border border-[var(--border-color)] px-4 py-2.5 text-sm transition-colors hover:bg-[var(--background)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-red)]"><ArrowLeft size={16} /> Kembali ke daftar</Link></div>;

    return (
        <div className="mx-auto max-w-4xl space-y-6 pb-10">
            <div className="flex items-center gap-3"><Link href="/admin/kotoba" aria-label="Kembali ke daftar Kotoba" className="rounded-xl p-2 text-[var(--foreground)]/60 transition-colors hover:bg-[var(--card-bg)] hover:text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-red)]"><ArrowLeft size={20} /></Link><div><p className="text-sm text-[var(--foreground)]/55">Koleksi / Kotoba</p><h1 className="mt-1 text-2xl font-semibold">{isNew ? 'Tambah Kotoba' : 'Edit Kotoba'}</h1></div></div>
            <form onSubmit={handleSubmit} className="overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)]">
                <AdminTabs value={activeTab} onChange={setActiveTab} label="Bagian formulir Kotoba" tabs={[{ id: 'info', label: 'Info Dasar' }, { id: 'content', label: 'Konten Detail' }, { id: 'metadata', label: 'Metadata' }]} />
                <div className="space-y-5 p-5 sm:p-7">
                    <section id="admin-panel-info" role="tabpanel" aria-labelledby="admin-tab-info" hidden={activeTab !== 'info'} className="grid gap-5 sm:grid-cols-2"><Field label="Kata / Kanji" required error={errors.word} errorId="kotoba-word-error"><input id="kotoba-word" aria-invalid={Boolean(errors.word)} aria-describedby={errors.word ? 'kotoba-word-error' : undefined} className={fieldClass} value={formData.word} onChange={event => updateField('word', event.target.value)} maxLength={255} /></Field><Field label="Bacaan (Kana)" required error={errors.reading} errorId="kotoba-reading-error"><input id="kotoba-reading" aria-invalid={Boolean(errors.reading)} aria-describedby={errors.reading ? 'kotoba-reading-error' : undefined} className={fieldClass} value={formData.reading || ''} onChange={event => updateField('reading', event.target.value)} maxLength={255} /></Field></section>
                    <section id="admin-panel-content" role="tabpanel" aria-labelledby="admin-tab-content" hidden={activeTab !== 'content'} className="space-y-6"><Field label="Arti" required error={errors.meaning} errorId="kotoba-meaning-error"><textarea id="kotoba-meaning" aria-invalid={Boolean(errors.meaning)} aria-describedby={errors.meaning ? 'kotoba-meaning-error' : undefined} className={`${fieldClass} resize-y`} rows={3} value={formData.meaning || ''} onChange={event => updateField('meaning', event.target.value)} /></Field>
                    <section className="space-y-4 border-t border-[var(--border-color)] pt-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-base font-semibold">Contoh kalimat</h2><p className="mt-1 text-sm text-[var(--foreground)]/55">Tambahkan konteks penggunaan kata.</p></div><button type="button" onClick={() => updateField('examples', [...formData.examples, { sentence: '', meaning: '' }])} className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-color)] px-3.5 py-2 text-sm font-medium transition-colors hover:bg-[var(--background)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-red)]"><Plus size={16} /> Tambah contoh</button></div>
                        {formData.examples.length ? <div className="space-y-3">{formData.examples.map((example, index) => <div key={`${index}-${example.sentence}`} className="grid gap-3 rounded-xl border border-[var(--border-color)] bg-[var(--background)] p-4 sm:grid-cols-[1fr_1fr_auto]"><input aria-label="Kalimat bahasa Jepang" className={fieldClass} placeholder="Kalimat bahasa Jepang" value={example.sentence || ''} onChange={event => updateExample(index, 'sentence', event.target.value)} /><input aria-label="Arti contoh kalimat" className={fieldClass} placeholder="Arti kalimat" value={example.meaning || ''} onChange={event => updateExample(index, 'meaning', event.target.value)} /><button type="button" aria-label="Hapus contoh kalimat" onClick={() => updateField('examples', formData.examples.filter((_, itemIndex) => itemIndex !== index))} className="justify-self-end rounded-lg p-2 text-[var(--brand-red)] transition-colors hover:bg-[var(--brand-red)]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-red)]"><Trash2 size={17} /></button></div>)}</div> : <p className="rounded-xl border border-dashed border-[var(--border-color)] px-4 py-6 text-center text-sm text-[var(--foreground)]/50">Belum ada contoh kalimat.</p>}
                    </section></section>
                    <section id="admin-panel-metadata" role="tabpanel" aria-labelledby="admin-tab-metadata" hidden={activeTab !== 'metadata'} className="grid gap-5 sm:grid-cols-2"><Field label="Tipe kata" required error={errors.word_type} errorId="kotoba-word_type-error"><select id="kotoba-word-type" aria-invalid={Boolean(errors.word_type)} aria-describedby={errors.word_type ? 'kotoba-word_type-error' : undefined} className={fieldClass} value={formData.word_type || ''} onChange={event => updateField('word_type', event.target.value)}><option value="">Pilih tipe kata</option>{WORD_TYPE_OPTIONS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}</select></Field><Field label="Level JLPT" required error={errors.jlpt_level} errorId="kotoba-jlpt_level-error"><select id="kotoba-jlpt-level" aria-invalid={Boolean(errors.jlpt_level)} aria-describedby={errors.jlpt_level ? 'kotoba-jlpt_level-error' : undefined} className={fieldClass} value={formData.jlpt_level} onChange={event => updateField('jlpt_level', event.target.value)}>{[5,4,3,2,1].map(level => <option key={level} value={level}>N{level}</option>)}</select></Field></section>
                </div>
                <div className="flex flex-col-reverse gap-3 border-t border-[var(--border-color)] p-5 sm:flex-row sm:justify-end sm:px-7"><Link href="/admin/kotoba" className="rounded-xl border border-[var(--border-color)] px-5 py-2.5 text-center text-sm font-medium transition-colors hover:bg-[var(--background)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-red)]">Batal</Link><button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--brand-red)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-red)] disabled:cursor-wait disabled:opacity-60"><Save size={16} />{saving ? 'Menyimpan...' : isNew ? 'Tambah Kotoba' : 'Simpan perubahan'}</button></div>
            </form>
        </div>
    );
}

function Field({ label, required, error, errorId, children }) {
    return <div className="block space-y-1.5"><label className="block space-y-1.5"><span className="block text-sm font-medium text-[var(--foreground)]">{label}{required && <span className="ml-1 text-[var(--brand-red)]">*</span>}</span>{children}</label>{error && <p id={errorId} role="alert" className="text-sm font-medium text-[var(--brand-red)]">{error}</p>}</div>;
}