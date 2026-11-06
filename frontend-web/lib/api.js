const base_url = process.env.NEXT_PUBLIC_API_URL || 'https://japan.pythonanywhere.com/api';
export const API_URL = base_url.endsWith('/') ? base_url.slice(0, -1) : base_url;

let kanjiVisibilityCache = null;
let kanjiVisibilityExpiresAt = 0;
let kanjiVisibilityRequest = null;
let vocabVisibilityCache = null;
let vocabVisibilityExpiresAt = 0;
let vocabVisibilityRequest = null;
let bunpoVisibilityCache = null;
let bunpoVisibilityExpiresAt = 0;
let bunpoVisibilityRequest = null;
import Cookies from 'js-cookie';
import { allocateQuestionsByType } from '@/utils/practiceQuestionAllocation';

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
 * Resolves the actual database ID for a content item by its character/word/title.
 *
 * @param {'kanji'|'vocab'|'grammar'} type
 * @param {string} character  - the character, word, or grammar title
 * @returns {Promise<number|string|null>}
 */
export async function resolveContentId(type, character) {
    if (!character) return null;

    const token = Cookies.get('access_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const endpoint = { kanji: 'kanji', vocab: 'vocab', grammar: 'grammar' }[type];
    if (!endpoint) return null;

    try {
        const res = await fetch(`${API_URL}/content/${endpoint}?search=${encodeURIComponent(character)}&limit=1`, { headers });
        if (!res.ok) return null;
        const data = await res.json();
        const items = Array.isArray(data) ? data : (data.items || data.results || []);
        return items[0]?.id ?? null;
    } catch (error) {
        console.warn('[resolveContentId] API lookup failed:', error.message);
        return null;
    }
}

export function invalidateVisibilityCache() {
    kanjiVisibilityCache = null;
    kanjiVisibilityExpiresAt = 0;
    kanjiVisibilityRequest = null;
    vocabVisibilityCache = null;
    vocabVisibilityExpiresAt = 0;
    vocabVisibilityRequest = null;
    bunpoVisibilityCache = null;
    bunpoVisibilityExpiresAt = 0;
    bunpoVisibilityRequest = null;
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('jbook:visibility-updated'));
    }
}

export function setKanjiVisibilityCache(disabledLevels) {
    const disabled = (Array.isArray(disabledLevels) ? disabledLevels : [])
        .map(Number)
        .filter(level => Number.isInteger(level) && level >= 1 && level <= 5);
    const enabled = [1, 2, 3, 4, 5].filter(level => !disabled.includes(level));
    kanjiVisibilityCache = { disabled_levels: disabled, enabled_levels: enabled };
    kanjiVisibilityExpiresAt = Date.now() + 5 * 60 * 1000;
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('jbook:visibility-updated', { detail: { type: 'kanji', cache: kanjiVisibilityCache } }));
    }
}

export function setVocabVisibilityCache(disabledLevels) {
    const disabled = (Array.isArray(disabledLevels) ? disabledLevels : [])
        .map(Number)
        .filter(level => Number.isInteger(level) && level >= 1 && level <= 5);
    const enabled = [1, 2, 3, 4, 5].filter(level => !disabled.includes(level));
    vocabVisibilityCache = { disabled_levels: disabled, enabled_levels: enabled };
    vocabVisibilityExpiresAt = Date.now() + 5 * 60 * 1000;
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('jbook:visibility-updated', { detail: { type: 'vocab', cache: vocabVisibilityCache } }));
    }
}

export function setBunpoVisibilityCache(disabledLevels) {
    const disabled = (Array.isArray(disabledLevels) ? disabledLevels : [])
        .map(Number)
        .filter(level => Number.isInteger(level) && level >= 1 && level <= 5);
    const enabled = [1, 2, 3, 4, 5].filter(level => !disabled.includes(level));
    bunpoVisibilityCache = { disabled_levels: disabled, enabled_levels: enabled };
    bunpoVisibilityExpiresAt = Date.now() + 5 * 60 * 1000;
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('jbook:visibility-updated', { detail: { type: 'bunpo', cache: bunpoVisibilityCache } }));
    }
}

