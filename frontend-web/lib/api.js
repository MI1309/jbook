
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://imronm.pythonanywhere.com/api';
import Cookies from 'js-cookie';

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
 * @param {Object} params
 * @param {number} [params.level]
 * @param {string} [params.search]
 * @param {number} [params.chapter]
 * @param {number} [params.limit]
 * @param {number} [params.offset]
 * @returns {Promise<Grammar[]>}
 */
export async function getGrammarList({ level, search, chapter, limit = 100, page = 1 } = {}) {
    const queryParams = new URLSearchParams();
    if (level) queryParams.append('level', level);
    if (search) queryParams.append('search', search);
    if (chapter) queryParams.append('chapter', chapter);
    if (limit) queryParams.append('limit', limit);

    // Calculate offset from page
    const offset = (page - 1) * limit;
    queryParams.append('offset', offset);

    const res = await fetch(`${API_URL}/content/grammar?${queryParams.toString()}`, {
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
export async function getPracticeQuestions({ limit = 10, level = null, type = 'kanji' } = {}) {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit);
    if (level) params.append('level', level);
    if (type) params.append('type', type);

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
    const token = Cookies.get('access_token');
    const headers = {
        'Content-Type': 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_URL}/learning/practice/submit`, {
        method: 'POST',
        headers,
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
    const token = Cookies.get('access_token');
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_URL}/learning/practice/analytics`, {
        headers,
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

/**
 * @returns {Promise<Object>}
 */
export async function resetPracticeProgress() {
    const token = Cookies.get('access_token');
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_URL}/learning/practice/reset`, {
        method: 'POST',
        headers,
    });

    if (!res.ok) {
        throw new Error('Failed to reset practice progress');
    }

    return res.json();
}

/**
 * @typedef {Object} Vocab
 * @property {string} id
 * @property {string} word
 * @property {string} reading
 * @property {string} meaning
 * @property {number} jlpt_level
 */

/**
 * @param {Object} params
 * @param {number} [params.level]
 * @param {string} [params.search]
 * @param {number} [params.limit]
 * @param {number} [params.page]
 * @returns {Promise<Vocab[]>}
 */
export async function getVocabList({ level, search, limit = 100, page = 1 } = {}) {
    const queryParams = new URLSearchParams();
    if (level) queryParams.append('level', level);
    if (search) queryParams.append('search', search);
    if (limit) queryParams.append('limit', limit);

    // Calculate offset from page
    const offset = (page - 1) * limit;
    queryParams.append('offset', offset);

    const res = await fetch(`${API_URL}/content/vocab?${queryParams.toString()}`, {
        cache: 'no-store',
    });

    if (!res.ok) {
        throw new Error('Failed to fetch Vocab');
    }

    return res.json();
}

/**
 * @param {string} id
 * @returns {Promise<Vocab>}
 */
export async function getVocabDetail(id) {
    const res = await fetch(`${API_URL}/content/vocab/${id}`, {
        cache: 'no-store',
    });

    if (!res.ok) {
        const errorText = await res.text();
        console.error(`[getVocabDetail] Fetch error: ${res.status}`, errorText);
        throw new Error(`Failed to fetch Vocab detail: ${res.status} ${res.statusText}`);
    }

    return res.json();
}

/**
 * @typedef {Object} Blog
 * @property {string} id
 * @property {string} title
 * @property {string} slug
 * @property {string} content
 * @property {string[]} tags
 * @property {string} created_at
 */

/**
 * @returns {Promise<Blog[]>}
 */
export async function getBlogList() {
    const res = await fetch(`${API_URL}/content/blog`, {
        cache: 'no-store',
    });

    if (!res.ok) {
        throw new Error('Failed to fetch blog list');
    }

    return res.json();
}

/**
 * @param {string} slug
 * @returns {Promise<Blog>}
 */
export async function getBlogDetailBySlug(slug) {
    const res = await fetch(`${API_URL}/content/blog/${slug}`, {
        cache: 'no-store',
    });

    return res.json();
}

/**
 * @param {Object} payload 
 * @returns {Promise<{message: string}>}
 */
export async function suggestContent(payload) {
    const res = await fetch(`${API_URL}/content/suggest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        throw new Error('Failed to submit suggestion');
    }

    return res.json();
}
/**
 * @returns {Promise<Object>}
 */
export async function exportPracticeData() {
    const token = Cookies.get('access_token');
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_URL}/learning/practice/export`, {
        headers,
        cache: 'no-store',
    });

    if (!res.ok) {
        throw new Error('Failed to export practice data');
    }

    return res.json();
}

/**
 * @param {Object} data 
 * @returns {Promise<Object>}
 */
export async function importPracticeData(data) {
    const token = Cookies.get('access_token');
    const headers = {
        'Content-Type': 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_URL}/learning/practice/import`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to import practice data: ${errorText}`);
    }

    return res.json();
}
