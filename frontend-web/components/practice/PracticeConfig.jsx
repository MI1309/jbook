'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { getBunpoLevelVisibility, getKanjiLevelVisibility, getVocabLevelVisibility } from '@/lib/api';
import AppMessage from '@/components/common/AppMessage';

export default function PracticeConfig() {
    const { theme, mounted } = useTheme();
    const router = useRouter();
    const [limit, setLimit] = useState(10);
    const [timer, setTimer] = useState(5); // Default 5 minutes
    const [isUnlimitedTime, setIsUnlimitedTime] = useState(false);
    
    // JLPT states
    const [mode, setMode] = useState('choice');
    const [selectedTypes, setSelectedTypes] = useState(['kanji']);
    const [selectedLevels, setSelectedLevels] = useState([]); // Default semua level
    const [selectionWarning, setSelectionWarning] = useState(false);

    const [kanjiEnabledLevels, setKanjiEnabledLevels] = useState([4, 5]);
    const [vocabEnabledLevels, setVocabEnabledLevels] = useState([1, 2, 3, 4, 5]);
    const [bunpoEnabledLevels, setBunpoEnabledLevels] = useState([1, 2, 3, 4, 5]);
    const jlptLevels = [
        { id: '5', label: 'N5' },
        { id: '4', label: 'N4' },
        { id: '3', label: 'N3' },
        { id: '2', label: 'N2' },
        { id: '1', label: 'N1' },
    ];
    const kanjiAvailable = kanjiEnabledLevels.length > 0;
    const vocabAvailable = vocabEnabledLevels.length > 0;
    const bunpoAvailable = bunpoEnabledLevels.length > 0;
    const unrestrictedOnly = selectedTypes.length > 0 && selectedTypes.every(type => ['particle', 'kana'].includes(type));

    const isLevelEnabledForSelection = (levelId, types = selectedTypes, enabled = {
        kanji: kanjiEnabledLevels,
        vocab: vocabEnabledLevels,
        bunpo: bunpoEnabledLevels,
    }) => {
        const level = Number(levelId);
        const hasUnrestrictedType = types.some(t => ['particle', 'kana'].includes(t));
        if (hasUnrestrictedType) return true;

        const allowedLevels = [];
        if (types.includes('kanji')) allowedLevels.push(...enabled.kanji);
        if (types.includes('vocab')) allowedLevels.push(...enabled.vocab);
        if (types.includes('grammar')) allowedLevels.push(...enabled.bunpo);
        return allowedLevels.length === 0 || allowedLevels.includes(level);
    };

    const syncVisibility = () => {
        return Promise.all([getKanjiLevelVisibility(), getVocabLevelVisibility(), getBunpoLevelVisibility()]).then(([kanjiData, vocabData, bunpoData]) => {
            const kanjiEnabled = (kanjiData.enabled_levels || [4, 5]).map(Number);
            const vocabEnabled = (vocabData.enabled_levels || [1, 2, 3, 4, 5]).map(Number);
            const bunpoEnabled = (bunpoData.enabled_levels || [1, 2, 3, 4, 5]).map(Number);
            setKanjiEnabledLevels(kanjiEnabled);
            setVocabEnabledLevels(vocabEnabled);
            setBunpoEnabledLevels(bunpoEnabled);

            setSelectedTypes(current => {
                const next = current.filter(type =>
                    (type !== 'kanji' || kanjiEnabled.length > 0) &&
                    (type !== 'vocab' || vocabEnabled.length > 0) &&
                    (type !== 'grammar' || bunpoEnabled.length > 0)
                );
                if (current.length > 0 && next.length === 0) {
                    const fallbackType = ['kanji', 'vocab', 'grammar', 'particle', 'kana'].find(t =>
                        (t !== 'kanji' || kanjiEnabled.length > 0) &&
                        (t !== 'vocab' || vocabEnabled.length > 0) &&
                        (t !== 'grammar' || bunpoEnabled.length > 0)
                    );
                    return [fallbackType || 'grammar'];
                }
                return next;
            });
            setSelectedLevels(current => current.filter(level => {
                const types = selectedTypes.filter(type =>
                    (type !== 'kanji' || kanjiEnabled.length > 0) &&
                    (type !== 'vocab' || vocabEnabled.length > 0) &&
                    (type !== 'grammar' || bunpoEnabled.length > 0)
                );
                const resolvedTypes = types.length > 0 ? types : ['grammar'];
                return isLevelEnabledForSelection(level, resolvedTypes, {
                    kanji: kanjiEnabled,
                    vocab: vocabEnabled,
                    bunpo: bunpoEnabled,
                });
            }));
        });
    };

    useEffect(() => {
        syncVisibility();

        const handleVisibilityUpdated = () => {
            syncVisibility();
        };
        window.addEventListener('jbook:visibility-updated', handleVisibilityUpdated);
        return () => window.removeEventListener('jbook:visibility-updated', handleVisibilityUpdated);
    }, []);

    const types = [
        { id: 'kana', label: 'Kana', icon: 'あ', sub: 'Hiragana & Katakana' },
        { id: 'kanji', label: 'Kanji', icon: '🈁', sub: 'Onyomi & Kunyomi' },
        { id: 'vocab', label: 'Kotoba', icon: '📖', sub: 'Kosakata' },
        { id: 'grammar', label: 'Bunpo', icon: '📝', sub: 'Tata Bahasa' },
        { id: 'particle', label: 'Partikel', icon: '🔗', sub: 'は, が, を' },
    ];

    const toggleType = (id) => {
        if (id === 'particle') return;
        if (id === 'kanji' && !kanjiAvailable) return;
        if (id === 'vocab' && !vocabAvailable) return;
        if (id === 'grammar' && !bunpoAvailable) return;
        setSelectionWarning(false);
        setSelectedTypes(prev => {
            const next = prev.includes(id)
                ? prev.filter(t => t !== id)
                : [...prev, id];
            setSelectedLevels(current => current.filter(level => isLevelEnabledForSelection(level, next)));
            return next;
        });
    };

    const toggleLevel = (id) => {
        if (!isLevelEnabledForSelection(id)) return;
        setSelectedLevels(prev =>
            prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]
        );
    };

    const handleStart = () => {
        if (selectedTypes.length === 0) {
            setSelectionWarning(true);
            return;
        }

        setSelectionWarning(false);
        sessionStorage.removeItem('guest_practice_session');

        // Parse and validate inputs before starting
        const finalLimit = Math.max(1, parseInt(limit) || 10);
        const finalTimer = Math.max(1, parseInt(timer) || 5);

        const params = new URLSearchParams();
        params.append('limit', finalLimit);
        
        const activeTypes = selectedTypes.filter(type =>
            type !== 'particle' &&
            (type !== 'kanji' || kanjiAvailable) &&
            (type !== 'vocab' || vocabAvailable) &&
            (type !== 'grammar' || bunpoAvailable)
        );
        if (activeTypes.length === 0) {
            setSelectionWarning(true);
            return;
        }

        const unrestrictedOnly = activeTypes.length > 0 && activeTypes.every(type => ['particle', 'kana'].includes(type));
        const activeLevels = unrestrictedOnly
            ? []
            : selectedLevels.filter(level => isLevelEnabledForSelection(level, activeTypes));
        if (!unrestrictedOnly && selectedLevels.length > 0 && activeLevels.length === 0) return;
        params.append('type', activeTypes.join(','));
        const particlesOnly = activeTypes.length === 1 && activeTypes[0] === 'particle';
        if (!particlesOnly && activeLevels.length > 0) {
            params.append('level', activeLevels.join(','));
        }
        params.append('mode', mode);
        
        if (!isUnlimitedTime) params.append('timer', finalTimer);
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
        <div className={`${glassBg} backdrop-blur-2xl p-4 sm:p-6 md:p-10 rounded-2xl sm:rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.12)] w-full max-w-7xl mx-auto border ${borderStyle} relative overflow-hidden transition-colors`}>
            <div className="absolute top-0 right-0 p-4 opacity-5 text-[8rem] sm:text-[12rem] font-serif select-none pointer-events-none text-blue-900 leading-none">
                学
            </div>

            <div className="relative z-10">
                <h2 className={`text-3xl sm:text-4xl md:text-5xl font-black mb-2 tracking-tight transition-colors ${textColor}`}>
                    Atur <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-sky-500">Latihanmu</span>
                </h2>
                <p className={`mb-6 sm:mb-10 text-sm sm:text-base md:text-lg transition-colors ${subTextColor}`}>Pilih materi, level, dan target waktu kuis hari ini.</p>

                <div className="space-y-6 sm:space-y-10">
                    {/* JLPT Specific Fields */}
                            {/* Materi Selection */}
                            <div>
                                <label className={`block text-xs sm:text-sm font-black uppercase tracking-widest mb-3 sm:mb-4 transition-colors ${subTextColor}`}>
                                    Materi Latihan
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 sm:gap-4">
                                    {types.map(t => {
                                        const temporarilyDisabled = t.id === 'particle';
                                        const featureDisabled = temporarilyDisabled || (t.id === 'kanji' && !kanjiAvailable) || (t.id === 'vocab' && !vocabAvailable) || (t.id === 'grammar' && !bunpoAvailable);
                                        const kakitoriDisabled = mode === 'kakitori' && (!['vocab'].includes(t.id) || !vocabAvailable);
                                        const typeDisabled = kakitoriDisabled || featureDisabled;
                                        const isSelected = selectedTypes.includes(t.id) && !typeDisabled;
                                        const disabledTitle = (t.id === 'kanji' && !kanjiAvailable)
                                            ? 'Kanji dinonaktifkan oleh admin'
                                            : (t.id === 'vocab' && !vocabAvailable)
                                                ? 'Kotoba dinonaktifkan oleh admin'
                                                : (t.id === 'grammar' && !bunpoAvailable)
                                                    ? 'Semua level Bunpo dinonaktifkan oleh admin'
                                                    : temporarilyDisabled
                                                        ? 'Latihan Partikel dinonaktifkan sementara'
                                                : kakitoriDisabled
                                                    ? 'Tidak tersedia untuk mode Kakitori'
                                                    : '';
                                        return (
                                            <button
                                                key={t.id}
                                                onClick={() => !typeDisabled && toggleType(t.id)}
                                                disabled={typeDisabled}
                                                title={disabledTitle}
                                                className={`flex flex-col items-center justify-center p-3.5 sm:p-4 rounded-2xl border-2 transition-all duration-300 ${
                                                    typeDisabled
                                                        ? `${cardBg} ${borderStyle} opacity-35 cursor-not-allowed grayscale`
                                                        : isSelected
                                                            ? 'bg-gradient-to-br from-blue-50 to-sky-50 dark:from-blue-950/30 dark:to-sky-950/10 border-blue-500 shadow-lg shadow-blue-500/20 transform hover:scale-[1.03] cursor-pointer'
                                                            : `${cardBg} ${borderStyle} hover:border-blue-300 dark:hover:border-blue-800 hover:shadow-md transform hover:scale-[1.03] cursor-pointer`
                                                }`}
                                            >
                                                <span className="text-2xl sm:text-3xl mb-1">{typeDisabled ? '🔒' : t.icon}</span>
                                                <span className={`font-bold text-xs sm:text-sm transition-colors ${
                                                    typeDisabled ? subTextColor : isSelected ? 'text-blue-700 dark:text-blue-400' : textColor
                                                }`}>
                                                    {t.label}
                                                </span>
                                                <span className={`text-[9px] sm:text-[10px] mt-0.5 uppercase font-medium transition-colors ${subTextColor} text-center`}>
                                                    {temporarilyDisabled ? 'Dinonaktifkan sementara' : featureDisabled ? 'Dinonaktifkan' : kakitoriDisabled ? 'Tidak tersedia' : t.sub}
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
                                                ? 'bg-gradient-to-br from-blue-50 to-sky-50 dark:from-blue-950/30 dark:to-sky-950/10 border-blue-500 shadow-lg shadow-blue-500/20'
                                                : `${cardBg} ${borderStyle} hover:border-blue-300 dark:hover:border-blue-800 hover:shadow-md`
                                        }`}
                                    >
                                        <span className="text-3xl">🔠</span>
                                        <div className="text-left">
                                            <span className={`block font-bold transition-colors ${mode === 'choice' ? 'text-blue-700 dark:text-blue-400' : textColor}`}>
                                                Pilihan Ganda
                                            </span>
                                            <span className={`text-[10px] uppercase font-medium transition-colors ${subTextColor}`}>Pilih satu dari empat jawaban</span>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => {
                                            if (!vocabAvailable) return;
                                            setMode('kakitori');
                                            const kakitoriAllowed = ['vocab'];
                                            const filtered = selectedTypes.filter(t => kakitoriAllowed.includes(t));
                                            setSelectedTypes(filtered.length > 0 ? filtered : ['vocab']);
                                        }}
                                        disabled={!vocabAvailable}
                                        title={!vocabAvailable ? 'Kotoba dinonaktifkan oleh admin' : ''}
                                        className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-300 transform hover:scale-[1.01] ${
                                            !vocabAvailable
                                                ? `${cardBg} ${borderStyle} opacity-35 cursor-not-allowed grayscale`
                                                : mode === 'kakitori'
                                                    ? 'bg-gradient-to-br from-blue-50 to-sky-50 dark:from-blue-950/30 dark:to-sky-950/10 border-blue-500 shadow-lg shadow-blue-500/20 cursor-pointer'
                                                    : `${cardBg} ${borderStyle} hover:border-blue-300 dark:hover:border-blue-800 hover:shadow-md cursor-pointer`
                                        }`}
                                    >
                                        <span className="text-3xl">{!vocabAvailable ? '🔒' : '🎧'}</span>
                                        <div className="text-left">
                                            <span className={`block font-bold transition-colors ${!vocabAvailable ? subTextColor : mode === 'kakitori' ? 'text-blue-700 dark:text-blue-400' : textColor}`}>
                                                Kakitori (Dikte / Tulis Suara)
                                            </span>
                                            <span className={`text-[10px] uppercase font-medium transition-colors ${subTextColor}`}>
                                                {!vocabAvailable ? 'Dinonaktifkan oleh admin' : 'Dengar audio & tulis dalam Kana'}
                                            </span>
                                        </div>
                                    </button>
                                </div>
                            </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {/* JLPT Levels */}
                        {!unrestrictedOnly && (
                            <div>
                                <label className={`block text-sm font-black uppercase tracking-widest mb-4 transition-colors ${subTextColor}`}>
                                    JLPT Level
                                </label>
                                <div className="flex flex-wrap gap-3">
                                    {jlptLevels.map(l => {
                                        const levelDisabled = !isLevelEnabledForSelection(l.id);
                                        const isSelected = selectedLevels.includes(l.id) && !levelDisabled;
                                        return (
                                        <button
                                            key={l.id}
                                            onClick={() => toggleLevel(l.id)}
                                            disabled={levelDisabled}
                                            title={levelDisabled ? 'Level ini dinonaktifkan oleh admin' : ''}
                                            className={`w-12 h-12 rounded-xl border-2 font-black transition-all duration-300 ${
                                                levelDisabled
                                                    ? `${cardBg} ${borderStyle} ${subTextColor} opacity-35 cursor-not-allowed grayscale`
                                                    : isSelected
                                                        ? 'bg-gradient-to-br from-blue-600 to-sky-600 border-transparent text-white shadow-lg shadow-blue-500/30 scale-110 transform hover:scale-110'
                                                        : `${cardBg} ${borderStyle} ${subTextColor} hover:border-blue-300 dark:hover:border-blue-800 hover:text-blue-600 dark:hover:text-blue-400 transform hover:scale-110`
                                            }`}
                                        >
                                            {l.label}
                                        </button>
                                        );
                                    })}
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
                        <div className={`space-y-6 ${unrestrictedOnly ? 'col-span-2' : ''}`}>
                            <div className="grid grid-cols-1 items-start gap-5 sm:grid-cols-2 sm:gap-6">
                                <div className="min-w-0">
                                    <label className={`block text-sm font-black uppercase tracking-widest mb-2 transition-colors ${subTextColor}`}>
                                        Jumlah Soal
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="number"
                                            value={limit}
                                            onChange={(e) => setLimit(e.target.value)}
                                            placeholder="10"
                                            className={`h-12 w-full ${inputBg} border-2 ${borderStyle} rounded-xl px-4 font-bold transition-all outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 ${textColor}`}
                                        />
                                        <span className={`font-bold transition-colors ${subTextColor}`}>Soal</span>
                                    </div>
                                </div>
                                <div className="min-w-0">
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
                                                className={`h-12 w-full ${inputBg} border-2 ${borderStyle} rounded-xl px-4 font-bold transition-all outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 ${textColor}`}
                                            />
                                            <span className={`font-bold transition-colors ${subTextColor}`}>Menit</span>
                                        </div>
                                        <label className="flex items-center gap-2 cursor-pointer mt-1 select-none">
                                            <input 
                                                type="checkbox" 
                                                checked={isUnlimitedTime} 
                                                onChange={() => setIsUnlimitedTime(!isUnlimitedTime)}
                                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300 cursor-pointer"
                                            />
                                            <span className={`text-sm font-bold transition-colors hover:text-blue-600 ${subTextColor}`}>Tanpa Batas Waktu</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {selectionWarning && (
                    <AppMessage variant="warning" className="mt-8">
                        Pilih minimal satu materi latihan sebelum memulai.
                    </AppMessage>
                )}

                <button
                    onClick={handleStart}
                    className="w-full mt-6 relative overflow-hidden bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white font-black py-5 rounded-2xl text-xl shadow-[0_0_40px_rgba(37,99,235,0.28)] transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 group border border-white/20"
                >
                    <span className="relative z-10">Mulai Latihan Sekarang</span>
                    <span className="text-2xl transition-transform group-hover:translate-x-2 relative z-10">→</span>
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-0"></div>
                </button>
            </div>
        </div>
    );
}
