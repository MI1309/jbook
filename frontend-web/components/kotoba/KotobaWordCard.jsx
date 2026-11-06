import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

export default function KotobaWordCard({ word }) {
    return (
        <Link href={`/kotoba/${word.id}`} className="group flex min-h-44 min-w-0 flex-col rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] p-4 transition hover:border-accent-blue/40 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue">
            <div className="flex min-w-0 items-start justify-between gap-3">
                <h2 className="min-w-0 break-words font-japanese text-2xl font-bold leading-tight text-foreground group-hover:text-accent-blue">{word.word}</h2>
                <span className="shrink-0 rounded border border-[var(--border-color)] px-2 py-1 text-[10px] font-bold text-gray-600 dark:text-gray-300">N{word.jlpt_level}</span>
            </div>
            <p className="mt-2 min-w-0 break-words font-japanese text-sm text-gray-500 dark:text-gray-400">{word.reading || '—'}</p>
            <p className="mt-3 min-w-0 flex-1 break-words text-sm leading-relaxed text-gray-700 dark:text-gray-200">{word.meaning}</p>
            <span className="mt-3 inline-flex min-h-11 items-center gap-1 text-xs font-bold text-accent-blue">
                Detail <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
            </span>
        </Link>
    );
}