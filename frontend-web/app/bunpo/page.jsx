import BunpoLanding from '@/components/bunpo/BunpoLanding';
import { getBunpoCatalog } from '@/lib/bunpo-catalog';

export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'Bunpo — Tata Bahasa Jepang N5 sampai N1 | JBook',
    description: 'Kuasai tata bahasa Jepang dari N5 sampai N1. 215 pola tata bahasa dengan penjelasan, contoh kalimat, dan latihan interaktif.',
    alternates: { canonical: '/bunpo' },
    openGraph: {
        title: 'Bunpo — Tata Bahasa Jepang N5 sampai N1 | JBook',
        description: 'Kuasai tata bahasa Jepang dari N5 sampai N1 dengan penjelasan, contoh kalimat, dan latihan interaktif.',
        type: 'website',
        url: '/bunpo',
    },
};

export default async function BunpoPage() {
    let patterns = [];
    try {
        patterns = await getBunpoCatalog();
    } catch (error) {
        console.error('[bunpo] Failed to load catalog:', error.message);
    }

    const searchPatterns = patterns.map(({ id, title, structure, explanation, jlpt_level, chapter }) => ({
        id,
        title,
        structure,
        explanation,
        jlpt_level,
        chapter,
    }));

    return <BunpoLanding patterns={searchPatterns} />;
}