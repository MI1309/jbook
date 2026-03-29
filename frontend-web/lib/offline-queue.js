/**
 * Offline Practice Results Queue
 * 
 * When a logged-in user submits results while offline, we save them to
 * localStorage. When the device reconnects, we automatically sync pending
 * results to the server.
 */

const QUEUE_KEY = 'offline_practice_queue';

/**
 * Read all pending results from the local queue.
 * @returns {Array<{results: Array, timestamp: number}>}
 */
export function getPendingQueue() {
    if (typeof window === 'undefined') return [];
    try {
        const raw = localStorage.getItem(QUEUE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

/**
 * Add a set of practice results to the offline queue.
 * @param {Array} results
 */
export function enqueueResults(results) {
    if (typeof window === 'undefined') return;
    const queue = getPendingQueue();
    queue.push({ results, timestamp: Date.now() });
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

/**
 * Clear the entire offline queue (called after successful sync).
 */
export function clearQueue() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(QUEUE_KEY);
}

/**
 * Attempt to sync all pending results to the server.
 * Removes successfully synced items from the queue.
 * Should be called when the device comes back online.
 * 
 * @param {Function} submitFn - async function to submit results array
 * @returns {Promise<number>} number of successfully synced batches
 */
export async function syncPendingResults(submitFn) {
    const queue = getPendingQueue();
    if (queue.length === 0) return 0;

    let synced = 0;
    const failed = [];

    for (const item of queue) {
        try {
            await submitFn(item.results);
            synced++;
        } catch (err) {
            console.warn('[offline-queue] Failed to sync batch:', err.message);
            failed.push(item);
        }
    }

    // Keep only the batches that still failed
    if (failed.length === 0) {
        clearQueue();
    } else {
        localStorage.setItem(QUEUE_KEY, JSON.stringify(failed));
    }

    return synced;
}

/**
 * Returns the total number of pending (unsynced) batches.
 */
export function pendingCount() {
    return getPendingQueue().length;
}
