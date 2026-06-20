'use client';

import { useState, useEffect, useRef } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { jbookApi } from '@/services/jbookApi';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

export default function AdminCustomModuleDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { theme } = useTheme();
    
    const [moduleData, setModuleData] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

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
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/admin/custom-modules" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">{moduleData.title}</h1>
                    <p className="text-sm opacity-60 uppercase font-bold tracking-wider">{moduleData.module_type}</p>
                </div>
            </div>

            {/* Actions */}
            <div className={`p-6 rounded-xl border ${theme === 'dark' ? 'bg-[#0a0a0a] border-neutral-800' : 'bg-white border-gray-200'} flex flex-wrap gap-4 items-center justify-between`}>
                <div className="flex items-center gap-4">
                    <button 
                        onClick={handleTogglePublish}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            moduleData.is_published 
                            ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                            : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                        }`}
                    >
                        {moduleData.is_published ? 'Batalkan Publish' : 'Publish Modul'}
                    </button>
                    <span className="text-sm opacity-70">Status: {moduleData.is_published ? 'Dapat dilihat User' : 'Draft (Tersembunyi)'}</span>
                </div>
                
                <div className="flex items-center gap-4">
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
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {uploading ? 'Mengunggah...' : 'Upload Excel Soal'}
                    </button>
                    <a 
                        href="/template_soal_kustom.xlsx" 
                        download
                        className="text-sm text-indigo-600 hover:underline"
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
                <h2 className="text-xl font-bold">Daftar Soal ({questions.length})</h2>
                {questions.length === 0 ? (
                    <div className="p-8 text-center opacity-50 border border-dashed rounded-xl">
                        Belum ada soal. Silakan upload file Excel.
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {questions.map((q, idx) => (
                            <div key={q.id} className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-[#0a0a0a] border-neutral-800' : 'bg-white border-gray-200'}`}>
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex gap-3">
                                        <span className="font-bold opacity-50">{idx + 1}.</span>
                                        <div>
                                            <p className="font-medium whitespace-pre-wrap">{q.question_text}</p>
                                            <p className="text-xs opacity-60 uppercase tracking-widest mt-1">{q.question_type}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => handleDeleteQuestion(q.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors">
                                        Hapus
                                    </button>
                                </div>
                                
                                {q.options && q.options.length > 0 && (
                                    <div className="ml-7 mt-3 grid grid-cols-2 gap-2 text-sm opacity-80">
                                        {q.options.map((opt, i) => (
                                            <div key={i} className="bg-gray-50 dark:bg-white/5 p-2 rounded">
                                                {String.fromCharCode(65 + i)}. {opt}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                
                                <div className="ml-7 mt-4 p-3 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded-lg text-sm">
                                    <strong>Jawaban Benar:</strong> {q.correct_answer}
                                    {q.explanation && (
                                        <p className="mt-1 opacity-80"><strong>Penjelasan:</strong> {q.explanation}</p>
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
