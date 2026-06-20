'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { jbookApi } from '@/services/jbookApi';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function CustomPracticeQuizPage() {
    const { id } = useParams();
    const { theme } = useTheme();
    
    const [moduleData, setModuleData] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [answers, setAnswers] = useState({});
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [results, setResults] = useState(null);

    useEffect(() => {
        if (id) {
            fetchData();
        }
    }, [id]);

    const fetchData = async () => {
        try {
            const mData = await jbookApi.getCustomModule(id);
            setModuleData(mData);
            const qData = await jbookApi.getCustomModuleQuestions(id);
            setQuestions(qData);
        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAnswerChange = (qId, val) => {
        if (isSubmitted) return;
        setAnswers(prev => ({ ...prev, [qId]: val }));
    };

    const handleSubmit = async () => {
        if (Object.keys(answers).length < questions.length) {
            if (!confirm("Masih ada soal yang belum dijawab. Yakin ingin mengumpulkan?")) {
                return;
            }
        }
        
        try {
            const res = await jbookApi.submitCustomModuleAnswers(id, answers);
            setResults(res);
            setIsSubmitted(true);
            window.scrollTo(0, 0);
        } catch (error) {
            console.error("Failed to submit", error);
            alert("Gagal mengirim jawaban.");
        }
    };

    if (loading) return <div className="p-8 text-center min-h-screen">Loading...</div>;
    if (!moduleData) return <div className="p-8 text-center min-h-screen">Modul tidak ditemukan.</div>;

    return (
        <div className={`min-h-screen py-8 ${theme === 'dark' ? 'bg-[#020202] text-neutral-200' : 'bg-gray-50 text-gray-900'}`}>
            <div className="max-w-4xl mx-auto px-4">
                
                {/* Header */}
                <div className="mb-8">
                    <Link href="/practice/custom" className="text-red-500 hover:underline text-sm font-bold uppercase tracking-widest mb-4 inline-block">
                        ← Kembali ke Daftar Modul
                    </Link>
                    <h1 className="text-3xl font-black">{moduleData.title}</h1>
                    {moduleData.description && <p className="opacity-70 mt-2">{moduleData.description}</p>}
                </div>

                {/* Score if submitted */}
                {isSubmitted && results && (
                    <div className={`p-8 mb-8 rounded-2xl text-center ${theme === 'dark' ? 'bg-neutral-900' : 'bg-white shadow-xl'}`}>
                        <h2 className="text-2xl font-bold mb-2">Hasil Latihan</h2>
                        <div className="text-5xl font-black text-red-600 mb-2">
                            {results.score} <span className="text-2xl text-neutral-500">/ {results.total}</span>
                        </div>
                        <p className="opacity-70">
                            Persentase: {Math.round((results.score / results.total) * 100)}%
                        </p>
                    </div>
                )}

                {/* Dokkai Passage */}
                {moduleData.module_type === 'dokkai' && moduleData.passage && (
                    <div className={`p-6 mb-8 rounded-2xl border ${theme === 'dark' ? 'bg-[#0a0a0a] border-neutral-800' : 'bg-white border-gray-200'} sticky top-4 z-10 shadow-lg`}>
                        <h3 className="font-bold mb-4 uppercase tracking-widest text-sm opacity-50">Teks Bacaan</h3>
                        <p className="whitespace-pre-wrap leading-relaxed text-lg">{moduleData.passage}</p>
                    </div>
                )}

                {/* Choukai Audio */}
                {moduleData.module_type === 'choukai' && moduleData.audio_url && (
                    <div className={`p-6 mb-8 rounded-2xl border flex items-center justify-center ${theme === 'dark' ? 'bg-[#0a0a0a] border-neutral-800' : 'bg-white border-gray-200'} sticky top-4 z-10 shadow-lg`}>
                        <audio controls className="w-full max-w-md">
                            <source src={moduleData.audio_url} type="audio/mpeg" />
                            Browser Anda tidak mendukung elemen audio.
                        </audio>
                    </div>
                )}

                {/* Questions */}
                <div className="space-y-6">
                    {questions.map((q, idx) => {
                        const isCorrect = results?.results[q.id]?.is_correct;
                        const correctAnswer = results?.results[q.id]?.correct_answer;
                        const explanation = results?.results[q.id]?.explanation;
                        const userAnswer = answers[q.id];

                        return (
                            <div key={q.id} className={`p-6 rounded-2xl border ${
                                isSubmitted 
                                ? isCorrect 
                                    ? (theme === 'dark' ? 'bg-green-900/10 border-green-900' : 'bg-green-50 border-green-200')
                                    : (theme === 'dark' ? 'bg-red-900/10 border-red-900' : 'bg-red-50 border-red-200')
                                : (theme === 'dark' ? 'bg-[#0a0a0a] border-neutral-800' : 'bg-white border-gray-200')
                            }`}>
                                <div className="flex gap-4 mb-4">
                                    <span className="font-black text-xl opacity-30">{idx + 1}.</span>
                                    <p className="text-lg font-medium whitespace-pre-wrap flex-1">{q.question_text}</p>
                                </div>

                                {/* Answer Input */}
                                <div className="ml-9">
                                    {q.question_type === 'choice' && (
                                        <div className="space-y-2">
                                            {q.options?.map((opt, i) => {
                                                const val = String.fromCharCode(65 + i); // A, B, C, D
                                                // if options are plain text, the answer could be the exact text or A/B/C/D.
                                                // Let's use the exact text as value to be safe, or let admin specify.
                                                // Assuming admin puts exact text or A/B/C/D in correct_answer.
                                                // We'll use the exact option text as value for simplicity.
                                                return (
                                                    <label key={i} className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                                                        userAnswer === opt 
                                                        ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' 
                                                        : 'hover:bg-gray-50 dark:hover:bg-white/5 border-transparent'
                                                    } ${isSubmitted && 'pointer-events-none'}`}>
                                                        <input 
                                                            type="radio" 
                                                            name={`q-${q.id}`} 
                                                            value={opt}
                                                            checked={userAnswer === opt}
                                                            onChange={() => handleAnswerChange(q.id, opt)}
                                                            className="w-4 h-4 text-red-600 focus:ring-red-500"
                                                        />
                                                        <span className="ml-3">{opt}</span>
                                                    </label>
                                                )
                                            })}
                                        </div>
                                    )}

                                    {q.question_type === 'true_false' && (
                                        <div className="flex gap-4">
                                            {['True', 'False'].map(val => (
                                                <button
                                                    key={val}
                                                    onClick={() => handleAnswerChange(q.id, val)}
                                                    disabled={isSubmitted}
                                                    className={`px-8 py-3 rounded-xl font-bold text-lg border transition-all ${
                                                        userAnswer === val 
                                                        ? 'bg-indigo-600 text-white border-indigo-600' 
                                                        : 'bg-transparent hover:bg-gray-100 dark:hover:bg-white/5 border-gray-300 dark:border-neutral-700'
                                                    } ${isSubmitted && 'pointer-events-none opacity-80'}`}
                                                >
                                                    {val === 'True' ? 'O (Benar)' : 'X (Salah)'}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {q.question_type === 'fill_blank' && (
                                        <input 
                                            type="text" 
                                            value={userAnswer || ''}
                                            onChange={e => handleAnswerChange(q.id, e.target.value)}
                                            disabled={isSubmitted}
                                            placeholder="Ketik jawaban Anda..."
                                            className={`w-full max-w-md p-3 border rounded-xl bg-transparent ${isSubmitted && 'pointer-events-none opacity-80'}`}
                                        />
                                    )}
                                </div>

                                {/* Results Feedback */}
                                {isSubmitted && (
                                    <div className="ml-9 mt-6 p-4 rounded-xl bg-white/50 dark:bg-black/20">
                                        <div className="flex items-center gap-2 mb-2 font-bold">
                                            {isCorrect ? (
                                                <span className="text-green-600">✓ Jawaban Anda Benar</span>
                                            ) : (
                                                <span className="text-red-600">✗ Jawaban Anda Salah</span>
                                            )}
                                        </div>
                                        {!isCorrect && (
                                            <p className="text-sm">Jawaban yang tepat: <span className="font-bold">{correctAnswer}</span></p>
                                        )}
                                        {explanation && (
                                            <div className="mt-3 text-sm opacity-80 border-t border-black/10 dark:border-white/10 pt-3">
                                                <strong>Penjelasan:</strong> {explanation}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {!isSubmitted && questions.length > 0 && (
                    <div className="mt-8 text-center">
                        <button 
                            onClick={handleSubmit}
                            className="px-10 py-4 bg-red-600 text-white font-black text-xl rounded-2xl shadow-xl shadow-red-600/30 hover:bg-red-700 hover:-translate-y-1 transition-all"
                        >
                            KUMPULKAN JAWABAN
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
