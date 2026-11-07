'use client';

import { Plus, Trash2 } from 'lucide-react';
import DynamicStringList from './DynamicStringList';

const inputClass = 'w-full rounded-lg border border-[var(--border-color)] bg-[var(--background)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none transition-colors focus-visible:border-[var(--accent-blue)] focus-visible:ring-2 focus-visible:ring-[var(--accent-blue)]/20';

function emptyItem(fields) {
    return Object.fromEntries(fields.map((field) => [
        field.name,
        field.type === 'stringList' ? [] : field.defaultValue ?? '',
    ]));
}

export default function DynamicObjectList({ label, value = [], fields, onChange, addLabel = 'Tambah' }) {
    const items = Array.isArray(value) ? value : [];

    const updateItem = (itemIndex, fieldName, fieldValue) => {
        onChange(items.map((item, index) => index === itemIndex ? { ...item, [fieldName]: fieldValue } : item));
    };

    return (
        <div className="space-y-3">
            {items.map((item, index) => (
                <fieldset key={index} className="min-w-0 space-y-3 rounded-lg border border-[var(--border-color)] p-3 sm:p-4">
                    <legend className="px-1 text-xs font-semibold text-[var(--foreground)]/60">{label} {index + 1}</legend>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        {fields.map((field) => {
                            if (field.visibleWhen && item[field.visibleWhen.field] !== field.visibleWhen.value) return null;

                            return (
                                <label key={field.name} className={`min-w-0 space-y-1.5 ${field.type === 'textarea' || field.type === 'stringList' ? 'md:col-span-2' : ''}`}>
                                    <span className="text-xs font-medium text-[var(--foreground)]/70">{field.label}</span>
                                    {field.type === 'textarea' ? (
                                        <textarea
                                            rows={field.rows || 3}
                                            className={`${inputClass} resize-y leading-5`}
                                            value={item[field.name] ?? ''}
                                            onChange={(event) => updateItem(index, field.name, event.target.value)}
                                        />
                                    ) : field.type === 'select' ? (
                                        <select
                                            className={inputClass}
                                            value={item[field.name] ?? field.options[0]?.value ?? ''}
                                            onChange={(event) => updateItem(index, field.name, event.target.value)}
                                        >
                                            {field.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                                        </select>
                                    ) : field.type === 'stringList' ? (
                                        <DynamicStringList
                                            label={field.label}
                                            value={item[field.name]}
                                            onChange={(nextValue) => updateItem(index, field.name, nextValue)}
                                            addLabel={field.addLabel}
                                        />
                                    ) : (
                                        <input
                                            type="text"
                                            className={inputClass}
                                            value={item[field.name] ?? ''}
                                            onChange={(event) => updateItem(index, field.name, event.target.value)}
                                        />
                                    )}
                                </label>
                            );
                        })}
                    </div>
                    <div className="flex justify-end">
                        <button
                            type="button"
                            aria-label={`Hapus ${label.toLowerCase()} ${index + 1}`}
                            onClick={() => onChange(items.filter((_, currentIndex) => currentIndex !== index))}
                            className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium text-[var(--brand-red)] transition-colors hover:bg-[var(--brand-red)]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-red)]"
                        >
                            <Trash2 size={14} /> Hapus
                        </button>
                    </div>
                </fieldset>
            ))}
            <button
                type="button"
                onClick={() => onChange([...items, emptyItem(fields)])}
                className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[var(--border-color)] px-3 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--background)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-red)]"
            >
                <Plus size={15} /> {addLabel}
            </button>
        </div>
    );
}