import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

function CardContent({ pattern, level, accent, slug }) {
    return (
        <>
            <div className="flex items-start justify-between gap-3">
                <h2 className="min-w-0 break-words font-japanese text-lg font-black leading-snug text-foreground sm:text-xl">
                    {pattern.title}
                </h2>
                <span className={`shrink-0 rounded border border-[var(--border-color)] bg-[var(--background)] px-2 py-1 text-[10px] font-bold ${accent}`}>
                    {level.toUpperCase()}
                </span>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
                <p className="min-w-0 break-words line-clamp-2 text-sm font-semibold text-gray-700 dark:text-gray-200">{pattern.structure}</p>
            </div>
            <p className="mt-3 min-w-0 break-words line-clamp-3 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                {pattern.explanation}
            </p>
            <span className={`mt-4 inline-flex items-center gap-1 text-xs font-bold ${accent}`}>
                {slug ? <>Buka pola <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" /></> : 'Lihat detail'}
            </span>
        </>
    );
}

export default function BunpoPatternCard({ pattern, level, slug, accent }) {
    const className = 'group block min-w-0 min-h-11 h-full rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] p-4 transition hover:-translate-y-0.5 hover:border-accent-blue/40 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue';
    const content = <CardContent pattern={pattern} level={level} accent={accent} slug={slug} />;

    return (
        <Link
            href={slug ? `/bunpo/${level}/${slug}` : `/bunpo/${level}`}
            aria-label={slug ? `Pelajari pola ${pattern.title}, level ${level.toUpperCase()}` : `Lihat daftar Bunpo ${level.toUpperCase()}`}
            className={className}
        >
            {content}
        </Link>
    );
}