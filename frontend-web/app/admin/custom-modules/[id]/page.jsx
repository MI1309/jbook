'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { jbookApi } from '@/services/jbookApi';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import AudioUploadWidget from '@/components/admin/AudioUploadWidget';
import { AdminEmptyState, AdminErrorState, AdminSkeleton } from '@/components/admin/AdminFeedback';
import { appToast as toast } from '@/components/common/AppMessage';
import AdminTabs from '@/components/admin/AdminTabs';
import { ArrowLeft, Plus } from 'lucide-react';

const fieldClass = 'w-full rounded-xl border border-[var(--border-color)] bg-[var(--background)] px-3.5 py-3 text-sm text-[var(--foreground)] outline-none transition-colors placeholder:text-[var(--foreground)]/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent-blue)]';

export default function AdminCustomModuleDetailPage() {
    const { id } = useParams();
    const [moduleData, setModuleData] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState('');
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    const [showAddModal, setShowAddModal] = useState(false);
    const [editTab, setEditTab] = useState('info');
    const [questionTab, setQuestionTab] = useState('info');
    const [newQuestion, setNewQuestion] = useState({
        question_type: 'choice',
        question_text: '',
        options: ['', '', '', ''],
        correct_answer: '',
        explanation: '',
    });

    const [showEditModule, setShowEditModule] = useState(false);
    const [editModuleData, setEditModuleData] = useState({
        title: '',
        description: '',
        module_type: 'general',
        passage: '',
        audio_url: ''
    });

    const fetchData = useCallback(async () => {
        setLoading(true);
        setFetchError('');
        try {
            const mData = await jbookApi.adminGetCustomModule(id);
            setModuleData(mData);
            const qData = await jbookApi.adminGetCustomModuleQuestions(id);
            setQuestions(qData);
        } catch (error) {
            console.error("Failed to fetch data", error);
            setFetchError('Gagal memuat data modul. Periksa koneksi atau akses akun, lalu coba lagi.');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (id) {
            fetchData();
        }
    }, [id, fetchData]);

    const handleEditModuleClick = () => {
        setEditModuleData({
            title: moduleData.title || '',
            description: moduleData.description || '',
            module_type: moduleData.module_type || 'general',
            passage: moduleData.passage || '',
            audio_url: moduleData.audio_url || ''
        });
        setShowEditModule(true);
    };

    const handleUpdateModule = async (e) => {
        e.preventDefault();
        if (!editModuleData.title.trim()) {
            setEditTab('info');
            toast.error('Judul modul wajib diisi.');
            return;
        }
        try {
            const payload = { ...moduleData, ...editModuleData };
            await jbookApi.adminUpdateCustomModule(id, payload);
            setShowEditModule(false);
            fetchData();
            toast.success('Informasi modul berhasil diperbarui.');
        } catch (error) {
            console.error("Failed to update module", error);
            toast.error('Gagal menyimpan perubahan modul.');
        }
    };

    const handleCreateQuestion = async (e) => {
        e.preventDefault();
        if (!newQuestion.question_text.trim()) {
            setQuestionTab('info');
            toast.error('Pertanyaan wajib diisi.');
            return;
        }
        if (!newQuestion.correct_answer.trim()) {
            setQuestionTab('metadata');
            toast.error('Jawaban benar wajib diisi.');
            return;
        }
        try {
            const payload = { ...newQuestion };
            if (payload.question_type !== 'choice') {
                payload.options = [];
            } else {
                payload.options = payload.options.filter(o => o.trim() !== '');
            }
            await jbookApi.adminCreateCustomModuleQuestion(id, payload);
            setShowAddModal(false);
            setNewQuestion({ question_type: 'choice', question_text: '', options: ['', '', '', ''], correct_answer: '', explanation: '' });
            setQuestionTab('info');
            fetchData();
            toast.success('Soal berhasil ditambahkan.');
        } catch (error) {
            console.error("Failed to create question", error);
            toast.error('Gagal menambahkan soal.');
        }
    };

    const handleTogglePublish = async () => {
        try {
            await jbookApi.adminUpdateCustomModule(id, {
                ...moduleData,
                is_published: !moduleData.is_published
            });
            setModuleData({ ...moduleData, is_published: !moduleData.is_published });
            toast.success(moduleData.is_published ? 'Modul dipindahkan ke draft.' : 'Modul berhasil dipublikasikan.');
        } catch (error) {
            console.error("Failed to toggle publish", error);
            toast.error('Gagal mengubah status publikasi.');
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const res = await jbookApi.adminUploadCustomModuleExcel(id, file);
            toast.success(`Berhasil mengunggah ${res.count} soal.`);
            fetchData();
        } catch (error) {
            console.error("Failed to upload excel", error);
            toast.error('Gagal mengunggah file Excel. Pastikan formatnya benar.');
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleDeleteQuestion = async (qId) => {
        if (confirm("Hapus soal ini?")) {
            try {
                await jbookApi.adminDeleteCustomModuleQuestion(qId);
                fetchData();
                toast.success('Soal berhasil dihapus.');
            } catch (error) {
                console.error("Failed to delete question", error);
                toast.error('Gagal menghapus soal.');
            }
        }
    };

    if (loading) return <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)]"><AdminSkeleton rows={5} /></div>;
    if (fetchError) return <AdminErrorState title="Modul gagal dimuat" message={fetchError} onRetry={fetchData} />;
    if (!moduleData) return <AdminEmptyState title="Modul tidak ditemukan" message="Modul mungkin sudah dihapus atau tautannya tidak valid." href="/admin/custom-modules" actionLabel="Kembali ke daftar" />;

    return (
        <div className="mx-auto max-w-5xl space-y-6 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Link href="/admin/custom-modules" aria-label="Kembali ke modul" className="rounded-lg p-2 text-[var(--foreground)]/65 transition-colors hover:bg-[var(--card-bg)] hover:text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-red)]">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <p className="text-sm text-[var(--foreground)]/55">Latihan / Modul Kustom</p>
                        <h1 className="mt-1 text-2xl font-semibold leading-tight text-[var(--foreground)]">{moduleData.title}</h1>
                        <p className="mt-1 text-xs capitalize text-[var(--foreground)]/55">{moduleData.module_type}</p>
                    </div>
                </div>
                <button 
                    onClick={handleEditModuleClick}
                    className="w-full rounded-xl border border-[var(--border-color)] px-4 py-2.5 text-center text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--background)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-red)] md:w-auto"
                >
                    Edit Informasi Modul
                </button>
            </div>

            {/* Edit Module Modal */}
            {showEditModule && (
                <form onSubmit={handleUpdateModule} className="overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)]">
                    <h3 className="font-bold text-lg">Edit Informasi Modul</h3>
                    <AdminTabs idPrefix="module-edit" value={editTab} onChange={setEditTab} label="Bagian formulir modul" tabs={[{ id: 'info', label: 'Info Dasar' }, { id: 'content', label: 'Konten' }, { id: 'metadata', label: 'Metadata' }]} />
                    <div className="space-y-5 p-4 md:p-6">
                        <section id="module-edit-panel-info" role="tabpanel" aria-labelledby="module-edit-tab-info" hidden={editTab !== 'info'} className="space-y-4">
                            <label className="block space-y-2"><span className="text-sm font-medium text-[var(--foreground)]">Judul modul</span><input type="text" className={fieldClass} value={editModuleData.title} onChange={e => setEditModuleData({...editModuleData, title: e.target.value})} /></label>
                            <label className="block space-y-2"><span className="text-sm font-medium text-[var(--foreground)]">Deskripsi</span><textarea className={fieldClass} value={editModuleData.description} onChange={e => setEditModuleData({...editModuleData, description: e.target.value})}></textarea></label>
                        </section>
                        <section id="module-edit-panel-content" role="tabpanel" aria-labelledby="module-edit-tab-content" hidden={editTab !== 'content'} className="space-y-4">
                            {editModuleData.module_type === 'dokkai' && <label className="block space-y-2"><span className="text-sm font-medium text-[var(--foreground)]">Teks cerita / passage</span><textarea className={fieldClass} rows="5" value={editModuleData.passage} onChange={e => setEditModuleData({...editModuleData, passage: e.target.value})}></textarea></label>}
                            {editModuleData.module_type === 'choukai' && <AudioUploadWidget value={editModuleData.audio_url} onChange={(url) => setEditModuleData({...editModuleData, audio_url: url})} folder="choukai" />}
                            {editModuleData.module_type === 'general' && <p className="text-sm text-[var(--foreground)]/55">Modul umum tidak memerlukan konten tambahan.</p>}
                        </section>
                        <section id="module-edit-panel-metadata" role="tabpanel" aria-labelledby="module-edit-tab-metadata" hidden={editTab !== 'metadata'}>
                            <label className="block space-y-2"><span className="text-sm font-medium text-[var(--foreground)]">Tipe modul</span><select className={fieldClass} value={editModuleData.module_type} onChange={e => setEditModuleData({...editModuleData, module_type: e.target.value})}><option value="general">Umum (Campuran)</option><option value="dokkai">Dokkai (Membaca)</option><option value="choukai">Choukai (Mendengar)</option></select></label>
                        </section>
                        <div className="flex flex-col-reverse justify-end gap-3 border-t border-[var(--border-color)] pt-5 sm:flex-row">
                            <button type="button" onClick={() => setShowEditModule(false)} className="rounded-xl border border-[var(--border-color)] px-4 py-2.5 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--background)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-red)]">Batal</button>
                            <button type="submit" className="rounded-xl bg-[var(--brand-red)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-red)]">Simpan Perubahan</button>
                        </div>
                    </div>
                </form>
            )}

            {/* Actions */}
            <div className="flex flex-col justify-between gap-4 rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4 md:flex-row md:items-center md:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4 w-full md:w-auto">
                    <button 
                        onClick={handleTogglePublish}
                        className={`w-full sm:w-auto px-4 py-2.5 md:py-2 rounded-lg font-medium transition-colors text-sm text-center ${
                            moduleData.is_published 
                            ? 'bg-[var(--accent-green)]/10 text-[var(--accent-green)] hover:bg-[var(--accent-green)]/15'
                            : 'bg-[var(--accent-gold)]/12 text-[var(--accent-gold)] hover:bg-[var(--accent-gold)]/20'
                        }`}
                    >
                        {moduleData.is_published ? 'Batalkan Publish' : 'Publish Modul'}
                    </button>
                    <span className="text-xs md:text-sm opacity-70 text-center sm:text-left">Status: {moduleData.is_published ? 'Dapat dilihat User' : 'Draft (Tersembunyi)'}</span>
                </div>
                
                <div className="flex w-full flex-col gap-3 border-t border-[var(--border-color)] pt-4 sm:flex-row sm:items-center md:w-auto md:border-0 md:pt-0 md:gap-4">
                    <input 
                        type="file" 
                        accept=".xlsx, .xls" 
                        className="hidden" 
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="w-full rounded-xl bg-[var(--brand-red)] px-4 py-2.5 text-center text-sm font-medium text-white transition-colors hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-red)] disabled:cursor-wait disabled:opacity-50 sm:w-auto"
                    >
                        {uploading ? 'Mengunggah...' : 'Upload Excel Soal'}
                    </button>
                    <a 
                        href="/template_soal_kustom.xlsx" 
                        download
                        className="block rounded text-center text-sm text-[var(--accent-blue)] transition-colors hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-red)] sm:text-left"
                        onClick={(e) => {
                            e.preventDefault();
                            toast.info("Format: question_type, question, option_a-d, correct_answer, explanation. Tipe: choice, true_false, fill_blank.");
                        }}
                    >
                        Lihat Format Excel
                    </a>
                </div>
            </div>

            {/* Questions List */}
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <h2 className="text-lg md:text-xl font-bold">Daftar Soal ({questions.length})</h2>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand-red)] px-4 py-2.5 text-center text-sm font-medium text-white transition-colors hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-red)] sm:w-auto"
                    >
                        <Plus size={16} /> Tambah Soal Manual
                    </button>
                </div>

                {showAddModal && (
                    <form onSubmit={handleCreateQuestion} className="overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)]">
                        <h3 className="font-bold text-lg">Buat Soal Baru</h3>
                        <AdminTabs idPrefix="question-create" value={questionTab} onChange={setQuestionTab} label="Bagian formulir soal" tabs={[{ id: 'info', label: 'Pertanyaan' }, { id: 'content', label: 'Opsi' }, { id: 'metadata', label: 'Jawaban' }]} />
                        <div className="space-y-5 p-5 sm:p-6">
                        <section id="question-create-panel-info" role="tabpanel" aria-labelledby="question-create-tab-info" hidden={questionTab !== 'info'} className="space-y-4">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Tipe soal</label>
                            <select className={fieldClass} value={newQuestion.question_type} onChange={e => setNewQuestion({...newQuestion, question_type: e.target.value})}>
                                <option value="choice">Pilihan Ganda (A, B, C, D)</option>
                                <option value="true_false">Benar / Salah (Maru/Batsu)</option>
                                <option value="fill_blank">Isian Singkat</option>
                            </select>
                        </div>
                        
                        <div>
                            <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Pertanyaan</label>
                            <textarea className={fieldClass} rows="3" value={newQuestion.question_text} onChange={e => setNewQuestion({...newQuestion, question_text: e.target.value})}></textarea>
                        </div>
                        </section>

                        <section id="question-create-panel-content" role="tabpanel" aria-labelledby="question-create-tab-content" hidden={questionTab !== 'content'} className="space-y-4">
                        {newQuestion.question_type === 'choice' && (
                            <div className="grid grid-cols-2 gap-4">
                                {newQuestion.options.map((opt, i) => (
                                    <div key={i}>
                                        <label className="block text-sm font-medium mb-1">Opsi {String.fromCharCode(65 + i)}</label>
                                        <input type="text" className={fieldClass} value={opt} onChange={e => {
                                            const newOpts = [...newQuestion.options];
                                            newOpts[i] = e.target.value;
                                            setNewQuestion({...newQuestion, options: newOpts});
                                        }} />
                                    </div>
                                ))}
                            </div>
                        )}

                        {newQuestion.question_type === 'true_false' && (
                            <p className="text-sm text-[var(--foreground)]/60">Otomatis menyediakan opsi True (O) dan False (X).</p>
                        )}
                        {newQuestion.question_type !== 'choice' && newQuestion.question_type !== 'true_false' && <p className="text-sm text-[var(--foreground)]/60">Tipe isian singkat tidak menggunakan opsi pilihan.</p>}
                        </section>

                        <section id="question-create-panel-metadata" role="tabpanel" aria-labelledby="question-create-tab-metadata" hidden={questionTab !== 'metadata'} className="space-y-4">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Jawaban benar</label>
                            {newQuestion.question_type === 'true_false' ? (
                                <select className={fieldClass} value={newQuestion.correct_answer} onChange={e => setNewQuestion({...newQuestion, correct_answer: e.target.value})}>
                                    <option value="">Pilih Jawaban...</option>
                                    <option value="True">True (O)</option>
                                    <option value="False">False (X)</option>
                                </select>
                            ) : newQuestion.question_type === 'choice' ? (
                                <select className={fieldClass} value={newQuestion.correct_answer} onChange={e => setNewQuestion({...newQuestion, correct_answer: e.target.value})}>
                                    <option value="">Pilih Jawaban...</option>
                                    {newQuestion.options.map((opt, i) => opt.trim() !== '' && (
                                        <option key={i} value={opt}>Opsi {String.fromCharCode(65 + i)}: {opt}</option>
                                    ))}
                                </select>
                            ) : (
                                <input type="text" className={fieldClass} placeholder="Ketik jawaban yang tepat..." value={newQuestion.correct_answer} onChange={e => setNewQuestion({...newQuestion, correct_answer: e.target.value})} />
                            )}
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-[var(--foreground)]">Penjelasan (opsional)</label>
                            <textarea className={fieldClass} rows="2" value={newQuestion.explanation} onChange={e => setNewQuestion({...newQuestion, explanation: e.target.value})}></textarea>
                        </div>
                        </section>

                        <div className="flex flex-col-reverse justify-end gap-3 border-t border-[var(--border-color)] pt-5 sm:flex-row">
                            <button type="button" onClick={() => setShowAddModal(false)} className="rounded-xl border border-[var(--border-color)] px-4 py-2.5 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--background)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-red)]">Batal</button>
                            <button type="submit" className="rounded-xl bg-[var(--brand-red)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-red)]">Simpan Soal</button>
                        </div>
                        </div>
                    </form>
                )}
                {questions.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-[var(--border-color)] bg-[var(--card-bg)]">
                        <AdminEmptyState title="Belum ada soal" message="Tambahkan pertanyaan secara manual atau unggah file Excel." />
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {questions.map((q, idx) => (
                            <div key={q.id} className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4 md:p-5">
                                <div className="flex flex-col sm:flex-row justify-between items-start mb-2 gap-3">
                                    <div className="flex gap-3">
                                        <span className="font-bold opacity-50 mt-1">{idx + 1}.</span>
                                        <div>
                                            <p className="font-medium whitespace-pre-wrap">{q.question_text}</p>
                                            <p className="text-xs opacity-60 uppercase tracking-widest mt-1">{q.question_type}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => handleDeleteQuestion(q.id)} className="mt-2 w-full rounded-lg border border-[var(--brand-red)]/20 p-2 text-center text-sm font-medium text-[var(--brand-red)] transition-colors hover:bg-[var(--brand-red)]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-red)] sm:mt-0 sm:w-auto sm:border-transparent">
                                        Hapus
                                    </button>
                                </div>
                                
                                {q.options && q.options.length > 0 && (
                                    <div className="ml-0 sm:ml-7 mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm opacity-80">
                                        {q.options.map((opt, i) => (
                                            <div key={i} className="rounded-lg border border-[var(--border-color)] bg-[var(--background)] p-2.5 sm:p-2">
                                                {String.fromCharCode(65 + i)}. {opt}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                
                                <div className="ml-0 mt-4 rounded-xl border border-[var(--accent-green)]/20 bg-[var(--accent-green)]/10 p-3 text-sm text-[var(--foreground)] sm:ml-7">
                                    <div className="flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                        <span><strong>Jawaban Benar:</strong> {q.correct_answer}</span>
                                    </div>
                                    {q.explanation && (
                                        <div className="mt-2 pt-2 border-t border-green-200 dark:border-green-800/50 opacity-90">
                                            <strong>Penjelasan:</strong> <span className="whitespace-pre-wrap">{q.explanation}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
