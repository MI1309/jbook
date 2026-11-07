import { WORD_TYPE_COLORS, WORD_TYPE_LABELS } from '@/components/kotoba/wordTypes';

export default function WordTypeBadge({ type, className = '' }) {
    const label = WORD_TYPE_LABELS[type] || 'Belum ditentukan';
    const color = WORD_TYPE_COLORS[type] || WORD_TYPE_COLORS.other;

    return (
        <span className={`inline-flex max-w-full items-center rounded-md border px-2 py-1 text-xs font-semibold leading-tight ${color} ${className}`}>
            {label}
        </span>
    );
}