export async function getKanjiLevelVisibility() {
    if (kanjiVisibilityCache && Date.now() < kanjiVisibilityExpiresAt) {
        return kanjiVisibilityCache;
    }
    if (kanjiVisibilityRequest) return kanjiVisibilityRequest;

    kanjiVisibilityRequest = fetch(`${API_URL}/content/kanji/visibility`, { cache: 'no-store' })
        .then(res => {
            if (!res.ok) throw new Error('Kanji visibility request failed');
            return res.json();
        })
        .then(data => {
            const enabledLevels = (Array.isArray(data.enabled_levels) ? data.enabled_levels : [1, 2, 3, 4, 5])
                .map(Number)
                .filter(level => Number.isInteger(level) && level >= 1 && level <= 5)
                .sort((a, b) => a - b);
            kanjiVisibilityCache = {
                disabled_levels: (Array.isArray(data.disabled_levels) ? data.disabled_levels : [])
                    .map(Number)
                    .filter(level => Number.isInteger(level) && level >= 1 && level <= 5),
                enabled_levels: enabledLevels,
            };
            kanjiVisibilityExpiresAt = Date.now() + 5 * 60 * 1000;
            return kanjiVisibilityCache;
        })
        .catch(() => {
            const fallback = { disabled_levels: [], enabled_levels: [1, 2, 3, 4, 5] };
            kanjiVisibilityCache = fallback;
            kanjiVisibilityExpiresAt = Date.now() + 60 * 1000;
            return fallback;
        })
        .finally(() => {
            kanjiVisibilityRequest = null;
        });

    try {
        return await kanjiVisibilityRequest;
    } catch (error) {
        return { disabled_levels: [], enabled_levels: [1, 2, 3, 4, 5] };
    }
}

export async function getVocabLevelVisibility() {
    if (vocabVisibilityCache && Date.now() < vocabVisibilityExpiresAt) {
        return vocabVisibilityCache;
    }
    if (vocabVisibilityRequest) return vocabVisibilityRequest;

    vocabVisibilityRequest = fetch(`${API_URL}/content/vocab/visibility`, { cache: 'no-store' })
        .then(res => {
            if (!res.ok) throw new Error('Vocab visibility request failed');
            return res.json();
        })
        .then(data => {
            const enabledLevels = (Array.isArray(data.enabled_levels) ? data.enabled_levels : [4, 5])
                .map(Number)
                .filter(level => Number.isInteger(level) && level >= 1 && level <= 5)
                .sort((a, b) => a - b);
            vocabVisibilityCache = {
                disabled_levels: (Array.isArray(data.disabled_levels) ? data.disabled_levels : [])
                    .map(Number)
                    .filter(level => Number.isInteger(level) && level >= 1 && level <= 5),
                enabled_levels: enabledLevels,
            };
            vocabVisibilityExpiresAt = Date.now() + 5 * 60 * 1000;
            return vocabVisibilityCache;
        })
        .catch(() => {
            const fallback = { disabled_levels: [1, 2, 3], enabled_levels: [4, 5] };
            vocabVisibilityCache = fallback;
            vocabVisibilityExpiresAt = Date.now() + 60 * 1000;
            return fallback;
        })
        .finally(() => {
            vocabVisibilityRequest = null;
        });

    try {
        return await vocabVisibilityRequest;
    } catch (error) {
        return { disabled_levels: [], enabled_levels: [1, 2, 3, 4, 5] };
    }
}

export async function getBunpoLevelVisibility() {
    if (bunpoVisibilityCache && Date.now() < bunpoVisibilityExpiresAt) {
        return bunpoVisibilityCache;
    }
    if (bunpoVisibilityRequest) return bunpoVisibilityRequest;

    bunpoVisibilityRequest = fetch(`${API_URL}/content/bunpo/visibility`, { cache: 'no-store' })
        .then(res => {
            if (!res.ok) throw new Error('Bunpo visibility request failed');
            return res.json();
        })
        .then(data => {
            const disabledLevels = (Array.isArray(data.disabled_levels) ? data.disabled_levels : [])
                .map(Number)
                .filter(level => Number.isInteger(level) && level >= 1 && level <= 5);
            const enabledLevels = (Array.isArray(data.enabled_levels) ? data.enabled_levels : [1, 2, 3, 4, 5])
                .map(Number)
                .filter(level => Number.isInteger(level) && level >= 1 && level <= 5)
                .sort((a, b) => a - b);
            bunpoVisibilityCache = { disabled_levels: disabledLevels, enabled_levels: enabledLevels };
            bunpoVisibilityExpiresAt = Date.now() + 5 * 60 * 1000;
            return bunpoVisibilityCache;
        })
        .catch(() => {
            const fallback = { disabled_levels: [], enabled_levels: [1, 2, 3, 4, 5] };
            bunpoVisibilityCache = fallback;
            bunpoVisibilityExpiresAt = Date.now() + 60 * 1000;
            return fallback;
        })
        .finally(() => {
            bunpoVisibilityRequest = null;
        });

    return bunpoVisibilityRequest;
}

