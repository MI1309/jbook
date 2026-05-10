/**
 * Offline Download Manager
 * 
 * Downloads all JBook content to IndexedDB with progress reporting.
 * Called once with user permission, persists permanently on device.
 */

import { dbPutAll, dbSetMeta, dbGetStats } from './offline-db';
import { API_URL } from './api';

export const OFFLINE_TTL_MS = 60 * 24 * 60 * 60 * 1000; // 2 months

/** Check if stored data is older than 2 months */
export async function isOfflineDataStale() {
    const stats = await dbGetStats();
    if (!stats.downloadedAt) return false;
    return (Date.now() - stats.downloadedAt) > OFFLINE_TTL_MS;
}

/**
 * Request navigator to persist storage to avoid sudden eviction on mobile
 */
async function requestPersistentStorage() {
    if (typeof window !== 'undefined' && navigator.storage && navigator.storage.persist) {
        try {
            const isPersisted = await navigator.storage.persisted();
            if (!isPersisted) {
                const granted = await navigator.storage.persist();
                if (granted) {
                    console.info('[offline-download] Storage persistence granted.');
                } else {
                    console.warn('[offline-download] Storage persistence not granted by the browser.');
                }
            } else {
                console.info('[offline-download] Storage is already persisted.');
            }
        } catch (e) {
            console.error('[offline-download] Failed to request persistent storage', e);
        }
    }
}

/**
 * Download all content to device.
 * 
 * @param {Function} onProgress - called with { step, total, label, percent }
 * @returns {Promise<{ vocab: number, kanji: number, grammar: number }>}
 */
export async function downloadAllForOffline(onProgress = () => {}) {
    await requestPersistentStorage();
    const steps = [
        {
            key: 'vocab',
            label: 'Kosakata (Kotoba)',
            url: `${API_URL}/content/vocab?limit=10000`,
            extract: (data) => Array.isArray(data) ? data : (data.items || []),
        },
        {
            key: 'kanji',
            label: 'Kanji',
            url: `${API_URL}/content/kanji?limit=5000`,
            extract: (data) => Array.isArray(data) ? data : (data.items || []),
        },
        {
            key: 'grammar',
            label: 'Tata Bahasa (Bunpo)',
            url: `${API_URL}/content/grammar?limit=2000`,
            extract: (data) => Array.isArray(data) ? data : (data.items || []),
        },
    ];

    const total = steps.length;

    for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        onProgress({ step: i + 1, total, label: step.label, percent: Math.round((i / total) * 100) });

        const res = await fetch(step.url);
        if (!res.ok) throw new Error(`Gagal mengunduh ${step.label}: ${res.status} ${res.statusText}`);

        const data = await res.json();
        const items = step.extract(data);

        // Ensure every item has an id field (for IndexedDB keyPath)
        const normalized = items.map(item => ({
            ...item,
            id: item.id || item.uuid || `${step.key}-${Math.random()}`,
        }));

        await dbPutAll(step.key, normalized);
        onProgress({ step: i + 1, total, label: step.label, percent: Math.round(((i + 1) / total) * 100) });
    }

    // Save timestamps
    await dbSetMeta('downloadedAt', Date.now());
    await dbSetMeta('version', '1.0');

    return dbGetStats();
}

/**
 * Get info about what's currently stored.
 */
export { dbGetStats };

/**
 * Checks if there are more items in the API than we have offline.
 * @returns {Promise<{ hasUpdate: boolean }>}
 */
export async function checkOfflineUpdates() {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return { hasUpdate: false };

    try {
        const stats = await dbGetStats();
        if (!stats.downloadedAt) return { hasUpdate: false }; // Not downloaded yet

        const [vocabRes, kanjiRes, grammarRes] = await Promise.all([
            fetch(`${API_URL}/content/vocab?limit=1`).then(res => res.ok ? res.json() : { total: stats.vocab || 0 }).catch(() => ({ total: stats.vocab || 0 })),
            fetch(`${API_URL}/content/kanji?limit=1`).then(res => res.ok ? res.json() : { total: stats.kanji || 0 }).catch(() => ({ total: stats.kanji || 0 })),
            fetch(`${API_URL}/content/grammar?limit=1`).then(res => res.ok ? res.json() : { total: stats.grammar || 0 }).catch(() => ({ total: stats.grammar || 0 })),
        ]);

        const hasUpdate = (
            ((vocabRes.total || 0) > (stats.vocab || 0)) ||
            ((kanjiRes.total || 0) > (stats.kanji || 0)) ||
            ((grammarRes.total || 0) > (stats.grammar || 0))
        );

        return { hasUpdate };
    } catch (err) {
        console.error("[offline-download] Failed to check offline updates", err);
        return { hasUpdate: false };
    }
}

/**
 * Wipe all offline data.
 */
export { dbClearAll } from './offline-db';
