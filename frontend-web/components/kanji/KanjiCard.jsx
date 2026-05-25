
import Link from 'next/link';
import PropTypes from 'prop-types';

import { toHiragana, toKatakana } from 'wanakana';

export default function KanjiCard({ id, character, meaning, onyomi, kunyomi, level }) {
    // Convert readings
    // Only convert if it's alphanumeric (Romaji) to avoid double conversion issues if data changes later
    const formatOnyomi = (readings) => {
        return readings.map(r => toKatakana(r.toUpperCase()));
    };

    const formatKunyomi = (readings) => {
        return readings.map(r => toHiragana(r.toLowerCase()));
    };

    return (
        <Link href={`/kanji/${id}`} className="block h-full">
            <div className="border border-[var(--border-color)] rounded-[2rem] p-6 hover:-translate-y-1 hover:shadow-xl hover:shadow-accent-blue/10 hover:border-accent-blue/30 transition-all bg-[var(--card-bg)] text-center h-full flex flex-col justify-between">
                <div>
                    <div className="text-5xl font-japanese font-bold mb-4 text-foreground">{character}</div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4 px-3 py-1 bg-[var(--background)] border border-[var(--border-color)] rounded-xl inline-block">N{level}</div>
                    <div className="text-sm font-semibold text-foreground mb-4 line-clamp-2">{meaning}</div>
                </div>
                <div className="text-xs text-gray-500 space-y-1.5 bg-[var(--background)]/50 p-4 rounded-2xl border border-[var(--border-color)]/50">
                    {onyomi.length > 0 && (
                        <p><span className="font-bold text-accent-blue">On:</span> {formatOnyomi(onyomi).join(', ')}</p>
                    )}
                    {kunyomi.length > 0 && (
                        <p><span className="font-bold text-accent-blue">Kun:</span> {formatKunyomi(kunyomi).join(', ')}</p>
                    )}
                </div>
            </div>
        </Link>
    );
}
KanjiCard.propTypes = {
    id: PropTypes.string.isRequired,
    character: PropTypes.string.isRequired,
    meaning: PropTypes.string.isRequired,
    onyomi: PropTypes.arrayOf(PropTypes.string).isRequired,
    kunyomi: PropTypes.arrayOf(PropTypes.string).isRequired,
    level: PropTypes.number.isRequired,
};
