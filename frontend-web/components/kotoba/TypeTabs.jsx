'use client';

import { useRef } from 'react';
import { WORD_TYPE_OPTIONS } from '@/components/kotoba/wordTypes';

const tabs = [{ value: 'all', label: 'Semua' }, ...WORD_TYPE_OPTIONS];

export default function TypeTabs({ value, counts, onChange }) {
    const tabRefs = useRef([]);

    const handleKeyDown = (event, index) => {
        let nextIndex = index;
        if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
        else if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;
        else if (event.key === 'Home') nextIndex = 0;
        else if (event.key === 'End') nextIndex = tabs.length - 1;
        else return;
        event.preventDefault();
        onChange(tabs[nextIndex].value);
        tabRefs.current[nextIndex]?.focus();
    };

    return (
        <div role="tablist" aria-label="Filter tipe kata" aria-orientation="horizontal" className="flex min-w-0 gap-1 overflow-x-auto border-b border-[var(--border-color)] px-1">
            {tabs.map((tab, index) => {
                const active = value === tab.value;
                const count = counts[tab.value];
                return (
                    <button
                        key={tab.value}
                        ref={(element) => { tabRefs.current[index] = element; }}
                        type="button"
                        role="tab"
                        id={`kotoba-type-tab-${tab.value}`}
                        aria-selected={active}
                        aria-controls="kotoba-list-panel"
                        tabIndex={active ? 0 : -1}
                        onClick={() => onChange(tab.value)}
                        onKeyDown={(event) => handleKeyDown(event, index)}
                        className={`inline-flex min-h-12 shrink-0 items-center gap-2 border-b-2 px-3 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent-blue ${active ? 'border-accent-blue bg-accent-blue/5 text-accent-blue' : 'border-transparent text-[var(--foreground)]/70 hover:border-[var(--border-color)] hover:text-[var(--foreground)]'}`}
                    >
                        <span>{tab.label}</span>
                        <span className={`rounded-full px-2 py-0.5 text-xs tabular-nums ${active ? 'bg-accent-blue/10 text-accent-blue' : 'bg-[var(--background)] text-[var(--foreground)]/60'}`}>
                            {count === undefined ? '…' : Number(count).toLocaleString('id-ID')}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}