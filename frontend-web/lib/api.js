const base_url = process.env.NEXT_PUBLIC_API_URL || 'https://imronm.pythonanywhere.com/api';
export const API_URL = base_url.endsWith('/') ? base_url.slice(0, -1) : base_url;
import Cookies from 'js-cookie';
import { fetchWithCache } from '@/lib/cache-store';
import { dbGetAll } from '@/lib/offline-db';

/**
 * Try to serve from IndexedDB. Returns null if store is empty.
 * Applies filters and pagination client-side.
 */
async function serveFromDb(storeName, { level, search, chapter, word_type, radical, page = 1, limit = 50 } = {}) {
    try {
        let items = await dbGetAll(storeName);
        if (!items || items.length === 0) return null;
        if (level) items = items.filter(i => String(i.jlpt_level) === String(level));
        if (chapter) items = items.filter(i => String(i.chapter) === String(chapter));
        if (word_type) items = items.filter(i => i.word_type === word_type);
        if (radical) items = items.filter(i => i.radical === radical);
        if (search) {
            const q = search.toLowerCase();
            items = items.filter(i =>
                i.character?.toLowerCase().includes(q) ||
                i.word?.toLowerCase().includes(q) ||
                i.reading?.toLowerCase().includes(q) ||
                i.meaning?.toLowerCase().includes(q) ||
                i.title?.toLowerCase().includes(q) ||
                i.structure?.toLowerCase().includes(q)
            );
        }
        const total = items.length;
        const offset = (page - 1) * limit;
        return { items: items.slice(offset, offset + Number(limit)), total, page, pages: Math.ceil(total / Number(limit)) || 1 };
    } catch (e) {
        console.warn('[offline-db] serveFromDb failed:', e.message);
        return null;
    }
}

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
    // Hapus pengecekan window — biarkan throw di semua environment
    if (defaultValue !== null) {
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

    const cacheKey = `kanji-list-${queryParams.toString()}`;
    try {
        return await fetchWithCache(cacheKey, async () => {
            const res = await fetch(`${API_URL}/content/kanji?${queryParams.toString()}`);
            return handleResponse(res, 'getKanjiList');
        });
    } catch (error) {
        if (error.status) throw error; // real HTTP error, don't use offline data
        // Network failed — serve from IndexedDB
        const offline = await serveFromDb('kanji', { level, search, radical, page, limit });
        if (offline) return offline;
        return handleNetworkError('getKanjiList', error, { items: [], total: 0, page: 1, pages: 1 });
    }
}

export async function getKanjiDetail(id) {
    try {
        return await fetchWithCache(`kanji-detail-${id}`, async () => {
            const res = await fetch(`${API_URL}/content/kanji/${id}`);
            return handleResponse(res, 'getKanjiDetail');
        });
    } catch (error) {
        if (error.status) throw error;
        // Fallback: search IndexedDB for this specific kanji by id
        try {
            const all = await dbGetAll('kanji');
            const found = all.find(k => k.id === id);
            if (found) return found;
        } catch {}
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

    const cacheKey = `grammar-list-${queryParams.toString()}`;
    try {
        return await fetchWithCache(cacheKey, async () => {
            const res = await fetch(`${API_URL}/content/grammar?${queryParams.toString()}`);
            const data = await handleResponse(res, 'getGrammarList');
            if (Array.isArray(data)) return { items: data, total: data.length, pages: 1, page: 1 };
            return data;
        });
    } catch (error) {
        if (error.status) throw error;
        const offline = await serveFromDb('grammar', { level, search, chapter, page, limit });
        if (offline) return offline;
        return handleNetworkError('getGrammarList', error, { items: [], total: 0, page: 1, pages: 1 });
    }
}

export async function getGrammarDetail(id) {
    try {
        return await fetchWithCache(`grammar-detail-${id}`, async () => {
            const res = await fetch(`${API_URL}/content/grammar/${id}`);
            return handleResponse(res, 'getGrammarDetail');
        });
    } catch (error) {
        if (error.status) throw error;
        try {
            const all = await dbGetAll('grammar');
            const found = all.find(g => g.id === id);
            if (found) return found;
        } catch {}
        return handleNetworkError('getGrammarDetail', error, null);
    }
}

export async function getPracticeQuestions({ limit = 10, level = null, type = 'kanji' } = {}) {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit);
    if (level) params.append('level', level);
    if (type) params.append('type', type);

    const cacheKey = `practice-questions-${params.toString()}`;
    try {
        return await fetchWithCache(cacheKey, async () => {
            const res = await fetch(`${API_URL}/learning/practice/generate?${params.toString()}`);
            return handleResponse(res, 'getPracticeQuestions');
        }, 24 * 60 * 60 * 1000); // 1 day TTL for practice questions
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

    const cacheKey = `vocab-list-${queryParams.toString()}`;
    try {
        return await fetchWithCache(cacheKey, async () => {
            const res = await fetch(`${API_URL}/content/vocab?${queryParams.toString()}`);
            const data = await handleResponse(res, 'getVocabList');
            if (Array.isArray(data)) return { items: data, total: data.length, pages: 1, page: 1 };
            return data;
        });
    } catch (error) {
        if (error.status) throw error;
        const offline = await serveFromDb('vocab', { level, search, word_type, page, limit });
        if (offline) return offline;
        return handleNetworkError('getVocabList', error, { items: [], total: 0, page: 1, pages: 1 });
    }
}

export async function getVocabDetail(id) {
    try {
        return await fetchWithCache(`vocab-detail-${id}`, async () => {
            const res = await fetch(`${API_URL}/content/vocab/${id}`);
            return handleResponse(res, 'getVocabDetail');
        });
    } catch (error) {
        if (error.status) throw error;
        try {
            const all = await dbGetAll('vocab');
            const found = all.find(v => v.id === id);
            if (found) return found;
        } catch {}
        return handleNetworkError('getVocabDetail', error, null);
    }
}

export async function getBlogList() {
    try {
        return await fetchWithCache('blog-list', async () => {
            const res = await fetch(`${API_URL}/content/blog`);
            return handleResponse(res, 'getBlogList');
        });
    } catch (error) {
        if (error.status) throw error;
        return handleNetworkError('getBlogList', error, []);
    }
}

export async function getBlogDetailBySlug(slug) {
    try {
        return await fetchWithCache(`blog-detail-${slug}`, async () => {
            const res = await fetch(`${API_URL}/content/blog/${slug}`);
            return handleResponse(res, 'getBlogDetailBySlug');
        });
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
        const res = await fetch(`${API_URL}/learning/practice/export`, { headers });
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
