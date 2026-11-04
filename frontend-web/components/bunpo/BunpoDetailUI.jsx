'use client';

import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';

export default function BunpoDetailUI({
    grammar,
    onClose,
    backHref = '/bunpo',
    backLabel = 'Kembali ke Daftar',
    levelHref,
    levelLabel,
}) {
    const { theme, mounted } = useTheme();
    if (!grammar) return null;
    const sourceSections = grammar.source_data?.detail?.bagian;

    const textColor = !mounted ? 'text-black' : (theme === 'dark' ? 'text-white' : 'text-black');
    const subTextColor = !mounted ? 'text-gray-400' : (theme === 'dark' ? 'text-gray-500' : 'text-gray-400');
    const cardBg = !mounted ? 'bg-white' : (theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-white');
    const borderStyle = !mounted ? 'border-gray-100' : (theme === 'dark' ? 'border-blue-950/20' : 'border-gray-100');

    return (
        <div className={`${cardBg} min-h-screen py-8 flex flex-col items-center transition-colors duration-300`}>
            <div className="container mx-auto px-4 w-full max-w-3xl">
            {onClose ? (
                <button onClick={onClose} className={`inline-flex items-center font-black transition-all mb-8 hover:text-blue-600 ${subTextColor}`}>
                    &larr; {backLabel}
                </button>
            ) : (
                <>
                    <nav aria-label="Breadcrumb" className={`mb-4 text-sm ${subTextColor}`}>
                        <Link href="/bunpo" className="font-semibold hover:text-blue-600 hover:underline">Bunpo</Link>
                        {levelHref && levelLabel && (
                            <>
                                <span aria-hidden="true" className="px-2">/</span>
                                <Link href={levelHref} className="font-semibold hover:text-blue-600 hover:underline">{levelLabel}</Link>
                            </>
                        )}
                        <span aria-hidden="true" className="px-2">/</span>
                        <span aria-current="page" className="font-bold">{grammar.title}</span>
                    </nav>
                    <Link href={backHref} className={`inline-flex items-center font-black transition-all mb-8 hover:text-blue-600 ${subTextColor}`}>
                        &larr; {backLabel}
                    </Link>
                </>
            )}

            <div className={`${cardBg} shadow-2xl rounded-[2.5rem] p-8 border-t-8 border-blue-600 transition-all border-b border-x ${borderStyle}`}>
                <div className={`mb-6 border-b pb-4 ${theme === 'dark' ? 'border-blue-950/30' : 'border-gray-100'}`}>
                    <div className="flex justify-between items-start mb-4">
                        <h1 className={`text-3xl font-black tracking-tight transition-colors ${textColor}`}>{grammar.title}</h1>
                        <div className="flex flex-col gap-2 items-end">
                            <span className="bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg shadow-blue-500/10 transition-colors">
                                JLPT N{grammar.jlpt_level}
                            </span>
                            {grammar.chapter && (
                                <span className={`${theme === 'dark' ? 'bg-blue-950/20 text-blue-300' : 'bg-gray-100 text-gray-400'} text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md transition-colors`}>
                                    Bab {grammar.chapter}
                                </span>
                            )}
                        </div>
                    </div>
                    {grammar.source_data?.kelompok && (
                        <p className={`mb-3 text-xs font-black uppercase tracking-wide ${subTextColor}`}>
                            {grammar.source_data.kelompok}
                        </p>
                    )}
                    <div className={`rounded-xl border p-4 shadow-inner transition-colors ${theme === 'dark' ? 'bg-blue-950/10 border-blue-950/30' : 'bg-blue-50 border-blue-100'}`}>
                        <p className={`mb-1 text-[10px] font-black uppercase tracking-widest ${subTextColor}`}>Arti / Struktur</p>
                        <p className={`text-xl font-black ${theme === 'dark' ? 'text-blue-300' : 'text-blue-700'}`}>
                            {grammar.meaning || grammar.structure}
                        </p>
                    </div>
                </div>

                <div className="mb-8 mt-8">
                    <h2 className={`text-[10px] font-black uppercase tracking-widest mb-3 transition-colors ${subTextColor}`}>Penjelasan</h2>
                    <div className={`text-lg leading-relaxed whitespace-pre-wrap font-bold transition-colors ${textColor}`}>
                        {grammar.explanation}
                    </div>
                </div>

                {Array.isArray(sourceSections) && sourceSections.length > 0 && (
                    <section className="mb-8 space-y-5">
                        <h2 className={`text-[10px] font-black uppercase tracking-widest transition-colors ${subTextColor}`}>Materi Lengkap</h2>
                        {sourceSections.map((section, sectionIndex) => (
                            <div key={`${section.judul}-${sectionIndex}`} className={`space-y-3 border-t pt-4 ${theme === 'dark' ? 'border-blue-950/30' : 'border-gray-100'}`}>
                                <h3 className={`text-lg font-black transition-colors ${textColor}`}>{section.judul}</h3>
                                {Array.isArray(section.isi) && section.isi.map((text, textIndex) => (
                                    typeof text === 'string' && (
                                        <p key={textIndex} className={`text-base leading-relaxed whitespace-pre-wrap transition-colors ${textColor}`}>
                                            {text}
                                        </p>
                                    )
                                ))}
                            </div>
                        ))}
                        {grammar.source_data?.url && (
                            <a href={grammar.source_data.url} target="_blank" rel="noreferrer" className="inline-flex text-sm font-bold text-blue-600 hover:underline">
                                Sumber materi
                            </a>
                        )}
                    </section>
                )}

                {Array.isArray(grammar.sentences) && (grammar.sentences.length > 0 || !sourceSections?.length) && (
                    <div>
                        <h2 className={`text-[10px] font-black uppercase tracking-widest mb-4 transition-colors ${subTextColor}`}>Contoh Kalimat</h2>
                        <div className="space-y-4">
                            {grammar.sentences.length > 0 ? grammar.sentences.map((sent, i) => (
                                <div key={i} className={`p-5 rounded-2xl border-l-4 transition-colors ${theme === 'dark' ? 'bg-blue-950/10 border-blue-600' : 'bg-gray-50 border-blue-600'}`}>
                                    <p className={`text-xl font-bold mb-2 transition-colors ${textColor}`}>{sent.jp}</p>
                                    <p className={`font-bold italic transition-colors ${subTextColor}`}>{sent.id}</p>
                                    {sent.expressions?.length > 0 && (
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            {sent.expressions.map((expression) => (
                                                <Link
                                                    key={expression.id}
                                                    href={`/kotoba/${expression.id}`}
                                                    className={`rounded-lg border px-3 py-1.5 text-sm font-bold transition-colors ${theme === 'dark' ? 'border-blue-900/30 bg-blue-950/20 text-blue-200 hover:bg-blue-900/30' : 'border-blue-100 bg-white text-blue-700 hover:bg-blue-50'}`}
                                                >
                                                    {expression.word}
                                                    {expression.meaning ? ` · ${expression.meaning}` : ''}
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )) : (
                                <p className="text-gray-400 dark:text-gray-500 italic">Belum ada contoh kalimat.</p>
                            )}
                        </div>
                    </div>
                )}
                </div>
            </div>
        </div>
    );
}
