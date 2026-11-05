import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import KanjiLevelSearch from '@/components/kanji/KanjiLevelSearch';
import { getKanjiLevel } from '@/data/kanjiLevels';
import { getKanjiList } from '@/lib/api';
import { findKanji, getKanjiHref } from '@/lib/kanji-route';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://jbook-five.vercel.app';
const safeJson = (value) => JSON.stringify(value).replace(/</g, '\\u003c');

export async function generateMetadata({ params }) {
    const { level: rawLevel } = await params;
    const levelStr = String(rawLevel).toLowerCase();
    const config = getKanjiLevel(levelStr);

    if (!config) {
        // Cek apakah ini legacy slug untuk kanji detail
        try {
            const kanji = await findKanji(rawLevel);
            if (kanji) {
                const canonical = getKanjiHref(kanji);
                return {
                    title: `Kanji ${kanji.character} (${kanji.meaning}) — JBook`,
                    description: `Arti Kanji ${kanji.character}: ${kanji.meaning}. Onyomi ${kanji.onyomi?.join(', ') || '-'}, Kunyomi ${kanji.kunyomi?.join(', ') || '-'}.`,
                    alternates: { canonical },
                };
            }
        } catch {}
        return { title: 'Level Kanji tidak ditemukan | JBook' };
    }

    const title = `Kanji ${config.level.toUpperCase()} — Daftar Kanji JLPT | JBook`;
    const description = `Daftar kanji JLPT ${config.level.toUpperCase()} lengkap dengan arti, onyomi, kunyomi, urutan coretan, dan filter radikal interaktif.`;

    return {
        title,
        description,
        alternates: { canonical: `/kanji/${config.level}` },
        openGraph: {
            title,
            description,
            url: `/kanji/${config.level}`,
            type: 'website',
        },
    };
}

export default async function KanjiLevelPage({ params, searchParams }) {
    const { level: rawLevel } = await params;
    const levelStr = String(rawLevel).toLowerCase();
    const config = getKanjiLevel(levelStr);

    // Jika bukan level N1..N5 yang valid, cek apakah ini legacy detail route (/kanji/[id] atau /kanji/[slug])
    if (!config) {
        let kanji = null;
        try {
            kanji = await findKanji(rawLevel);
        } catch (err) {
            console.error('[kanji-level-route] Error resolving legacy kanji:', err);
        }

        if (kanji) {
            // Redirect 308 permanen ke format baru: /kanji/[level]/[slug]
            permanentRedirect(getKanjiHref(kanji));
        }

        notFound();
    }

    const resolvedSearchParams = await searchParams;
    const search = resolvedSearchParams?.search || '';
    const radical = resolvedSearchParams?.radical || '';
    const page = parseInt(resolvedSearchParams?.page, 10) || 1;

    let initialData = { items: [], total: 0, pages: 1, page: 1 };
    try {
        initialData = await getKanjiList({
            level: config.number,
            search,
            radical,
            limit: 30,
            page,
        });
    } catch (err) {
        console.error('[kanji-level-page] Gagal memuat data awal kanji:', err.message);
    }

    const canonicalUrl = `${BASE_URL}/kanji/${config.level}`;

    const collectionJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: `Kanji JLPT ${config.level.toUpperCase()}`,
        description: `Daftar kanji level JLPT ${config.level.toUpperCase()} di JBook. Total ${initialData.total || 0} karakter.`,
        url: canonicalUrl,
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
            { '@type': 'ListItem', position: 3, name: config.level.toUpperCase(), item: canonicalUrl },
        ],
    };

    return (
        <main className="washi-texture min-h-screen bg-[var(--background)] text-[var(--foreground)]">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: safeJson(collectionJsonLd) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: safeJson(breadcrumbJsonLd) }}
            />

            <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
                {/* Breadcrumb Navigation */}
                <nav aria-label="Breadcrumb" className="mb-5 text-xs sm:text-sm text-gray-500 sm:mb-6">
                    <Link href="/kanji" className="font-semibold hover:text-accent-blue hover:underline">
                        Kanji
                    </Link>
                    <span aria-hidden="true" className="px-2">/</span>
                    <span aria-current="page" className="font-bold text-[var(--foreground)]">
                        {config.level.toUpperCase()}
                    </span>
                </nav>

                <KanjiLevelSearch levelConfig={config} initialData={initialData} />
            </div>
        </main>
    );
}
