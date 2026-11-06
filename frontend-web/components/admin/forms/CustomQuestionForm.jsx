'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { jbookApi } from '@/services/jbookApi';
import { appToast as toast } from '@/components/common/AppMessage';
import AdminFormShell from '@/components/admin/AdminFormShell';

const fieldClass = 'w-full rounded-lg border border-[var(--border-color)] bg-[var(--background)] px-3 py-2.5 text-sm text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent-blue)]';
const initialQuestion = { question_type: 'choice', question_text: '', options: ['', '', '', ''], correct_answer: '', explanation: '' };

export default function CustomQuestionForm() {
    const { id } = useParams();
    const router = useRouter();
    const [question, setQuestion] = useState(initialQuestion);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const updateOption = (index, value) => setQuestion(current => ({ ...current, options: current.options.map((option, optionIndex) => optionIndex === index ? value : option) }));
    const handleSubmit = async event => {
        event.preventDefault();
        setError('');
        if (!question.question_text.trim() || !question.correct_answer.trim()) {
            setError('Pertanyaan dan jawaban benar wajib diisi.');
            return;
        }
        setSaving(true);
        try {
            await jbookApi.adminCreateCustomModuleQuestion(id, { ...question, options: question.question_type === 'choice' ? question.options.filter(option => option.trim()) : [] });
            toast.success('Soal berhasil ditambahkan.');
            router.push(`/admin/custom-modules/${id}`);
        } catch {
            setError('Gagal menambahkan soal. Periksa isian, koneksi, dan akses akun.');
            toast.error('Gagal menambahkan soal.');
        } finally {
            setSaving(false);
        }
    };

    return <AdminFormShell title="Tambah soal" breadcrumbs={[{ label: 'Modul Kustom', href: '/admin/custom-modules' }, { label: `Modul #${id}`, href: `/admin/custom-modules/${id}` }, { label: 'Soal baru' }]} backHref={`/admin/custom-modules/${id}`} onSubmit={handleSubmit} saving={saving} error={error} submitLabel="Simpan soal">
        <label className="block space-y-1.5"><span className="text-sm font-medium">Tipe soal</span><select className={fieldClass} value={question.question_type} onChange={event => setQuestion({ ...question, question_type: event.target.value })}><option value="choice">Pilihan ganda</option><option value="true_false">Benar / Salah</option><option value="fill_blank">Isian singkat</option></select></label>
        <label className="block space-y-1.5"><span className="text-sm font-medium">Pertanyaan *</span><textarea required rows={4} className={fieldClass} value={question.question_text} onChange={event => setQuestion({ ...question, question_text: event.target.value })} /></label>
        {question.question_type === 'choice' && <fieldset className="grid gap-3 sm:grid-cols-2"><legend className="mb-2 text-sm font-medium">Pilihan jawaban</legend>{question.options.map((option, index) => <label key={index} className="space-y-1"><span className="text-xs text-[var(--foreground)]/60">Opsi {String.fromCharCode(65 + index)}</span><input className={fieldClass} value={option} onChange={event => updateOption(index, event.target.value)} /></label>)}</fieldset>}
        <label className="block space-y-1.5"><span className="text-sm font-medium">Jawaban benar *</span>{question.question_type === 'true_false' ? <select required className={fieldClass} value={question.correct_answer} onChange={event => setQuestion({ ...question, correct_answer: event.target.value })}><option value="">Pilih jawaban</option><option value="True">Benar</option><option value="False">Salah</option></select> : question.question_type === 'choice' ? <select required className={fieldClass} value={question.correct_answer} onChange={event => setQuestion({ ...question, correct_answer: event.target.value })}><option value="">Pilih jawaban</option>{question.options.filter(option => option.trim()).map(option => <option key={option} value={option}>{option}</option>)}</select> : <input required className={fieldClass} value={question.correct_answer} onChange={event => setQuestion({ ...question, correct_answer: event.target.value })} />}</label>
        <label className="block space-y-1.5"><span className="text-sm font-medium">Penjelasan</span><textarea rows={3} className={fieldClass} value={question.explanation} onChange={event => setQuestion({ ...question, explanation: event.target.value })} /></label>
    </AdminFormShell>;
}
