'use client';

import { useEffect, useState } from 'react';
import { API_URL } from '@/lib/api';
import Cookies from 'js-cookie';

export default function ExpressionPicker({ selected = [], onChange }) {
    const [query, setQuery] = useState('');
    const [options, setOptions] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const controller = new AbortController();
        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams({ word_type: 'expression', limit: '100' });
                if (query.trim()) params.set('search', query.trim());
                const response = await fetch(`${API_URL}/admin/kotoba?${params}`, {
                    headers: { Authorization: `Bearer ${Cookies.get('access_token')}` },
                    signal: controller.signal,
                });
                if (response.ok) setOptions(await response.json());
            } catch (error) {
                if (error.name !== 'AbortError') console.error('Gagal mencari expression', error);
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        }, 250);

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [query]);

    const addExpression = (expression) => {
        if (!selected.some((item) => item.id === expression.id)) {
            onChange([...selected, expression]);
        }
    };

    return (
        <div className="space-y-2">
            <label className="block text-xs font-semibold text-[var(--foreground)]/65">
                Expression terkait
            </label>
            <div className="flex flex-wrap gap-2">
                {selected.map((expression) => (
                    <span key={expression.id} className="inline-flex max-w-full items-center gap-2 rounded-lg border border-[var(--brand-red)]/25 bg-[var(--brand-red)]/10 px-2.5 py-1.5 text-xs text-[var(--foreground)]">
                        <span className="truncate">{expression.word}</span>
                        <button
                            type="button"
                            aria-label={`Lepas ${expression.word}`}
                            onClick={() => onChange(selected.filter((item) => item.id !== expression.id))}
                            className="shrink-0 rounded px-1 text-[var(--brand-red)] transition-colors hover:bg-[var(--brand-red)]/10 hover:text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-red)]"
                        >
                            ×
                        </button>
                    </span>
                ))}
            </div>
            <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cari expression dari Kotoba..."
                className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] px-3.5 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground)]/45 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent-blue)]"
            />
            {(loading || options.length > 0 || query.trim()) && (
                <div className="max-h-48 space-y-1 overflow-y-auto rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-1.5" aria-live="polite">
                    {loading && <p className="px-2 py-2 text-sm text-[var(--foreground)]/55">Mencari expression...</p>}
                    {!loading && options.filter((item) => !selected.some((value) => value.id === item.id)).map((expression) => (
                        <button
                            key={expression.id}
                            type="button"
                            onClick={() => addExpression(expression)}
                            className="flex w-full items-start justify-between gap-3 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-[var(--background)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent-blue)]"
                        >
                            <span className="min-w-0">
                                <span className="block truncate text-sm font-semibold text-[var(--foreground)]">{expression.word}</span>
                                <span className="block truncate text-xs text-[var(--foreground)]/60">{expression.meaning}</span>
                            </span>
                            <span className="shrink-0 text-xs font-medium text-[var(--brand-red)]">Tambah</span>
                        </button>
                    ))}
                    {!loading && options.filter((item) => !selected.some((value) => value.id === item.id)).length === 0 && query.trim() && (
                        <p className="px-2 py-2 text-sm text-[var(--foreground)]/55">Expression tidak ditemukan.</p>
                    )}
                </div>
            )}
        </div>
    );
}