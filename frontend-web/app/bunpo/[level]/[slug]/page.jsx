import { notFound } from 'next/navigation';
import BunpoDetailUI from '@/components/bunpo/BunpoDetailUI';
import { getBunpoLevel } from '@/data/bunpoLevels';
import { getBunpoSlug, getPolaBySlug } from '@/data/bunpoSlugs';
import { getBunpoCatalog, getBunpoGrammarDetail } from '@/lib/bunpo-catalog';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://jbook-five.vercel.app';

async function findGrammar(level, slug) {
    const config = getBunpoLevel(level);
    const pola = getPolaBySlug(slug);
    if (!config || !pola) return null;

    const catalog = await getBunpoCatalog();
    const pattern = catalog.find((item) =>
        Number(item.jlpt_level) === config.number &&
        item.title === pola &&
        getBunpoSlug(item.title) === slug
    );
    if (!pattern) return null;

    const detail = await getBunpoGrammarDetail(pattern.id);
    return detail ? { ...pattern, ...detail, meaning: detail.meaning || detail.structure } : null;
}

export async function generateMetadata({ params }) {
    const { level: rawLevel, slug } = await params;
    const level = String(rawLevel).toLowerCase();
    const config = getBunpoLevel(level);
    const pola = getPolaBySlug(slug);
    if (!config || !pola) return { title: 'Pola Bunpo tidak ditemukan | JBook' };

    try {
        const grammar = await findGrammar(level, slug);
        if (!grammar) return { title: `${pola} — Bunpo ${level.toUpperCase()} | JBook` };

        const shortExplanation = String(grammar.explanation || '').replace(/\s+/g, ' ').slice(0, 170);
        const description = `${grammar.meaning || grammar.structure}. ${shortExplanation}`.trim();
        const title = `${pola} — Bunpo ${level.toUpperCase()} | JBook`;
        return {
            title,
            description,
            alternates: { canonical: `/bunpo/${level}/${slug}` },
            openGraph: { title, description, url: `/bunpo/${level}/${slug}`, type: 'article' },
        };
    } catch {
        return { title: `${pola} — Bunpo ${level.toUpperCase()} | JBook` };
    }
}

export default async function BunpoPatternPage({ params }) {
    const { level: rawLevel, slug } = await params;
    const level = String(rawLevel).toLowerCase();
    const config = getBunpoLevel(level);
    const pola = getPolaBySlug(slug);
    if (!config || !pola) notFound();

    const grammar = await findGrammar(level, slug);
    if (!grammar) notFound();

    const canonicalUrl = `${BASE_URL}/bunpo/${level}/${slug}`;
    const description = `${grammar.meaning || grammar.structure}. ${String(grammar.explanation || '').replace(/\s+/g, ' ').slice(0, 170)}`.trim();
    const learningResource = {
        '@context': 'https://schema.org',
        '@type': 'LearningResource',
        name: `Bunpo: ${grammar.title}`,
        description,
        educationalLevel: `JLPT ${level.toUpperCase()}`,
        inLanguage: ['id', 'ja'],
        url: canonicalUrl,
        learningResourceType: 'Grammar lesson',
        isPartOf: { '@type': 'WebSite', name: 'JBook', url: BASE_URL },
    };
    const breadcrumb = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Beranda', item: BASE_URL },
            { '@type': 'ListItem', position: 2, name: 'Bunpo', item: `${BASE_URL}/bunpo` },
            { '@type': 'ListItem', position: 3, name: level.toUpperCase(), item: `${BASE_URL}/bunpo/${level}` },
            { '@type': 'ListItem', position: 4, name: grammar.title, item: canonicalUrl },
        ],
    };
    const safeJson = (value) => JSON.stringify(value).replace(/</g, '\\u003c');

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJson(learningResource) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJson(breadcrumb) }} />
            <BunpoDetailUI
                grammar={grammar}
                backHref={`/bunpo/${level}`}
                backLabel={`Kembali ke daftar ${level.toUpperCase()}`}
                levelHref={`/bunpo/${level}`}
                levelLabel={level.toUpperCase()}
            />
        </>
    );
}