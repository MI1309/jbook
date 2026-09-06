const base_url = process.env.NEXT_PUBLIC_API_URL || 'https://imronm.pythonanywhere.com/api';
export const API_URL = base_url.endsWith('/') ? base_url.slice(0, -1) : base_url;
import Cookies from 'js-cookie';
import { fetchWithCache } from '@/lib/cache-store';
import { dbGetAll, dbHasData, dbGet } from '@/lib/offline-db';
import { hasKanji, extractKanji, getScriptTypes } from '@/lib/utils';
import { 
    hiraganaGojuon, hiraganaDakuon, hiraganaYoon, 
    katakanaGojuon, katakanaDakuon, katakanaYoon 
} from '@/data/kana';

/**
 * Try to serve from IndexedDB. Returns null if store is empty.
 * Applies filters and pagination client-side.
 */
async function serveFromDb(storeName, { level, search, chapter, word_type, radical, page = 1, limit = 50 } = {}) {
    try {
        let items = await dbGetAll(storeName);
        if (!items || items.length === 0) return null;
        if (level) {
            const levelValues = String(level).split(',').map(l => l.trim()).filter(Boolean);
            if (levelValues.length) {
                items = items.filter(i => levelValues.includes(String(i.jlpt_level)));
            }
        }
        if (chapter) items = items.filter(i => String(i.chapter) === String(chapter));
        if (word_type) items = items.filter(i => i.word_type === word_type);
        if (radical) items = items.filter(i => i.radical === radical);

        if (search) {
            const q = search.toLowerCase();
            
            // 1. Basic Filtering
            items = items.filter(i => {
                const charMatch = i.character?.toLowerCase().includes(q);
                const wordMatch = i.word?.toLowerCase().includes(q);
                const readMatch = i.reading?.toLowerCase().includes(q);
                const meanMatch = i.meaning?.toLowerCase().includes(q);
                const titleMatch = i.title?.toLowerCase().includes(q);
                const structMatch = i.structure?.toLowerCase().includes(q);

                // Attach match info for UI highlighting
                if (charMatch || wordMatch) i._matchTarget = 'word';
                else if (readMatch) i._matchTarget = 'reading';
                else if (meanMatch || titleMatch || structMatch) i._matchTarget = 'meaning';
                
                return charMatch || wordMatch || readMatch || meanMatch || titleMatch || structMatch;
            });

            // 2. Smart Search for Kanji: Search in Vocab meanings too
            // Always check Vocab related to ensures we find Kanjis based on words (e.g. "hari" -> "日")
            if (storeName === 'kanji') {
                const vocabs = await dbGetAll('vocab');
                const matchedVocab = vocabs.filter(v => v.meaning?.toLowerCase().includes(q));
                
                if (matchedVocab.length > 0) {
                    const allKanjis = await dbGetAll('kanji');
                    const relatedKanjiChars = new Set();
                    matchedVocab.forEach(v => {
                        extractKanji(v.word).forEach(k => relatedKanjiChars.add(k));
                    });

                    relatedKanjiChars.forEach(char => {
                        if (!items.find(it => it.character === char)) {
                            const found = allKanjis.find(k => k.character === char);
                            if (found) {
                                // Find which vocab matched to show as context
                                const contextVocab = matchedVocab.find(v => v.word.includes(char));
                                items.push({
                                    ...found,
                                    _isSmartMatch: true,
                                    _smartContext: contextVocab ? `${contextVocab.meaning} (${contextVocab.word})` : q
                                });
                            }
                        }
                    });
                }
            }
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
        const rawDetail = data.detail || data.message || data;
        detail = typeof rawDetail === 'object' ? JSON.stringify(rawDetail) : String(rawDetail);
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

/**
 * Finds an ID in IndexedDB by a specific field value.
 * Used for cross-category navigation (e.g., clicking a kanji in a word).
 */
export async function findIdByString(storeName, value) {
    if (typeof window === 'undefined') return null;
    try {
        const items = await dbGetAll(storeName);
        if (!items) return null;
        
        // Try matching character (for Kanji) or word (for Kotoba)
        const found = items.find(i => 
            i.character === value || 
            i.word === value || 
            i.title === value
        );
        return found ? found.id : null;
    } catch (e) {
        console.warn(`[offline-db] findIdByString failed for ${storeName}:`, e.message);
        return null;
    }
}

/**
 * Resolves the actual database ID for a content item by its character/word/title.
 *
 * Priority:
 *   1. Online  → search the API (always returns the canonical server ID)
 *   2. Offline → lookup from IndexedDB (requires prior offline download)
 *
 * @param {'kanji'|'vocab'|'grammar'} type
 * @param {string} character  - the character, word, or grammar title
 * @returns {Promise<number|string|null>}
 */
export async function resolveContentId(type, character) {
    if (!character) return null;

    // --- Online: Search the API ---
    if (typeof navigator !== 'undefined' && navigator.onLine) {
        try {
            const token = Cookies.get('access_token');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            let url = '';
            if (type === 'kanji')   url = `${API_URL}/content/kanji?search=${encodeURIComponent(character)}&limit=1`;
            if (type === 'vocab')   url = `${API_URL}/content/vocab?search=${encodeURIComponent(character)}&limit=1`;
            if (type === 'grammar') url = `${API_URL}/content/grammar?search=${encodeURIComponent(character)}&limit=1`;
            if (!url) return null;

            const res = await fetch(url, { headers });
            if (res.ok) {
                const data = await res.json();
                const items = Array.isArray(data) ? data : (data.items || data.results || []);
                if (items.length > 0) {
                    return items[0].id ?? null;
                }
            }
        } catch (e) {
            console.warn('[resolveContentId] API lookup failed, falling back to offline:', e.message);
        }
    }

    // --- Offline fallback: search IndexedDB ---
    const storeMap = { kanji: 'kanji', vocab: 'vocab', grammar: 'grammar' };
    return findIdByString(storeMap[type] || type, character);
}

export async function getKanjiList({ level, search, radical, limit = 50, page = 1 } = {}) {
    const queryParams = new URLSearchParams();
    if (level) queryParams.append('level', level);
    if (search) queryParams.append('search', search);
    if (radical) queryParams.append('radical', radical);
    if (limit) queryParams.append('limit', limit);
    if (page) queryParams.append('page', page);

    const cacheKey = `kanji-list-${queryParams.toString()}`;
    
    // Check local smart matches first (Parallel or Fallback)
    let localSmartResults = null;
    if (typeof window !== 'undefined') {
        localSmartResults = await serveFromDb('kanji', { level, search, radical, page: 1, limit: 200 });
    }

    // 1. Jika Online: Ambil dari API (Selalu Prioritas Utama)
    if (typeof window === 'undefined' || (typeof navigator !== 'undefined' && navigator.onLine)) {
        console.info(`[jbook-api] Online: Mencoba mengambil Kanji dari API...`);
        try {
            const data = await fetchWithCache(cacheKey, async () => {
                const res = await fetch(`${API_URL}/content/kanji?${queryParams.toString()}`, { cache: 'no-store' });
                return handleResponse(res, 'getKanjiList');
            });

            const responseData = { ...data };

            // Merge with local results if search is active
            if (search && localSmartResults) {
                const apiItems = [...(responseData.items || [])];
                // Merge all local results that aren't in the API response
                const localItems = localSmartResults.items || [];
                
                localItems.forEach(si => {
                    if (!apiItems.find(ai => ai.character === si.character)) {
                        apiItems.push(si);
                    }
                });
                
                responseData.items = apiItems;
                responseData.total = apiItems.length;
            }

            return responseData;
        } catch (error) {
            console.warn(`[jbook-api] API Gagal, mencoba fallback ke Database Lokal...`, error.message);
            if (localSmartResults) return localSmartResults;
            throw error;
        }
    }

    // 2. Jika Benar-benar Offline: Ambil dari Database Lokal
    console.info(`[jbook-api] Offline: Mengambil Kanji dari Database Lokal...`);
    return localSmartResults || { items: [], total: 0, page, pages: 1 };
}

export async function getKanjiDetail(id) {
    // 1. Jika Online: Ambil dari API
    if (typeof window === 'undefined' || (typeof navigator !== 'undefined' && navigator.onLine)) {
        console.info(`[jbook-api] Online: Mengambil Kanji Detail (${id}) dari API...`);
        try {
            const url = `${API_URL}/content/kanji/${id}`;
            console.debug(`[jbook-api] Fetching Kanji Detail: ${url}`);
            return await fetchWithCache(`kanji-detail-${id}`, async () => {
                const res = await fetch(url);
                if (res.status === 404) {
                    console.warn(`[jbook-api] Kanji Detail NOT FOUND (404): ${url}`);
                    return null;
                }
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
            // Return null alih-alih melempar error agar Server Component tidak crash
            return null;
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
    if (typeof window === 'undefined' || (typeof navigator !== 'undefined' && navigator.onLine)) {
        try {
            return await fetchWithCache(cacheKey, async () => {
                const res = await fetch(`${API_URL}/content/grammar?${queryParams.toString()}`, { cache: 'no-store' });
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
    if (typeof window === 'undefined' || (typeof navigator !== 'undefined' && navigator.onLine)) {
        try {
            const url = `${API_URL}/content/grammar/${id}`;
            console.debug(`[jbook-api] Fetching Grammar Detail: ${url}`);
            return await fetchWithCache(`grammar-detail-${id}`, async () => {
                const res = await fetch(url);
                if (res.status === 404) {
                    console.warn(`[jbook-api] Grammar Detail NOT FOUND (404): ${url}`);
                    return null;
                }
                return handleResponse(res, 'getGrammarDetail');
            });
        } catch (error) {
            if (typeof window !== 'undefined') {
                try {
                    const local = await dbGet('grammar', id);
                    if (local) return local;
                } catch {}
            }
            return null;
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

export async function getMinnaQuestions({ limit = 10, book = null, chapter = null, type = 'choice' } = {}) {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit);
    if (book) params.append('book', book);
    if (chapter) params.append('chapter', chapter);
    if (type) params.append('type', type);

    const cacheKey = `minna-questions-${params.toString()}`;

    if (typeof window === 'undefined' || (typeof navigator !== 'undefined' && navigator.onLine)) {
        try {
            return await fetchWithCache(cacheKey, async () => {
                const res = await fetch(`${API_URL}/learning/practice/minna/generate?${params.toString()}`);
                return handleResponse(res, 'getMinnaQuestions');
            }, 60 * 1000); // 1 minute cache for flexibility
        } catch (error) {
            console.error('[jbook-api] getMinnaQuestions API failed:', error.message);
            throw error;
        }
    }
    throw new Error('Offline mode tidak didukung untuk latihan Minna Book saat ini.');
}

export async function getPracticeQuestions({ limit = 10, level = null, type = 'kanji' } = {}) {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit);
    if (level) params.append('level', level);
    if (type) params.append('type', type);

    const cacheKey = `practice-questions-${params.toString()}`;

    // 1. Jika Online: Ambil dari API (Selalu Prioritas Utama)
    if (typeof window === 'undefined' || (typeof navigator !== 'undefined' && navigator.onLine)) {
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
        const requestedTypes = type.split(',').map(t => t.trim());
        let fullPool = [];

        // Fetch pool for each type
        for (const t of requestedTypes) {
            if (t === 'kana') {
                const kanaPool = [
                    ...hiraganaGojuon, ...hiraganaDakuon, ...hiraganaYoon,
                    ...katakanaGojuon, ...katakanaDakuon, ...katakanaYoon
                ].filter(k => k.kana && k.romaji);
                
                kanaPool.forEach(item => {
                    fullPool.push({ item, type: 'kana', originalPool: kanaPool });
                });
                continue;
            }

            const storeName = t === 'kanji' ? 'kanji' : (t === 'vocab' || t === 'kotoba' ? 'vocab' : 'grammar');
            let pool = await dbGetAll(storeName);
            
            if (level) {
                // Support multi-level filtering
                const levels = String(level).split(',').map(l => l.trim());
                pool = pool.filter(i => levels.includes(String(i.jlpt_level)));
            }
            
            // Tag items with their type for later processing
            pool.forEach(item => {
                fullPool.push({ item, type: storeName, originalPool: pool });
            });
        }

        if (!fullPool || fullPool.length < 4) return [];

        // Shuffle pool
        const shuffled = [...fullPool].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, Math.min(limit, shuffled.length));

        return selected.map(({ item, type, originalPool }) => {
            // Find distractors from the same category pool
            const distractors = originalPool
                .filter(p => p.id !== item.id)
                .sort(() => 0.5 - Math.random())
                .slice(0, 3);
                
            let options = [];
            if (type === 'kana') {
                options = [item.romaji, ...distractors.map(d => d.romaji)];
            } else if (type === 'kanji') {
                options = [item.meaning, ...distractors.map(d => d.meaning)];
            } else if (type === 'vocab') {
                options = [item.meaning, ...distractors.map(d => d.meaning)];
            } else {
                options = [item.explanation, ...distractors.map(d => d.explanation)];
            }

            const formattedOptions = options.map((opt, idx) => ({
                text: opt,
                is_correct: idx === 0
            })).sort(() => 0.5 - Math.random());

            return {
                id: item.id || `kana-${item.kana}`,
                character: item.kana || item.character || item.word || item.title,
                type: type, // Correctly use the category's type
                options: formattedOptions,
                reading: type === 'kanji' && (item.onyomi || item.kunyomi)
                    ? `On: ${item.onyomi?.length ? item.onyomi.join(', ') : '-'} | Kun: ${item.kunyomi?.length ? item.kunyomi.join(', ') : '-'}`
                    : (item.romaji || item.reading || (item.onyomi ? item.onyomi.join(', ') : '')),
                meaning: item.romaji || item.meaning || item.explanation,
                word_type: item.word_type
            };
        });
    } catch (err) {
        console.error("Failed to generate offline questions", err);
        return [];
    }
}


// getUserAnalytics — tambah fallback kakitori_stats
export async function getUserAnalytics() {
    const token = Cookies.get('access_token');
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const cacheKey = 'user-analytics';
    const defaultKakitori = {
        total_attempts: 0, total_questions: 0,
        correct: 0, accuracy: 0, level_breakdown: []
    };

    try {
        return await fetchWithCache(cacheKey, async () => {
            const res = await fetch(`${API_URL}/learning/practice/analytics`, { headers });
            if (!res.ok) return { total_attempts: 0, accuracy: 0, wrong_stats: [], 
                                   level_stats: [], kakitori_stats: defaultKakitori };
            const data = await res.json();
            // Fallback jika server belum return kakitori_stats
            if (!data.kakitori_stats) data.kakitori_stats = defaultKakitori;
            return data;
        }, 24 * 60 * 60 * 1000);
    } catch (error) {
        return handleNetworkError('getUserAnalytics', error, {
            total_attempts: 0, accuracy: 0, wrong_stats: [],
            level_stats: [], kakitori_stats: defaultKakitori
        });
    }
}

// submitPracticeResults — invalidate cache setelah submit
export async function submitPracticeResults(results) {
    const token = Cookies.get('access_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
        const res = await fetch(`${API_URL}/learning/practice/submit`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ results }),
        });
        const data = await handleResponse(res, 'submitPracticeResults');
        
        // ← PENTING: invalidate cache analytics agar dashboard langsung update
        // (asumsi fetchWithCache punya fungsi invalidate, atau hapus manual)
        try {
            const { cacheStore } = await import('./cache-store');
            cacheStore.delete('user-analytics');
        } catch {}
        
        return data;
    } catch (error) {
        if (error.status) throw error;
        return handleNetworkError('submitPracticeResults', error);
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
    
    // Check local smart matches first (Parallel or Fallback)
    let localSmartResults = null;
    if (typeof window !== 'undefined') {
        localSmartResults = await serveFromDb('vocab', { level, search, word_type, page: 1, limit: 200 });
    }
    
    // 1. Jika Online: Ambil dari API
    if (typeof window === 'undefined' || (typeof navigator !== 'undefined' && navigator.onLine)) {
        try {
            const data = await fetchWithCache(cacheKey, async () => {
                const res = await fetch(`${API_URL}/content/vocab?${queryParams.toString()}`, { cache: 'no-store' });
                const resData = await handleResponse(res, 'getVocabList');
                if (Array.isArray(resData)) return { items: resData, total: resData.length, pages: 1, page: 1 };
                return resData;
            });

            const responseData = { ...data };

            // Merge with local results if search is active (for _matchTarget highlighting)
            if (search && localSmartResults) {
                const apiItems = [...(responseData.items || [])];
                const localItems = localSmartResults.items || [];
                
                // First, enrich API items with local _matchTarget if they match
                apiItems.forEach((ai, index) => {
                    const li = localItems.find(item => item.id === ai.id || item.word === ai.word);
                    if (li && li._matchTarget) {
                        apiItems[index] = { ...ai, _matchTarget: li._matchTarget };
                    }
                });

                // Then, merge local items that aren't in API response
                localItems.forEach(si => {
                    if (!apiItems.find(ai => ai.id === si.id || ai.word === si.word)) {
                        apiItems.push(si);
                    }
                });
                
                responseData.items = apiItems;
                responseData.total = apiItems.length;
            }

            return responseData;
        } catch (error) {
            // Jika API Gagal (misal: timeout), coba fallback ke Offline
            if (typeof window !== 'undefined') {
                if (localSmartResults) return localSmartResults;
                const offline = await serveFromDb('vocab', { level, search, word_type, page, limit });
                if (offline && offline.items.length > 0) return offline;
            }
            throw error;
        }
    }

    // 2. Jika Benar-benar Offline: Ambil dari Database Lokal
    if (typeof window !== 'undefined') {
        if (localSmartResults) return localSmartResults;
        const offline = await serveFromDb('vocab', { level, search, word_type, page, limit });
        if (offline && offline.items.length > 0) return offline;
    }
    
    return handleNetworkError('getVocabList', new Error('Offline'), { items: [], total: 0, page: 1, pages: 1 });
}

export async function getVocabDetail(id) {
    // 1. Jika Online: Ambil dari API
    if (typeof window === 'undefined' || (typeof navigator !== 'undefined' && navigator.onLine)) {
        try {
            const url = `${API_URL}/content/vocab/${id}`;
            console.debug(`[jbook-api] Fetching Vocab Detail: ${url}`);
            return await fetchWithCache(`vocab-detail-${id}`, async () => {
                const res = await fetch(url);
                if (res.status === 404) {
                    console.warn(`[jbook-api] Vocab Detail NOT FOUND (404): ${url}`);
                    return null;
                }
                return handleResponse(res, 'getVocabDetail');
            });
        } catch (error) {
            if (typeof window !== 'undefined') {
                try {
                    const local = await dbGet('vocab', id);
                    if (local) return local;
                } catch {}
            }
            return null;
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

export async function getBlogList(options = {}) {
    // Blog dengan cache ISR revalidate (default 300s / 5m)
    try {
        const fetchOptions = {
            next: { revalidate: 300 },
            ...options
        };
        const res = await fetch(`${API_URL}/content/blog`, fetchOptions);
        return handleResponse(res, 'getBlogList');
    } catch (error) {
        return handleNetworkError('getBlogList', error, []);
    }
}

export async function getBlogDetailBySlug(slug, options = {}) {
    // Blog detail dengan cache ISR revalidate
    try {
        const fetchOptions = {
            next: { revalidate: 300 },
            ...options
        };
        const res = await fetch(`${API_URL}/content/blog/${slug}`, fetchOptions);
        return handleResponse(res, 'getBlogDetailBySlug');
    } catch (error) {
        return handleNetworkError('getBlogDetailBySlug', error, null);
    }
}

export async function getCrossword() {
    try {
        const res = await fetch(`${API_URL}/learning/tts/generate`, { cache: 'no-store' });
        return handleResponse(res, 'getCrossword');
    } catch (error) {
        return handleNetworkError('getCrossword', error);
    }
}

/**
 * ─── Doukai / Dokkai (Reading Comprehension) API ────────────────────────────
 */

/**
 * Mendapatkan daftar teks cerita Doukai
 */
export async function getDoukaiPassages({ book, chapter } = {}) {
    const queryParams = new URLSearchParams();
    if (book) queryParams.append('book', book);
    if (chapter) queryParams.append('chapter', chapter);

    try {
        const res = await fetch(`${API_URL}/learning/doukai/passages?${queryParams.toString()}`, { cache: 'no-store' });
        return handleResponse(res, 'getDoukaiPassages');
    } catch (error) {
        return handleNetworkError('getDoukaiPassages', error, []);
    }
}

/**
 * Mendapatkan detail satu passage Doukai beserta soal-soalnya
 */
export async function getDoukaiPassage(id) {
    if (!id) return null;
    try {
        const res = await fetch(`${API_URL}/learning/doukai/passages/${id}`, { cache: 'no-store' });
        return handleResponse(res, 'getDoukaiPassage');
    } catch (error) {
        return handleNetworkError('getDoukaiPassage', error, null);
    }
}

/**
 * Mengecek jumlah total passage yang tersedia
 */
export async function getDoukaiCount() {
    try {
        const res = await fetch(`${API_URL}/learning/doukai/count`, { cache: 'no-store' });
        const data = await handleResponse(res, 'getDoukaiCount');
        return data.count || 0;
    } catch (error) {
        console.warn('[getDoukaiCount] Failed to fetch count:', error.message);
        return 0;
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
    let data;

    if (token) {
        // Online Export (Logged In)
        try {
            const res = await fetch(`${API_URL}/learning/practice/export`, { 
                headers: { 'Authorization': `Bearer ${token}` } 
            });
            data = await handleResponse(res, 'exportPracticeData');
        } catch (error) {
            console.error("[jbook-api] Server export failed, falling back to local if possible", error);
        }
    }

    // If Guest or if server export failed, try to get local guest analytics
    if (!data) {
        const { getGuestAnalytics } = await import('./local-analytics');
        const analytics = getGuestAnalytics();
        data = {
            total_attempts: analytics.total_attempts,
            accuracy: analytics.accuracy,
            wrong_stats: analytics.wrong_stats,
            attempts: [], // Individual attempts are not stored locally for guests
            progress: []
        };
    }

    // NORMALIZE: Ensure we are working with the actual data object
    let rawData = data;
    if (data && data.data && !data.attempts) rawData = data.data;

    // 1. Group wrong_stats
    const rawWrong = rawData.wrong_stats || [];
    const groupedWrong = new Map();
    rawWrong.forEach(w => {
        const key = `${w.type}|${w.character}`;
        if (groupedWrong.has(key)) {
            const existing = groupedWrong.get(key);
            existing.count += (w.count || 1);
        } else {
            groupedWrong.set(key, { ...w, count: w.count || 1 });
        }
    });
    const cleanedWrong = Array.from(groupedWrong.values());

    // 2. Group attempts (The heaviest part)
    const rawAttempts = rawData.attempts || [];
    const attemptMap = new Map();
    rawAttempts.forEach(a => {
        const char = a.character || a.label || a.word || a.title;
        if (!char) return;

        // Preserve mode separation (choice vs kakitori) in exports/imports
        const mode = a.mode || 'choice';
        const key = `${mode}|${a.type}|${char}`;
        if (!attemptMap.has(key)) {
            attemptMap.set(key, {
                type: a.type,
                character: char,
                mode,
                kanji_id: a.kanji_id,
                vocab_id: a.vocab_id,
                grammar_id: a.grammar_id,
                particle_id: a.particle_id,
                wrong_count: a.is_correct ? 0 : 1,
                right_count: a.is_correct ? 1 : 0,
                last_attempt: a.created_at || a.timestamp || a.date
            });
        } else {
            const existing = attemptMap.get(key);
            // UPDATE: If existing group has no ID but this row has it, fill it in
            if (!existing.kanji_id && a.kanji_id) existing.kanji_id = a.kanji_id;
            if (!existing.vocab_id && a.vocab_id) existing.vocab_id = a.vocab_id;
            if (!existing.grammar_id && a.grammar_id) existing.grammar_id = a.grammar_id;
            if (!existing.particle_id && a.particle_id) existing.particle_id = a.particle_id;

            if (a.is_correct) existing.right_count++;
            else existing.wrong_count++;
            
            const ts = a.created_at || a.timestamp || a.date;
            if (ts && (!existing.last_attempt || ts > existing.last_attempt)) {
                existing.last_attempt = ts;
            }
        }
    });
    const cleanedAttempts = Array.from(attemptMap.values());

    // 3. Group progress
    const rawProgress = rawData.progress || [];
    const progMap = new Map();
    rawProgress.forEach(p => {
        // Handle both formats: server (content_type_app/model) and guest/old (content_type)
        const type = p.content_type || `${p.content_type_app}.${p.content_type_model}`;
        const id = p.object_id || p.content_id;
        const key = `${type}|${id}`;
        
        const ts = p.updated_at || p.last_reviewed || p.timestamp || 0;
        if (!progMap.has(key) || (ts > (progMap.get(key)._ts || 0))) {
            progMap.set(key, { ...p, _ts: ts });
        }
    });
    const cleanedProgress = Array.from(progMap.values()).map(({ _ts, ...p }) => p);

    return {
        total_attempts: rawData.total_attempts || 0,
        accuracy: rawData.accuracy || 0,
        wrong_stats: cleanedWrong,
        wrong_summary: cleanedWrong,
        attempts: cleanedAttempts,
        progress: cleanedProgress,
        export_date: new Date().toISOString(),
        version: '2.2-type-preserved'
    };
}

export async function importPracticeData(rawData) {
    const token = Cookies.get('access_token');
    
    // Data Protection & Migration Transformer
    let data = JSON.parse(JSON.stringify(rawData)); // Deep clone
    
    // NORMALIZE: Ensure we are working with the actual data object
    if (data && data.data && !data.attempts) data = data.data;

    const { dbGet } = await import('./offline-db');

    // 1. Handle unified format (v2.x) - Expand it back for server compatibility
    if ((data.version?.startsWith('2.')) && data.attempts) {
        const expandedAttempts = [];
        const baseDate = data.export_date ? new Date(data.export_date) : new Date();
        
        data.attempts.forEach((a, idx) => {
            const groupDate = a.last_attempt ? new Date(a.last_attempt) : new Date(baseDate.getTime() - (idx * 60000));
            const mode = a.mode || 'choice';

            for (let i = 0; i < (a.wrong_count || 0); i++) {
                const itemDate = new Date(groupDate.getTime() - (i * 1000));
                expandedAttempts.push({
                    type: a.type,
                    character: a.character,
                    mode,
                    kanji_id: a.kanji_id,
                    vocab_id: a.vocab_id,
                    grammar_id: a.grammar_id,
                    particle_id: a.particle_id,
                    is_correct: false,
                    created_at: itemDate.toISOString(),
                    timestamp: itemDate.toISOString()
                });
            }
            for (let i = 0; i < (a.right_count || 0); i++) {
                const itemDate = new Date(groupDate.getTime() - (i * 1000 + (a.wrong_count || 0) * 1000));
                expandedAttempts.push({
                    type: a.type,
                    character: a.character,
                    mode,
                    kanji_id: a.kanji_id,
                    vocab_id: a.vocab_id,
                    grammar_id: a.grammar_id,
                    particle_id: a.particle_id,
                    is_correct: true,
                    created_at: itemDate.toISOString(),
                    timestamp: itemDate.toISOString()
                });
            }
        });
        data.attempts = expandedAttempts;
    }

    // 2. Migrate & Repair old/missing data
    if (data.attempts && Array.isArray(data.attempts)) {
        for (const a of data.attempts) {
            // Ensure mode exists (server uses this to compute kakitori analytics)
            if (!a.mode) a.mode = 'choice';
            // Repair Tipe missing
            if (!a.type) {
                if (a.grammar_id) a.type = 'grammar';
                else if (a.kanji_id) a.type = 'kanji';
                else if (a.vocab_id) a.type = 'vocab';
                else if (a.particle_id) a.type = 'particle';
            }
            
            // Normalize names
            if (a.type === 'bunpo') a.type = 'grammar';
            if (a.type === 'kotoba') a.type = 'vocab';

            // Repair Label (Character/Title) missing from old data
            if (!a.label && !a.character) {
                const targetId = a.kanji_id || a.vocab_id || a.grammar_id || a.particle_id;
                if (targetId) {
                    try {
                        const storeName = a.type === 'grammar' ? 'grammar' : (a.type === 'vocab' || a.type === 'vocab' ? 'vocab' : (a.type === 'particle' ? 'particle' : 'kanji'));
                        const item = await dbGet(storeName, targetId);
                        if (item) {
                            a.label = item.character || item.word || item.title;
                            a.character = a.label; // Compatibility for different code paths
                        }
                    } catch (e) {
                        console.warn("[jbook-api] Failed to repair label for ID", targetId, e);
                    }
                }
            } else if (a.label && !a.character) {
                a.character = a.label;
            } else if (!a.label && a.character) {
                a.label = a.character;
            }

            // Sync mistake_count -> wrong_count
            if (a.mistake_count !== undefined && a.wrong_count === undefined) {
                a.wrong_count = a.mistake_count;
            }
        }
    }

    if (data.progress && Array.isArray(data.progress)) {
        data.progress.forEach(p => {
            // Normalisasi tipe lama
            if (p.content_type === 'bunpo' || p.content_type_model === 'bunpo') {
                p.content_type = 'grammar';
                p.content_type_model = 'grammar';
            }
            if (p.content_type === 'kotoba' || p.content_type_model === 'kotoba') {
                p.content_type = 'vocab';
                p.content_type_model = 'vocab';
            }

            // Map p.content_type ke app/model (untuk data dari file lama/guest)
            if (p.content_type && !p.content_type_app) {
                const parts = p.content_type.split('.');
                if (parts.length === 2) {
                    p.content_type_app = parts[0];
                    p.content_type_model = parts[1];
                } else {
                    p.content_type_app = (p.content_type === 'quizattempt' || p.content_type === 'userprogress') ? 'learning' : 'content';
                    p.content_type_model = p.content_type;
                }
            }
            
            // Map content_id ke object_id
            if (p.content_id && !p.object_id) {
                p.object_id = p.content_id;
            }
        });
    }

    // Repair labels and types in wrong_stats / wrong_summary
    ['wrong_stats', 'wrong_summary'].forEach(key => {
        if (data[key] && Array.isArray(data[key])) {
            data[key].forEach(w => {
                if (w.type === 'bunpo') w.type = 'grammar';
                if (w.type === 'kotoba') w.type = 'vocab';
            });
        }
    });

    // 2. If Logged In, Sync to Server
    if (token) {
        try {
            const res = await fetch(`${API_URL}/learning/practice/import`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data),
            });
            return await handleResponse(res, 'importPracticeData');
        } catch (error) {
            console.error("[jbook-api] Server import failed", error);
            throw error;
        }
    }

    // 3. If Guest, Merge into LocalStorage
    const { getGuestAnalytics, STORAGE_KEY } = await import('./local-analytics');
    const current = getGuestAnalytics();
    
    const total = (current.total_attempts || 0) + (data.total_attempts || 0);
    const accuracy = total > 0 
        ? ((current.accuracy * (current.total_attempts || 0)) + (data.accuracy * (data.total_attempts || 0))) / total
        : 0;

    const newWrong = data.wrong_summary || data.wrong_stats || [];
    
    // If summary is missing, generate it from attempts
    if (newWrong.length === 0 && data.attempts) {
        const tempMap = new Map();
        data.attempts.forEach(a => {
            if (!a.is_correct && a.label) {
                const k = a.label + '|' + a.type;
                if (!tempMap.has(k)) tempMap.set(k, { character: a.label, count: 0, type: a.type });
                tempMap.get(k).count++;
            }
        });
        newWrong.push(...Array.from(tempMap.values()));
    }

    const wrongMap = new Map();
    (current.wrong_stats || []).forEach(w => wrongMap.set(w.character + '|' + w.type, w));
    
    newWrong.forEach(w => {
        const key = w.character + '|' + w.type;
        if (wrongMap.has(key)) {
            const existing = wrongMap.get(key);
            existing.count += (w.count || (w.wrong_count || 1));
            existing.right_count = (existing.right_count || 0) + (w.right_count || 0);
        } else {
            wrongMap.set(key, { ...w });
        }
    });

    const merged = {
        total_attempts: total,
        accuracy: Math.round(accuracy * 100) / 100,
        wrong_stats: Array.from(wrongMap.values()).sort((a, b) => b.count - a.count).slice(0, 50)
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    return { imported: data.attempts?.length || 0, skipped: 0 };
}



