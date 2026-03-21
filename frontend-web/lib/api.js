
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

function handleNetworkError(context, error, defaultValue = null) {
    console.error(`[${context}] Network error:`, error.message);
    if (typeof window === 'undefined') {
        return defaultValue;
    }
    throw new Error('Koneksi gagal. Mohon periksa internet Anda.');
}

export async function getKanjiList({ level, search, radical, limit = 50, page = 1 } = {}) {
    const queryParams = new URLSearchParams();
    if (level) queryParams.append('level', level);
    if (search) queryParams.append('search', search);
    if (radical) queryParams.append('radical', radical);
    if (limit) queryParams.append('limit', limit);
    if (page) queryParams.append('page', page);

    try {
        const res = await fetch(`${API_URL}/content/kanji?${queryParams.toString()}`, {
            cache: 'no-store',
        });
        return handleResponse(res, 'getKanjiList');
    } catch (error) {
        if (error.status) throw error;
        return handleNetworkError('getKanjiList', error, { items: [], total: 0, page: 1, pages: 1 });
    }
}

export async function getKanjiDetail(id) {
    try {
        const res = await fetch(`${API_URL}/content/kanji/${id}`);
        return handleResponse(res, 'getKanjiDetail');
    } catch (error) {
        if (error.status) throw error;
        return handleNetworkError('getKanjiDetail', error, null);
    }
}

export async function getGrammarList({ level, search, chapter, limit = 50, page = 1 } = {}) {
    const queryParams = new URLSearchParams();
    if (level) queryParams.append('level', level);
    if (search) queryParams.append('search', search);
    if (chapter) queryParams.append('chapter', chapter);
    if (limit) queryParams.append('limit', limit);
    if (page) queryParams.append('page', page);

    try {
        const res = await fetch(`${API_URL}/content/grammar?${queryParams.toString()}`, {
            cache: 'no-store',
        });
        return handleResponse(res, 'getGrammarList');
    } catch (error) {
        if (error.status) throw error;
        return handleNetworkError('getGrammarList', error, { items: [], total: 0, page: 1, pages: 1 });
    }
}

export async function getGrammarDetail(id) {
    try {
        const res = await fetch(`${API_URL}/content/grammar/${id}`);
        return handleResponse(res, 'getGrammarDetail');
    } catch (error) {
        if (error.status) throw error;
        return handleNetworkError('getGrammarDetail', error, null);
    }
}

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
        return handleNetworkError('getPracticeQuestions', error, []);
    }
}

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
        return handleNetworkError('submitPracticeResults', error);
    }
}

export async function getUserAnalytics() {
    const token = Cookies.get('access_token');
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
        const res = await fetch(`${API_URL}/learning/practice/analytics`, {
            headers,
            cache: 'no-store',
        });

        if (!res.ok) {
            return {
                total_attempts: 0,
                accuracy: 0,
                wrong_stats: []
            };
        }

        return res.json();
    } catch (error) {
        return handleNetworkError('getUserAnalytics', error, {
            total_attempts: 0,
            accuracy: 0,
            wrong_stats: []
        });
    }
}

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
        return handleNetworkError('resetPracticeProgress', error);
    }
}

export async function getVocabList({ level, search, word_type, limit = 50, page = 1 } = {}) {
    const queryParams = new URLSearchParams();
    if (level) queryParams.append('level', level);
    if (search) queryParams.append('search', search);
    if (word_type) queryParams.append('word_type', word_type);
    if (limit) queryParams.append('limit', limit);
    if (page) queryParams.append('page', page);

    try {
        const res = await fetch(`${API_URL}/content/vocab?${queryParams.toString()}`, {
            cache: 'no-store',
        });
        return handleResponse(res, 'getVocabList');
    } catch (error) {
        if (error.status) throw error;
        return handleNetworkError('getVocabList', error, { items: [], total: 0, page: 1, pages: 1 });
    }
}

export async function getVocabDetail(id) {
    try {
        const res = await fetch(`${API_URL}/content/vocab/${id}`, {
            cache: 'no-store',
        });
        return handleResponse(res, 'getVocabDetail');
    } catch (error) {
        if (error.status) throw error;
        return handleNetworkError('getVocabDetail', error, null);
    }
}

export async function getBlogList() {
    try {
        const res = await fetch(`${API_URL}/content/blog`, {
            cache: 'no-store',
        });
        return handleResponse(res, 'getBlogList');
    } catch (error) {
        if (error.status) throw error;
        return handleNetworkError('getBlogList', error, []);
    }
}

export async function getBlogDetailBySlug(slug) {
    try {
        const res = await fetch(`${API_URL}/content/blog/${slug}`, {
            cache: 'no-store',
        });
        return handleResponse(res, 'getBlogDetailBySlug');
    } catch (error) {
        if (error.status) throw error;
        return handleNetworkError('getBlogDetailBySlug', error, null);
    }
}

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
        return handleNetworkError('suggestContent', error);
    }
}

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
        return handleNetworkError('exportPracticeData', error);
    }
}

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
        return handleNetworkError('importPracticeData', error);
    }
}
