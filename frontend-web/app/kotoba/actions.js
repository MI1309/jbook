'use server';

import { getVocabList } from '@/lib/api';

export async function searchKotoba({ query, wordType, level } = {}) {
    const search = String(query || '').trim();
    if (search.length < 2) return [];

    try {
        const result = await getVocabList({
            word_type: wordType || undefined,
            level: level || undefined,
            search,
            limit: 8,
            page: 1,
        });
        return result?.items || [];
    } catch (error) {
        console.error('[kotoba] Failed to search vocabulary:', error.message);
        return [];
    }
}