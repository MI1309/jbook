'use client';

import { useState, useEffect, useRef } from 'react';
import { jbookApi } from '@/services/jbookApi';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import AudioUploadWidget from '@/components/admin/AudioUploadWidget';

export default function AdminCustomModuleDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    
    const [moduleData, setModuleData] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    const [showAddModal, setShowAddModal] = useState(false);
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

    useEffect(() => {
        if (id) {
            fetchData();
        }
    }, [id]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const mData = await jbookApi.adminGetCustomModule(id);
            setModuleData(mData);
            const qData = await jbookApi.adminGetCustomModuleQuestions(id);
            setQuestions(qData);
        } catch (error) {
            console.error("Failed to fetch data", error);
            alert("Gagal memuat data modul.");
        } finally {
            setLoading(false);
        }
    };

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
        try {
            const payload = { ...moduleData, ...editModuleData };
            await jbookApi.adminUpdateCustomModule(id, payload);
            setShowEditModule(false);
            fetchData();
        } catch (error) {
            console.error("Failed to update module", error);
            alert("Gagal menyimpan perubahan modul.");
        }
    };

    const handleCreateQuestion = async (e) => {
        e.preventDefault();
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
            fetchData();
        } catch (error) {
            console.error("Failed to create question", error);
            alert("Gagal menambahkan soal.");
        }
    };

    const handleTogglePublish = async () => {
        try {
            await jbookApi.adminUpdateCustomModule(id, {
                ...moduleData,
                is_published: !moduleData.is_published
            });
            setModuleData({ ...moduleData, is_published: !moduleData.is_published });
        } catch (error) {
            console.error("Failed to toggle publish", error);
            alert("Gagal mengubah status publish.");
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const res = await jbookApi.adminUploadCustomModuleExcel(id, file);
            alert(`Berhasil mengunggah ${res.count} soal.`);
            fetchData();
        } catch (error) {
            console.error("Failed to upload excel", error);
            alert("Gagal mengunggah file Excel. Pastikan formatnya benar.");
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
            } catch (error) {
                console.error("Failed to delete question", error);
                alert("Gagal menghapus soal.");
            }
        }
    };

    if (loading) return <div className="p-8 text-center">Loading...</div>;
    if (!moduleData) return <div className="p-8 text-center">Modul tidak ditemukan.</div>;

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Link href="/admin/custom-modules" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors">
                        <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </Link>
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold leading-tight">{moduleData.title}</h1>
                        <p className="text-xs md:text-sm opacity-60 uppercase font-bold tracking-wider mt-1">{moduleData.module_type}</p>
                    </div>
                </div>
                <button 
                    onClick={handleEditModuleClick}
                    className="w-full md:w-auto px-4 py-2.5 md:py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 font-medium text-sm transition-colors text-center"
                >
                    Edit Informasi Modul
                </button>
            </div>

            {/* Edit Module Modal */}
            {showEditModule && (
                <form onSubmit={handleUpdateModule} className="p-4 md:p-6 rounded-xl border bg-neutral-900 border-neutral-800 space-y-4">
                    <h3 className="font-bold text-lg">Edit Informasi Modul</h3>
                    
                    <div>
                        <label className="block text-sm font-medium mb-1">Judul Modul</label>
                        <input required type="text" className="w-full p-2.5 md:p-2 border rounded-lg bg-transparent" value={editModuleData.title} onChange={e => setEditModuleData({...editModuleData, title: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Deskripsi</label>
                        <textarea className="w-full p-2.5 md:p-2 border rounded-lg bg-transparent" value={editModuleData.description} onChange={e => setEditModuleData({...editModuleData, description: e.target.value})}></textarea>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Tipe Modul</label>
                        <select className="w-full p-2.5 md:p-2 border rounded-lg bg-transparent" value={editModuleData.module_type} onChange={e => setEditModuleData({...editModuleData, module_type: e.target.value})}>
                            <option value="general">Umum (Campuran)</option>
                            <option value="dokkai">Dokkai (Membaca)</option>
                            <option value="choukai">Choukai (Mendengar)</option>
                        </select>
                    </div>
                    {editModuleData.module_type === 'dokkai' && (
                        <div>
                            <label className="block text-sm font-medium mb-1">Teks Cerita / Passage</label>
                            <textarea className="w-full p-2.5 md:p-2 border rounded-lg bg-transparent" rows="4" value={editModuleData.passage} onChange={e => setEditModuleData({...editModuleData, passage: e.target.value})}></textarea>
                        </div>
                    )}
                    {editModuleData.module_type === 'choukai' && (
                        <AudioUploadWidget
                            value={editModuleData.audio_url}
                            onChange={(url) => setEditModuleData({ ...editModuleData, audio_url: url })}
                            folder="choukai"
                        />
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={() => setShowEditModule(false)} className="px-4 py-2.5 md:py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-sm font-medium">Batal</button>
                        <button type="submit" className="px-4 py-2.5 md:py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">Simpan Perubahan</button>
                    </div>
                </form>
            )}

            {/* Actions */}
            <div className="p-4 md:p-6 rounded-xl border bg-[#0a0a0a] border-neutral-800 flex flex-col md:flex-row gap-4 md:items-center justify-between">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4 w-full md:w-auto">
                    <button 
                        onClick={handleTogglePublish}
                        className={`w-full sm:w-auto px-4 py-2.5 md:py-2 rounded-lg font-medium transition-colors text-sm text-center ${
                            moduleData.is_published 
                            ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                            : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                        }`}
                    >
                        {moduleData.is_published ? 'Batalkan Publish' : 'Publish Modul'}
                    </button>
                    <span className="text-xs md:text-sm opacity-70 text-center sm:text-left">Status: {moduleData.is_published ? 'Dapat dilihat User' : 'Draft (Tersembunyi)'}</span>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4 w-full md:w-auto pt-4 md:pt-0 border-t md:border-0 border-gray-100 dark:border-neutral-800">
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
                        className="w-full sm:w-auto px-4 py-2.5 md:py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium text-center"
                    >
                        {uploading ? 'Mengunggah...' : 'Upload Excel Soal'}
                    </button>
                    <a 
                        href="/template_soal_kustom.xlsx" 
                        download
                        className="text-xs md:text-sm text-indigo-600 hover:underline text-center sm:text-left block"
                        onClick={(e) => {
                            e.preventDefault();
                            alert("Format Kolom: question_type, question, option_a, option_b, option_c, option_d, correct_answer, explanation\nquestion_type bisa: choice, true_false, fill_blank");
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
                        className="w-full sm:w-auto px-4 py-2.5 md:py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium text-center"
                    >
                        + Tambah Soal Manual
                    </button>
                </div>

                {showAddModal && (
                    <form onSubmit={handleCreateQuestion} className="p-6 rounded-xl border bg-neutral-900 border-neutral-800 space-y-4">
                        <h3 className="font-bold text-lg">Buat Soal Baru</h3>
                        
                        <div>
                            <label className="block text-sm font-medium mb-1">Tipe Soal</label>
                            <select className="w-full p-2 border rounded-lg bg-transparent" value={newQuestion.question_type} onChange={e => setNewQuestion({...newQuestion, question_type: e.target.value})}>
                                <option value="choice">Pilihan Ganda (A, B, C, D)</option>
                                <option value="true_false">Benar / Salah (Maru/Batsu)</option>
                                <option value="fill_blank">Isian Singkat</option>
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium mb-1">Pertanyaan</label>
                            <textarea required className="w-full p-2 border rounded-lg bg-transparent" rows="3" value={newQuestion.question_text} onChange={e => setNewQuestion({...newQuestion, question_text: e.target.value})}></textarea>
                        </div>

                        {newQuestion.question_type === 'choice' && (
                            <div className="grid grid-cols-2 gap-4">
                                {newQuestion.options.map((opt, i) => (
                                    <div key={i}>
                                        <label className="block text-sm font-medium mb-1">Opsi {String.fromCharCode(65 + i)}</label>
                                        <input type="text" className="w-full p-2 border rounded-lg bg-transparent" value={opt} onChange={e => {
                                            const newOpts = [...newQuestion.options];
                                            newOpts[i] = e.target.value;
                                            setNewQuestion({...newQuestion, options: newOpts});
                                        }} />
                                    </div>
                                ))}
                            </div>
                        )}

                        {newQuestion.question_type === 'true_false' && (
                            <p className="text-sm opacity-70">Otomatis menyediakan opsi True (O) dan False (X).</p>
                        )}

                        <div>
                            <label className="block text-sm font-medium mb-1">Jawaban Benar</label>
                            {newQuestion.question_type === 'true_false' ? (
                                <select className="w-full p-2 border rounded-lg bg-transparent" value={newQuestion.correct_answer} onChange={e => setNewQuestion({...newQuestion, correct_answer: e.target.value})}>
                                    <option value="">Pilih Jawaban...</option>
                                    <option value="True">True (O)</option>
                                    <option value="False">False (X)</option>
                                </select>
                            ) : newQuestion.question_type === 'choice' ? (
                                <select required className="w-full p-2 border rounded-lg bg-transparent" value={newQuestion.correct_answer} onChange={e => setNewQuestion({...newQuestion, correct_answer: e.target.value})}>
                                    <option value="">Pilih Jawaban...</option>
                                    {newQuestion.options.map((opt, i) => opt.trim() !== '' && (
                                        <option key={i} value={opt}>Opsi {String.fromCharCode(65 + i)}: {opt}</option>
                                    ))}
                                </select>
                            ) : (
                                <input required type="text" className="w-full p-2 border rounded-lg bg-transparent" placeholder="Ketik jawaban yang tepat..." value={newQuestion.correct_answer} onChange={e => setNewQuestion({...newQuestion, correct_answer: e.target.value})} />
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Penjelasan (Opsional)</label>
                            <textarea className="w-full p-2 border rounded-lg bg-transparent" rows="2" value={newQuestion.explanation} onChange={e => setNewQuestion({...newQuestion, explanation: e.target.value})}></textarea>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-white/5">Batal</button>
                            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Simpan Soal</button>
                        </div>
                    </form>
                )}
                {questions.length === 0 ? (
                    <div className="p-8 text-center opacity-50 border border-dashed rounded-xl">
                        Belum ada soal. Silakan upload file Excel.
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {questions.map((q, idx) => (
                            <div key={q.id} className="p-4 md:p-5 rounded-xl border bg-[#0a0a0a] border-neutral-800">
                                <div className="flex flex-col sm:flex-row justify-between items-start mb-2 gap-3">
                                    <div className="flex gap-3">
                                        <span className="font-bold opacity-50 mt-1">{idx + 1}.</span>
                                        <div>
                                            <p className="font-medium whitespace-pre-wrap">{q.question_text}</p>
                                            <p className="text-xs opacity-60 uppercase tracking-widest mt-1">{q.question_type}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => handleDeleteQuestion(q.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors w-full sm:w-auto text-sm text-center border border-red-100 dark:border-red-900/30 sm:border-transparent mt-2 sm:mt-0 font-medium">
                                        Hapus
                                    </button>
                                </div>
                                
                                {q.options && q.options.length > 0 && (
                                    <div className="ml-0 sm:ml-7 mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm opacity-80">
                                        {q.options.map((opt, i) => (
                                            <div key={i} className="bg-gray-50 dark:bg-white/5 p-2.5 sm:p-2 rounded border border-gray-100 dark:border-neutral-800">
                                                {String.fromCharCode(65 + i)}. {opt}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                
                                <div className="ml-0 sm:ml-7 mt-4 p-3 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded-lg text-sm border border-green-100 dark:border-green-900/30">
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
