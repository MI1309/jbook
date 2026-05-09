
import Link from 'next/link';
import PropTypes from 'prop-types';

export default function GrammarCard({ id, title, structure, level, chapter }) {
    return (
        <Link href={`/bunpo/${id}`} className="block">
            <div className="border border-gray-200 rounded-lg p-5 hover:shadow-lg transition-shadow bg-white h-full flex flex-col justify-between">
                <div>
                    <div className="flex justify-between items-start mb-3">
                        <h2 className="text-xl font-bold text-gray-800">{title}</h2>
                        <div className="flex gap-2">
                            {chapter && (
                                <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                                    Bab {chapter}
                                </span>
                            )}
                            <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">N{level}</span>
                        </div>
                    </div>
                    <p className="text-gray-600 font-medium mb-2">{structure}</p>
                </div>
                <div className="mt-4 text-sm text-blue-500 font-semibold">
                    Lihat Penjelasan &rarr;
                </div>
            </div>
        </Link>
    );
}

GrammarCard.propTypes = {
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    structure: PropTypes.string.isRequired,
    level: PropTypes.number.isRequired,
    chapter: PropTypes.number,
};
