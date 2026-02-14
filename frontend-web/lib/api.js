
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
 * @param {Object} params
 * @param {number} [params.level]
 * @param {string} [params.search]
 * @param {string} [params.radical]
 * @param {number} [params.limit]
 * @param {number} [params.offset]
 * @returns {Promise<Kanji[]>}
 */
export async function getKanjiList({ level, search, radical, limit = 100, page = 1 } = {}) {
    const queryParams = new URLSearchParams();
    if (level) queryParams.append('level', level);
    if (search) queryParams.append('search', search);
    if (radical) queryParams.append('radical', radical);
    if (limit) queryParams.append('limit', limit);

    // Calculate offset from page
    const offset = (page - 1) * limit;
    queryParams.append('offset', offset);

    const res = await fetch(`${API_URL}/content/kanji?${queryParams.toString()}`, {
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
/**
 * @typedef {Object} QuizQuestion
 * @property {string} kanji_id
 * @property {string} character
 * @property {Object[]} options
 * @property {string} options.text
 * @property {boolean} options.is_correct
 */

/**
 * @param {Object} params
 * @param {number} [params.limit]
 * @param {number} [params.level]
 * @returns {Promise<QuizQuestion[]>}
 */
export async function getPracticeQuestions({ limit = 10, level = null } = {}) {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit);
    if (level) params.append('level', level);

    const res = await fetch(`${API_URL}/learning/practice/generate?${params.toString()}`, {
        cache: 'no-store',
    });

    if (!res.ok) {
        throw new Error('Failed to fetch practice questions');
    }

    return res.json();
}

/**
 * @param {Object[]} results
 * @returns {Promise<Object>}
 */
export async function submitPracticeResults(results) {
    const res = await fetch(`${API_URL}/learning/practice/submit`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ results }),
    });

    if (!res.ok) {
        throw new Error('Failed to submit practice results');
    }

    return res.json();
}

/**
 * @returns {Promise<Object>}
 */
export async function getUserAnalytics() {
    const res = await fetch(`${API_URL}/learning/practice/analytics`, {
        cache: 'no-store',
    });

    if (!res.ok) {
        // Return default empty structure if auth fails or error
        return {
            total_attempts: 0,
            accuracy: 0,
            wrong_stats: []
        };
    }

    return res.json();
}
