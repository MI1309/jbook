import { notFound } from 'next/navigation';
import BunpoDetailUI from '@/components/bunpo/BunpoDetailUI';
import { getBunpoLevel } from '@/data/bunpoLevels';
import { getBunpoSlug } from '@/data/bunpoSlugs';
import { BUNPO_SECTIONS_PILOT } from '@/data/bunpo-sections-pilot';
import { applyPilotFallback } from '@/lib/bunpo-fallback.mjs';
import { getBunpoCatalog, getBunpoGrammarDetail } from '@/lib/bunpo-catalog';
import { normalizeBunpoPattern } from '@/lib/bunpo-schema';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://jbook-five.vercel.app';

function makeDescription(grammar) {
    const base = String(grammar.meaning || grammar.structure || '').replace(/\s+/g, ' ').trim();
    const explanation = String(grammar.explanation || '').replace(/\s+/g, ' ').trim();
    const full = [base, explanation].filter(Boolean).join('. ');
    return full.length > 160 ? `${full.slice(0, 157).trimEnd()}...` : full;
}

function makeTitle(pola, level) {
    return `${pola} — Bunpo ${level.toUpperCase()} | JBook`.slice(0, 60);
}

function slugMatches(item, slug) {
    const generatedSlug = getBunpoSlug(item.title);
    if (item.slug === slug || generatedSlug === slug) return true;
    try {
        return decodeURIComponent(item.slug || '') === slug || decodeURIComponent(generatedSlug || '') === slug;
    } catch {
        return false;
    }
}

async function findGrammar(level, slug) {
    const config = getBunpoLevel(level);
    if (!config) return null;

    const catalog = await getBunpoCatalog();
    const pattern = catalog.find((item) =>
        Number(item.jlpt_level) === config.number &&
        slugMatches(item, slug)
    );
    if (!pattern) return null;

    const detail = await getBunpoGrammarDetail(pattern.id);
    if (!detail) return null;

    const grammar = normalizeBunpoPattern({ ...pattern, ...detail, meaning: detail.meaning || detail.structure });
    return applyPilotFallback(grammar, slug, BUNPO_SECTIONS_PILOT);
}

export async function generateMetadata({ params }) {
    const { level: rawLevel, slug } = await params;
    const level = String(rawLevel).toLowerCase();
    const config = getBunpoLevel(level);
    if (!config) return { title: 'Pola Bunpo tidak ditemukan | JBook', robots: { index: false, follow: true } };

    try {
        const grammar = await findGrammar(level, slug);
        if (!grammar) return { title: 'Pola Bunpo tidak ditemukan | JBook', robots: { index: false, follow: true } };

        const description = makeDescription(grammar);
        const title = makeTitle(grammar.title, level);
        return {
            title,
            description,
            robots: { index: true, follow: true },
            alternates: { canonical: `/bunpo/${level}/${slug}` },
            openGraph: { title, description, url: `/bunpo/${level}/${slug}`, type: 'article' },
        };
    } catch {
        const title = makeTitle(slug, level);
        return {
            title,
            robots: { index: true, follow: true },
            alternates: { canonical: `/bunpo/${level}/${slug}` },
        };
    }
}

export default async function BunpoPatternPage({ params }) {
    const { level: rawLevel, slug } = await params;
    const level = String(rawLevel).toLowerCase();
    const config = getBunpoLevel(level);
    if (!config) notFound();

    const grammar = await findGrammar(level, slug);
    if (!grammar) notFound();

    const canonicalUrl = `${BASE_URL}/bunpo/${level}/${slug}`;
    const description = makeDescription(grammar);
    const faq = grammar.sections?.faq;
    const learningResource = {
        '@context': 'https://schema.org',
        '@type': 'LearningResource',
        name: `Bunpo: ${grammar.title}`,
        description,
        educationalLevel: `JLPT ${level.toUpperCase()}`,
        educationalAlignment: {
            '@type': 'AlignmentObject',
            alignmentType: 'educationalSubject',
            educationalFramework: 'JLPT',
            targetName: `JLPT ${level.toUpperCase()}`,
        },
        about: [{ '@type': 'Thing', name: grammar.title }],
        ...(grammar.sections?.mainFunction?.summary ? { teaches: grammar.sections.mainFunction.summary.slice(0, 250) } : {}),
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
            {Array.isArray(faq) && faq.length > 0 && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJson({
                '@context': 'https://schema.org',
                '@type': 'FAQPage',
                mainEntity: faq.map(({ q, a }) => ({
                    '@type': 'Question',
                    name: q,
                    acceptedAnswer: { '@type': 'Answer', text: a },
                })),
            }) }} />}
            <BunpoDetailUI
                grammar={grammar}
                backHref={`/bunpo/${level}`}
                backLabel={`Kembali ke daftar ${level.toUpperCase()}`}
            />
        </>
    );
}