import { Suspense } from 'react';
import { getVocabDetail } from '@/lib/api';
import Link from 'next/link';
import { hasKanji } from '@/lib/utils';
import KotobaDetailUI from '@/components/kotoba/KotobaDetailUI';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://jbook-five.vercel.app';

export async function generateMetadata({ params }) {
    const { id } = await params;
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
    } catch (e) {
        return { title: 'Kotoba Detail - JBook' };
    }
}

export default async function KotobaDetailPage({ params }) {
    const { id } = await params;
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
