import Link from 'next/link';
import PropTypes from 'prop-types';
import { toHiragana, toKatakana } from 'wanakana';
import { getKanjiHref } from '@/lib/kanji-route';

function safeReadings(readings) {
    if (!readings) return [];
    if (Array.isArray(readings)) {
        return readings.map((r) => String(r || '').trim()).filter(Boolean);
    }
    return [String(readings).trim()].filter(Boolean);
}

export default function KanjiCard({ id, character, meaning, onyomi = [], kunyomi = [], level, radical, strokes }) {
    const rawOnyomi = safeReadings(onyomi);
    const rawKunyomi = safeReadings(kunyomi);

    const formattedOnyomi = rawOnyomi.map((r) => {
        try {
            return toKatakana(r.toUpperCase());
        } catch {
            return r;
        }
    });

    const formattedKunyomi = rawKunyomi.map((r) => {
        try {
            return toHiragana(r.toLowerCase());
        } catch {
            return r;
        }
    });

    const numLevel = Number(level) || 5;
    const href = getKanjiHref({ id, character, meaning, onyomi: rawOnyomi, kunyomi: rawKunyomi, jlpt_level: numLevel });

    return (
        <Link
            href={href}
            className="group block h-full min-w-0 rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-accent-blue/40 hover:shadow-xl hover:shadow-accent-blue/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue"
        >
            <div className="flex h-full flex-col justify-between text-center">
                <div>
                    <div className="mb-2 flex items-center justify-between text-[11px] font-bold text-gray-500">
                        <span className="inline-flex rounded-lg border border-[var(--border-color)] bg-[var(--background)] px-2 py-0.5 font-bold text-accent-blue">
                            N{numLevel}
                        </span>
                        {radical && (
                            <span className="font-japanese text-xs text-gray-400 dark:text-gray-400">
                                部首: <span className="font-bold text-[var(--foreground)]">{radical}</span>
                            </span>
                        )}
                        {Boolean(strokes) && (
                            <span className="text-[10px] text-gray-400">
                                {strokes}画
                            </span>
                        )}
                    </div>

                    <div className="my-3 font-japanese text-5xl font-black text-[var(--foreground)] transition-transform duration-300 group-hover:scale-110">
                        {character}
                    </div>

                    <p className="line-clamp-2 text-sm font-semibold text-[var(--foreground)]" title={meaning}>
                        {meaning}
                    </p>
                </div>

                <div className="mt-4 space-y-1 rounded-xl border border-[var(--border-color)]/60 bg-[var(--background)]/60 p-2.5 text-left text-xs text-gray-600 dark:text-gray-300">
                    {formattedOnyomi.length > 0 && (
                        <p className="truncate">
                            <span className="font-bold text-accent-blue">On:</span> {formattedOnyomi.join(', ')}
                        </p>
                    )}
                    {formattedKunyomi.length > 0 && (
                        <p className="truncate">
                            <span className="font-bold text-accent-green">Kun:</span> {formattedKunyomi.join(', ')}
                        </p>
                    )}
                    {formattedOnyomi.length === 0 && formattedKunyomi.length === 0 && (
                        <p className="italic text-gray-400">-</p>
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
    onyomi: PropTypes.arrayOf(PropTypes.string),
    kunyomi: PropTypes.arrayOf(PropTypes.string),
    level: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    radical: PropTypes.string,
    strokes: PropTypes.number,
};
