export const WORD_TYPE_OPTIONS = [
    { value: 'noun', label: 'Kata Benda' },
    { value: 'godan', label: 'Kata Kerja Godan' },
    { value: 'ichidan', label: 'Kata Kerja Ichidan' },
    { value: 'suru', label: 'Kata Kerja Suru' },
    { value: 'intransitive', label: 'Kata Kerja Intransitif' },
    { value: 'transitive', label: 'Kata Kerja Transitif' },
    { value: 'i_adj', label: 'Adjektiva-i' },
    { value: 'na_adj', label: 'Adjektiva-na' },
    { value: 'adverb', label: 'Adverbia' },
    { value: 'particle', label: 'Partikel' },
    { value: 'suffix', label: 'Sufiks' },
    { value: 'conjunction', label: 'Konjungsi' },
    { value: 'expression', label: 'Ekspresi' },
    { value: 'interjection', label: 'Interjeksi' },
    { value: 'pronoun', label: 'Pronomina' },
    { value: 'counter', label: 'Kata Bantu Bilangan' },
    { value: 'other', label: 'Lain-lain' },
];

export const WORD_TYPE_LABELS = Object.fromEntries(
    WORD_TYPE_OPTIONS.map(({ value, label }) => [value, label]),
);

export const WORD_TYPE_COLORS = {
    noun: 'border-accent-blue/25 bg-accent-blue/10 text-accent-blue',
    godan: 'border-accent-green/25 bg-accent-green/10 text-accent-green',
    ichidan: 'border-accent-green/25 bg-accent-green/10 text-accent-green',
    suru: 'border-accent-green/25 bg-accent-green/10 text-accent-green',
    intransitive: 'border-accent-green/25 bg-accent-green/10 text-accent-green',
    transitive: 'border-accent-green/25 bg-accent-green/10 text-accent-green',
    i_adj: 'border-accent-gold/30 bg-accent-gold/15 text-amber-900 dark:text-amber-200',
    na_adj: 'border-accent-gold/30 bg-accent-gold/15 text-amber-900 dark:text-amber-200',
    adverb: 'border-cyan-700/25 bg-cyan-700/10 text-cyan-800 dark:text-cyan-200',
    particle: 'border-teal-700/25 bg-teal-700/10 text-teal-800 dark:text-teal-200',
    suffix: 'border-orange-700/25 bg-orange-700/10 text-orange-800 dark:text-orange-200',
    conjunction: 'border-sky-700/25 bg-sky-700/10 text-sky-800 dark:text-sky-200',
    expression: 'border-rose-700/25 bg-rose-700/10 text-rose-800 dark:text-rose-200',
    interjection: 'border-pink-700/25 bg-pink-700/10 text-pink-800 dark:text-pink-200',
    pronoun: 'border-indigo-700/25 bg-indigo-700/10 text-indigo-800 dark:text-indigo-200',
    counter: 'border-lime-700/25 bg-lime-700/10 text-lime-900 dark:text-lime-200',
    other: 'border-[var(--border-color)] bg-[var(--background)] text-[var(--foreground)]/75',
};