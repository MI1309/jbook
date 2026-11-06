import { toRomaji } from 'wanakana';

export function generateSlug(title) {
    if (typeof title !== 'string' || !title.trim()) return null;

    const normalizedTitle = title.trim().toLowerCase();
    const cleanedTitle = normalizedTitle
        .replace(/[～〜~]/g, ' ')
        .replace(/[^\p{L}\p{N}_\s-]/gu, '')
        .replace(/\s+/g, ' ')
        .trim();
    if (/[\p{Script=Han}]/u.test(cleanedTitle)) {
        return encodeURIComponent(cleanedTitle);
    }

    const kanaTitle = cleanedTitle === 'は'
        ? 'わ'
        : cleanedTitle.replace(/は(?=[～〜~\s]|$)/g, 'わ');
    const romanized = toRomaji(kanaTitle);
    const slug = romanized
        .replace(/[^\p{L}\p{N}]+/gu, '-')
        .replace(/^-|-$/g, '')
        .replace(/-+/g, '-');

    return slug || encodeURIComponent(cleanedTitle);
}

export function getBunpoSlug(title) {
    return generateSlug(title);
}

export function getPolaBySlug(slug) {
    if (typeof slug !== 'string') return null;
    try {
        return decodeURIComponent(slug);
    } catch {
        return slug;
    }
}
