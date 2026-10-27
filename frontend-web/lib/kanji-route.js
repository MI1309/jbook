import { toRomaji } from 'wanakana';

function toSlugPart(value) {
    return String(value || '')
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

export function getKanjiSlug(kanji) {
    const readings = [...(kanji?.kunyomi || []), ...(kanji?.onyomi || [])];
    const reading = readings
        .map(value => toSlugPart(toRomaji(String(value || ''))))
        .find(Boolean);
    const meaning = toSlugPart(kanji?.meaning);

    return [reading, meaning].filter(Boolean).join('-') || `kanji-${kanji?.id}`;
}

export function getKanjiHref(kanji) {
    return `/kanji/${encodeURIComponent(getKanjiSlug(kanji))}`;
}

export function getKanjiSearchTerm(slug) {
    return String(slug || '').split('-')[0];
}