const base_url = process.env.NEXT_PUBLIC_API_URL || 'https://imronm.pythonanywhere.com/api';
export const API_URL = base_url.endsWith('/') ? base_url.slice(0, -1) : base_url;
import Cookies from 'js-cookie';
import { fetchWithCache } from '@/lib/cache-store';
import { dbGetAll, dbHasData, dbGet } from '@/lib/offline-db';

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
    
    // 1. Jika Online: Ambil dari API (Selalu Prioritas Utama)
    if (typeof window === 'undefined' || navigator.onLine) {
        console.info(`[jbook-api] Online: Mencoba mengambil Kanji dari API...`);
        try {
            const data = await fetchWithCache(cacheKey, async () => {
                const res = await fetch(`${API_URL}/content/kanji?${queryParams.toString()}`);
                return handleResponse(res, 'getKanjiList');
            });
            console.info(`[jbook-api] Berhasil mengambil Kanji dari API/Cache Browser.`);
            return data;
        } catch (error) {
            console.warn(`[jbook-api] API Gagal, mencoba fallback ke Database Lokal...`, error.message);
            if (typeof window !== 'undefined') {
                const offline = await serveFromDb('kanji', { level, search, radical, page, limit });
                if (offline && offline.items.length > 0) {
                    console.info(`[jbook-api] Berhasil memuat data Kanji cadangan dari Database Lokal.`);
                    return offline;
                }
            }
            throw error;
        }
    }

    // 2. Jika Benar-benar Offline: Ambil dari Database Lokal
    console.info(`[jbook-api] Offline: Mengambil Kanji dari Database Lokal...`);
    if (typeof window !== 'undefined') {
        const offline = await serveFromDb('kanji', { level, search, radical, page, limit });
        if (offline && offline.items.length > 0) {
            console.info(`[jbook-api] Berhasil memuat data Kanji dari Database Lokal.`);
            return offline;
        }
    }
    
    console.error(`[jbook-api] Tidak ada koneksi internet dan data lokal kosong (Belum didownload).`);
    return handleNetworkError('getKanjiList', new Error('Offline'), { items: [], total: 0, page: 1, pages: 1 });
}

export async function getKanjiDetail(id) {
    // 1. Jika Online: Ambil dari API
    if (typeof window === 'undefined' || navigator.onLine) {
        console.info(`[jbook-api] Online: Mengambil Kanji Detail (${id}) dari API...`);
        try {
            return await fetchWithCache(`kanji-detail-${id}`, async () => {
                const res = await fetch(`${API_URL}/content/kanji/${id}`);
                return handleResponse(res, 'getKanjiDetail');
            });
        } catch (error) {
            console.warn(`[jbook-api] API Gagal, mencoba fallback ke Database Lokal.`);
            if (typeof window !== 'undefined') {
                try {
                    const local = await dbGet('kanji', id);
                    if (local) return local;
                } catch {}
            }
            throw error;
        }
    }

    // 2. Jika Offline: Ambil dari Database Lokal
    console.info(`[jbook-api] Offline: Mengambil Kanji Detail (${id}) dari Database Lokal...`);
    if (typeof window !== 'undefined') {
        try {
            const local = await dbGet('kanji', id);
            if (local) {
                console.info(`[jbook-api] Berhasil memuat Kanji Detail dari Database Lokal.`);
                return local;
            }
        } catch {}
    }

    return handleNetworkError('getKanjiDetail', new Error('Offline'), null);
}

