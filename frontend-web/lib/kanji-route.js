import { toHiragana, toRomaji } from 'wanakana';

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

// ambil href untuk halaman detail kanji
export function getKanjiHref(kanji) {
    return `/kanji/${encodeURIComponent(getKanjiSlug(kanji))}`;
}

// The API searches readings stored in kana, while public slugs use romaji.
export function getKanjiSearchTerm(slug) {
    const reading = String(slug || '').split('-')[0]
        .replace(/-[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}々〆ヵヶ]+$/u, '')
        .replace(/-[0-9a-f]+(?:-[0-9a-f]+)*$/i, '');
    return toHiragana(reading.replace(/-/g, ''));
}