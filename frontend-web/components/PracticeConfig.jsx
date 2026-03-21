'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PracticeConfig() {
    const router = useRouter();
    const [limit, setLimit] = useState(10);
    const [timer, setTimer] = useState(5); // Default 5 minutes
    
    // Multi-select states
    const [selectedTypes, setSelectedTypes] = useState(['kanji']);
    const [selectedLevels, setSelectedLevels] = useState(['5', '4']); // Default N5 & N4

    const types = [
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

        const params = new URLSearchParams();
        params.append('limit', limit);
        params.append('type', selectedTypes.join(','));
        if (selectedLevels.length > 0) {
            params.append('level', selectedLevels.join(','));
        }
        if (timer) params.append('timer', timer);
        
        router.push(`/practice/start?${params.toString()}`);
    };

    return (
        <div className="bg-white/80 backdrop-blur-md p-6 md:p-10 rounded-3xl shadow-2xl max-w-3xl mx-auto border border-white/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 text-[12rem] font-serif select-none pointer-events-none text-red-900 leading-none">
                学
            </div>

            <div className="relative z-10">
                <h2 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">Atur Latihanmu</h2>
                <p className="text-gray-500 mb-10 text-lg">Pilih materi, level, dan target waktu kuis hari ini.</p>

                <div className="space-y-10">
                    {/* Materi Selection */}
                    <div>
                        <label className="block text-sm font-black text-gray-400 uppercase tracking-widest mb-4">
                            Materi Latihan
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {types.map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => toggleType(t.id)}
                                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-300 ${
                                        selectedTypes.includes(t.id)
                                            ? 'bg-red-50 border-red-500 shadow-lg shadow-red-100'
                                            : 'bg-white border-gray-100 hover:border-red-200 hover:bg-red-50/30'
                                    }`}
                                >
                                    <span className="text-3xl mb-2">{t.icon}</span>
                                    <span className={`font-bold ${selectedTypes.includes(t.id) ? 'text-red-700' : 'text-gray-700'}`}>
                                        {t.label}
                                    </span>
                                    <span className="text-[10px] text-gray-400 mt-1 uppercase font-medium">{t.sub}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {/* JLPT Levels */}
                        <div>
                            <label className="block text-sm font-black text-gray-400 uppercase tracking-widest mb-4">
                                JLPT Level
                            </label>
                            <div className="flex flex-wrap gap-3">
                                {jlptLevels.map(l => (
                                    <button
                                        key={l.id}
                                        onClick={() => toggleLevel(l.id)}
                                        className={`w-12 h-12 rounded-xl border-2 font-black transition-all ${
                                            selectedLevels.includes(l.id)
                                                ? 'bg-red-600 border-red-600 text-white shadow-lg shadow-red-100 scale-110'
                                                : 'bg-white border-gray-100 text-gray-400 hover:border-red-200'
                                        }`}
                                    >
                                        {l.label}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setSelectedLevels([])}
                                    className={`px-4 h-12 rounded-xl border-2 font-bold transition-all ${
                                        selectedLevels.length === 0
                                            ? 'bg-gray-800 border-gray-800 text-white'
                                            : 'bg-white border-gray-100 text-gray-400 hover:bg-gray-50'
                                    }`}
                                >
                                    Semua
                                </button>
                            </div>
                        </div>

                        {/* Limits and Time */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-black text-gray-400 uppercase tracking-widest mb-2">
                                        Jumlah Soal
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="number"
                                            value={limit}
                                            onChange={(e) => setLimit(Math.max(1, parseInt(e.target.value) || 0))}
                                            className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 font-bold text-gray-700 focus:border-red-500 transition-colors outline-none"
                                        />
                                        <span className="text-gray-400 font-bold">Soal</span>
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-black text-gray-400 uppercase tracking-widest mb-2">
                                        Waktu
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="number"
                                            value={timer}
                                            onChange={(e) => setTimer(Math.max(1, parseInt(e.target.value) || 0))}
                                            className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 font-bold text-gray-700 focus:border-red-500 transition-colors outline-none"
                                        />
                                        <span className="text-gray-400 font-bold">Menit</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleStart}
                    className="w-full mt-12 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-black py-5 rounded-2xl text-xl shadow-xl shadow-red-200 transition-all transform active:scale-[0.98] flex items-center justify-center gap-3 group"
                >
                    <span>Mulai Kuis Sekarang</span>
                    <span className="text-2xl transition-transform group-hover:translate-x-2">→</span>
                </button>
            </div>
        </div>
    );
}
