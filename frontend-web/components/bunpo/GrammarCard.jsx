
import Link from 'next/link';
import PropTypes from 'prop-types';

export default function GrammarCard({ id, title, structure, level, chapter }) {
    return (
        <Link href={`/bunpo/${id}`} className="block h-full">
            <div className="border border-[var(--border-color)] rounded-[2rem] p-6 hover:-translate-y-1 hover:shadow-xl hover:shadow-accent-green/10 hover:border-accent-green/30 transition-all bg-[var(--card-bg)] h-full flex flex-col justify-between">
                <div>
                    <div className="flex justify-between items-start mb-4">
                        <h2 className="text-xl font-japanese font-black text-foreground">{title}</h2>
                        <div className="flex gap-2">
                            {chapter && (
                                <span className="bg-accent-green/10 text-accent-green text-[10px] font-black px-2 py-0.5 rounded-xl border border-accent-green/20 uppercase tracking-widest">
                                    Bab {chapter}
                                </span>
                            )}
                            <span className="bg-[var(--background)] text-gray-500 text-[10px] font-black px-2 py-0.5 rounded-xl border border-[var(--border-color)] uppercase tracking-widest">N{level}</span>
                        </div>
                    </div>
                    <p className="text-gray-500 text-sm font-medium mb-2">{structure}</p>
                </div>
                <div className="mt-4 text-[10px] uppercase tracking-widest font-black text-accent-green hover:underline">
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
