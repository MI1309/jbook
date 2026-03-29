/**
 * JBook Offline Database (IndexedDB)
 * 
 * Stores all content permanently on device.
 * Survives app close, browser restart, unlike sessionStorage/localStorage size limits.
 * 
 * Stores:
 *   - vocab    : all vocabulary items
 *   - kanji    : all kanji items
 *   - grammar  : all grammar/bunpo items
 *   - practice : cached practice question sets
 *   - meta     : download metadata (timestamps, versions)
 */

const DB_NAME = 'jbook-offline';
const DB_VERSION = 1;
const STORES = ['vocab', 'kanji', 'grammar', 'practice', 'meta'];

let _db = null;

function openDB() {
    if (typeof window === 'undefined') return Promise.reject(new Error('IndexedDB is not available on server'));
    if (_db) return Promise.resolve(_db);
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (e) => {
            const db = e.target.result;
            STORES.forEach(name => {
                if (!db.objectStoreNames.contains(name)) {
                    db.createObjectStore(name, { keyPath: 'id', autoIncrement: name === 'meta' });
                }
            });
        };
        req.onsuccess = (e) => { _db = e.target.result; resolve(_db); };
        req.onerror = () => reject(req.error);
    });
}

/** Save an array of items to a store (replaces all) */
export async function dbPutAll(storeName, items) {
    if (typeof window === 'undefined') return;
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        store.clear();
        items.forEach(item => store.put(item));
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
    });
}

/** Get all items from a store */
export async function dbGetAll(storeName) {
    if (typeof window === 'undefined') return [];
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const req = tx.objectStore(storeName).getAll();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

/** Get a single item by id */
export async function dbGet(storeName, id) {
    if (typeof window === 'undefined') return null;
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const req = tx.objectStore(storeName).get(id);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
    });
}

/** Check if a store has data */
export async function dbHasData(storeName) {
    if (typeof window === 'undefined') return false;
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const req = tx.objectStore(storeName).count();
        req.onsuccess = () => resolve(req.result > 0);
        req.onerror = () => reject(req.error);
    });
}

/** Count items in a store */
export async function dbCount(storeName) {
    if (typeof window === 'undefined') return 0;
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const req = tx.objectStore(storeName).count();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

/** Save metadata (e.g. download timestamp) */
export async function dbSetMeta(key, value) {
    if (typeof window === 'undefined') return;
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('meta', 'readwrite');
        tx.objectStore('meta').put({ id: key, value, updatedAt: Date.now() });
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
    });
}

/** Get metadata */
export async function dbGetMeta(key) {
    if (typeof window === 'undefined') return null;
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('meta', 'readonly');
        const req = tx.objectStore('meta').get(key);
        req.onsuccess = () => resolve(req.result?.value ?? null);
        req.onerror = () => reject(req.error);
    });
}

/** Delete all offline data */
export async function dbClearAll() {
    if (typeof window === 'undefined') return;
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORES, 'readwrite');
        STORES.forEach(name => tx.objectStore(name).clear());
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
    });
}

/** Get summary of what's stored locally */
export async function dbGetStats() {
    const [vocab, kanji, grammar, downloadedAt] = await Promise.all([
        dbCount('vocab'),
        dbCount('kanji'),
        dbCount('grammar'),
        dbGetMeta('downloadedAt'),
    ]);
    return { vocab, kanji, grammar, downloadedAt };
}
