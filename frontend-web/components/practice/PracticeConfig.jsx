'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';

export default function PracticeConfig() {
    const { theme, mounted } = useTheme();
    const router = useRouter();
    const [limit, setLimit] = useState(10);
    const [timer, setTimer] = useState(5); // Default 5 minutes
    const [isUnlimitedTime, setIsUnlimitedTime] = useState(false);
    const [mode, setMode] = useState('choice'); // 'choice' or 'kakitori'
    
    // Multi-select states
    const [selectedTypes, setSelectedTypes] = useState(['kanji']);
    const [selectedLevels, setSelectedLevels] = useState(['5', '4']); // Default N5 & N4

    const types = [
        { id: 'kana', label: 'Kana', icon: 'あ', sub: 'Hiragana & Katakana' },
        { id: 'kanji', label: 'Kanji', icon: '🈁', sub: 'Onyomi & Kunyomi' },
        { id: 'vocab', label: 'Kotoba', icon: '📖', sub: 'Kosakata' },
        { id: 'grammar', label: 'Bunpo', icon: '📝', sub: 'Tata Bahasa' },
        { id: 'particle', label: 'Partikel', icon: '🔗', sub: 'は, が, を' },
    ];

    const jlptLevels = [
        { id: '5', label: 'N5', color: 'bg-green-100 text-green-700 border-green-200' },
        { id: '4', label: 'N4', color: 'bg-blue-100 text-blue-700 border-blue-200' },
        { id: '3', label: 'N3', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
        { id: '2', label: 'N2', color: 'bg-orange-100 text-orange-700 border-orange-200' },
        { id: '1', label: 'N1', color: 'bg-red-100 text-red-700 border-red-200' },
    ];

    const toggleType = (id) => {
        setSelectedTypes(prev => 
            prev.includes(id) 
                ? (prev.length > 1 ? prev.filter(t => t !== id) : prev) 
                : [...prev, id]
        );
    };

    const toggleLevel = (id) => {
        setSelectedLevels(prev => 
            prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]
        );
    };

    const handleStart = () => {
        sessionStorage.removeItem('guest_practice_session');

        // Parse and validate inputs before starting
        const finalLimit = Math.max(1, parseInt(limit) || 10);
        const finalTimer = Math.max(1, parseInt(timer) || 5);

        const params = new URLSearchParams();
        params.append('limit', finalLimit);
        params.append('type', selectedTypes.join(','));
        if (selectedLevels.length > 0) {
            params.append('level', selectedLevels.join(','));
        }
        if (!isUnlimitedTime) params.append('timer', finalTimer);
        params.append('mode', mode);
        params.append('play', 'true');
        
        router.push(`?${params.toString()}`);
    };

    const textColor = !mounted ? 'text-black' : (theme === 'dark' ? 'text-white' : 'text-black');
    const subTextColor = !mounted ? 'text-gray-400' : (theme === 'dark' ? 'text-gray-500' : 'text-gray-400');
    const cardBg = !mounted ? 'bg-white' : (theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-white');
    const glassBg = !mounted ? 'bg-white/60' : (theme === 'dark' ? 'bg-[#0a0a0a]/60' : 'bg-white/60');
    const inputBg = !mounted ? 'bg-gray-50' : (theme === 'dark' ? 'bg-black/40' : 'bg-gray-50');
    const borderStyle = !mounted ? 'border-gray-100' : (theme === 'dark' ? 'border-white/5' : 'border-white/60');

    return (
        <div className={`${glassBg} backdrop-blur-2xl p-6 md:p-10 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.12)] max-w-3xl mx-auto border ${borderStyle} relative overflow-hidden transition-colors`}>
            <div className="absolute top-0 right-0 p-4 opacity-5 text-[12rem] font-serif select-none pointer-events-none text-red-900 leading-none">
                学
            </div>

            <div className="relative z-10">
                <h2 className={`text-4xl md:text-5xl font-black mb-2 tracking-tight transition-colors ${textColor}`}>
                    Atur <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-rose-500">Latihanmu</span>
                </h2>
                <p className={`mb-10 text-lg transition-colors ${subTextColor}`}>Pilih materi, level, dan target waktu kuis hari ini.</p>

                <div className="space-y-10">
                    {/* Materi Selection */}
                    <div>
                        <label className={`block text-sm font-black uppercase tracking-widest mb-4 transition-colors ${subTextColor}`}>
                            Materi Latihan
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {types.map(t => {
                                const kakitoriDisabled = mode === 'kakitori' && !['kanji', 'vocab'].includes(t.id);
                                const isSelected = selectedTypes.includes(t.id);
                                return (
                                    <button
                                        key={t.id}
                                        onClick={() => !kakitoriDisabled && toggleType(t.id)}
                                        disabled={kakitoriDisabled}
                                        title={kakitoriDisabled ? 'Tidak tersedia untuk mode Kakitori' : ''}
                                        className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-300 ${
                                            kakitoriDisabled
                                                ? `${cardBg} ${borderStyle} opacity-35 cursor-not-allowed grayscale`
                                                : isSelected
                                                    ? 'bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/10 border-red-500 shadow-lg shadow-red-500/20 transform hover:scale-[1.03]'
                                                    : `${cardBg} ${borderStyle} hover:border-red-300 dark:hover:border-red-800 hover:shadow-md transform hover:scale-[1.03]`
                                        }`}
                                    >
                                        <span className="text-3xl mb-2">{kakitoriDisabled ? '🔒' : t.icon}</span>
                                        <span className={`font-bold transition-colors ${
                                            kakitoriDisabled ? subTextColor : isSelected ? 'text-red-700 dark:text-red-400' : textColor
                                        }`}>
                                            {t.label}
                                        </span>
                                        <span className={`text-[10px] mt-1 uppercase font-medium transition-colors ${subTextColor}`}>
                                            {kakitoriDisabled ? 'Tidak tersedia' : t.sub}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Mode Latihan Selection */}
                    <div>
                        <label className={`block text-sm font-black uppercase tracking-widest mb-4 transition-colors ${subTextColor}`}>
                            Mode Latihan
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button
                                onClick={() => setMode('choice')}
                                className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-300 transform hover:scale-[1.01] ${
                                    mode === 'choice'
                                        ? 'bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/10 border-red-500 shadow-lg shadow-red-500/20'
                                        : `${cardBg} ${borderStyle} hover:border-red-300 dark:hover:border-red-800 hover:shadow-md`
                                }`}
                            >
                                <span className="text-3xl">🔠</span>
                                <div className="text-left">
                                    <span className={`block font-bold transition-colors ${mode === 'choice' ? 'text-red-700 dark:text-red-400' : textColor}`}>
                                        Pilihan Ganda
                                    </span>
                                    <span className={`text-[10px] uppercase font-medium transition-colors ${subTextColor}`}>Pilih satu dari empat jawaban</span>
                                </div>
                            </button>

                            <button
                                onClick={() => {
                                    setMode('kakitori');
                                    // Keep only kanji & vocab — disable kana, grammar, particle for kakitori
                                    const kakitoriAllowed = ['kanji', 'vocab'];
                                    const filtered = selectedTypes.filter(t => kakitoriAllowed.includes(t));
                                    setSelectedTypes(filtered.length > 0 ? filtered : ['vocab']);
                                }}
                                className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-300 transform hover:scale-[1.01] ${
                                    mode === 'kakitori'
                                        ? 'bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/10 border-red-500 shadow-lg shadow-red-500/20'
                                        : `${cardBg} ${borderStyle} hover:border-red-300 dark:hover:border-red-800 hover:shadow-md`
                                }`}
                            >
                                <span className="text-3xl">🎧</span>
                                <div className="text-left">
                                    <span className={`block font-bold transition-colors ${mode === 'kakitori' ? 'text-red-700 dark:text-red-400' : textColor}`}>
                                        Kakitori (Dikte / Tulis Suara)
                                    </span>
                                    <span className={`text-[10px] uppercase font-medium transition-colors ${subTextColor}`}>Dengar audio & tulis dalam Hiragana/Katakana</span>
                                </div>
                            </button>
                        </div>
                    </div>

                    <div className={`grid grid-cols-1 ${selectedTypes.length === 1 && selectedTypes[0] === 'kana' ? 'md:grid-cols-1' : 'md:grid-cols-2'} gap-10`}>
                        {/* JLPT Levels - Hide if only Kana selected */}
                        {!(selectedTypes.length === 1 && selectedTypes[0] === 'kana') && (
                            <div>
                                <label className={`block text-sm font-black uppercase tracking-widest mb-4 transition-colors ${subTextColor}`}>
                                    JLPT Level
                                </label>
                                <div className="flex flex-wrap gap-3">
                                    {jlptLevels.map(l => (
                                        <button
                                            key={l.id}
                                            onClick={() => toggleLevel(l.id)}
                                            className={`w-12 h-12 rounded-xl border-2 font-black transition-all duration-300 transform hover:scale-110 ${
                                                selectedLevels.includes(l.id)
                                                    ? 'bg-gradient-to-br from-red-500 to-rose-600 border-transparent text-white shadow-lg shadow-red-500/30 scale-110'
                                                    : `${cardBg} ${borderStyle} ${subTextColor} hover:border-red-300 dark:hover:border-red-800 hover:text-red-500 dark:hover:text-red-400`
                                            }`}
                                        >
                                            {l.label}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => setSelectedLevels([])}
                                        className={`px-4 h-12 rounded-xl border-2 font-bold transition-all duration-300 transform hover:scale-105 ${
                                            selectedLevels.length === 0
                                                ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-transparent text-white shadow-lg shadow-gray-900/20'
                                                : `${cardBg} ${borderStyle} ${subTextColor} hover:bg-gray-50 dark:hover:bg-gray-900`
                                        }`}
                                    >
                                        Semua
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Limits and Time */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex-1">
                                    <label className={`block text-sm font-black uppercase tracking-widest mb-2 transition-colors ${subTextColor}`}>
                                        Jumlah Soal
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="number"
                                            value={limit}
                                            onChange={(e) => setLimit(e.target.value)}
                                            placeholder="10"
                                            className={`w-full ${inputBg} border-2 ${borderStyle} rounded-xl px-4 py-3 font-bold transition-all outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/20 ${textColor}`}
                                        />
                                        <span className={`font-bold transition-colors ${subTextColor}`}>Soal</span>
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <label className={`block text-sm font-black uppercase tracking-widest mb-2 transition-colors ${subTextColor}`}>
                                        Waktu
                                    </label>
                                    <div className="flex flex-col gap-2">
                                        <div className={`flex items-center gap-3 transition-opacity ${isUnlimitedTime ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                                            <input
                                                type="number"
                                                value={timer}
                                                onChange={(e) => setTimer(e.target.value)}
                                                disabled={isUnlimitedTime}
                                                placeholder="5"
                                                className={`w-full ${inputBg} border-2 ${borderStyle} rounded-xl px-4 py-3 font-bold transition-all outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/20 ${textColor}`}
                                            />
                                            <span className={`font-bold transition-colors ${subTextColor}`}>Menit</span>
                                        </div>
                                        <label className="flex items-center gap-2 cursor-pointer mt-1 select-none">
                                            <input 
                                                type="checkbox" 
                                                checked={isUnlimitedTime} 
                                                onChange={() => setIsUnlimitedTime(!isUnlimitedTime)}
                                                className="w-4 h-4 text-red-600 rounded focus:ring-red-500 border-gray-300 cursor-pointer"
                                            />
                                            <span className={`text-sm font-bold transition-colors hover:text-red-500 ${subTextColor}`}>Tanpa Batas Waktu</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleStart}
                    className="w-full mt-12 relative overflow-hidden bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black py-5 rounded-2xl text-xl shadow-[0_0_40px_rgba(225,29,72,0.3)] transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 group border border-white/20"
                >
                    <span className="relative z-10">Mulai Kuis Sekarang</span>
                    <span className="text-2xl transition-transform group-hover:translate-x-2 relative z-10">→</span>
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-0"></div>
                </button>
            </div>
        </div>
    );
}
