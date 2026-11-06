'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { jbookApi } from '@/services/jbookApi';
import { appToast as toast } from '@/components/common/AppMessage';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminConfirmDialog from '@/components/admin/AdminConfirmDialog';
import { AdminEmptyState, AdminErrorState, AdminSkeleton } from '@/components/admin/AdminFeedback';

export default function AdminCustomModuleDetailPage() {
    const { id } = useParams();
    const [moduleData, setModuleData] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState('');
    const [uploading, setUploading] = useState(false);
    const [pendingDelete, setPendingDelete] = useState(null);
    const fileInputRef = useRef(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setFetchError('');
        try {
            const [module, moduleQuestions] = await Promise.all([
                jbookApi.adminGetCustomModule(id),
                jbookApi.adminGetCustomModuleQuestions(id),
            ]);
            setModuleData(module);
            setQuestions(Array.isArray(moduleQuestions) ? moduleQuestions : []);
        } catch {
            setFetchError('Gagal memuat data modul. Periksa koneksi atau akses akun, lalu coba lagi.');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const togglePublish = async () => {
        const nextPublished = !moduleData.is_published;
        try {
            const updated = await jbookApi.adminUpdateCustomModule(id, { ...moduleData, is_published: nextPublished });
            setModuleData(updated);
            toast.success(nextPublished ? 'Modul berhasil dipublikasikan.' : 'Modul dipindahkan ke draft.');
        } catch {
            toast.error('Gagal mengubah status publikasi.');
        }
    };

    const uploadQuestions = async event => {
        const file = event.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const result = await jbookApi.adminUploadCustomModuleExcel(id, file);
            toast.success(`Berhasil mengunggah ${result.count} soal.`);
            await fetchData();
        } catch {
            toast.error('Gagal mengunggah file Excel. Pastikan formatnya benar.');
        } finally {
            setUploading(false);
            event.target.value = '';
        }
    };

    const deleteQuestion = async () => {
        if (!pendingDelete) return;
        try {
            await jbookApi.adminDeleteCustomModuleQuestion(pendingDelete.id);
            toast.success('Soal berhasil dihapus.');
            await fetchData();
        } catch {
            toast.error('Gagal menghapus soal.');
        } finally {
            setPendingDelete(null);
        }
    };

    if (loading) return <AdminSkeleton rows={5} />;
    if (fetchError) return <AdminErrorState title="Modul gagal dimuat" message={fetchError} onRetry={fetchData} />;
    if (!moduleData) return <AdminEmptyState title="Modul tidak ditemukan" message="Modul mungkin sudah dihapus atau tautannya tidak valid." href="/admin/custom-modules" actionLabel="Kembali ke daftar" />;

    return <div className="mx-auto max-w-5xl space-y-6 pb-10">
        <AdminPageHeader title={moduleData.title} description={`${moduleData.module_type} · ${moduleData.is_published ? 'Published' : 'Draft'}`} breadcrumbs={[{ label: 'Modul Kustom', href: '/admin/custom-modules' }, { label: `Detail #${id}` }]} action={<div className="flex flex-wrap gap-2"><Link href="/admin/custom-modules" className="rounded-lg border border-[var(--border-color)] px-4 py-2.5 text-sm">Kembali</Link><Link href={`/admin/custom-modules/${id}/edit`} className="rounded-lg bg-[var(--brand-red)] px-4 py-2.5 text-sm font-medium text-white">Edit</Link></div>} />
        <section className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-5">
            <h2 className="font-semibold">Informasi modul</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2"><div><dt className="text-xs text-[var(--foreground)]/55">Deskripsi</dt><dd className="mt-1 whitespace-pre-wrap text-sm">{moduleData.description || '—'}</dd></div><div><dt className="text-xs text-[var(--foreground)]/55">Status publikasi</dt><dd className="mt-1 text-sm">{moduleData.is_published ? 'Published' : 'Draft'}</dd></div>{moduleData.passage && <div className="sm:col-span-2"><dt className="text-xs text-[var(--foreground)]/55">Teks bacaan</dt><dd className="mt-1 whitespace-pre-wrap text-sm">{moduleData.passage}</dd></div>}{moduleData.audio_url && <div className="sm:col-span-2"><dt className="text-xs text-[var(--foreground)]/55">Audio</dt><dd className="mt-1 break-all text-sm">{moduleData.audio_url}</dd></div>}</dl>
            <button type="button" onClick={togglePublish} aria-label={moduleData.is_published ? 'Jadikan modul draft' : 'Publikasikan modul'} className="mt-5 rounded-lg border border-[var(--border-color)] px-3 py-2 text-sm hover:bg-[var(--background)]">{moduleData.is_published ? 'Batalkan publikasi' : 'Publikasikan'}</button>
        </section>
        <section className="flex flex-col gap-3 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-5 sm:flex-row sm:items-center sm:justify-between">
            <div><h2 className="font-semibold">Import soal</h2><p className="mt-1 text-sm text-[var(--foreground)]/60">Unggah file Excel berformat soal kustom.</p></div>
            <div className="flex flex-wrap gap-2"><input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={uploadQuestions} className="sr-only" aria-label="Pilih file Excel soal" /><button type="button" disabled={uploading} onClick={() => fileInputRef.current?.click()} className="rounded-lg border border-[var(--border-color)] px-3 py-2 text-sm disabled:opacity-50">{uploading ? 'Mengunggah...' : 'Pilih Excel'}</button><a href="/template_soal_kustom.xlsx" download className="rounded-lg border border-[var(--border-color)] px-3 py-2 text-sm">Unduh template</a></div>
        </section>
        <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold">Daftar Soal ({questions.length})</h2><Link href={`/admin/custom-modules/${id}/questions/new`} className="rounded-lg bg-[var(--brand-red)] px-4 py-2.5 text-sm font-medium text-white">Tambah soal</Link></div>
            {questions.length === 0 ? <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)]"><AdminEmptyState title="Belum ada soal" message="Tambahkan pertanyaan atau unggah file Excel." /></div> : <div className="space-y-3">{questions.map((question, index) => <article key={question.id} className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-sm font-medium">{index + 1}. {question.question_text}</p><p className="mt-1 text-xs uppercase text-[var(--foreground)]/55">{question.question_type}</p></div><button type="button" onClick={() => setPendingDelete(question)} aria-label={`Hapus soal ${index + 1}`} className="shrink-0 rounded-lg p-2 text-[var(--brand-red)] hover:bg-[var(--brand-red)]/10">Hapus</button></div>{question.options?.length > 0 && <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">{question.options.map((option, optionIndex) => <li key={`${optionIndex}-${option}`} className="rounded-lg border border-[var(--border-color)] p-2">{String.fromCharCode(65 + optionIndex)}. {option}</li>)}</ul>}<p className="mt-3 rounded-lg bg-[var(--accent-green)]/10 p-3 text-sm"><strong>Jawaban benar:</strong> {question.correct_answer}</p>{question.explanation && <p className="mt-2 text-sm text-[var(--foreground)]/65">{question.explanation}</p>}</article>)}</div>}
        </section>
        <AdminConfirmDialog open={!!pendingDelete} onCancel={() => setPendingDelete(null)} onConfirm={deleteQuestion} itemLabel="soal ini" />
    </div>;
}
