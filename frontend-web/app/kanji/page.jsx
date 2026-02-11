
import { getKanjiList } from '@/lib/api';
import KanjiCard from '@/components/KanjiCard';

export default async function KanjiPage() {
    const kanjiList = await getKanjiList();

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6 text-center">Daftar Kanji (漢字)</h1>

            {/* TODO: Add Filter Component Here */}

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {kanjiList.map((kanji) => (
                    <KanjiCard
                        key={kanji.id}
                        id={kanji.id}
                        character={kanji.character}
                        meaning={kanji.meaning}
                        onyomi={kanji.onyomi}
                        kunyomi={kanji.kunyomi}
                        level={kanji.jlpt_level}
                    />
                ))}
            </div>
        </div>
    );
}
