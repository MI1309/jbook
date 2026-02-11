
import Link from 'next/link';
import PropTypes from 'prop-types';

export default function KanjiCard({ id, character, meaning, onyomi, kunyomi, level }) {
    return (
        <Link href={`/kanji/${id}`} className="block">
            <div className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow bg-white text-center">
                <div className="text-4xl font-bold mb-2 text-gray-800">{character}</div>
                <div className="text-sm text-gray-500 mb-2">N{level}</div>
                <div className="text-lg font-medium text-gray-700 mb-2">{meaning}</div>
                <div className="text-xs text-gray-600">
                    <p><span className="font-bold">On:</span> {onyomi.join(', ')}</p>
                    <p><span className="font-bold">Kun:</span> {kunyomi.join(', ')}</p>
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
