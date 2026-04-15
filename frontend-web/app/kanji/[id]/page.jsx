import { getKanjiDetail } from '@/lib/api';
import Link from 'next/link';
import { toHiragana, toKatakana } from 'wanakana';
import { hasKanji } from '@/lib/utils';
import { notFound } from 'next/navigation';
import KanjiDetailUI from '@/components/KanjiDetailUI';

export async function generateMetadata({ params }) {
    const { id } = await params;
    try {
        const kanji = await getKanjiDetail(id);
        return {
            title: `Kanji ${kanji.character} (${kanji.meaning}) - JBook`,
            description: `Pelajari cara baca Onyomi: ${kanji.onyomi.join(', ')}, Kunyomi: ${kanji.kunyomi.join(', ')} untuk karakter ${kanji.character} (${kanji.meaning}).`,
        };
    } catch (e) {
        return { title: 'Kanji Detail - JBook' };
    }
}

export default async function KanjiDetailPage({ params }) {
    const { id } = await params;
    
    let kanji;
    try {
        kanji = await getKanjiDetail(id);
        if (!kanji) {
            notFound();
        }
    } catch (error) {
        notFound();
    }

    return <KanjiDetailUI kanji={kanji} />;
}
