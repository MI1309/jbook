
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
        <Link href={`/kanji/${id}`} className="block">
            <div className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow bg-white text-center h-full flex flex-col justify-between">
                <div>
                    <div className="text-4xl font-bold mb-2 text-gray-800">{character}</div>
                    <div className="text-sm text-gray-500 mb-2">N{level}</div>
                    <div className="text-lg font-medium text-gray-700 mb-3 line-clamp-2">{meaning}</div>
                </div>
                <div className="text-xs text-gray-600 space-y-1">
                    {onyomi.length > 0 && (
                        <p><span className="font-bold">On:</span> {formatOnyomi(onyomi).join(', ')}</p>
                    )}
                    {kunyomi.length > 0 && (
                        <p><span className="font-bold">Kun:</span> {formatKunyomi(kunyomi).join(', ')}</p>
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
