import { getKanjiDetail } from '@/lib/api';
import Link from 'next/link';
import { toHiragana, toKatakana } from 'wanakana';
import { hasKanji } from '@/lib/utils';
import { notFound } from 'next/navigation';
import KanjiDetailUI from '@/components/kanji/KanjiDetailUI';

export async function generateMetadata({ params }) {
    const { id } = await params;
    try {
        const kanji = await getKanjiDetail(id);
        if (!kanji) return { title: 'Kanji Detail - JBook' };
        
        return {
            title: `Kanji ${kanji.character} (${kanji.meaning}) - JBook`,
            description: `Pelajari cara baca Onyomi: ${kanji.onyomi?.join(', ') || ''}, Kunyomi: ${kanji.kunyomi?.join(', ') || ''} untuk karakter ${kanji.character} (${kanji.meaning}).`,
        };
    } catch (e) {
        return { title: 'Kanji Detail - JBook' };
    }
}

export default async function KanjiDetailPage({ params }) {
    const { id } = await params;
    
    let kanji = null;
    let isError = false;

    try {
        kanji = await getKanjiDetail(id);
    } catch (error) {
        console.error('[jbook-server-error] Backend API hancur atau return 500:', error);
        isError = true;
    }

    // ✅ Pemicu notFound() harus di luar blok try-catch agar Next.js tidak bingung
    if (isError || !kanji) {
        notFound();
    }

    return <KanjiDetailUI kanji={kanji} />;
}