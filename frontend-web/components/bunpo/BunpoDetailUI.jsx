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

    const isDark = mounted && theme === 'dark';
    const textColor = isDark ? 'text-white' : 'text-black';
    const subTextColor = isDark ? 'text-gray-400' : 'text-gray-600';
    const cardBg = isDark ? 'bg-[#0a0a0a]' : 'bg-white';
    const borderStyle = isDark ? 'border-blue-950/20' : 'border-gray-200';
    const innerBorder = isDark ? 'border-blue-950/30' : 'border-gray-200';
    const emphasisBg = isDark ? 'bg-blue-950/10' : 'bg-blue-50';
    const emphasisBorder = isDark ? 'border-blue-950/30' : 'border-blue-100';
    const emphasisText = isDark ? 'text-blue-300' : 'text-blue-700';
    const chapterBadge = isDark ? 'bg-blue-950/20 text-blue-300' : 'bg-gray-100 text-gray-700';
    const sentenceBg = isDark ? 'bg-blue-950/10 border-blue-600' : 'bg-gray-50 border-blue-600';
    const expressionChip = isDark
        ? 'border-blue-900/30 bg-blue-950/20 text-blue-200 hover:bg-blue-900/30'
        : 'border-blue-100 bg-white text-blue-700 hover:bg-blue-50';

    return (
        <div className={`${cardBg} min-h-screen py-6 sm:py-8 transition-colors duration-300`}>
            <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8">
            {onClose ? (
                <button onClick={onClose} className={`mb-6 inline-flex min-h-11 items-center font-black transition-all hover:text-blue-600 sm:mb-8 ${subTextColor}`}>
                    &larr; {backLabel}
                </button>
            ) : (
                <>
                    <nav aria-label="Breadcrumb" className={`mb-3 flex min-w-0 flex-wrap items-center text-sm ${subTextColor}`}>
                        <Link href="/bunpo" className="inline-flex min-h-11 items-center font-semibold hover:text-blue-600 hover:underline">Bunpo</Link>
                        {levelHref && levelLabel && (
                            <>
                                <span aria-hidden="true" className="px-2">/</span>
                                <Link href={levelHref} className="inline-flex min-h-11 items-center font-semibold hover:text-blue-600 hover:underline">{levelLabel}</Link>
                            </>
                        )}
                        <span aria-hidden="true" className="px-2">/</span>
                        <span aria-current="page" className="min-w-0 break-words font-bold">{grammar.title}</span>
                    </nav>
                    <Link href={backHref} className={`mb-6 inline-flex min-h-11 items-center font-black transition-all hover:text-blue-600 sm:mb-8 ${subTextColor}`}>
                        &larr; {backLabel}
                    </Link>
                </>
            )}

            <article className={`${cardBg} min-w-0 rounded-2xl border-x border-b border-t-8 border-blue-600 p-5 shadow-2xl transition-all sm:rounded-3xl sm:p-6 lg:rounded-[2.5rem] lg:p-8 ${borderStyle}`}>
                <div className={`mb-6 min-w-0 border-b pb-4 ${innerBorder}`}>
                    <div className="mb-4 flex min-w-0 flex-col items-start gap-3 sm:flex-row sm:justify-between">
                        <h1 className={`min-w-0 flex-1 break-words text-2xl font-black leading-tight tracking-tight transition-colors sm:text-3xl lg:text-4xl ${textColor}`}>{grammar.title}</h1>
                        <div className="flex shrink-0 flex-row flex-wrap items-center gap-2 sm:flex-col sm:items-end">
                            <span className="bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg shadow-blue-500/10 transition-colors">
                                JLPT N{grammar.jlpt_level}
                            </span>
                            {grammar.chapter && (
                                <span className={`${chapterBadge} text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md transition-colors`}>
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
                    <div className={`min-w-0 break-words rounded-xl border p-4 shadow-inner transition-colors ${emphasisBg} ${emphasisBorder}`}>
                        <p className={`mb-1 text-[10px] font-black uppercase tracking-widest ${subTextColor}`}>Arti / Struktur</p>
                        <p className={`break-words text-lg font-black sm:text-xl ${emphasisText}`}>
                            {grammar.meaning || grammar.structure}
                        </p>
                    </div>
                </div>

                <div className="mb-6 mt-6 sm:mb-8 sm:mt-8">
                    <h2 className={`mb-3 break-words text-base font-black uppercase tracking-widest transition-colors sm:text-lg ${subTextColor}`}>Penjelasan</h2>
                    <div className={`break-words whitespace-pre-wrap text-base font-medium leading-relaxed transition-colors sm:text-lg ${textColor}`}>
                        {grammar.explanation}
                    </div>
                </div>

                {Array.isArray(sourceSections) && sourceSections.length > 0 && (
                    <section className="mb-8 space-y-5">
                        <h2 className={`break-words text-base font-black uppercase tracking-widest transition-colors sm:text-lg ${subTextColor}`}>Materi Lengkap</h2>
                        {sourceSections.map((section, sectionIndex) => (
                            <div key={`${section.judul}-${sectionIndex}`} className={`min-w-0 space-y-3 border-t pt-4 ${innerBorder}`}>
                                <h3 className={`break-words text-base font-black transition-colors sm:text-lg ${textColor}`}>{section.judul}</h3>
                                {Array.isArray(section.isi) && section.isi.map((text, textIndex) => (
                                    typeof text === 'string' && (
                                        <p key={textIndex} className={`break-words text-sm leading-relaxed whitespace-pre-wrap transition-colors sm:text-base ${textColor}`}>
                                            {text}
                                        </p>
                                    )
                                ))}
                            </div>
                        ))}
                        {grammar.source_data?.url && (
                            <a href={grammar.source_data.url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center text-sm font-bold text-blue-600 hover:underline">
                                Sumber materi
                            </a>
                        )}
                    </section>
                )}

                {Array.isArray(grammar.sentences) && (grammar.sentences.length > 0 || !sourceSections?.length) && (
                    <div>
                        <h2 className={`mb-4 break-words text-base font-black uppercase tracking-widest transition-colors sm:text-lg ${subTextColor}`}>Contoh Kalimat</h2>
                        <div className="space-y-4">
                            {grammar.sentences.length > 0 ? grammar.sentences.map((sent, i) => (
                                <div key={i} className={`min-w-0 break-words rounded-2xl border-l-4 p-4 transition-colors sm:p-5 ${sentenceBg}`}>
                                    <p className={`mb-2 break-words text-lg font-bold transition-colors sm:text-xl ${textColor}`}>{sent.jp}</p>
                                    <p className={`break-words font-bold italic ${subTextColor}`}>{sent.id}</p>
                                    {sent.expressions?.length > 0 && (
                                        <div className="mt-4 flex min-w-0 flex-wrap gap-2">
                                            {sent.expressions.map((expression) => (
                                                <Link
                                                    key={expression.id}
                                                    href={`/kotoba/${expression.id}`}
                                                    className={`inline-flex min-h-11 max-w-full break-words items-center rounded-lg border px-3 py-1.5 text-sm font-bold transition-colors ${expressionChip}`}
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
                </article>
            </div>
        </div>
    );
}