export async function getKanjiList({ level, search, radical, limit = 50, page = 1, randomOrder = false } = {}) {
    const visibility = await getKanjiLevelVisibility();
    const enabledLevels = (visibility.enabled_levels || [4, 5]).map(Number);
    const requestedLevels = level
        ? String(level).split(',').map(Number).filter(item => enabledLevels.includes(item))
        : [];
    const hasExplicitLevel = level !== undefined && level !== null && String(level).trim() !== '';
    if (hasExplicitLevel && requestedLevels.length === 0) {
        return { items: [], total: 0, page: 1, pages: 1 };
    }
    const queryParams = new URLSearchParams();
    if (requestedLevels.length) queryParams.append('level', requestedLevels.join(','));
    if (search) queryParams.append('search', search);
    if (radical) queryParams.append('radical', radical);
    if (randomOrder) queryParams.append('random_order', 'true');
    if (limit) queryParams.append('limit', limit);
    if (page) queryParams.append('page', page);

    const res = await fetch(`${API_URL}/content/kanji?${queryParams.toString()}`, { cache: 'no-store' });
    return handleResponse(res, 'getKanjiList');
}

export async function getKanjiDetail(id) {
    const url = `${API_URL}/content/kanji/${id}`;
    try {
        const res = await fetch(url);
        if (res.status === 404) return null;
        return handleResponse(res, 'getKanjiDetail');
    } catch (error) {
        console.error('[jbook-api] Kanji detail request failed:', error.message);
        return null;
    }
}

export async function getCurriculumLevels() {
    const res = await fetch(`${API_URL}/content/curriculum/levels`, { cache: 'no-store' });
    return handleResponse(res, 'getCurriculumLevels');
}

export async function getCurriculumBooks(level) {
    const params = new URLSearchParams();
    if (level) params.set('level', level);
    const res = await fetch(`${API_URL}/content/curriculum/books?${params.toString()}`, { cache: 'no-store' });
    return handleResponse(res, 'getCurriculumBooks');
}

export async function getCurriculumUnits({ level, book } = {}) {
    const params = new URLSearchParams();
    if (level) params.set('level', level);
    if (book) params.set('book', book);
    const res = await fetch(`${API_URL}/content/curriculum/units?${params.toString()}`, { cache: 'no-store' });
    return handleResponse(res, 'getCurriculumUnits');
}

export async function getCurriculumUnit(id) {
    const res = await fetch(`${API_URL}/content/curriculum/units/${id}`, { cache: 'no-store' });
    if (res.status === 404) return null;
    return handleResponse(res, 'getCurriculumUnit');
}

export async function getCurriculumUnitMaterials(id) {
    const res = await fetch(`${API_URL}/content/curriculum/units/${id}/materials`, { cache: 'no-store' });
    if (res.status === 404) return null;
    return handleResponse(res, 'getCurriculumUnitMaterials');
}

export async function getGrammarList({ level, search, chapter, unit, limit = 50, page = 1 } = {}) {
    const queryParams = new URLSearchParams();
    if (level) queryParams.append('level', level);
    if (search) queryParams.append('search', search);
    if (chapter) queryParams.append('chapter', chapter);
    if (unit) queryParams.append('unit', unit);
    if (limit) queryParams.append('limit', limit);
    if (page) queryParams.append('page', page);

    const res = await fetch(`${API_URL}/content/grammar?${queryParams.toString()}`, { cache: 'no-store' });
    const data = await handleResponse(res, 'getGrammarList');
    if (Array.isArray(data)) return { items: data, total: data.length, pages: 1, page: 1 };
    return data;
}

export async function getGrammarDetail(id) {
    const url = `${API_URL}/content/grammar/${id}`;
    try {
        const res = await fetch(url);
        if (res.status === 404) return null;
        return handleResponse(res, 'getGrammarDetail');
    } catch (error) {
        console.error('[jbook-api] Grammar detail request failed:', error.message);
        return null;
    }
}

export async function getMinnaQuestions({ limit = 10, book = null, chapter = null, type = 'choice' } = {}) {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit);
    if (book) params.append('book', book);
    if (chapter) params.append('chapter', chapter);
    if (type) params.append('type', type);

    const res = await fetch(`${API_URL}/learning/practice/minna/generate?${params.toString()}`);
    return handleResponse(res, 'getMinnaQuestions');
}

