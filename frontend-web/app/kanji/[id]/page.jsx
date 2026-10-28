import { notFound, permanentRedirect } from 'next/navigation';
import KanjiDetailUI from '@/components/kanji/KanjiDetailUI';
import { API_URL, getKanjiDetail, getKanjiList } from '@/lib/api';
import { getCharacterKanjiSlug, getKanjiHref, getKanjiReadingSlug, getKanjiSearchTerm, getKanjiSlug, getLegacyKanjiSlug } from '@/lib/kanji-route';

const isDatabaseId = value => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
    || /^[0-9a-f]{32}$/i.test(value);

async function findKanji(routeValue) {
    if (isDatabaseId(routeValue)) return getKanjiDetail(routeValue);

    let matchingKanji = null;
    try {
        const response = await fetch(`${API_URL}/content/kanji/sitemap`, {
            next: { revalidate: 86400 },
        });
        if (response.ok) {
            const kanjiIndex = await response.json();
            matchingKanji = kanjiIndex.find(kanji => getKanjiSlug(kanji) === routeValue);

            if (!matchingKanji) {
                matchingKanji = kanjiIndex.find(kanji => getLegacyKanjiSlug(kanji) === routeValue);
            }

            if (!matchingKanji) {
                matchingKanji = kanjiIndex.find(kanji => getCharacterKanjiSlug(kanji) === routeValue);
            }

            if (!matchingKanji) {
                const legacyMatches = kanjiIndex.filter(kanji => getKanjiReadingSlug(kanji) === routeValue);
                if (legacyMatches.length === 1) matchingKanji = legacyMatches[0];
            }
        }
    } catch (error) {
        console.warn('[kanji-route] Sitemap lookup failed; trying list search.', error);
    }

    if (!matchingKanji) {
        const { items = [] } = await getKanjiList({ search: getKanjiSearchTerm(routeValue), limit: 300 });
        matchingKanji = items.find(kanji => getKanjiSlug(kanji) === routeValue);
        if (!matchingKanji) {
            matchingKanji = items.find(kanji => getLegacyKanjiSlug(kanji) === routeValue);
        }
        if (!matchingKanji) {
            matchingKanji = items.find(kanji => getCharacterKanjiSlug(kanji) === routeValue);
        }
        if (!matchingKanji) {
            const legacyMatches = items.filter(kanji => getKanjiReadingSlug(kanji) === routeValue);
            if (legacyMatches.length === 1) matchingKanji = legacyMatches[0];
        }
    }

    return matchingKanji ? getKanjiDetail(matchingKanji.id) : null;
}

export async function generateMetadata({ params }) {
    const { id: routeValue } = await params;
    try {
        const kanji = await findKanji(routeValue);
        if (!kanji) return { title: 'Kanji Detail - JBook' };
        const canonical = getKanjiHref(kanji);
        
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
            alternates: { canonical },
            openGraph: {
                title: `Kanji ${kanji.character}: ${kanji.meaning}`,
                description: `Pelajari arti dan cara baca Kanji ${kanji.character} di JBook.`,
                url: canonical,
                type: 'article',
            },
        };
    } catch (e) {
        return { title: 'Kanji Detail - JBook' };
    }
}

export default async function KanjiDetailPage({ params }) {
    const { id: routeValue } = await params;
    
    let kanji = null;
    let isError = false;

    try {
        kanji = await findKanji(routeValue);
    } catch (error) {
        console.error('[jbook-server-error] Backend API hancur atau return 500:', error);
        isError = true;
    }

    // ✅ Pemicu notFound() harus di luar blok try-catch agar Next.js tidak bingung
    if (isError || !kanji) {
        notFound();
    }

    const canonical = getKanjiHref(kanji);
    if (routeValue !== getKanjiSlug(kanji)) {
        permanentRedirect(canonical);
    }

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'LearningResource',
        name: `Kanji ${kanji.character}: ${kanji.meaning}`,
        description: `Materi belajar Kanji ${kanji.character} dengan arti ${kanji.meaning}.`,
        educationalLevel: `JLPT N${kanji.jlpt_level}`,
        inLanguage: ['id', 'ja'],
        url: `https://jbook-five.vercel.app${canonical}`,
        learningResourceType: 'Kanji lesson',
        isPartOf: { '@type': 'WebSite', name: 'JBook', url: 'https://jbook-five.vercel.app' },
    };
    const breadcrumbJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Beranda', item: 'https://jbook-five.vercel.app' },
            { '@type': 'ListItem', position: 2, name: 'Kanji', item: 'https://jbook-five.vercel.app/kanji' },
            { '@type': 'ListItem', position: 3, name: `Kanji ${kanji.character}`, item: `https://jbook-five.vercel.app${canonical}` },
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