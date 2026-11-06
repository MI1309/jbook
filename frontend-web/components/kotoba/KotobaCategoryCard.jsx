import Link from 'next/link';
import { ArrowRight, BetweenHorizontalEnd, Box, Footprints, Gauge, GitBranch, Hash, Link2, MessageCircle, MoveLeft, MoveRight, Shapes, Sparkles, UserRound, Volume2 } from 'lucide-react';

const icons = { BetweenHorizontalEnd, Box, Footprints, Gauge, GitBranch, Hash, Link2, MessageCircle, MoveLeft, MoveRight, Shapes, Sparkles, UserRound, Volume2 };

export default function KotobaCategoryCard({ category }) {
    const Icon = icons[category.icon] || Box;

    return (
        <Link
            href={`/kotoba/${category.slug}`}
            className="group relative flex min-h-[14rem] min-w-0 flex-col overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-accent-blue/40 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue"
        >
            <span className="absolute inset-x-5 top-0 h-1 rounded-b-full bg-gradient-to-r from-accent-blue via-sky-400 to-violet-400" aria-hidden="true" />

            <div className="flex min-w-0 items-start justify-between gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-accent-blue/20 bg-accent-blue/10 text-accent-blue" aria-hidden="true">
                    <Icon className="h-5 w-5" />
                </span>
                <span className="break-words text-right font-japanese text-lg font-bold text-gray-500 dark:text-gray-400">{category.japanese}</span>
            </div>

            <div className="mt-5 min-w-0">
                <h2 className="break-words text-lg font-black text-foreground">{category.name}</h2>
                <p className="mt-2 min-w-0 text-sm leading-relaxed text-gray-600 dark:text-gray-300">{category.description}</p>
            </div>

            <div className="mt-auto border-t border-[var(--border-color)] pt-4">
                <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-gray-500">{category.count.toLocaleString('id-ID')} kata</span>
                    <span className="inline-flex items-center gap-1 text-sm font-bold text-accent-blue">
                        Lihat kata <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                </div>
            </div>
        </Link>
    );
}