export default function AdminTabs({ tabs, value, onChange, label, idPrefix = 'admin' }) {
    return (
        <div className="flex gap-1 overflow-x-auto border-b border-[var(--border-color)] px-4" role="tablist" aria-label={label}>
            {tabs.map(({ id, label: tabLabel }) => (
                <button
                    key={id}
                    type="button"
                    role="tab"
                    id={`${idPrefix}-tab-${id}`}
                    aria-selected={value === id}
                    aria-controls={`${idPrefix}-panel-${id}`}
                    onClick={() => onChange(id)}
                    className={`shrink-0 border-b-2 px-4 py-3 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-red)] ${value === id ? 'border-[var(--brand-red)] text-[var(--brand-red)]' : 'border-transparent text-[var(--foreground)]/55 hover:text-[var(--foreground)]'}`}
                >
                    {tabLabel}
                </button>
            ))}
        </div>
    );
}