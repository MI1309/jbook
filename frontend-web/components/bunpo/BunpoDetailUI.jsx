'use client';

import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';

export default function BunpoDetailUI({ grammar, onClose }) {
    const { theme, mounted } = useTheme();
    if (!grammar) return null;

    const textColor = !mounted ? 'text-black' : (theme === 'dark' ? 'text-white' : 'text-black');
    const subTextColor = !mounted ? 'text-gray-400' : (theme === 'dark' ? 'text-gray-500' : 'text-gray-400');
    const cardBg = !mounted ? 'bg-white' : (theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-white');
    const borderStyle = !mounted ? 'border-gray-100' : (theme === 'dark' ? 'border-red-950/20' : 'border-gray-100');

    return (
        <div className={`${cardBg} min-h-screen py-8 flex flex-col items-center transition-colors duration-300`}>
            <div className="container mx-auto px-4 w-full max-w-3xl">
            {onClose ? (
                <button onClick={onClose} className={`inline-flex items-center font-black transition-all mb-8 hover:text-red-600 ${subTextColor}`}>
                    &larr; Kembali ke Daftar
                </button>
            ) : (
                <Link href="/bunpo" className={`inline-flex items-center font-black transition-all mb-8 hover:text-red-600 ${subTextColor}`}>
                    &larr; Kembali ke Daftar
                </Link>
            )}

            <div className={`${cardBg} shadow-2xl rounded-[2.5rem] p-8 border-t-8 border-red-600 transition-all border-b border-x ${borderStyle}`}>
                <div className={`mb-6 border-b pb-4 ${theme === 'dark' ? 'border-red-950/30' : 'border-gray-100'}`}>
                    <div className="flex justify-between items-start mb-4">
                        <h1 className={`text-3xl font-black tracking-tight transition-colors ${textColor}`}>{grammar.title}</h1>
                        <div className="flex flex-col gap-2 items-end">
                            <span className="bg-red-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg shadow-red-500/10 transition-colors">
                                JLPT N{grammar.jlpt_level}
                            </span>
                            {grammar.chapter && (
                                <span className={`${theme === 'dark' ? 'bg-red-950/20 text-red-400' : 'bg-gray-100 text-gray-400'} text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md transition-colors`}>
                                    Bab {grammar.chapter}
                                </span>
                            )}
                        </div>
                    </div>
                    <p className={`text-xl font-black p-4 rounded-xl shadow-inner border transition-colors ${theme === 'dark' ? 'bg-red-950/10 border-red-950/30 text-red-500' : 'bg-red-50 border-red-100 text-red-600'}`}>
                        {grammar.structure}
                    </p>
                </div>

                <div className="mb-8 mt-8">
                    <h2 className={`text-[10px] font-black uppercase tracking-widest mb-3 transition-colors ${subTextColor}`}>Penjelasan</h2>
                    <div className={`text-lg leading-relaxed whitespace-pre-wrap font-bold transition-colors ${textColor}`}>
                        {grammar.explanation}
                    </div>
                </div>

                <div>
                    <h2 className={`text-[10px] font-black uppercase tracking-widest mb-4 transition-colors ${subTextColor}`}>Contoh Kalimat</h2>
                    <div className="space-y-4">
                        {Array.isArray(grammar.sentences) && grammar.sentences.length > 0 ? (
                            grammar.sentences.map((sent, i) => (
                                <div key={i} className={`p-5 rounded-2xl border-l-4 transition-colors ${theme === 'dark' ? 'bg-red-950/10 border-red-600' : 'bg-gray-50 border-red-600'}`}>
                                    <p className={`text-xl font-bold mb-2 transition-colors ${textColor}`}>{sent.jp}</p>
                                    <p className={`font-bold italic transition-colors ${subTextColor}`}>{sent.id}</p>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-400 dark:text-gray-500 italic">Belum ada contoh kalimat.</p>
                        )}
                    </div>
                </div>
                </div>
            </div>
        </div>
    );
}
