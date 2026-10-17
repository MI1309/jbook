
import { getGrammarDetail } from '@/lib/api';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import BunpoDetailUI from '@/components/bunpo/BunpoDetailUI';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://jbook-five.vercel.app';

export async function generateMetadata({ params }) {
    const { id } = await params;
    try {
        const grammar = await getGrammarDetail(id);
        if (!grammar) return { title: 'Bunpo Detail - JBook' };

        return {
            title: `${grammar.title} (${grammar.structure}) - JBook`,
            description: `Pelajari tata bahasa Jepang ${grammar.title}. Struktur: ${grammar.structure}. Penjelasan lengkap + contoh kalimat di JBook. Tingkat JLPT N${grammar.jlpt_level}.`,
            keywords: [
                'bunpo',
                'tatabahasajepang',
                'grammar jepang',
                grammar.title,
                grammar.structure,
                `jlpt n${grammar.jlpt_level}`,
                'belajar bahasa jepang',
                '文法',
            ].filter(Boolean),
            alternates: { canonical: `/bunpo/${id}` },
            openGraph: {
                title: `Bunpo: ${grammar.title}`,
                description: `Struktur ${grammar.structure}. Pelajari tata bahasa Jepang ${grammar.title} di JBook.`,
                url: `/bunpo/${id}`,
                type: 'article',
            },
        };
    } catch (e) {
        return { title: 'Bunpo Detail - JBook' };
    }
}

export default async function BunpoDetailPage({ params }) {
    const { id } = await params;
    const grammar = await getGrammarDetail(id);

    if (!grammar) {
        return (
            <div className="container mx-auto px-4 py-16 text-center uppercase tracking-widest font-black">
                <div className="text-6xl mb-6">📜</div>
                <h1 className="text-2xl text-gray-800 mb-4">Tata Bahasa Tidak Ditemukan</h1>
                <Link href="/bunpo" className="text-blue-500 hover:underline">Kembali ke Daftar</Link>
            </div>
        );
    }

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'LearningResource',
        name: `Bunpo: ${grammar.title}`,
        description: `Materi belajar tata bahasa Jepang ${grammar.title} dengan struktur ${grammar.structure}.`,
        educationalLevel: `JLPT N${grammar.jlpt_level}`,
        inLanguage: ['id', 'ja'],
        url: `${BASE_URL}/bunpo/${id}`,
        learningResourceType: 'Grammar lesson',
        isPartOf: { '@type': 'WebSite', name: 'JBook', url: BASE_URL },
    };

    const breadcrumbJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Beranda', item: BASE_URL },
            { '@type': 'ListItem', position: 2, name: 'Bunpo', item: `${BASE_URL}/bunpo` },
            { '@type': 'ListItem', position: 3, name: grammar.title, item: `${BASE_URL}/bunpo/${id}` },
        ],
    };

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
            <BunpoDetailUI grammar={grammar} />
        </>
    );
}
