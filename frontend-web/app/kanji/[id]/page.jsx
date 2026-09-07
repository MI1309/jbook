import { getKanjiDetail } from '@/lib/api';
import Link from 'next/link';
import { toHiragana, toKatakana } from 'wanakana';
import { hasKanji } from '@/lib/utils';
import { notFound } from 'next/navigation';
import KanjiDetailUI from '@/components/kanji/KanjiDetailUI';

export async function generateMetadata({ params }) {
    const { id } = await params;
    try {
        const kanji = await getKanjiDetail(id);
        if (!kanji) return { title: 'Kanji Detail - JBook' };
        
        return {
            title: `Kanji ${kanji.character} (${kanji.meaning}) - JBook`,
            description: `Arti Kanji ${kanji.character}: ${kanji.meaning}. Pelajari Onyomi ${kanji.onyomi?.join(', ') || '-'}, Kunyomi ${kanji.kunyomi?.join(', ') || '-'}, jumlah coretan, radikal, dan contoh penggunaannya di JBook.`,
            keywords: [
                `arti kanji ${kanji.character}`,
                `cara baca kanji ${kanji.character}`,
                `kanji ${kanji.meaning}`,
                kanji.onyomi?.join(' '),
                kanji.kunyomi?.join(' '),
                'belajar kanji Jepang',
            ].filter(Boolean),
            alternates: { canonical: `/kanji/${id}` },
            openGraph: {
                title: `Kanji ${kanji.character}: ${kanji.meaning}`,
                description: `Pelajari arti dan cara baca Kanji ${kanji.character} di JBook.`,
                url: `/kanji/${id}`,
                type: 'article',
            },
        };
    } catch (e) {
        return { title: 'Kanji Detail - JBook' };
    }
}

export default async function KanjiDetailPage({ params }) {
    const { id } = await params;
    
    let kanji = null;
    let isError = false;

    try {
        kanji = await getKanjiDetail(id);
    } catch (error) {
        console.error('[jbook-server-error] Backend API hancur atau return 500:', error);
        isError = true;
    }

    // ✅ Pemicu notFound() harus di luar blok try-catch agar Next.js tidak bingung
    if (isError || !kanji) {
        notFound();
    }

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'LearningResource',
        name: `Kanji ${kanji.character}: ${kanji.meaning}`,
        description: `Materi belajar Kanji ${kanji.character} dengan arti ${kanji.meaning}.`,
        educationalLevel: `JLPT N${kanji.jlpt_level}`,
        inLanguage: ['id', 'ja'],
        url: `https://jbook-five.vercel.app/kanji/${id}`,
        learningResourceType: 'Kanji lesson',
        isPartOf: { '@type': 'WebSite', name: 'JBook', url: 'https://jbook-five.vercel.app' },
    };
    const breadcrumbJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Beranda', item: 'https://jbook-five.vercel.app' },
            { '@type': 'ListItem', position: 2, name: 'Kanji', item: 'https://jbook-five.vercel.app/kanji' },
            { '@type': 'ListItem', position: 3, name: `Kanji ${kanji.character}`, item: `https://jbook-five.vercel.app/kanji/${id}` },
        ],
    };

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
            <KanjiDetailUI kanji={kanji} />
        </>
    );
}