export async function getGrammarList({ level, search, chapter, limit = 50, page = 1 } = {}) {
    const queryParams = new URLSearchParams();
    if (level) queryParams.append('level', level);
    if (search) queryParams.append('search', search);
    if (chapter) queryParams.append('chapter', chapter);
    if (limit) queryParams.append('limit', limit);
    if (page) queryParams.append('page', page);

    // Prioritas Baru: API Pertama (Online) > Database Lokal (Offline/Gagal)
    const cacheKey = `grammar-list-${queryParams.toString()}`;
    
    // 1. Jika Online: Ambil dari API
    if (typeof window === 'undefined' || navigator.onLine) {
        try {
            return await fetchWithCache(cacheKey, async () => {
                const res = await fetch(`${API_URL}/content/grammar?${queryParams.toString()}`);
                const data = await handleResponse(res, 'getGrammarList');
                if (Array.isArray(data)) return { items: data, total: data.length, pages: 1, page: 1 };
                return data;
            });
        } catch (error) {
            // Jika API Gagal (misal: timeout), coba fallback ke Offline
            if (typeof window !== 'undefined') {
                const offline = await serveFromDb('grammar', { level, search, chapter, page, limit });
                if (offline && offline.items.length > 0) return offline;
            }
            throw error;
        }
    }

    // 2. Jika Benar-benar Offline: Ambil dari Database Lokal
    if (typeof window !== 'undefined') {
        const offline = await serveFromDb('grammar', { level, search, chapter, page, limit });
        if (offline && offline.items.length > 0) return offline;
    }
    
    return handleNetworkError('getGrammarList', new Error('Offline'), { items: [], total: 0, page: 1, pages: 1 });
}

export async function getGrammarDetail(id) {
    // 1. Jika Online: Ambil dari API
    if (typeof window === 'undefined' || navigator.onLine) {
        try {
            return await fetchWithCache(`grammar-detail-${id}`, async () => {
                const res = await fetch(`${API_URL}/content/grammar/${id}`);
                return handleResponse(res, 'getGrammarDetail');
            });
        } catch (error) {
            if (typeof window !== 'undefined') {
                try {
                    const local = await dbGet('grammar', id);
                    if (local) return local;
                } catch {}
            }
            throw error;
        }
    }

    // 2. Jika Offline: Ambil dari Database Lokal
    if (typeof window !== 'undefined') {
        try {
            const local = await dbGet('grammar', id);
            if (local) return local;
        } catch {}
    }

    return handleNetworkError('getGrammarDetail', new Error('Offline'), null);
}

export async function getPracticeQuestions({ limit = 10, level = null, type = 'kanji' } = {}) {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit);
    if (level) params.append('level', level);
    if (type) params.append('type', type);

    const cacheKey = `practice-questions-${params.toString()}`;

    // 1. Jika Online: Ambil dari API (Selalu Prioritas Utama)
    if (typeof window === 'undefined' || navigator.onLine) {
        console.info(`[jbook-api] Online: Membuat soal Latihan dari API...`);
        try {
            return await fetchWithCache(cacheKey, async () => {
                const res = await fetch(`${API_URL}/learning/practice/generate?${params.toString()}`);
                return handleResponse(res, 'getPracticeQuestions');
            }, 24 * 60 * 60 * 1000); 
        } catch (error) {
            console.warn(`[jbook-api] API Gagal, mencoba membuat soal Latihan secara lokal...`);
            if (typeof window !== 'undefined') {
                const questions = await generateOfflineQuestions({ limit, level, type });
                if (questions && questions.length > 0) return questions;
            }
            throw error;
        }
    }

    // 2. Jika Offline: Buat soal Latihan secara Lokal (Simulator)
    console.info(`[jbook-api] Offline: Membuat soal Latihan secara lokal (Database Download)...`);
    if (typeof window !== 'undefined') {
        const questions = await generateOfflineQuestions({ limit, level, type });
        if (questions && questions.length > 0) {
            console.info(`[jbook-api] Berhasil membuat ${questions.length} soal latihan offline.`);
            return questions;
        }
    }

    console.error(`[jbook-api] Tidak bisa membuat soal latihan offline (Data belum didownload).`);
    return handleNetworkError('getPracticeQuestions', new Error('Offline'), []);
}

/**
 * Simulator generator soal latihan offline
 */
