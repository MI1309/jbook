
import { getGrammarList } from '@/lib/api';
import GrammarCard from '@/components/GrammarCard';

export default async function BunpoPage() {
    const grammarList = await getGrammarList();

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6 text-center">Daftar Bunpo (文法)</h1>

            {/* TODO: Add Filter Component Here */}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {grammarList.map((grammar) => (
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
    );
}
