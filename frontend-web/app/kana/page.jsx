'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useDebounce } from 'use-debounce';
import { BookOpenCheck, Gamepad2, Search } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import {
    hiraganaGojuon, hiraganaDakuon, hiraganaYoon,
    katakanaGojuon, katakanaDakuon, katakanaYoon,
} from '@/data/kana';
import KanaStrokeCard from '@/components/kanji/KanaStrokeCard';

const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue';

export default function KanaPage() {
    const { theme, mounted } = useTheme();
    const [activeTab, setActiveTab] = useState('hiragana');
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery] = useDebounce(searchQuery, 200);

    const isDark = mounted && theme === 'dark';
    const textColor = !mounted ? 'text-black' : (isDark ? 'text-white' : 'text-black');
    const subTextColor = !mounted ? 'text-gray-500' : (isDark ? 'text-gray-400' : 'text-gray-500');
    const query = debouncedQuery.trim().toLocaleLowerCase();
    const sections = activeTab === 'hiragana'
        ? [
            { id: 'gojuon', title: 'Gojuon', description: 'Huruf Dasar', data: hiraganaGojuon, yoon: false },
            { id: 'dakuon', title: 'Dakuon & Handakuon', description: 'Teng-teng & Maru', data: hiraganaDakuon, yoon: false },
            { id: 'yoon', title: 'Yoon', description: 'Huruf Gabungan', data: hiraganaYoon, yoon: true },
        ]
        : [
            { id: 'gojuon', title: 'Gojuon', description: 'Huruf Dasar', data: katakanaGojuon, yoon: false },
            { id: 'dakuon', title: 'Dakuon & Handakuon', description: 'Teng-teng & Maru', data: katakanaDakuon, yoon: false },
            { id: 'yoon', title: 'Yoon', description: 'Huruf Gabungan', data: katakanaYoon, yoon: true },
        ];
    const filteredSections = sections.map((section) => ({
        ...section,
        data: section.data.filter((item) => {
            if (!query) return true;
            return `${item.kana} ${item.romaji}`.toLocaleLowerCase().includes(query);
        }),
    }));
    const visibleSections = filteredSections.filter((section) => !query || section.data.length > 0);
    const hasResults = visibleSections.some((section) => section.data.some((item) => item.kana));

    const selectTab = (tab) => {
        setActiveTab(tab);
        document.getElementById(`kana-tab-${tab}`)?.focus();
    };

    const handleTabKeyDown = (event) => {
        const tabs = ['hiragana', 'katakana'];
        const currentIndex = tabs.indexOf(activeTab);
        let nextTab;

        if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
            event.preventDefault();
            const direction = event.key === 'ArrowRight' ? 1 : -1;
            nextTab = tabs[(currentIndex + direction + tabs.length) % tabs.length];
        } else if (event.key === 'Home') {
            event.preventDefault();
            nextTab = tabs[0];
        } else if (event.key === 'End') {
            event.preventDefault();
            nextTab = tabs[tabs.length - 1];
        }

        if (nextTab) selectTab(nextTab);
    };

    const scrollToSection = (sectionId) => {
        document.getElementById(`kana-${activeTab}-${sectionId}`)?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
        });
    };

    const renderChart = (section) => {
        const cols = section.yoon
            ? 'grid-cols-3 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-8'
            : 'grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10';

        return (
            <div className={`grid ${cols} mx-auto w-full max-w-5xl gap-2 sm:gap-3 md:gap-4`}>
                {section.data.map((item, index) => (
                    <KanaStrokeCard
                        key={`${item.kana || 'empty'}-${index}`}
                        char={item.kana}
                        romaji={item.romaji}
                        isDark={isDark}
                        textColor={textColor}
                        activeTab={activeTab}
                        isYoon={section.yoon}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className="container mx-auto min-h-screen px-4 py-8 transition-colors duration-300 md:py-12">
            <header className="mb-8 text-center md:mb-10">
                <h1 className={`mb-3 font-japanese text-3xl font-black tracking-tight transition-colors md:text-5xl ${textColor}`}>
                    かな <span className="bg-gradient-to-r from-accent-blue to-accent-green bg-clip-text text-transparent">Kana</span>
                </h1>
                <div className="mx-auto mb-4 h-1 w-20 rounded-full bg-gradient-to-r from-accent-blue to-accent-green" />
                <p className={`mx-auto max-w-2xl text-sm md:text-base ${subTextColor}`}>
                    Tabel referensi lengkap huruf Jepang dasar. Klik pada huruf untuk melihat animasi cara tulisnya.
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-3">
                    <Link
                        href="/practice?type=kana&mode=choice&limit=10&timer=5&play=true"
                        onClick={() => {
                            if (typeof window !== 'undefined') {
                                sessionStorage.removeItem('guest_practice_session');
                            }
                        }}
                        className={`inline-flex min-h-11 items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2.5 text-sm font-bold text-white transition-all shadow-md shadow-blue-500/20 hover:scale-[1.02] active:scale-95 ${focusRing}`}
                    >
                        <BookOpenCheck aria-hidden="true" className="h-4 w-4" /> Latihan Kana
                    </Link>
                    <Link href="/tts" className={`inline-flex min-h-11 items-center gap-2 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] px-4 py-2.5 text-sm font-bold text-foreground transition-colors hover:border-accent-blue hover:text-accent-blue ${focusRing}`}>
                        <Gamepad2 aria-hidden="true" className="h-4 w-4" /> Main TTS (Hiragana)
                    </Link>
                </div>
            </header>

            <div className="sticky top-16 z-30 -mx-4 border-y border-[var(--border-color)] bg-[var(--background)]/95 px-4 py-2 backdrop-blur sm:mx-0 sm:rounded-xl sm:border">
                <div role="tablist" aria-label="Jenis kana" className="mx-auto flex w-full max-w-lg gap-1 rounded-xl bg-black/5 p-1 dark:bg-white/5">
                    <button
                        type="button"
                        role="tab"
                        id="kana-tab-hiragana"
                        aria-selected={activeTab === 'hiragana'}
                        aria-controls="kana-panel"
                        tabIndex={activeTab === 'hiragana' ? 0 : -1}
                        onClick={() => setActiveTab('hiragana')}
                        onKeyDown={handleTabKeyDown}
                        className={`min-h-11 flex-1 rounded-lg px-3 py-2 text-sm font-black transition-colors ${focusRing} ${activeTab === 'hiragana' ? 'bg-[var(--card-bg)] text-blue-600 dark:text-blue-400 shadow-md ring-1 ring-blue-500/20' : 'text-gray-500 hover:text-foreground dark:text-gray-400'}`}
                    >
                        Hiragana <span className="opacity-60">(ひらがな)</span>
                    </button>
                    <button
                        type="button"
                        role="tab"
                        id="kana-tab-katakana"
                        aria-selected={activeTab === 'katakana'}
                        aria-controls="kana-panel"
                        tabIndex={activeTab === 'katakana' ? 0 : -1}
                        onClick={() => setActiveTab('katakana')}
                        onKeyDown={handleTabKeyDown}
                        className={`min-h-11 flex-1 rounded-lg px-3 py-2 text-sm font-black transition-colors ${focusRing} ${activeTab === 'katakana' ? 'bg-[var(--card-bg)] text-emerald-600 dark:text-emerald-400 shadow-md ring-1 ring-emerald-500/20' : 'text-gray-500 hover:text-foreground dark:text-gray-400'}`}
                    >
                        Katakana <span className="opacity-60">(カタカナ)</span>
                    </button>
                </div>
            </div>

            <div id="kana-panel" role="tabpanel" aria-labelledby={`kana-tab-${activeTab}`} className="pt-5">
                <nav aria-label="Navigasi bagian kana" className="mb-5 flex flex-wrap justify-center gap-2">
                    {sections.map((section) => {
                        const isUnavailable = query && !filteredSections.find((item) => item.id === section.id)?.data.length;
                        return (
                            <button
                                key={section.id}
                                type="button"
                                disabled={Boolean(isUnavailable)}
                                onClick={() => scrollToSection(section.id)}
                                className={`rounded-full border border-[var(--border-color)] px-3 py-1.5 text-xs font-bold text-foreground transition-colors hover:border-accent-blue hover:text-accent-blue disabled:cursor-not-allowed disabled:opacity-40 ${focusRing}`}
                            >
                                {section.title === 'Dakuon & Handakuon' ? 'Dakuon' : section.title}
                            </button>
                        );
                    })}
                </nav>

                <div className="mx-auto mb-8 max-w-xl">
                    <label htmlFor="kana-search" className="sr-only">Cari berdasarkan romaji atau karakter</label>
                    <div className="relative">
                        <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                        <input
                            id="kana-search"
                            type="search"
                            value={searchQuery}
                            onChange={(event) => setSearchQuery(event.target.value)}
                            placeholder="Cari romaji atau karakter kana"
                            className={`min-h-11 w-full rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] py-2.5 pl-10 pr-3 text-sm text-foreground placeholder:text-gray-500 ${focusRing}`}
                        />
                    </div>
                </div>

                {query && !hasResults && (
                    <p role="status" className="mb-8 text-center text-sm font-semibold text-gray-600 dark:text-gray-300">
                        Tidak ditemukan
                    </p>
                )}

                <div className="space-y-12 pb-12">
                    {visibleSections.map((section) => (
                        <section key={section.id} id={`kana-${activeTab}-${section.id}`} className="scroll-mt-36">
                            <div className={`mb-6 flex items-center gap-4 border-b pb-3 ${activeTab === 'hiragana' ? 'border-accent-blue/40' : 'border-accent-green/40'}`}>
                                <h2 className={`font-japanese text-xl font-bold sm:text-2xl ${activeTab === 'hiragana' ? 'text-accent-blue' : 'text-accent-green'}`}>
                                    {section.title}
                                </h2>
                                <span className={`text-xs font-bold uppercase tracking-widest ${subTextColor}`}>
                                    {section.description}
                                </span>
                            </div>
                            {renderChart(section)}
                        </section>
                    ))}
                </div>
            </div>
        </div>
    );
}