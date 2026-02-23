'use client';

import { useState } from 'react';
import {
    hiraganaGojuon, hiraganaDakuon, hiraganaYoon,
    katakanaGojuon, katakanaDakuon, katakanaYoon
} from '@/data/kana';

export default function KanaPage() {
    const [activeTab, setActiveTab] = useState('hiragana');

    const renderChart = (data, isYoon = false) => {
        // Grid setup: Yoon has 3 columns (a, u, o), others have 5 (a, i, u, e, o)
        const cols = isYoon ? 'grid-cols-3' : 'grid-cols-5';

        return (
            <div className={`grid ${cols} gap-2 sm:gap-3 md:gap-4 w-full max-w-4xl mx-auto`}>
                {data.map((item, index) => (
                    <div
                        key={index}
                        className={`
                            flex flex-col items-center justify-center p-2 sm:p-4 rounded-xl border
                            ${item.kana ? 'bg-white shadow-sm hover:shadow-md hover:border-red-300 transition-all border-gray-100' : 'bg-transparent border-transparent'}
                            min-h-[60px] sm:min-h-[80px] md:min-h-[100px]
                        `}
                    >
                        {item.kana && (
                            <>
                                <span className="text-2xl sm:text-4xl md:text-5xl font-medium text-gray-800 mb-1 sm:mb-2">{item.kana}</span>
                                <span className="text-[10px] sm:text-xs md:text-sm font-bold text-red-500 tracking-wider uppercase">{item.romaji}</span>
                            </>
                        )}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="container mx-auto px-4 py-8 md:py-12 min-h-screen">
            <div className="text-center mb-8 md:mb-12">
                <h1 className="text-3xl md:text-4xl font-bold text-red-600 mb-4 tracking-tight">Hiragana & Katakana</h1>
                <p className="text-gray-600 text-sm md:text-base max-w-2xl mx-auto">
                    Tabel referensi lengkap huruf Jepang dasar. Gunakan tombol di bawah untuk menukar tampilan antara Hiragana dan Katakana.
                </p>
            </div>

            {/* Tabs */}
            <div className="flex justify-center mb-12">
                <div className="bg-gray-100 p-1.5 rounded-2xl inline-flex shadow-inner">
                    <button
                        onClick={() => setActiveTab('hiragana')}
                        className={`
                            px-6 sm:px-10 py-2.5 sm:py-3 rounded-xl font-bold text-sm sm:text-base transition-all duration-300
                            ${activeTab === 'hiragana'
                                ? 'bg-white text-red-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'}
                        `}
                    >
                        Hiragana (ひらがな)
                    </button>
                    <button
                        onClick={() => setActiveTab('katakana')}
                        className={`
                            px-6 sm:px-10 py-2.5 sm:py-3 rounded-xl font-bold text-sm sm:text-base transition-all duration-300
                            ${activeTab === 'katakana'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'}
                        `}
                    >
                        Katakana (カタカナ)
                    </button>
                </div>
            </div>

            {/* Charts Section */}
            <div className="space-y-16">

                {/* Gojuon */}
                <section>
                    <h2 className={`text-xl sm:text-2xl font-bold mb-6 text-center pb-2 border-b-2 inline-block mx-auto flex justify-center ${activeTab === 'hiragana' ? 'border-red-200 text-red-800' : 'border-blue-200 text-blue-800'}`}>
                        Gojuon (Huruf Dasar)
                    </h2>
                    {renderChart(activeTab === 'hiragana' ? hiraganaGojuon : katakanaGojuon)}
                </section>

                {/* Dakuon */}
                <section>
                    <h2 className={`text-xl sm:text-2xl font-bold mb-6 text-center pb-2 border-b-2 inline-block mx-auto flex justify-center ${activeTab === 'hiragana' ? 'border-red-200 text-red-800' : 'border-blue-200 text-blue-800'}`}>
                        Dakuon & Handakuon (Teng-teng & Maru)
                    </h2>
                    {renderChart(activeTab === 'hiragana' ? hiraganaDakuon : katakanaDakuon)}
                </section>

                {/* Yoon */}
                <section>
                    <h2 className={`text-xl sm:text-2xl font-bold mb-6 text-center pb-2 border-b-2 inline-block mx-auto flex justify-center ${activeTab === 'hiragana' ? 'border-red-200 text-red-800' : 'border-blue-200 text-blue-800'}`}>
                        Yoon (Huruf Gabungan)
                    </h2>
                    {renderChart(activeTab === 'hiragana' ? hiraganaYoon : katakanaYoon, true)}
                </section>

            </div>
        </div>
    );
}
