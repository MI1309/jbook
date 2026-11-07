'use client';

import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';
import ConceptMap from './ConceptMap';

export default function BunpoDetailUI({
    grammar,
    onClose,
    backHref = '/bunpo',
    backLabel = 'Kembali ke Daftar',
}) {
    const { theme } = useTheme();
    if (!grammar) return null;
    const sourceSections = grammar.source_data?.detail?.bagian;
    const sections = grammar.sections || {};
    const sectionHasContent = (key) => {
        const section = sections[key];
        if (Array.isArray(section)) return section.length > 0;
        if (!section || typeof section !== 'object') return false;
        return Object.values(section).some((value) => (
            typeof value === 'string' ? Boolean(value.trim()) : Array.isArray(value) && value.length > 0
        ));
    };
    const hasEditorialSections = [
        'mainFunction', 'sentencePattern', 'examples', 'comparison', 'nuance',
        'coreExplanation', 'commonMistakes', 'faq', 'miniPractice', 'conceptMap',
    ].some((key) => key === 'miniPractice' || sectionHasContent(key));
    const sectionAnchors = [
        { key: 'mainFunction', id: 'fungsi-utama', label: 'Fungsi' },
        { key: 'sentencePattern', id: 'pola-kalimat', label: 'Pola' },
        { key: 'examples', id: 'contoh-kalimat', label: 'Contoh' },
        { key: 'comparison', id: 'perbandingan', label: 'Perbandingan' },
        { key: 'nuance', id: 'nuansa', label: 'Nuansa' },
        { key: 'coreExplanation', id: 'penjelasan-inti', label: 'Inti' },
        { key: 'commonMistakes', id: 'kesalahan-umum', label: 'Kesalahan' },
        { key: 'faq', id: 'tanya-jawab', label: 'FAQ' },
        { key: 'miniPractice', id: 'latihan-mini', label: 'Latihan' },
        { key: 'conceptMap', id: 'peta-materi', label: 'Peta' },
    ].filter(({ key }) => key === 'miniPractice' || sectionHasContent(key));

    const isDark = theme === 'dark';
    const textColor = isDark ? 'text-white' : 'text-black';
    const subTextColor = isDark ? 'text-gray-400' : 'text-gray-600';
    const cardBg = isDark ? 'bg-[#0a0a0a]' : 'bg-white';
    const innerBorder = isDark ? 'border-blue-950/30' : 'border-gray-200';
    const emphasisText = isDark ? 'text-sky-300' : 'text-blue-800';
    const sentenceBg = isDark ? 'bg-blue-950/10 border-blue-600' : 'bg-gray-50 border-blue-600';
    const sectionNumber = isDark ? 'text-blue-300 bg-blue-950/40' : 'text-blue-600 bg-blue-100';
    const mutedPanel = isDark ? 'border-gray-800 bg-black/30' : 'border-gray-200 bg-gray-50';
    const expressionChip = isDark
        ? 'border-blue-900/30 bg-blue-950/20 text-blue-200 hover:bg-blue-900/30'
        : 'border-blue-100 bg-white text-blue-700 hover:bg-blue-50';

    return (
        <div className={`${cardBg} min-h-screen py-6 sm:py-8 transition-colors duration-300`}>
            <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            {onClose ? (
                <button onClick={onClose} className={`mb-6 inline-flex min-h-11 items-center font-black transition-all hover:text-blue-600 sm:mb-8 ${subTextColor}`}>
                    &larr; {backLabel}
                </button>
            ) : (
                <>
                    {!hasEditorialSections && (
                        <Link href={backHref} className={`mb-3 inline-flex min-h-11 items-center font-black transition-all hover:text-blue-600 ${subTextColor}`}>
                            &larr; {backLabel}
                        </Link>
                    )}
                </>
            )}

            <article className={hasEditorialSections ? 'min-w-0 lg:grid lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start lg:gap-12' : 'min-w-0'}>
                {hasEditorialSections ? (
                    <aside className="min-w-0 lg:sticky lg:top-24 lg:h-[calc(100vh-6rem)] lg:self-start lg:overflow-y-auto">
                        {!onClose && (
                            <Link href={backHref} className={`mb-4 inline-flex min-h-10 items-center text-sm font-bold transition-colors hover:text-accent-blue ${subTextColor}`}>
                                &larr; {backLabel}
                            </Link>
                        )}
                        <div className={`min-w-0 border-b pb-5 ${innerBorder}`}>
                            <div className="mb-4 flex min-w-0 flex-wrap items-center gap-3">
                                <span className="bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg shadow-blue-500/10 transition-colors">
                                    JLPT N{grammar.jlpt_level}
                                </span>
                            </div>
                            <h1 className={`mb-5 min-w-0 break-words font-japanese text-4xl font-black leading-tight tracking-tight transition-colors md:text-5xl lg:text-4xl ${textColor}`}>{grammar.title}</h1>
                            {grammar.source_data?.kelompok && (
                                <p className={`mb-3 text-xs font-black uppercase tracking-wide ${subTextColor}`}>
                                    {grammar.source_data.kelompok}
                                </p>
                            )}
                            <div className={`inline-block w-fit max-w-full min-w-0 break-words border-l-4 border-blue-600 py-2 pl-4 pr-3 ${isDark ? 'bg-blue-950/10' : 'bg-blue-50/70'}`}>
                                <p className={`mb-1 text-[10px] font-black uppercase tracking-widest ${subTextColor}`}>Arti / Struktur</p>
                                <p className={`break-words text-2xl font-black ${emphasisText}`}>
                                    {grammar.meaning || grammar.structure}
                                </p>
                            </div>
                        </div>
                        <nav aria-label="Navigasi section" className="sticky top-16 z-30 -mx-4 mt-4 border-b border-[var(--border-color)] bg-[var(--background)]/90 px-4 backdrop-blur-md sm:-mx-6 sm:px-6 lg:static lg:mx-0 lg:mt-5 lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
                            <ul className="bunpo-section-nav-list flex gap-2 overflow-x-auto whitespace-nowrap py-2 text-sm lg:flex-col lg:gap-1 lg:overflow-visible lg:py-0">
                                {sectionAnchors.map(({ id, label }) => (
                                    <li key={id} className="shrink-0 lg:w-full">
                                        {id === 'latihan-mini' ? (
                                            <Link href="/practice" className="inline-flex min-h-10 items-center whitespace-nowrap rounded-full px-3 py-2 font-semibold text-gray-600 no-underline transition-colors hover:bg-accent-blue/10 hover:text-accent-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/60 dark:text-gray-300 lg:w-full lg:rounded-lg">
                                                {label}
                                            </Link>
                                        ) : (
                                            <a href={`#${id}`} className="inline-flex min-h-10 items-center whitespace-nowrap rounded-full px-3 py-2 font-semibold text-gray-600 no-underline transition-colors hover:bg-accent-blue/10 hover:text-accent-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/60 dark:text-gray-300 lg:w-full lg:rounded-lg">
                                                {label}
                                            </a>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    </aside>
                ) : (
                    <div className={`mb-6 min-w-0 border-b pb-6 ${innerBorder}`}>
                        <div className="mb-5 flex min-w-0 flex-wrap items-center justify-between gap-3">
                            <h1 className={`min-w-0 flex-1 break-words font-japanese text-4xl font-black leading-tight tracking-tight transition-colors md:text-5xl ${textColor}`}>{grammar.title}</h1>
                            <div className="flex shrink-0 flex-row flex-wrap items-center gap-3">
                                <span className="bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg shadow-blue-500/10 transition-colors">
                                    JLPT N{grammar.jlpt_level}
                                </span>
                            </div>
                        </div>
                        {grammar.source_data?.kelompok && (
                            <p className={`mb-3 text-xs font-black uppercase tracking-wide ${subTextColor}`}>
                                {grammar.source_data.kelompok}
                            </p>
                        )}
                        <div className={`inline-block w-fit max-w-full min-w-0 break-words border-l-4 border-blue-600 py-2 pl-4 pr-3 ${isDark ? 'bg-blue-950/10' : 'bg-blue-50/70'}`}>
                            <p className={`mb-1 text-[10px] font-black uppercase tracking-widest ${subTextColor}`}>Arti / Struktur</p>
                            <p className={`break-words text-2xl font-black ${emphasisText}`}>
                                {grammar.meaning || grammar.structure}
                            </p>
                        </div>
                    </div>
                )}

                {!hasEditorialSections && <div className="mb-6 mt-6 sm:mb-8 sm:mt-8">
                    <h2 className={`mb-3 break-words text-base font-black uppercase tracking-widest transition-colors sm:text-lg ${subTextColor}`}>Penjelasan</h2>
                    <div className={`break-words whitespace-pre-wrap text-base font-medium leading-relaxed transition-colors sm:text-lg ${textColor}`}>
                        {grammar.explanation}
                    </div>
                </div>}

                {hasEditorialSections ? (
                    <div className="min-w-0">
                        {[
                            {
                                key: 'mainFunction', title: 'Fungsi Utama · 主な機能',
                                content: (value) => <>
                                    {value.summary && <p className={`break-words text-base font-semibold leading-relaxed md:text-lg ${textColor}`}>{value.summary}</p>}
                                    {value.points?.length > 0 && <ul className={`list-disc space-y-2 pl-5 text-base leading-relaxed md:text-lg ${textColor}`}>{value.points.map((point, index) => <li key={index} className="break-words">{point}</li>)}</ul>}
                                </>,
                            },
                            {
                                key: 'sentencePattern', title: 'Pola Kalimat · 文型',
                                content: (value) => <>
                                    {value.formula && <p className={`break-words rounded-lg border px-3 py-2 font-mono text-sm font-bold sm:text-base ${mutedPanel} ${textColor}`}>{value.formula}</p>}
                                    {value.variations?.length > 0 && <div className="space-y-3">{value.variations.map((item, index) => <div key={index} className={`min-w-0 rounded-lg border p-3 ${mutedPanel}`}>
                                        <p className={`break-words text-sm font-bold ${textColor}`}>{item.label}</p>
                                        <p className={`mt-1 break-words font-mono text-sm ${emphasisText}`}>{item.formula}</p>
                                        <p className={`mt-1 break-words text-sm ${subTextColor}`}>{item.example}</p>
                                    </div>)}</div>}
                                    {value.notes?.length > 0 && <ul className={`list-disc space-y-2 pl-5 text-sm leading-relaxed ${textColor}`}>{value.notes.map((note, index) => <li key={index} className="break-words">{note}</li>)}</ul>}
                                </>,
                            },
                            {
                                key: 'examples', title: 'Contoh Kalimat · 例文',
                                content: (items) => <div className="space-y-3">{items.map((example, index) => <div key={index} className={`min-w-0 break-words rounded-xl border-l-4 p-4 ${sentenceBg}`}>
                                    <p className={`break-words text-lg font-bold ${textColor}`}>{example.jp}</p>
                                    {example.reading && <p className={`mt-1 break-words text-sm ${subTextColor}`}>{example.reading}</p>}
                                    <p className={`mt-2 break-words font-semibold ${textColor}`}>{example.id}</p>
                                    {example.expressions?.length > 0 && <div className="mt-3 flex min-w-0 flex-wrap gap-2">{example.expressions.map((expression, expressionIndex) => {
                                        const label = `${expression.word}${expression.meaning ? ` · ${expression.meaning}` : ''}`;
                                        const className = `inline-flex min-h-9 max-w-full break-words items-center rounded-lg border px-3 py-1 text-sm font-bold ${expressionChip}`;
                                        return expression.id ? <Link key={`${expression.id}-${expressionIndex}`} href={`/kotoba/${expression.id}`} className={className}>{label}</Link> : <span key={`${expression.word}-${expressionIndex}`} className={className}>{label}</span>;
                                    })}</div>}
                                </div>)}</div>,
                            },
                            {
                                key: 'comparison', title: 'Perbandingan · 比較',
                                content: (value) => <>
                                    {value.summary && <p className={`break-words text-sm leading-relaxed sm:text-base ${textColor}`}>{value.summary}</p>}
                                    {value.items?.length > 0 && <div className="space-y-3">{value.items.map((item, index) => <div key={index} className={`min-w-0 rounded-lg border p-3 ${mutedPanel}`}>
                                        <h3 className={`break-words font-bold ${emphasisText}`}>{item.vs}</h3>
                                        <p className={`mt-1 break-words text-sm leading-relaxed ${textColor}`}>{item.difference}</p>
                                        <p className={`mt-2 break-words text-sm italic ${subTextColor}`}>{item.example}</p>
                                    </div>)}</div>}
                                </>,
                            },
                            {
                                key: 'nuance', title: 'Nuansa dan Pemakaian · ニュアンスと使い方',
                                content: (value) => <>
                                    {value.summary && <p className={`break-words text-sm font-semibold leading-relaxed sm:text-base ${textColor}`}>{value.summary}</p>}
                                    {value.points?.length > 0 && <ul className={`list-disc space-y-2 pl-5 text-sm leading-relaxed sm:text-base ${textColor}`}>{value.points.map((point, index) => <li key={index} className="break-words">{point}</li>)}</ul>}
                                </>,
                            },
                            {
                                key: 'coreExplanation', title: 'Penjelasan Inti · 核心解説',
                                content: (value) => <>
                                    {value.summary && <p className={`break-words font-semibold leading-relaxed ${textColor}`}>{value.summary}</p>}
                                    {value.text && <p className={`break-words whitespace-pre-wrap text-sm leading-relaxed sm:text-base ${textColor}`}>{value.text}</p>}
                                </>,
                            },
                            {
                                key: 'commonMistakes', title: 'Kesalahan Umum · よくある間違い',
                                content: (items) => <div className="space-y-3">{items.map((item, index) => <div key={index} className={`min-w-0 rounded-lg border p-3 ${mutedPanel}`}>
                                    <p className="break-words font-semibold text-red-700 dark:text-red-300"><span className="mr-2 font-black">×</span>{item.wrong}</p>
                                    <p className="mt-2 break-words font-semibold text-green-700 dark:text-green-300"><span className="mr-2 font-black">✓</span>{item.correct}</p>
                                    <p className={`mt-2 break-words text-sm leading-relaxed ${subTextColor}`}>{item.reason}</p>
                                </div>)}</div>,
                            },
                            {
                                key: 'faq', title: 'Tanya Jawab · よくある質問',
                                content: (items) => <div className="space-y-2">{items.map((item, index) => <details key={index} className={`min-w-0 rounded-lg border px-3 py-2 ${mutedPanel}`}>
                                    <summary className={`cursor-pointer break-words py-1 font-bold ${textColor}`}>{item.q}</summary>
                                    <p className={`break-words pb-1 pt-2 text-sm leading-relaxed ${subTextColor}`}>{item.a}</p>
                                </details>)}</div>,
                            },
                            {
                                key: 'miniPractice', title: 'Latihan Soal Interaktif',
                                content: () => (
                                    <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-5 sm:p-6">
                                        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-xl text-blue-700 dark:bg-blue-900/30 dark:text-blue-200" aria-hidden="true">
                                            🎯
                                        </div>
                                        <h3 className={`text-base font-bold sm:text-lg ${textColor}`}>Latihan Soal Interaktif</h3>
                                        <p className={`mt-2 text-sm leading-relaxed ${subTextColor}`}>
                                            Uji pemahaman pola ini lewat latihan yang mencatat progres dan akurasi kamu.
                                        </p>
                                        <Link
                                            href="/practice"
                                            className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent-blue)] px-5 py-2.5 text-sm font-bold text-white transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-blue)] focus-visible:ring-offset-2 sm:w-auto"
                                        >
                                            Mulai Latihan <span aria-hidden="true">→</span>
                                        </Link>
                                    </div>
                                ),
                            },
                            {
                                key: 'conceptMap', title: 'Peta Materi · 学習マップ',
                                content: (value) => <ConceptMap nodes={value?.nodes || []} edges={value?.edges || []} summary={value?.summary || ''} />,
                            },
                        ].map((item, index) => {
                            if (item.key !== 'miniPractice' && !sectionHasContent(item.key)) return null;
                            const sectionId = sectionAnchors.find(({ key }) => key === item.key)?.id;
                            return (
                            <section key={item.key} id={sectionId} aria-labelledby={`${sectionId}-heading`} className="min-w-0 scroll-mt-28 border-t border-[var(--border-color)] py-8 first:border-t-0 first:pt-0 sm:py-10">
                                <header className="mb-3 flex min-w-0 items-start gap-3">
                                    <span className={`shrink-0 rounded-md px-2 py-1 text-sm font-black tabular-nums ${sectionNumber}`}>{String(index + 1).padStart(2, '0')}</span>
                                    <h2 id={`${sectionId}-heading`} className={`min-w-0 break-words text-xl font-bold leading-snug sm:text-2xl ${textColor}`}>{item.title}</h2>
                                </header>
                                <div className="min-w-0 space-y-3">{item.content(sections[item.key])}</div>
                            </section>
                        );
                        })}
                    </div>
                ) : (
                    <>
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
                    </>
                )}
                </article>
            </div>
        </div>
    );
}