async function generateOfflineQuestions({ limit, level, type }) {
    try {
        const storeName = type === 'kanji' ? 'kanji' : (type === 'vocab' || type === 'kotoba' ? 'vocab' : 'grammar');
        let pool = await dbGetAll(storeName);
        if (!pool || pool.length < 4) return [];

        if (level) {
            pool = pool.filter(i => String(i.jlpt_level) === String(level));
        }
        if (pool.length < 4) return [];

        // Shuffle pool
        const shuffled = [...pool].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, Math.min(limit, shuffled.length));

        return selected.map(item => {
            const distractors = pool.filter(p => p.id !== item.id).sort(() => 0.5 - Math.random()).slice(0, 3);
            let options = [];

            if (storeName === 'kanji') {
                options = [item.meaning, ...distractors.map(d => d.meaning)];
            } else if (storeName === 'vocab') {
                options = [item.meaning, ...distractors.map(d => d.meaning)];
            } else {
                options = [item.explanation, ...distractors.map(d => d.explanation)];
            }

            const formattedOptions = options.map((opt, idx) => ({
                text: opt,
                is_correct: idx === 0
            })).sort(() => 0.5 - Math.random());

            return {
                id: item.id,
                character: item.character || item.word || item.title,
                type: storeName,
                options: formattedOptions,
                reading: item.reading || (item.onyomi ? item.onyomi.join(', ') : ''),
                meaning: item.meaning || item.explanation
            };
        });
    } catch (err) {
        console.error("Failed to generate offline questions", err);
        return [];
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

    // Prioritas Baru: API Pertama (Online) > Database Lokal (Offline/Gagal)
    const cacheKey = `vocab-list-${queryParams.toString()}`;
    
    // 1. Jika Online: Ambil dari API
    if (typeof window === 'undefined' || navigator.onLine) {
        try {
            return await fetchWithCache(cacheKey, async () => {
                const res = await fetch(`${API_URL}/content/vocab?${queryParams.toString()}`);
                const data = await handleResponse(res, 'getVocabList');
                if (Array.isArray(data)) return { items: data, total: data.length, pages: 1, page: 1 };
                return data;
            });
        } catch (error) {
            // Jika API Gagal (misal: timeout), coba fallback ke Offline
            if (typeof window !== 'undefined') {
                const offline = await serveFromDb('vocab', { level, search, word_type, page, limit });
                if (offline && offline.items.length > 0) return offline;
            }
            throw error;
        }
    }

    // 2. Jika Benar-benar Offline: Ambil dari Database Lokal
    if (typeof window !== 'undefined') {
        const offline = await serveFromDb('vocab', { level, search, word_type, page, limit });
        if (offline && offline.items.length > 0) return offline;
    }
    
    return handleNetworkError('getVocabList', new Error('Offline'), { items: [], total: 0, page: 1, pages: 1 });
}

export async function getVocabDetail(id) {
    // 1. Jika Online: Ambil dari API
    if (typeof window === 'undefined' || navigator.onLine) {
        try {
            return await fetchWithCache(`vocab-detail-${id}`, async () => {
                const res = await fetch(`${API_URL}/content/vocab/${id}`);
                return handleResponse(res, 'getVocabDetail');
            });
        } catch (error) {
            if (typeof window !== 'undefined') {
                try {
                    const local = await dbGet('vocab', id);
                    if (local) return local;
                } catch {}
            }
            throw error;
        }
    }

    // 2. Jika Offline: Ambil dari Database Lokal
    if (typeof window !== 'undefined') {
        try {
            const local = await dbGet('vocab', id);
            if (local) return local;
        } catch {}
    }

    return handleNetworkError('getVocabDetail', new Error('Offline'), null);
}

export async function getBlogList() {
    // Blog harus online — bypass cache-store jika offline, atau gunakan TTL sangat pendek
    try {
        const res = await fetch(`${API_URL}/content/blog`, { cache: 'no-store' });
        return handleResponse(res, 'getBlogList');
    } catch (error) {
        return handleNetworkError('getBlogList', error, []);
    }
}

export async function getBlogDetailBySlug(slug) {
    // Blog harus online
    try {
        const res = await fetch(`${API_URL}/content/blog/${slug}`, { cache: 'no-store' });
        return handleResponse(res, 'getBlogDetailBySlug');
    } catch (error) {
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
