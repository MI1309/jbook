'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useDebounce } from 'use-debounce';
import { getCurriculumBooks, getCurriculumLevels, getCurriculumUnits } from '@/lib/api';

function FilterContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Initialize state from URL params
    const initialSearch = searchParams.get('search') || '';
    const [searchTerm, setSearchTerm] = useState(initialSearch);
    const [levels, setLevels] = useState([]);
    const [booksState, setBooksState] = useState({ level: '', items: [] });
    const [unitsState, setUnitsState] = useState({ book: '', items: [] });
    const [curriculumLevel, setCurriculumLevel] = useState(searchParams.get('curriculum_level') || '');
    const [bookId, setBookId] = useState(searchParams.get('book') || '');
    const [unitId, setUnitId] = useState(searchParams.get('unit') || '');

    // Debounce search term to avoid too many URL updates
    const [debouncedSearch] = useDebounce(searchTerm, 500);
    useEffect(() => {
        getCurriculumLevels().then(setLevels).catch(() => setLevels([]));
    }, []);

    useEffect(() => {
        if (!curriculumLevel) return;
        getCurriculumBooks(curriculumLevel)
            .then(items => setBooksState({ level: curriculumLevel, items }))
            .catch(() => setBooksState({ level: curriculumLevel, items: [] }));
    }, [curriculumLevel]);

    useEffect(() => {
        if (!bookId) return;
        getCurriculumUnits({ level: curriculumLevel, book: bookId })
            .then(items => setUnitsState({ book: bookId, items }))
            .catch(() => setUnitsState({ book: bookId, items: [] }));
    }, [curriculumLevel, bookId]);

    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (debouncedSearch) params.set('search', debouncedSearch);
        else params.delete('search');
        if (debouncedSearch !== (searchParams.get('search') || '')) {
            params.delete('page');
            router.push(`/bunpo?${params.toString()}`, { scroll: false });
        }
    }, [debouncedSearch, router, searchParams]);

    const updateSelection = (nextLevel, nextBook, nextUnit) => {
        const params = new URLSearchParams(searchParams.toString());
        if (nextLevel) params.set('curriculum_level', nextLevel);
        else params.delete('curriculum_level');
        if (nextBook) params.set('book', nextBook);
        else params.delete('book');
        if (nextUnit) params.set('unit', nextUnit);
        else params.delete('unit');
        params.delete('chapter');
        params.delete('level');
        params.delete('page');
        setCurriculumLevel(nextLevel);
        setBookId(nextBook);
        setUnitId(nextUnit);
        router.push(`/bunpo?${params.toString()}`, { scroll: false });
    };

    const books = booksState.level === curriculumLevel ? booksState.items : [];
    const units = unitsState.book === bookId ? unitsState.items : [];

    return (
        <div className="bg-[var(--card-bg)] p-6 rounded-[2.5rem] border border-[var(--border-color)] shadow-xl shadow-accent-blue/5 transition-all duration-300 w-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-5 items-start">
                {/* Search Bunpo */}
                <div className="sm:col-span-2 lg:col-span-5">
                    <label className="block font-black mb-2 flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-gray-500 dark:text-gray-400">
                        <span>🔍</span> Cari Bunpo
                    </label>
                    <div className="relative group">
                        <input
                            type="text"
                            placeholder="Cari struktur, judul, atau penjelasan..."
                            className="w-full px-4 py-2.5 bg-[var(--background)] text-[var(--foreground)] border border-[var(--border-color)] focus:outline-none focus:ring-2 focus:ring-accent-blue/40 focus:border-accent-blue transition-all group-hover:border-accent-blue/30 rounded-2xl text-sm font-semibold"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-xs text-gray-400 hover:text-red-500 hover:bg-gray-200 dark:hover:bg-gray-800 transition-all"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                </div>

                <div className="sm:col-span-1 lg:col-span-2">
                    <label className="block font-black mb-2 uppercase text-[11px] tracking-widest text-gray-500 dark:text-gray-400">Level JLPT</label>
                    <select value={curriculumLevel} onChange={e => updateSelection(e.target.value, '', '')} className="w-full px-4 py-2.5 bg-[var(--background)] text-[var(--foreground)] border border-[var(--border-color)] rounded-2xl text-sm font-semibold">
                        <option value="">Pilih level</option>
                        {levels.map(level => <option key={level.id} value={level.code}>{level.code}</option>)}
                    </select>
                </div>
                <div className="sm:col-span-1 lg:col-span-3">
                    <label className="block font-black mb-2 uppercase text-[11px] tracking-widest text-gray-500 dark:text-gray-400">Buku Referensi</label>
                    <select value={bookId} disabled={!curriculumLevel} onChange={e => updateSelection(curriculumLevel, e.target.value, '')} className="w-full px-4 py-2.5 bg-[var(--background)] text-[var(--foreground)] border border-[var(--border-color)] rounded-2xl text-sm font-semibold disabled:opacity-50">
                        <option value="">{curriculumLevel ? (books.length ? 'Pilih buku' : 'Belum ada buku') : 'Pilih level dahulu'}</option>
                        {books.map(book => <option key={book.id} value={book.id}>{book.title}</option>)}
                    </select>
                    {curriculumLevel && books.length === 0 && <p className="mt-2 text-xs font-semibold text-gray-500">Belum ada buku referensi untuk level ini.</p>}
                </div>
                <div className="sm:col-span-2 lg:col-span-2">
                    <label className="block font-black mb-2 uppercase text-[11px] tracking-widest text-gray-500 dark:text-gray-400">Bab / Unit</label>
                    <select value={unitId} disabled={!bookId} onChange={e => updateSelection(curriculumLevel, bookId, e.target.value)} className="w-full px-4 py-2.5 bg-[var(--background)] text-[var(--foreground)] border border-[var(--border-color)] rounded-2xl text-sm font-semibold disabled:opacity-50">
                        <option value="">{bookId ? (units.length ? 'Pilih unit' : 'Belum ada unit') : 'Pilih buku dahulu'}</option>
                        {units.map(unit => <option key={unit.id} value={unit.id}>{unit.display_title || `Bab ${unit.original_unit_number}`} (asli {unit.original_unit_number})</option>)}
                    </select>
                    {bookId && units.length === 0 && <p className="mt-2 text-xs font-semibold text-gray-500">Belum ada bab/unit untuk buku ini.</p>}
                </div>
            </div>
        </div>
    );
}

export default function BunpoFilter() {
    return (
        <Suspense fallback={<div className="bg-[var(--card-bg)] p-6 rounded-[2.5rem] border border-[var(--border-color)] w-full h-32 animate-pulse"></div>}>
            <FilterContent />
        </Suspense>
    );
}
