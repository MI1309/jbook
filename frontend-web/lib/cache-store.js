/**
 * Simple localStorage cache with TTL (Time-To-Live).
 * Used to serve API data when the device is offline.
 *
 * Key naming: use a descriptive string like 'kanji-list-level-3'
 * TTL default: 7 days (data won't go stale too fast for vocab/grammar)
 */

const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function getKey(key) {
    return `jbook_cache:${key}`;
}

/**
 * Save data to the local cache.
 * @param {string} key
 * @param {any} data
 * @param {number} [ttlMs]
 */
export function cacheSet(key, data, ttlMs = DEFAULT_TTL_MS) {
    if (typeof window === 'undefined') return;
    try {
        const entry = { data, expires: Date.now() + ttlMs };
        localStorage.setItem(getKey(key), JSON.stringify(entry));
    } catch (e) {
        // localStorage full or unavailable — silently ignore
        console.warn('[cache-store] Failed to save cache:', key, e.message);
    }
}

/**
 * Read data from the local cache.
 * Returns null if not found or expired.
 * @param {string} key
 * @returns {any|null}
 */
export function cacheGet(key) {
    if (typeof window === 'undefined') return null;
    try {
        const raw = localStorage.getItem(getKey(key));
        if (!raw) return null;
        const entry = JSON.parse(raw);
        if (Date.now() > entry.expires) {
            localStorage.removeItem(getKey(key));
            return null;
        }
        return entry.data;
    } catch {
        return null;
    }
}

/**
 * Remove a specific cache entry.
 * @param {string} key
 */
export function cacheClear(key) {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(getKey(key));
}

/**
 * Fetch data with offline-fallback caching.
 *
 * - If online: fetch from network, save to cache, return data.
 * - If offline: return cached data if available, otherwise throw.
 *
 * @param {string} cacheKey  - unique key for this data
 * @param {Function} fetchFn - async function that returns the data
 * @param {number} [ttlMs]   - how long to keep the cache (default 7 days)
 * @returns {Promise<any>}
 */
export async function fetchWithCache(cacheKey, fetchFn, ttlMs = DEFAULT_TTL_MS) {
    // If offline, serve from cache immediately
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && !navigator.onLine) {
        const cached = cacheGet(cacheKey);
        if (cached !== null) {
            console.info(`[cache-store] Offline — serving cached: ${cacheKey}`);
            return cached;
        }
        throw new Error('Tidak ada koneksi internet dan data tidak tersedia secara offline.');
    }

    // Online: fetch and update cache
    try {
        const data = await fetchFn();
        cacheSet(cacheKey, data, ttlMs);
        return data;
    } catch (err) {
        // Network failed mid-request — try cache as fallback
        const cached = cacheGet(cacheKey);
        if (cached !== null) {
            console.warn(`[cache-store] Network error — using stale cache: ${cacheKey}`);
            return cached;
        }
        throw err;
    }
}
