
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

/**
 * @typedef {Object} Kanji
 * @property {string} id
 * @property {string} character
 * @property {string} meaning
 * @property {string[]} onyomi
 * @property {string[]} kunyomi
 * @property {number} strokes
 * @property {number} jlpt_level
 * @property {any[]} examples
 */

/**
 * @param {number} [level]
 * @returns {Promise<Kanji[]>}
 */
export async function getKanjiList(level) {
    const params = level ? `?level=${level}` : '';
    const res = await fetch(`${API_URL}/content/kanji${params}`, {
        cache: 'no-store', // dynamic data
    });

    if (!res.ok) {
        throw new Error('Failed to fetch Kanji');
    }

    return res.json();
}

/**
 * @param {string} id
 * @returns {Promise<Kanji>}
 */
export async function getKanjiDetail(id) {
    const res = await fetch(`${API_URL}/content/kanji/${id}`);

    if (!res.ok) {
        throw new Error('Failed to fetch Kanji detail');
    }

    return res.json();
}

/**
 * @typedef {Object} Grammar
 * @property {string} id
 * @property {string} title
 * @property {string} structure
 * @property {string} explanation
 * @property {number} jlpt_level
 * @property {any[]} sentences
 */

/**
 * @param {number} [level]
 * @returns {Promise<Grammar[]>}
 */
export async function getGrammarList(level) {
    const params = level ? `?level=${level}` : '';
    const res = await fetch(`${API_URL}/content/grammar${params}`, {
        cache: 'no-store',
    });

    if (!res.ok) {
        throw new Error('Failed to fetch Grammar');
    }

    return res.json();
}

/**
 * @param {string} id
 * @returns {Promise<Grammar>}
 */
export async function getGrammarDetail(id) {
    const res = await fetch(`${API_URL}/content/grammar/${id}`);

    if (!res.ok) {
        throw new Error('Failed to fetch Grammar detail');
    }

    return res.json();
}
