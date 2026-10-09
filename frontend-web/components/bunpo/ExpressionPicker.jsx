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
            <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-500">
                Expression terkait
            </label>
            <div className="flex flex-wrap gap-2">
                {selected.map((expression) => (
                    <span key={expression.id} className="inline-flex max-w-full items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-2.5 py-1.5 text-xs text-red-200">
                        <span className="truncate">{expression.word}</span>
                        <button
                            type="button"
                            aria-label={`Lepas ${expression.word}`}
                            onClick={() => onChange(selected.filter((item) => item.id !== expression.id))}
                            className="shrink-0 text-red-300 hover:text-white"
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
                className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:border-red-500 focus:outline-none"
            />
            {(loading || options.length > 0) && (
                <div className="max-h-36 space-y-1 overflow-y-auto rounded-lg border border-white/5 bg-black/20 p-1">
                    {loading && <p className="px-2 py-1 text-xs text-neutral-500">Mencari...</p>}
                    {options.filter((item) => !selected.some((value) => value.id === item.id)).map((expression) => (
                        <button
                            key={expression.id}
                            type="button"
                            onClick={() => addExpression(expression)}
                            className="flex w-full items-start justify-between gap-3 rounded-md px-2 py-1.5 text-left hover:bg-white/5"
                        >
                            <span className="min-w-0">
                                <span className="block truncate text-sm font-bold text-neutral-200">{expression.word}</span>
                                <span className="block truncate text-xs text-neutral-500">{expression.meaning}</span>
                            </span>
                            <span className="shrink-0 text-xs text-red-400">Tambah</span>
                        </button>
                    ))}
                    {!loading && options.length === 0 && query.trim() && (
                        <p className="px-2 py-1 text-xs text-neutral-500">Expression tidak ditemukan.</p>
                    )}
                </div>
            )}
        </div>
    );
}