import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Search, X } from 'lucide-react';
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

export default async function BunpoLevelPage({ params, searchParams }) {
    const [{ level: rawLevel }, queryParams] = await Promise.all([params, searchParams]);
    const level = String(rawLevel).toLowerCase();
    const searchQuery = typeof queryParams?.q === 'string' ? queryParams.q.trim() : '';
    const requestedPage = typeof queryParams?.page === 'string' && /^\d+$/.test(queryParams.page)
        ? Number(queryParams.page)
        : 1;
    const config = getBunpoLevel(level);
    if (!config) notFound();

    const catalog = await getBunpoCatalog();
    const normalizedQuery = searchQuery.toLocaleLowerCase('id');
    const matchingPatterns = catalog
        .filter((pattern) => Number(pattern.jlpt_level) === config.number)
        .filter((pattern) => !normalizedQuery || [pattern.title, pattern.structure, pattern.explanation]
            .some((value) => String(value ?? '').toLocaleLowerCase('id').includes(normalizedQuery)));
    const pageSize = 20;
    const totalPages = Math.max(1, Math.ceil(matchingPatterns.length / pageSize));
    const currentPage = Math.min(requestedPage, totalPages);
    const patterns = matchingPatterns.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    const pageHref = (page) => {
        const query = new URLSearchParams();
        if (searchQuery) query.set('q', searchQuery);
        if (page > 1) query.set('page', String(page));
        const queryString = query.toString();
        return `/bunpo/${level}${queryString ? `?${queryString}` : ''}`;
    };
    const paginationItems = totalPages <= 7
        ? Array.from({ length: totalPages }, (_, index) => index + 1)
        : [...new Set([1, currentPage - 1, currentPage, currentPage + 1, totalPages])]
            .filter((page) => page >= 1 && page <= totalPages)
            .sort((a, b) => a - b)
            .flatMap((page, index, pages) => index > 0 && page - pages[index - 1] > 1 ? [null, page] : [page]);
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
                        <p className="mt-4 text-sm text-gray-500">{matchingPatterns.length} pola · {level.toUpperCase()}</p>
                    </div>
                </header>

                <form action={`/bunpo/${level}`} method="get" role="search" aria-label={`Cari pola Bunpo ${level.toUpperCase()}`} className="flex max-w-2xl items-center gap-2 py-5">
                    <label htmlFor="bunpo-level-search" className="sr-only">Cari judul, struktur, atau penjelasan</label>
                    <input
                        id="bunpo-level-search"
                        name="q"
                        type="search"
                        defaultValue={searchQuery}
                        placeholder="Cari judul, struktur, atau penjelasan..."
                        className="min-h-11 min-w-0 flex-1 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] px-3 text-sm text-[var(--foreground)] outline-none placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-accent-blue/40"
                    />
                    <button type="submit" aria-label="Cari Bunpo" title="Cari Bunpo" className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg border border-[var(--border-color)] text-[var(--foreground)] hover:bg-[var(--card-bg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-blue">
                        <Search aria-hidden="true" size={18} />
                    </button>
                    {searchQuery && (
                        <Link href={`/bunpo/${level}`} aria-label="Hapus pencarian" title="Hapus pencarian" className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg border border-[var(--border-color)] text-[var(--foreground)] hover:bg-[var(--card-bg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-blue">
                            <X aria-hidden="true" size={18} />
                        </Link>
                    )}
                </form>

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
                        {searchQuery ? `Tidak ada pola ${level.toUpperCase()} yang cocok dengan "${searchQuery}".` : 'Belum ada pola untuk level ini.'}
                    </p>
                )}

                {totalPages > 1 && (
                    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-center gap-2 py-5">
                        {currentPage > 1 && (
                            <Link href={pageHref(currentPage - 1)} rel="prev" className="inline-flex min-h-11 items-center rounded-md border border-[var(--border-color)] px-3 text-sm font-semibold hover:bg-[var(--card-bg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-blue">
                                Sebelumnya
                            </Link>
                        )}
                        {paginationItems.map((page, index) => page === null ? (
                            <span key={`ellipsis-${index}`} aria-hidden="true" className="px-1 text-gray-500">…</span>
                        ) : (
                            <Link
                                key={page}
                                href={pageHref(page)}
                                aria-label={`Halaman ${page}`}
                                aria-current={page === currentPage ? 'page' : undefined}
                                className={`inline-flex size-11 items-center justify-center rounded-md border text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-blue ${page === currentPage ? 'border-accent-blue bg-accent-blue/10 text-accent-blue' : 'border-[var(--border-color)] hover:bg-[var(--card-bg)]'}`}
                            >
                                {page}
                            </Link>
                        ))}
                        {currentPage < totalPages && (
                            <Link href={pageHref(currentPage + 1)} rel="next" className="inline-flex min-h-11 items-center rounded-md border border-[var(--border-color)] px-3 text-sm font-semibold hover:bg-[var(--card-bg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-blue">
                                Berikutnya
                            </Link>
                        )}
                    </nav>
                )}

                <Link href="/bunpo" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-md py-2 font-semibold text-accent-blue underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue">
                    ← Kembali ke semua level
                </Link>
            </div>
        </main>
    );
}