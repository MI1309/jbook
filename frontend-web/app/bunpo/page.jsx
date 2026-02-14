
import { getGrammarList } from '@/lib/api';
import GrammarCard from '@/components/GrammarCard';

export default async function BunpoPage() {
    const grammarList = await getGrammarList();

    // Group by chapter
    const groupedGrammar = grammarList.reduce((acc, grammar) => {
        const chapter = grammar.chapter || 0; // Default to 0 (Uncategorized)
        if (!acc[chapter]) {
            acc[chapter] = [];
        }
        acc[chapter].push(grammar);
        return acc;
    }, {});

    // Sort chapters (0 at end if desired, or just numeric)
    const chapters = Object.keys(groupedGrammar).sort((a, b) => {
        if (parseInt(a) === 0) return 1; // Put 0 (Uncategorized) at the end
        if (parseInt(b) === 0) return -1;
        return parseInt(a) - parseInt(b);
    });

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">Daftar Bunpo (文法)</h1>

            {chapters.map((chapter) => (
                <div key={chapter} className="mb-12">
                    <h2 className="text-2xl font-bold mb-6 text-gray-700 border-b-2 border-red-500 inline-block pb-1">
                        {parseInt(chapter) === 0 ? 'Lainnya' : `Bab ${chapter}`}
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {groupedGrammar[chapter].map((grammar) => (
                            <GrammarCard
                                key={grammar.id}
                                id={grammar.id}
                                title={grammar.title}
                                structure={grammar.structure}
                                level={grammar.jlpt_level}
                            />
                        ))}
                    </div>
                </div>
            ))}

            {grammarList.length === 0 && (
                <p className="text-center text-gray-500 mt-10">Belum ada data bunpo.</p>
            )}
        </div>
    );
}