async function sanitizePracticeSelection({ type, level }) {
    const requestedTypes = String(type || 'kanji').split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
    const needsKanji = requestedTypes.includes('kanji');
    const needsVocab = requestedTypes.some(t => t === 'vocab' || t === 'kotoba');
    const needsBunpo = requestedTypes.some(t => t === 'grammar' || t === 'bunpo');

    let kanjiEnabled = [4, 5];
    let vocabEnabled = [1, 2, 3, 4, 5];
    let bunpoEnabled = [1, 2, 3, 4, 5];
    if (needsKanji) {
        const vis = await getKanjiLevelVisibility();
        kanjiEnabled = (vis.enabled_levels || [4, 5]).map(Number);
    }
    if (needsVocab) {
        const vis = await getVocabLevelVisibility();
        vocabEnabled = (vis.enabled_levels || [1, 2, 3, 4, 5]).map(Number);
    }

    if (needsBunpo) {
        const vis = await getBunpoLevelVisibility();
        bunpoEnabled = (vis.enabled_levels || [1, 2, 3, 4, 5]).map(Number);
    }

    const safeTypes = requestedTypes.filter(t =>
        t !== 'particle' &&
        (t !== 'kanji' || kanjiEnabled.length > 0) &&
        (!['vocab', 'kotoba'].includes(t) || vocabEnabled.length > 0) &&
        (!['grammar', 'bunpo'].includes(t) || bunpoEnabled.length > 0)
    );
    if (!safeTypes.length) return { type: '', level: null };

    if (!level) return { type: safeTypes.join(','), level: null };

    const levels = String(level).split(',').map(l => l.trim()).filter(Boolean);
    const hasJlptScopedTypes = safeTypes.some(t => !['particle', 'kana'].includes(t));
    if (!hasJlptScopedTypes) return { type: safeTypes.join(','), level: null };
    const filteredLevels = levels.filter(l => {
        const n = Number(l);
        const kanjiSelected = safeTypes.includes('kanji');
        const vocabSelected = safeTypes.includes('vocab') || safeTypes.includes('kotoba');
        const bunpoSelected = safeTypes.includes('grammar') || safeTypes.includes('bunpo');
        if (kanjiSelected || vocabSelected || bunpoSelected) {
            return (kanjiSelected && kanjiEnabled.includes(n)) ||
                (vocabSelected && vocabEnabled.includes(n)) ||
                (bunpoSelected && bunpoEnabled.includes(n));
        }
        return true;
    });

    if (!filteredLevels.length) return { type: '', level: null };
    return { type: safeTypes.join(','), level: filteredLevels.join(',') };
}

export async function getPracticeQuestions({ limit = 10, level = null, type = 'kanji', unit = null } = {}) {
    const sanitized = await sanitizePracticeSelection({ type, level });
    if (!sanitized.type) return [];

    type = sanitized.type;
    level = sanitized.level;

    const params = new URLSearchParams();
    if (limit) params.append('limit', limit);
    if (level) params.append('level', level);
    if (type) params.append('type', type);
    if (unit) params.append('unit', unit);

    const res = await fetch(`${API_URL}/learning/practice/generate?${params.toString()}`);
    const questions = await handleResponse(res, 'getPracticeQuestions');
    return allocateQuestionsByType(questions, type.split(','), limit);
}


// getUserAnalytics — tambah fallback kakitori_stats
export async function getUserAnalytics() {
    const token = Cookies.get('access_token');
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const defaultKakitori = {
        total_attempts: 0, total_questions: 0,
        correct: 0, accuracy: 0, level_breakdown: []
    };

    try {
        const res = await fetch(`${API_URL}/learning/practice/analytics`, { headers });
        if (!res.ok) return { total_attempts: 0, accuracy: 0, wrong_stats: [],
            level_stats: [], kakitori_stats: defaultKakitori };
        const data = await res.json();
        if (!data.kakitori_stats) data.kakitori_stats = defaultKakitori;
        return data;
    } catch (error) {
        return handleNetworkError('getUserAnalytics', error, {
            total_attempts: 0, accuracy: 0, wrong_stats: [],
            level_stats: [], kakitori_stats: defaultKakitori
        });
    }
}

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
    const visibility = await getVocabLevelVisibility();
    const enabledLevels = (visibility.enabled_levels || [1, 2, 3, 4, 5]).map(Number);
    const requestedLevels = level
        ? String(level).split(',').map(Number).filter(item => enabledLevels.includes(item))
        : [];
    const hasExplicitLevel = level !== undefined && level !== null && String(level).trim() !== '';
    if (hasExplicitLevel && requestedLevels.length === 0) {
        return { items: [], total: 0, page: 1, pages: 1 };
    }
    const queryParams = new URLSearchParams();
    if (requestedLevels.length) queryParams.append('level', requestedLevels.join(','));
    if (search) queryParams.append('search', search);
    if (word_type) queryParams.append('word_type', word_type);
    if (limit) queryParams.append('limit', limit);
    if (page) queryParams.append('page', page);

    const res = await fetch(`${API_URL}/content/vocab?${queryParams.toString()}`, { cache: 'no-store' });
    const data = await handleResponse(res, 'getVocabList');
    if (Array.isArray(data)) return { items: data, total: data.length, pages: 1, page: 1 };
    return data;
}

export async function getVocabDetail(id) {
    const url = `${API_URL}/content/vocab/${id}`;
    try {
        const res = await fetch(url);
        if (res.status === 404) return null;
        return handleResponse(res, 'getVocabDetail');
    } catch (error) {
        console.error('[jbook-api] Vocab detail request failed:', error.message);
        return null;
    }
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

            if (a.label && !a.character) {
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



