import KotobaLanding from '@/components/kotoba/KotobaLanding';
import { getVocabList } from '@/lib/api';
import { KOTOBA_CATEGORIES } from '@/components/kotoba/kotobaCategories';

export default async function KotobaPage() {
    let total = 0;
    let categories = KOTOBA_CATEGORIES.map((category) => ({ ...category, count: 0 }));
    try {
        const [allWords, ...categoryResults] = await Promise.all([
            getVocabList({ limit: 1, page: 1 }),
            ...KOTOBA_CATEGORIES.map((category) => getVocabList({ word_type: category.wordType, limit: 1, page: 1 })),
        ]);
        total = Number(allWords?.total) || 0;
        categories = KOTOBA_CATEGORIES.map((category, index) => ({
            ...category,
            count: Number(categoryResults[index]?.total) || 0,
        }));
    } catch (error) {
        console.error('[kotoba] Failed to load category totals:', error.message);
    }
    return <KotobaLanding total={total} categories={categories} />;
}
