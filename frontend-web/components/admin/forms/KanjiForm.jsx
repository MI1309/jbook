'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Cookies from 'js-cookie';
import { API_URL } from '@/lib/api';
import { appToast as toast } from '@/components/common/AppMessage';
import AdminTabs from '@/components/admin/AdminTabs';
import { ArrowLeft, Save } from 'lucide-react';

const initialForm = {
    character: '', meaning: '', onyomi: '', kunyomi: '', strokes: 1,
    jlpt_level: 5, radical: '', word_type: '', examples: [], svg_data: null,
};

const fieldClass = 'w-full rounded-xl border border-[var(--border-color)] bg-[var(--background)] px-3.5 py-3 text-sm text-[var(--foreground)] outline-none transition-colors placeholder:text-[var(--foreground)]/40 focus-visible:border-[var(--accent-blue)] focus-visible:ring-2 focus-visible:ring-[var(--accent-blue)]/20';

export default function KanjiForm({ id, isNew: isNewRoute = false }) {
    const router = useRouter();
    const isNew = isNewRoute || id === 'new';
    const [formData, setFormData] = useState(initialForm);
    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('info');
    const [fetchError, setFetchError] = useState('');

    useEffect(() => {
        if (isNew) return undefined;
        let cancelled = false;
        const loadKanji = async () => {
            setLoading(true);
            setFetchError('');
            try {
                const response = await fetch(`${API_URL}/admin/kanji/${id}`, {
                    headers: { Authorization: `Bearer ${Cookies.get('access_token')}` },
                });
                if (!response.ok) {
                    const body = await response.json().catch(() => ({}));
                    throw new Error(body.detail || body.message || `Gagal memuat Kanji (${response.status}).`);
                }
                const data = await response.json();
                if (!cancelled) setFormData({
                    ...initialForm,
                    ...data,
                    onyomi: Array.isArray(data.onyomi) ? data.onyomi.join(', ') : '',
                    kunyomi: Array.isArray(data.kunyomi) ? data.kunyomi.join(', ') : '',
                    examples: Array.isArray(data.examples) ? data.examples : [],
                });
            } catch (error) {
                if (!cancelled) setFetchError(error.message || 'Tidak dapat terhubung ke server.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        loadKanji();
        return () => { cancelled = true; };
    }, [id, isNew]);

    const updateField = (field, value) => setFormData(current => ({ ...current, [field]: value }));

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!formData.character.trim() || !formData.meaning.trim()) {
            setActiveTab('info');
            toast.error('Karakter dan arti wajib diisi.');
            return;
        }
        if (!formData.strokes || Number(formData.strokes) < 1) {
            setActiveTab('metadata');
            toast.error('Jumlah goresan minimal satu.');
            return;
        }
        setSaving(true);
        try {
            const payload = {
                ...formData,
                onyomi: formData.onyomi.split(',').map(value => value.trim()).filter(Boolean),
                kunyomi: formData.kunyomi.split(',').map(value => value.trim()).filter(Boolean),
                strokes: Number(formData.strokes),
                jlpt_level: Number(formData.jlpt_level),
            };
            const response = await fetch(isNew ? `${API_URL}/admin/kanji` : `${API_URL}/admin/kanji/${id}`, {
                method: isNew ? 'POST' : 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${Cookies.get('access_token')}` },
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                const body = await response.json().catch(() => ({}));
                throw new Error(body.detail || body.message || `Gagal menyimpan Kanji (${response.status}).`);
            }
            toast.success(isNew ? 'Kanji berhasil ditambahkan.' : 'Perubahan Kanji berhasil disimpan.');
            router.push('/admin/kanji');
        } catch (error) {
            toast.error(error.message || 'Tidak dapat menyimpan Kanji.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="mx-auto max-w-4xl animate-pulse space-y-5"><div className="h-9 w-52 rounded-lg bg-[var(--border-color)]" /><div className="h-[520px] rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)]" /></div>;
    if (fetchError) return <div className="mx-auto max-w-3xl rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-8 text-center"><h1 className="text-xl font-semibold">Tidak dapat membuka Kanji</h1><p role="alert" className="mt-2 text-sm text-[var(--foreground)]/60">{fetchError}</p><Link href="/admin/kanji" className="mt-5 inline-flex items-center gap-2 rounded-xl border border-[var(--border-color)] px-4 py-2.5 text-sm transition-colors hover:bg-[var(--background)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-red)]"><ArrowLeft size={16} /> Kembali ke daftar</Link></div>;

    return (
        <div className="mx-auto max-w-4xl space-y-6 pb-10">
            <div className="flex items-center gap-3"><Link href="/admin/kanji" aria-label="Kembali ke daftar Kanji" className="rounded-xl p-2 text-[var(--foreground)]/60 transition-colors hover:bg-[var(--card-bg)] hover:text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-red)]"><ArrowLeft size={20} /></Link><div><p className="text-sm text-[var(--foreground)]/55">Koleksi / Kanji</p><h1 className="mt-1 text-2xl font-semibold">{isNew ? 'Tambah Kanji' : 'Edit Kanji'}</h1></div></div>
            <form onSubmit={handleSubmit} className="overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)]">
                <AdminTabs value={activeTab} onChange={setActiveTab} label="Bagian formulir Kanji" tabs={[{ id: 'info', label: 'Info Dasar' }, { id: 'content', label: 'Konten Detail' }, { id: 'metadata', label: 'Metadata' }]} />
                <div className="space-y-5 p-5 sm:p-7">
                    <section id="admin-panel-info" role="tabpanel" aria-labelledby="admin-tab-info" hidden={activeTab !== 'info'} className="grid gap-5 sm:grid-cols-2">
                        <Field label="Karakter" required><input className={`${fieldClass} text-2xl font-medium`} value={formData.character} onChange={event => updateField('character', event.target.value)} maxLength={1} /></Field>
                        <Field label="Arti (Indonesia)" required><input className={fieldClass} value={formData.meaning} onChange={event => updateField('meaning', event.target.value)} maxLength={500} /></Field>
                    </section>
                    <section id="admin-panel-content" role="tabpanel" aria-labelledby="admin-tab-content" hidden={activeTab !== 'content'} className="grid gap-5 sm:grid-cols-2">
                        <Field label="Onyomi" hint="Pisahkan beberapa bacaan dengan koma"><input className={fieldClass} value={formData.onyomi} onChange={event => updateField('onyomi', event.target.value)} placeholder="例: ニチ, ジツ" /></Field>
                        <Field label="Kunyomi" hint="Pisahkan beberapa bacaan dengan koma"><input className={fieldClass} value={formData.kunyomi} onChange={event => updateField('kunyomi', event.target.value)} placeholder="例: ひ, び" /></Field>
                    </section>
                    <section id="admin-panel-metadata" role="tabpanel" aria-labelledby="admin-tab-metadata" hidden={activeTab !== 'metadata'} className="grid gap-5 sm:grid-cols-2">
                        <Field label="Jumlah goresan" required><input type="number" min="1" className={fieldClass} value={formData.strokes} onChange={event => updateField('strokes', event.target.value)} /></Field>
                        <Field label="Level JLPT" required><select className={fieldClass} value={formData.jlpt_level} onChange={event => updateField('jlpt_level', event.target.value)}>{[5, 4, 3, 2, 1].map(level => <option key={level} value={level}>N{level}</option>)}</select></Field>
                        <Field label="Radikal"><input className={fieldClass} value={formData.radical || ''} onChange={event => updateField('radical', event.target.value)} maxLength={5} /></Field>
                        <Field label="Tipe kata"><select className={fieldClass} value={formData.word_type || ''} onChange={event => updateField('word_type', event.target.value)}><option value="">Tidak ditentukan</option>{[['noun','Noun'],['godan','Godan verb'],['ichidan','Ichidan verb'],['suru','Suru verb'],['i_adj','I-adjective'],['na_adj','Na-adjective'],['adverb','Adverb'],['particle','Particle'],['suffix','Suffix'],['conjunction','Conjunction'],['interjection','Interjection'],['pronoun','Pronoun'],['counter','Counter'],['other','Lainnya']].map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
                    </section>
                </div>
                <div className="flex flex-col-reverse gap-3 border-t border-[var(--border-color)] p-5 sm:flex-row sm:justify-end sm:px-7"><Link href="/admin/kanji" className="rounded-xl border border-[var(--border-color)] px-5 py-2.5 text-center text-sm font-medium transition-colors hover:bg-[var(--background)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-red)]">Batal</Link><button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--brand-red)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-red)] disabled:cursor-wait disabled:opacity-60"><Save size={16} />{saving ? 'Menyimpan...' : isNew ? 'Tambah Kanji' : 'Simpan perubahan'}</button></div>
            </form>
        </div>
    );
}

function Field({ label, hint, required, children }) {
    return <label className="block space-y-1.5"><span className="block text-sm font-medium text-[var(--foreground)]">{label}{required && <span className="ml-1 text-[var(--brand-red)]">*</span>}</span>{children}{hint && <span className="block text-xs text-[var(--foreground)]/50">{hint}</span>}</label>;
}