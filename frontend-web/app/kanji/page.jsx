import KanjiLanding from '@/components/kanji/KanjiLanding';
import { API_URL, getKanjiLevelVisibility } from '@/lib/api';

export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'Kanji — Belajar Kanji Jepang N5 sampai N1 | JBook',
    description: 'Kuasai kanji Jepang dari N5 sampai N1. 249+ materi kanji dengan arti, onyomi, kunyomi, urutan coretan, dan 214 filter radikal.',
    alternates: { canonical: '/kanji' },
    openGraph: {
        title: 'Kanji — Belajar Kanji Jepang N5 sampai N1 | JBook',
        description: 'Kuasai kanji Jepang dari N5 sampai N1. Pelajari arti, bacaan onyomi/kunyomi, animasi coretan, dan filter radikal interaktif di JBook.',
        type: 'website',
        url: '/kanji',
    },
};

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://jbook-five.vercel.app';
const safeJson = (value) => JSON.stringify(value).replace(/</g, '\\u003c');

export default async function KanjiPage() {
    let kanjiIndex = [];
    const counts = { n5: 80, n4: 169, n3: 0, n2: 0, n1: 0 };

    try {
        const [sitemapRes, , n5Res, n4Res] = await Promise.all([
            fetch(`${API_URL}/content/kanji/sitemap`, { next: { revalidate: 86400 } }).catch(() => null),
            getKanjiLevelVisibility().catch(() => null),
            fetch(`${API_URL}/content/kanji?level=5&limit=1`, { next: { revalidate: 3600 } }).catch(() => null),
            fetch(`${API_URL}/content/kanji?level=4&limit=1`, { next: { revalidate: 3600 } }).catch(() => null),
        ]);

        if (sitemapRes?.ok) {
            const fullList = await sitemapRes.json();
            if (Array.isArray(fullList)) {
                kanjiIndex = fullList.map(({ id, character, meaning, onyomi, kunyomi, jlpt_level }) => ({
                    id,
                    character,
                    meaning,
                    onyomi,
                    kunyomi,
                    jlpt_level: jlpt_level || 5,
                }));
            }
        }

        if (n5Res?.ok) {
            const data5 = await n5Res.json();
            if (data5?.total !== undefined) counts.n5 = data5.total;
        }

        if (n4Res?.ok) {
            const data4 = await n4Res.json();
            if (data4?.total !== undefined) counts.n4 = data4.total;
        }
    } catch (err) {
        console.error('[kanji-landing] Gagal memuat data index kanji:', err.message);
    }

    const collectionJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Daftar Kanji Jepang N5 sampai N1',
        description: 'Kuasai kanji Jepang dari N5 sampai N1 dengan arti, onyomi, kunyomi, coretan, dan 214 radikal.',
        url: `${BASE_URL}/kanji`,
        isPartOf: {
            '@type': 'WebSite',
            name: 'JBook',
            url: BASE_URL,
        },
        hasPart: [
            { '@type': 'WebPage', name: 'Kanji N5', url: `${BASE_URL}/kanji/n5` },
            { '@type': 'WebPage', name: 'Kanji N4', url: `${BASE_URL}/kanji/n4` },
            { '@type': 'WebPage', name: 'Kanji N3', url: `${BASE_URL}/kanji/n3` },
            { '@type': 'WebPage', name: 'Kanji N2', url: `${BASE_URL}/kanji/n2` },
            { '@type': 'WebPage', name: 'Kanji N1', url: `${BASE_URL}/kanji/n1` },
        ],
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: safeJson(collectionJsonLd) }}
            />
            <KanjiLanding kanjiIndex={kanjiIndex} counts={counts} />
        </>
    );
}
