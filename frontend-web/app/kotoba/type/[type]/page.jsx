import { notFound } from 'next/navigation';
import Link from 'next/link';
import Pagination from '@/components/common/Pagination';
import KotobaCategoryHeader from '@/components/kotoba/KotobaCategoryHeader';
import KotobaWordCard from '@/components/kotoba/KotobaWordCard';
import { KOTOBA_CATEGORIES, getKotobaCategory } from '@/components/kotoba/kotobaCategories';
import { getVocabList } from '@/lib/api';

const LEVELS = ['', '5', '4', '3', '2', '1'];

export function generateStaticParams() {
    return KOTOBA_CATEGORIES.map(({ slug }) => ({ type: slug }));
}

export async function generateMetadata({ params }) {
    const { type } = await params;
    const category = getKotobaCategory(type);
    if (!category) return { title: 'Kategori Kotoba tidak ditemukan | JBook' };

    const title = `${category.name} — Kosakata Jepang | JBook`;
    return {
        title,
        description: category.description,
        alternates: { canonical: `/kotoba/type/${category.slug}` },
        openGraph: { title, description: category.description, url: `/kotoba/type/${category.slug}`, type: 'website' },
    };
}

export default async function KotobaTypePage({ params, searchParams }) {
    const [{ type }, resolvedSearchParams] = await Promise.all([params, searchParams]);
    const category = getKotobaCategory(type);
    if (!category) notFound();

    const search = typeof resolvedSearchParams?.search === 'string' ? resolvedSearchParams.search.trim() : '';
    const requestedLevel = typeof resolvedSearchParams?.level === 'string' ? resolvedSearchParams.level : '';
    const level = LEVELS.includes(requestedLevel) ? requestedLevel : '';
    const requestedPage = Math.max(1, Number.parseInt(resolvedSearchParams?.page, 10) || 1);
    let data = { items: [], total: 0, pages: 1 };
    let categoryTotal = 0;
    let loadError = false;

    try {
        const [listResult, countResult] = await Promise.all([
            getVocabList({ word_type: category.wordType, level: level || undefined, search: search || undefined, limit: 48, page: requestedPage }),
            getVocabList({ word_type: category.wordType, limit: 1, page: 1 }),
        ]);
        data = listResult || data;
        categoryTotal = Number(countResult?.total) || 0;
    } catch (error) {
        loadError = true;
        console.error('[kotoba] Failed to load category:', error.message);
    }

    const items = data?.items || [];
    const totalPages = Math.max(1, Number(data?.pages) || 1);
    const pageHref = (targetPage) => {
        const query = new URLSearchParams();
        if (search) query.set('search', search);
        if (level) query.set('level', level);
        query.set('page', String(Math.min(totalPages, Math.max(1, targetPage))));
        return `/kotoba/type/${category.slug}?${query}`;
    };
    const levelHref = (targetLevel) => {
        const query = new URLSearchParams();
        if (search) query.set('search', search);
        if (targetLevel) query.set('level', targetLevel);
        return `/kotoba/type/${category.slug}${query.size ? `?${query}` : ''}`;
    };

    return (
        <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
            <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
                <nav aria-label="Breadcrumb" className="mb-5 text-sm text-gray-500 sm:mb-6">
                    <Link href="/kotoba" className="min-h-11 inline-flex items-center font-semibold hover:text-accent-blue hover:underline">Kotoba</Link>
                    <span aria-hidden="true" className="px-2">/</span>
                    <span aria-current="page" className="font-bold text-foreground">{category.name}</span>
                </nav>
                <KotobaCategoryHeader category={category} count={categoryTotal} initialSearch={search} initialLevel={level} initialSuggestions={items.slice(0, 8)} />

                <nav aria-label="Filter level JLPT" className="flex min-w-0 flex-wrap items-center gap-2 border-b border-[var(--border-color)] py-5">
                    <span className="mr-1 text-sm font-semibold text-gray-600 dark:text-gray-300">Level:</span>
                    {LEVELS.map((item) => {
                        const active = level === item;
                        const label = item ? `N${item}` : 'Semua';
                        return (
                            <Link key={item || 'all'} href={levelHref(item)} aria-current={active ? 'page' : undefined} aria-label={`Filter ${item ? `level JLPT ${label}` : 'semua level JLPT'}`} className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border px-3 text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue ${active ? 'border-accent-blue bg-accent-blue text-white' : 'border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--foreground)] hover:border-accent-blue/50'}`}>
                                {label}
                            </Link>
                        );
                    })}
                </nav>

                {loadError ? (
                    <section role="alert" className="my-8 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6 text-center sm:p-8">
                        <h2 className="text-lg font-bold">Kosakata gagal dimuat</h2>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Periksa koneksi lalu coba lagi.</p>
                        <Link href={levelHref(level)} className="mt-4 inline-flex min-h-11 items-center rounded-lg border border-[var(--border-color)] px-4 text-sm font-semibold hover:border-accent-blue/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-blue">Coba lagi</Link>
                    </section>
                ) : items.length ? (
                    <>
                        <div className="grid min-w-0 grid-cols-1 gap-3 py-6 sm:grid-cols-2 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
                            {items.map((word) => <KotobaWordCard key={word.id} word={word} />)}
                        </div>
                        <div className="flex flex-col items-center gap-3 border-t border-[var(--border-color)] py-5 sm:flex-row sm:justify-between">
                            <p className="text-sm text-gray-600 dark:text-gray-300">Menampilkan {(requestedPage - 1) * 48 + 1}–{Math.min(requestedPage * 48, Number(data.total) || 0)} dari {Number(data.total || 0).toLocaleString('id-ID')} kata</p>
                            <Pagination currentPage={requestedPage} totalPages={totalPages} getHref={pageHref} />
                        </div>
                    </>
                ) : (
                    <section className="py-12 text-center sm:py-16">
                        <p className="font-japanese text-3xl" aria-hidden="true">語彙</p>
                        <h2 className="mt-3 text-lg font-bold">Belum ada kosakata untuk filter ini</h2>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Coba level atau kata kunci yang berbeda.</p>
                        <Link href={levelHref('')} className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-accent-blue px-4 text-sm font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue">Lihat semua kata</Link>
                    </section>
                )}
            </div>
        </main>
    );
}