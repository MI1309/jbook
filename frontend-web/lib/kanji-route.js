import { toHiragana, toRomaji } from 'wanakana';
import { API_URL, getKanjiDetail, getKanjiList } from '@/lib/api';

export function getKanjiReadingSlug(kanji) {
    const kunyomi = (kanji?.kunyomi || []).find(value => String(value || '').trim());
    const onyomi = (kanji?.onyomi || []).find(value => String(value || '').trim());

    const reading = kunyomi || onyomi;
    return reading
        ? toRomaji(String(reading).trim()).toLowerCase().replace(/[^a-z0-9-]/g, '')
        : 'kanji';
}

function toMeaningSlug(meaning) {
    return String(meaning || '')
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

export function getKanjiSlug(kanji) {
    const readingSlug = getKanjiReadingSlug(kanji);
    const meaningSlug = toMeaningSlug(kanji?.meaning);

    return meaningSlug ? `${readingSlug}-${meaningSlug}` : `${readingSlug}-${kanji?.id}`;
}

export function getLegacyKanjiSlug(kanji) {
    const characterCode = Array.from(String(kanji?.character || ''))
        .map(value => value.codePointAt(0).toString(16))
        .join('-');

    return characterCode ? `${getKanjiReadingSlug(kanji)}-${characterCode}` : null;
}

export function getCharacterKanjiSlug(kanji) {
    const character = String(kanji?.character || '').trim();
    return character ? `${getKanjiReadingSlug(kanji)}-${character}` : null;
}

export function getKanjiLevelSlug(kanji) {
    const raw = kanji?.jlpt_level ?? kanji?.level;
    if (!raw) return 'n5';
    const str = String(raw).trim().toLowerCase();
    return str.startsWith('n') ? str : `n${str}`;
}

// Ambil href untuk halaman detail kanji konsisten dengan Bunpo: /kanji/[level]/[slug]
export function getKanjiHref(kanji) {
    const level = getKanjiLevelSlug(kanji);
    return `/kanji/${level}/${encodeURIComponent(getKanjiSlug(kanji))}`;
}

// Ambil href format lama (/kanji/[slug]) untuk keperluan redirect/kompatibilitas
export function getLegacyKanjiHref(kanji) {
    return `/kanji/${encodeURIComponent(getKanjiSlug(kanji))}`;
}

// The API searches readings stored in kana, while public slugs use romaji.
export function getKanjiSearchTerm(slug) {
    const reading = String(slug || '').split('-')[0]
        .replace(/-[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}々〆ヵヶ]+$/u, '')
        .replace(/-[0-9a-f]+(?:-[0-9a-f]+)*$/i, '');
    return toHiragana(reading.replace(/-/g, ''));
}

export const isDatabaseId = (value) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
    || /^[0-9a-f]{32}$/i.test(value);

/**
 * Mencari kanji berdasarkan routeValue (slug, character, atau UUID),
 * opsional difilter berdasarkan level jika tersedia.
 */
export async function findKanji(routeValue) {
    if (!routeValue) return null;
    const decodedValue = decodeURIComponent(String(routeValue).trim());

    if (isDatabaseId(decodedValue)) {
        return getKanjiDetail(decodedValue);
    }

    let matchingKanji = null;

    try {
        const response = await fetch(`${API_URL}/content/kanji/sitemap`, {
            next: { revalidate: 86400 },
        });
        if (response.ok) {
            const kanjiIndex = await response.json();
            // 1. Cocokkan exact slug (misal: 'hi-matahari-hari')
            matchingKanji = kanjiIndex.find(kanji => getKanjiSlug(kanji) === decodedValue);

            // 2. Cocokkan langsung karakter kanji (misal: '日')
            if (!matchingKanji) {
                matchingKanji = kanjiIndex.find(kanji => kanji.character === decodedValue);
            }

            // 3. Cocokkan legacy slug dengan kode heksadesimal unicode
            if (!matchingKanji) {
                matchingKanji = kanjiIndex.find(kanji => getLegacyKanjiSlug(kanji) === decodedValue);
            }

            // 4. Cocokkan character slug (misal: 'hi-日')
            if (!matchingKanji) {
                matchingKanji = kanjiIndex.find(kanji => getCharacterKanjiSlug(kanji) === decodedValue);
            }

            // 5. Cocokkan reading saja jika unik
            if (!matchingKanji) {
                const legacyMatches = kanjiIndex.filter(kanji => getKanjiReadingSlug(kanji) === decodedValue);
                if (legacyMatches.length === 1) matchingKanji = legacyMatches[0];
            }
        }
    } catch (error) {
        console.warn('[kanji-route] Sitemap lookup failed; trying list search.', error);
    }

    // Jika belum ditemukan di sitemap, coba cari via list API
    if (!matchingKanji) {
        try {
            const searchTerm = getKanjiSearchTerm(decodedValue) || decodedValue;
            const { items = [] } = await getKanjiList({ search: searchTerm, limit: 300 });

            matchingKanji = items.find(kanji => getKanjiSlug(kanji) === decodedValue);

            if (!matchingKanji) {
                matchingKanji = items.find(kanji => kanji.character === decodedValue);
            }
            if (!matchingKanji) {
                matchingKanji = items.find(kanji => getLegacyKanjiSlug(kanji) === decodedValue);
            }
            if (!matchingKanji) {
                matchingKanji = items.find(kanji => getCharacterKanjiSlug(kanji) === decodedValue);
            }
            if (!matchingKanji) {
                const legacyMatches = items.filter(kanji => getKanjiReadingSlug(kanji) === decodedValue);
                if (legacyMatches.length === 1) matchingKanji = legacyMatches[0];
            }
        } catch (err) {
            console.warn('[kanji-route] List fallback search failed.', err);
        }
    }

    if (!matchingKanji) return null;

    // Ambil data detail penuh (termasuk svg_data, contoh kata kotoba, radikal, dll)
    const detail = await getKanjiDetail(matchingKanji.id);
    return detail || matchingKanji;
}
