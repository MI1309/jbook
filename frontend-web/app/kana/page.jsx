'use client';

import { useState } from 'react';
import { useTheme } from '@/context/ThemeContext';
import {
    hiraganaGojuon, hiraganaDakuon, hiraganaYoon,
    katakanaGojuon, katakanaDakuon, katakanaYoon
} from '@/data/kana';
import KanaStrokeCard from '@/components/kanji/KanaStrokeCard';

export default function KanaPage() {
    const { theme, mounted } = useTheme();
    const [activeTab, setActiveTab] = useState('hiragana');

    const isDark = mounted && theme === 'dark';
    const textColor = !mounted ? 'text-black' : (isDark ? 'text-white' : 'text-black');
    const subTextColor = !mounted ? 'text-gray-500' : (isDark ? 'text-gray-400' : 'text-gray-500');

    const renderChart = (data, isYoon = false) => {
        const cols = isYoon ? 'grid-cols-3' : 'grid-cols-5';

        return (
            <div className={`grid ${cols} gap-2 sm:gap-3 md:gap-4 w-full max-w-4xl mx-auto`}>
                {data.map((item, index) => (
                    <KanaStrokeCard 
                        key={index}
                        char={item.kana}
                        romaji={item.romaji}
                        isDark={isDark}
                        textColor={textColor}
                        activeTab={activeTab}
                    />
                ))}
            </div>
        );
    };

    const sectionBorderColor = activeTab === 'hiragana'
        ? 'border-accent-blue/40'
        : 'border-accent-green/40';

    const sectionTitleColor = activeTab === 'hiragana'
        ? 'text-accent-blue'
        : 'text-accent-green';

    return (
        <div className="container mx-auto px-4 py-8 md:py-12 min-h-screen transition-colors duration-300">
            {/* Page Header */}
            <div className="text-center mb-8 md:mb-12">
                <h1 className={`text-3xl md:text-5xl font-japanese font-black tracking-tight mb-3 transition-colors ${textColor}`}>
                    かな <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-blue to-accent-green">Kana</span>
                </h1>
                <div className="h-1 w-20 bg-gradient-to-r from-accent-blue to-accent-green rounded-full mx-auto mb-4" />
                <p className={`text-sm md:text-base max-w-2xl mx-auto transition-colors ${subTextColor}`}>
                    Tabel referensi lengkap huruf Jepang dasar. Klik pada huruf untuk melihat animasi cara tulisnya.
                </p>
            </div>

            {/* Tabs */}
            <div className="flex justify-center mb-12">
                <div className={`p-1.5 rounded-2xl inline-flex shadow-inner border transition-colors ${
                    isDark ? 'bg-[#131317] border-[#212127]' : 'bg-gray-100 border-gray-200'
                }`}>
                    <button
                        onClick={() => setActiveTab('hiragana')}
                        id="kana-tab-hiragana"
                        className={`
                            px-6 sm:px-10 py-2.5 sm:py-3 rounded-xl font-bold text-sm sm:text-base transition-all duration-300
                            ${activeTab === 'hiragana'
                                ? isDark
                                    ? 'bg-accent-blue/20 text-accent-blue shadow-sm border border-accent-blue/30'
                                    : 'bg-white text-accent-blue shadow-sm'
                                : isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}
                        `}
                    >
                        Hiragana <span className="opacity-60">(ひらがな)</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('katakana')}
                        id="kana-tab-katakana"
                        className={`
                            px-6 sm:px-10 py-2.5 sm:py-3 rounded-xl font-bold text-sm sm:text-base transition-all duration-300
                            ${activeTab === 'katakana'
                                ? isDark
                                    ? 'bg-accent-green/20 text-accent-green shadow-sm border border-accent-green/30'
                                    : 'bg-white text-accent-green shadow-sm'
                                : isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}
                        `}
                    >
                        Katakana <span className="opacity-60">(カタカナ)</span>
                    </button>
                </div>
            </div>

            {/* Charts Section */}
            <div className="space-y-16">

                {/* Gojuon */}
                <section>
                    <div className={`flex items-center gap-4 mb-6 pb-3 border-b ${sectionBorderColor}`}>
                        <h2 className={`text-xl sm:text-2xl font-japanese font-bold ${sectionTitleColor}`}>
                            Gojuon
                        </h2>
                        <span className={`text-xs font-bold uppercase tracking-widest ${subTextColor}`}>
                            Huruf Dasar
                        </span>
                    </div>
                    {renderChart(activeTab === 'hiragana' ? hiraganaGojuon : katakanaGojuon)}
                </section>

                {/* Dakuon */}
                <section>
                    <div className={`flex items-center gap-4 mb-6 pb-3 border-b ${sectionBorderColor}`}>
                        <h2 className={`text-xl sm:text-2xl font-japanese font-bold ${sectionTitleColor}`}>
                            Dakuon & Handakuon
                        </h2>
                        <span className={`text-xs font-bold uppercase tracking-widest ${subTextColor}`}>
                            Teng-teng & Maru
                        </span>
                    </div>
                    {renderChart(activeTab === 'hiragana' ? hiraganaDakuon : katakanaDakuon)}
                </section>

                {/* Yoon */}
                <section>
                    <div className={`flex items-center gap-4 mb-6 pb-3 border-b ${sectionBorderColor}`}>
                        <h2 className={`text-xl sm:text-2xl font-japanese font-bold ${sectionTitleColor}`}>
                            Yoon
                        </h2>
                        <span className={`text-xs font-bold uppercase tracking-widest ${subTextColor}`}>
                            Huruf Gabungan
                        </span>
                    </div>
                    {renderChart(activeTab === 'hiragana' ? hiraganaYoon : katakanaYoon, true)}
                </section>

            </div>
        </div>
    );
}
