import Link from 'next/link';
import { notFound } from 'next/navigation';
import BunpoPatternCard from '@/components/bunpo/BunpoPatternCard';
import { getBunpoLevel } from '@/data/bunpoLevels';
import { getBunpoSlug } from '@/data/bunpoSlugs';
import { getBunpoCatalog } from '@/lib/bunpo-catalog';

export async function generateMetadata({ params }) {
    const { level: rawLevel } = await params;
    const level = String(rawLevel).toLowerCase();
    const config = getBunpoLevel(level);
    if (!config) return { title: 'Level Bunpo tidak ditemukan | JBook' };

    const title = `Bunpo ${level.toUpperCase()} — Pola Tata Bahasa Jepang | JBook`;
    const description = `Pelajari semua pola tata bahasa Jepang ${level.toUpperCase()} dengan penjelasan, contoh kalimat, dan latihan interaktif.`;
    return {
        title,
        description,
        alternates: { canonical: `/bunpo/${level}` },
        openGraph: { title, description, url: `/bunpo/${level}`, type: 'website' },
    };
}

export default async function BunpoLevelPage({ params }) {
    const { level: rawLevel } = await params;
    const level = String(rawLevel).toLowerCase();
    const config = getBunpoLevel(level);
    if (!config) notFound();

    const catalog = await getBunpoCatalog();
    const patterns = catalog
        .map((pattern, index) => ({ pattern, index }))
        .filter(({ pattern }) => Number(pattern.jlpt_level) === config.number)
        .sort((a, b) => (Number(a.pattern.chapter) || 0) - (Number(b.pattern.chapter) || 0) || a.index - b.index)
        .map(({ pattern }) => pattern);
    return (
        <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
            <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
                <nav aria-label="Breadcrumb" className="mb-5 text-sm text-gray-500 sm:mb-6">
                    <Link href="/bunpo" className="font-semibold hover:text-accent-blue hover:underline">Bunpo</Link>
                    <span aria-hidden="true" className="px-2">/</span>
                    <span aria-current="page" className="font-bold text-foreground">{level.toUpperCase()}</span>
                </nav>

                <header className="border-b border-[var(--border-color)] pb-6 sm:pb-7 lg:pb-8">
                    <div className="min-w-0">
                        <span className={`inline-flex rounded-full border border-[var(--border-color)] bg-[var(--card-bg)] px-3 py-1 text-xs font-bold ${config.accent}`}>
                            {level.toUpperCase()} · 文法
                        </span>
                        <h1 className="mt-3 break-words font-japanese text-2xl font-black leading-tight sm:text-3xl lg:text-4xl">
                            文法 Bunpo {level.toUpperCase()}
                        </h1>
                        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-gray-600 dark:text-gray-300 sm:text-base">
                            <span className="font-bold">{config.title}.</span> {config.description}
                        </p>
                        <p className="mt-4 text-sm text-gray-500">{patterns.length} pola · {level.toUpperCase()}</p>
                    </div>
                </header>

                {patterns.length ? (
                    <div className="grid min-w-0 grid-cols-1 gap-3 py-6 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
                        {patterns.map((pattern) => (
                            <BunpoPatternCard
                                key={pattern.id}
                                pattern={pattern}
                                level={level}
                                slug={pattern.slug || getBunpoSlug(pattern.title)}
                                accent={config.accent}
                            />
                        ))}
                    </div>
                ) : (
                    <p className="py-12 text-center text-sm text-gray-600 dark:text-gray-300 sm:py-16">
                        Belum ada pola untuk level ini.
                    </p>
                )}

                <Link href="/bunpo" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-md py-2 font-semibold text-accent-blue underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue">
                    ← Kembali ke semua level
                </Link>
            </div>
        </main>
    );
}