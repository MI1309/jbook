import { Suspense } from 'react';
import { getVocabDetail, getVocabList } from '@/lib/api';
import Link from 'next/link';
import Pagination from '@/components/common/Pagination';
import KotobaCategoryHeader from '@/components/kotoba/KotobaCategoryHeader';
import KotobaWordCard from '@/components/kotoba/KotobaWordCard';
import { getKotobaCategory } from '@/components/kotoba/kotobaCategories';
import KotobaDetailUI from '@/components/kotoba/KotobaDetailUI';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://jbook-five.vercel.app';

export async function generateMetadata({ params }) {
    const { id } = await params;
    const category = getKotobaCategory(id);
    if (category) {
        const title = `${category.name} — Kosakata Jepang | JBook`;
        return {
            title,
            description: category.description,
            alternates: { canonical: `/kotoba/${category.slug}` },
            openGraph: { title, description: category.description, url: `/kotoba/${category.slug}`, type: 'website' },
        };
    }
    try {
        const vocab = await getVocabDetail(id);
        if (!vocab) return { title: 'Kotoba Detail - JBook' };

        return {
            title: `${vocab.word} (${vocab.reading || '-'}) - ${vocab.meaning} - JBook`,
            description: `Pelajari kosakata Jepang ${vocab.word} (${vocab.reading || '-'}). Arti: ${vocab.meaning}. Tipe kata: ${vocab.word_type || 'noun'}. Tingkat JLPT N${vocab.jlpt_level}.`,
            keywords: [
                'kotoba',
                'kosakata jepang',
                'vocabulary jepang',
                vocab.word,
                vocab.reading,
                vocab.meaning,
                `jlpt n${vocab.jlpt_level}`,
                vocab.word_type,
                'belajar bahasa jepang',
                '語',
            ].filter(Boolean),
            alternates: { canonical: `/kotoba/${id}` },
            openGraph: {
                title: `Kotoba: ${vocab.word}`,
                description: `${vocab.word} (${vocab.reading || '-'}) - ${vocab.meaning}`,
                url: `/kotoba/${id}`,
                type: 'article',
            },
        };
    } catch {
        return { title: 'Kotoba Detail - JBook' };
    }
}

export default async function KotobaDetailPage({ params, searchParams }) {
    const [{ id }, resolvedSearchParams] = await Promise.all([params, searchParams]);
    const category = getKotobaCategory(id);
    if (category) {
        const search = typeof resolvedSearchParams?.search === 'string' ? resolvedSearchParams.search : '';
        const requestedPage = Math.max(1, Number.parseInt(resolvedSearchParams?.page, 10) || 1);
        let data = { items: [], total: 0, pages: 1 };
        let categoryTotal = 0;
        try {
            const [listResult, countResult] = await Promise.all([
                getVocabList({ word_type: category.wordType, search: search || undefined, limit: 48, page: requestedPage }),
                getVocabList({ word_type: category.wordType, limit: 1, page: 1 }),
            ]);
            data = listResult || data;
            categoryTotal = Number(countResult?.total) || 0;
        } catch (error) {
            console.error('[kotoba] Failed to load category:', error.message);
        }
        const items = data?.items || [];
        const totalPages = Math.max(1, Number(data?.pages) || 1);
        const getHref = (targetPage) => {
            const query = new URLSearchParams();
            if (search) query.set('search', search);
            query.set('page', String(Math.min(totalPages, Math.max(1, targetPage))));
            return `/kotoba/${category.slug}?${query.toString()}`;
        };

        return (
            <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
                <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
                    <nav aria-label="Breadcrumb" className="mb-5 text-sm text-gray-500 sm:mb-6">
                        <Link href="/kotoba" className="font-semibold hover:text-accent-blue hover:underline">Kotoba</Link>
                        <span aria-hidden="true" className="px-2">/</span>
                        <span aria-current="page" className="font-bold text-foreground">{category.name}</span>
                    </nav>
                    <KotobaCategoryHeader category={category} count={categoryTotal} initialSearch={search} initialSuggestions={items.slice(0, 8)} />
                    {items.length ? (
                        <>
                            <div className="grid min-w-0 grid-cols-1 gap-3 py-6 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
                                {items.map((word) => <KotobaWordCard key={word.id} word={word} />)}
                            </div>
                            <Pagination currentPage={requestedPage} totalPages={totalPages} getHref={getHref} />
                        </>
                    ) : (
                        <p className="py-12 text-center text-sm text-gray-600 dark:text-gray-300 sm:py-16">Belum ada kata di kategori ini.</p>
                    )}
                </div>
            </main>
        );
    }

    const vocab = await getVocabDetail(id);
    if (!vocab) {
        return (
            <div className="container mx-auto px-4 py-32 text-center min-h-screen flex flex-col items-center justify-center">
                <div className="text-6xl mb-6">🏮</div>
                <h1 className="text-3xl font-black text-gray-900 mb-4">Kosakata Tidak Ditemukan</h1>
                <Link href="/kotoba" className="text-red-600 font-bold hover:underline">Kembali ke Daftar</Link>
            </div>
        );
    }

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'LearningResource',
        name: `Kotoba: ${vocab.word} - ${vocab.meaning}`,
        description: `Materi belajar kosakata Jepang ${vocab.word} (${vocab.reading || '-'}) dengan arti ${vocab.meaning}.`,
        educationalLevel: `JLPT N${vocab.jlpt_level}`,
        inLanguage: ['id', 'ja'],
        url: `${BASE_URL}/kotoba/${id}`,
        learningResourceType: 'Vocabulary lesson',
        isPartOf: { '@type': 'WebSite', name: 'JBook', url: BASE_URL },
    };

    const breadcrumbJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Beranda', item: BASE_URL },
            { '@type': 'ListItem', position: 2, name: 'Kotoba', item: `${BASE_URL}/kotoba` },
            { '@type': 'ListItem', position: 3, name: vocab.word, item: `${BASE_URL}/kotoba/${id}` },
        ],
    };

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-400 font-bold">🏮 Memuat...</div>}>
                <KotobaDetailUI vocab={vocab} />
            </Suspense>
        </>
    );
}
