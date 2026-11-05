import { notFound, permanentRedirect } from 'next/navigation';
import KanjiDetailUI from '@/components/kanji/KanjiDetailUI';
import { getKanjiLevel } from '@/data/kanjiLevels';
import { findKanji, getKanjiHref, getKanjiSlug } from '@/lib/kanji-route';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://jbook-five.vercel.app';
const safeJson = (value) => JSON.stringify(value).replace(/</g, '\\u003c');

function makeKanjiDescription(kanji, level) {
    const char = kanji?.character || '';
    const meaning = kanji?.meaning || '';
    const onyomi = kanji?.onyomi?.join(', ') || '-';
    const kunyomi = kanji?.kunyomi?.join(', ') || '-';
    const radical = kanji?.radical ? ` Radikal: ${kanji.radical}.` : '';

    const text = `Arti Kanji ${char}: ${meaning}. Pelajari Onyomi (${onyomi}), Kunyomi (${kunyomi}), jumlah coretan, dan contoh kata di JLPT ${level.toUpperCase()}.` + radical;
    return text.length > 160 ? `${text.slice(0, 157).trimEnd()}...` : text;
}

export async function generateMetadata({ params }) {
    const { level: rawLevel, slug } = await params;
    const levelStr = String(rawLevel).toLowerCase();
    const config = getKanjiLevel(levelStr);
    if (!config) return { title: 'Kanji Detail - JBook' };

    try {
        const kanji = await findKanji(slug, config.number);
        if (!kanji) {
            return { title: `Kanji ${levelStr.toUpperCase()} - JBook` };
        }

        const canonical = getKanjiHref(kanji);
        const description = makeKanjiDescription(kanji, config.level);

        // Title ≤60 karakter
        const rawTitle = `${kanji.character} — Kanji ${config.level.toUpperCase()} (${kanji.meaning}) | JBook`;
        const title = rawTitle.length > 60 ? `${rawTitle.slice(0, 57)}...` : rawTitle;

        return {
            title,
            description,
            alternates: { canonical },
            openGraph: {
                title,
                description,
                url: canonical,
                type: 'article',
            },
        };
    } catch {
        return { title: 'Kanji Detail - JBook' };
    }
}

export default async function KanjiDetailPage({ params }) {
    const { level: rawLevel, slug } = await params;
    const levelStr = String(rawLevel).toLowerCase();
    const config = getKanjiLevel(levelStr);
    if (!config) notFound();

    let kanji = null;
    let isError = false;

    try {
        kanji = await findKanji(slug, config.number);
    } catch (error) {
        console.error('[kanji-detail-page] Error loading kanji:', error);
        isError = true;
    }

    if (isError || !kanji) {
        notFound();
    }

    // Redirect ke URL kanonik jika slug yang diminta bukan slug kanonik
    const canonical = getKanjiHref(kanji);
    const expectedSlug = getKanjiSlug(kanji);
    const decodedSlug = decodeURIComponent(slug);

    if (decodedSlug !== expectedSlug && decodedSlug !== kanji.character) {
        permanentRedirect(canonical);
    }

    const description = makeKanjiDescription(kanji, config.level);
    const canonicalUrl = `${BASE_URL}${canonical}`;

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'LearningResource',
        name: `Kanji ${kanji.character}: ${kanji.meaning}`,
        description,
        educationalLevel: `JLPT ${config.level.toUpperCase()}`,
        educationalAlignment: {
            '@type': 'AlignmentObject',
            alignmentType: 'educationalSubject',
            educationalFramework: 'JLPT',
            targetName: `JLPT ${config.level.toUpperCase()}`,
        },
        inLanguage: ['id', 'ja'],
        url: canonicalUrl,
        learningResourceType: 'Kanji lesson',
        isPartOf: {
            '@type': 'WebSite',
            name: 'JBook',
            url: BASE_URL,
        },
    };

    const breadcrumbJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Beranda', item: BASE_URL },
            { '@type': 'ListItem', position: 2, name: 'Kanji', item: `${BASE_URL}/kanji` },
            { '@type': 'ListItem', position: 3, name: config.level.toUpperCase(), item: `${BASE_URL}/kanji/${config.level}` },
            { '@type': 'ListItem', position: 4, name: kanji.character, item: canonicalUrl },
        ],
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: safeJson(jsonLd) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: safeJson(breadcrumbJsonLd) }}
            />
            <KanjiDetailUI
                kanji={kanji}
                level={config.level}
                slug={expectedSlug}
                backHref={`/kanji/${config.level}`}
                backLabel={`Kembali ke daftar ${config.level.toUpperCase()}`}
            />
        </>
    );
}
