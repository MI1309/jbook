
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

async function handleResponse(res, context = 'API') {
    if (res.ok) return res.json();
    
    let detail = '';
    try {
        const data = await res.json();
        detail = data.detail || data.message || '';
    } catch (e) {
        try {
            detail = await res.text();
        } catch (e2) {
            detail = res.statusText;
        }
    }
    
    const errorMessage = detail ? `${detail}` : `Error ${res.status}: ${res.statusText}`;
    console.error(`[${context}] ${res.status} ${res.url}`, detail);
    
    const error = new Error(errorMessage);
    error.status = res.status;
    error.detail = detail;
    throw error;
}

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

    try {
        const res = await fetch(`${API_URL}/content/kanji?${queryParams.toString()}`, {
            cache: 'no-store',
        });
        return handleResponse(res, 'getKanjiList');
    } catch (error) {
        if (error.status) throw error;
        console.error('[getKanjiList] Network error:', error.message);
        if (typeof window === 'undefined') return [];
        throw new Error('Koneksi gagal. Mohon periksa internet Anda.');
    }
}

/**
 * @param {string} id
 * @returns {Promise<Kanji>}
 */
export async function getKanjiDetail(id) {
    try {
        const res = await fetch(`${API_URL}/content/kanji/${id}`);
        return handleResponse(res, 'getKanjiDetail');
    } catch (error) {
        if (error.status) throw error;
        console.error(`[getKanjiDetail] Network error for ${id}:`, error.message);
        if (typeof window === 'undefined') return null;
        throw new Error('Koneksi gagal. Mohon periksa internet Anda.');
    }
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

    try {
        const res = await fetch(`${API_URL}/content/grammar?${queryParams.toString()}`, {
            cache: 'no-store',
        });
        return handleResponse(res, 'getGrammarList');
    } catch (error) {
        if (error.status) throw error;
        console.error('[getGrammarList] Network error:', error.message);
        if (typeof window === 'undefined') return [];
        throw new Error('Koneksi gagal. Mohon periksa internet Anda.');
    }
}

/**
 * @param {string} id
 * @returns {Promise<Grammar>}
 */
export async function getGrammarDetail(id) {
    try {
        const res = await fetch(`${API_URL}/content/grammar/${id}`);
        return handleResponse(res, 'getGrammarDetail');
    } catch (error) {
        if (error.status) throw error;
        console.error(`[getGrammarDetail] Network error for ${id}:`, error.message);
        if (typeof window === 'undefined') return null;
        throw new Error('Koneksi gagal. Mohon periksa internet Anda.');
    }
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

    try {
        const res = await fetch(`${API_URL}/learning/practice/generate?${params.toString()}`, {
            cache: 'no-store',
        });
        return handleResponse(res, 'getPracticeQuestions');
    } catch (error) {
        if (error.status) throw error;
        throw new Error('Koneksi gagal. Mohon periksa internet Anda.');
    }
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

    try {
        const res = await fetch(`${API_URL}/learning/practice/submit`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ results }),
        });
        return handleResponse(res, 'submitPracticeResults');
    } catch (error) {
        if (error.status) throw error;
        throw new Error('Koneksi gagal. Mohon periksa internet Anda.');
    }
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

    try {
        const res = await fetch(`${API_URL}/learning/practice/reset`, {
            method: 'POST',
            headers,
        });
        return handleResponse(res, 'resetPracticeProgress');
    } catch (error) {
        if (error.status) throw error;
        throw new Error('Koneksi gagal. Mohon periksa internet Anda.');
    }
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

    try {
        const res = await fetch(`${API_URL}/content/vocab?${queryParams.toString()}`, {
            cache: 'no-store',
        });
        return handleResponse(res, 'getVocabList');
    } catch (error) {
        if (error.status) throw error;
        console.error('[getVocabList] Network error:', error.message);
        if (typeof window === 'undefined') return [];
        throw new Error('Koneksi gagal. Mohon periksa internet Anda.');
    }
}

/**
 * @param {string} id
 * @returns {Promise<Vocab>}
 */
export async function getVocabDetail(id) {
    try {
        const res = await fetch(`${API_URL}/content/vocab/${id}`, {
            cache: 'no-store',
        });
        return handleResponse(res, 'getVocabDetail');
    } catch (error) {
        if (error.status) throw error;
        console.error(`[getVocabDetail] Network error for ${id}:`, error.message);
        if (typeof window === 'undefined') return null;
        throw new Error('Koneksi gagal. Mohon periksa internet Anda.');
    }
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
    try {
        const res = await fetch(`${API_URL}/content/blog`, {
            cache: 'no-store',
        });
        return handleResponse(res, 'getBlogList');
    } catch (error) {
        // If it's a backend error with a status, throw it
        if (error.status) throw error;
        
        // On server-side (build/SSR), log the error but don't crash if it's just a network failure
        console.error('[getBlogList] Network error:', error.message);
        if (typeof window === 'undefined') {
            return []; // Return empty list during build if API is down
        }
        throw new Error('Koneksi gagal. Mohon periksa internet Anda.');
    }
}

/**
 * @param {string} slug
 * @returns {Promise<Blog>}
 */
export async function getBlogDetailBySlug(slug) {
    try {
        const res = await fetch(`${API_URL}/content/blog/${slug}`, {
            cache: 'no-store',
        });
        return handleResponse(res, 'getBlogDetailBySlug');
    } catch (error) {
        if (error.status) throw error;
        console.error(`[getBlogDetailBySlug] Network error for ${slug}:`, error.message);
        if (typeof window === 'undefined') return null;
        throw new Error('Koneksi gagal. Mohon periksa internet Anda.');
    }
}

/**
 * @param {Object} payload 
 * @returns {Promise<{message: string}>}
 */
export async function suggestContent(payload) {
    try {
        const res = await fetch(`${API_URL}/content/suggest`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        return handleResponse(res, 'suggestContent');
    } catch (error) {
        if (error.status) throw error;
        throw new Error('Koneksi gagal. Mohon periksa internet Anda.');
    }
}
/**
 * @returns {Promise<Object>}
 */
export async function exportPracticeData() {
    const token = Cookies.get('access_token');
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
        const res = await fetch(`${API_URL}/learning/practice/export`, {
            headers,
            cache: 'no-store',
        });
        return handleResponse(res, 'exportPracticeData');
    } catch (error) {
        if (error.status) throw error;
        throw new Error('Koneksi gagal. Mohon periksa internet Anda.');
    }
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

    try {
        const res = await fetch(`${API_URL}/learning/practice/import`, {
            method: 'POST',
            headers,
            body: JSON.stringify(data),
        });
        return handleResponse(res, 'importPracticeData');
    } catch (error) {
        if (error.status) throw error;
        throw new Error('Koneksi gagal. Mohon periksa internet Anda.');
    }
}
