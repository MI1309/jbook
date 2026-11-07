'use client';

import { Plus, Trash2 } from 'lucide-react';

const inputClass = 'min-w-0 flex-1 rounded-lg border border-[var(--border-color)] bg-[var(--background)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none transition-colors focus-visible:border-[var(--accent-blue)] focus-visible:ring-2 focus-visible:ring-[var(--accent-blue)]/20';

export default function DynamicStringList({ label, value = [], onChange, addLabel = 'Tambah', placeholder = '' }) {
    const items = Array.isArray(value) ? value : [];

    return (
        <div className="space-y-3">
            {items.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                    <input
                        type="text"
                        aria-label={`${label} ${index + 1}`}
                        className={inputClass}
                        placeholder={placeholder}
                        value={typeof item === 'string' ? item : ''}
                        onChange={(event) => onChange(items.map((current, currentIndex) => currentIndex === index ? event.target.value : current))}
                    />
                    <button
                        type="button"
                        aria-label={`Hapus ${label.toLowerCase()} ${index + 1}`}
                        onClick={() => onChange(items.filter((_, currentIndex) => currentIndex !== index))}
                        className="rounded-lg p-2 text-[var(--brand-red)] transition-colors hover:bg-[var(--brand-red)]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-red)]"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            ))}
            <button
                type="button"
                onClick={() => onChange([...items, ''])}
                className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-color)] px-3 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--background)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-red)]"
            >
                <Plus size={15} /> {addLabel}
            </button>
        </div>
    );
}