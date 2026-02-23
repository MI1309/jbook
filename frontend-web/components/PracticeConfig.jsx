'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PracticeConfig() {
    const router = useRouter();
    const [limit, setLimit] = useState(10);
    const [level, setLevel] = useState(''); // Empty string means "All Levels"
    const [timer, setTimer] = useState(''); // Empty string means "No Timer"
    const [type, setType] = useState('kanji'); // Default to Kanji

    const handleStart = () => {
        // Clear any existing guest session to ensure a fresh start
        sessionStorage.removeItem('guest_practice_session');

        const params = new URLSearchParams();
        params.append('limit', limit);
        params.append('type', type);
        if (level) params.append('level', level);
        if (timer) params.append('timer', timer);
        router.push(`/practice/start?${params.toString()}`);
    };

    return (
        <div className="bg-white p-4 md:p-8 rounded-2xl shadow-xl max-w-2xl mx-auto border-t-4 border-red-600 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 text-9xl font-serif select-none pointer-events-none text-red-900">
                学
            </div>

            <div className="flex justify-between items-center mb-2">
                <h2 className="text-3xl font-bold text-gray-800">Mulai Latihan Baru</h2>
            </div>
            <p className="text-gray-500 mb-8">Atur preferensi latihan sesuai target belajarmu hari ini.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 relative z-10">
                {/* Type Selector */}
                <div className="bg-red-50 p-4 rounded-xl border border-red-100 transition-transform hover:-translate-y-1">
                    <label className="block text-sm font-bold text-red-800 mb-2 flex items-center gap-2">
                        <span>📚</span> Materi
                    </label>
                    <select
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        className="w-full p-2 border-0 bg-white rounded-lg ring-1 ring-red-200 focus:ring-2 focus:ring-red-500 text-gray-700 font-medium"
                    >
                        <option value="kanji">Kanji Satuan (Onyomi & Kunyomi)</option>
                        <option value="vocab">Kosakata / Kanji Gabungan (Furigana)</option>
                        <option value="bunpo">Tata Bahasa (Bunpo)</option>
                    </select>
                </div>

                {/* Number of Questions */}
                <div className="bg-red-50 p-4 rounded-xl border border-red-100 transition-transform hover:-translate-y-1">
                    <label className="block text-sm font-bold text-red-800 mb-2 flex items-center gap-2">
                        <span>📝</span> Jumlah Soal
                    </label>
                    <select
                        value={limit}
                        onChange={(e) => setLimit(e.target.value)}
                        className="w-full p-2 border-0 bg-white rounded-lg ring-1 ring-red-200 focus:ring-2 focus:ring-red-500 text-gray-700 font-medium"
                    >
                        <option value="5">5 Soal</option>
                        <option value="10">10 Soal</option>
                        <option value="20">20 Soal</option>
                        <option value="50">50 Soal</option>
                    </select>
                </div>

                {/* JLPT Level */}
                <div className="bg-red-50 p-4 rounded-xl border border-red-100 transition-transform hover:-translate-y-1">
                    <label className="block text-sm font-bold text-red-800 mb-2 flex items-center gap-2">
                        <span>📊</span> Level JLPT
                    </label>
                    <select
                        value={level}
                        onChange={(e) => setLevel(e.target.value)}
                        className="w-full p-2 border-0 bg-white rounded-lg ring-1 ring-red-200 focus:ring-2 focus:ring-red-500 text-gray-700 font-medium"
                    >
                        <option value="">Semua Level</option>
                        <option value="5">N5 (Pemula)</option>
                        <option value="4">N4 (Dasar)</option>
                        <option value="3">N3 (Menengah)</option>
                        <option value="2">N2 (Lanjut)</option>
                        <option value="1">N1 (Mahir)</option>
                    </select>
                </div>

                {/* Time Limit */}
                <div className="bg-red-50 p-4 rounded-xl border border-red-100 transition-transform hover:-translate-y-1">
                    <label className="block text-sm font-bold text-red-800 mb-2 flex items-center gap-2">
                        <span>⏱️</span> Waktu
                    </label>
                    <select
                        value={timer}
                        onChange={(e) => setTimer(e.target.value)}
                        className="w-full p-2 border-0 bg-white rounded-lg ring-1 ring-red-200 focus:ring-2 focus:ring-red-500 text-gray-700 font-medium"
                    >
                        <option value="">Santai ☕</option>
                        <option value="1">1 Menit 🔥</option>
                        <option value="3">3 Menit ⚡</option>
                        <option value="5">5 Menit 🏃</option>
                        <option value="10">10 Menit 🧘</option>
                    </select>
                </div>
            </div>

            <button
                onClick={handleStart}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-4 rounded-xl text-lg shadow-lg shadow-red-200 transition-all transform hover:scale-[1.02] relative z-10 flex items-center justify-center gap-2"
            >
                <span>Mulai Kuis</span>
                <span className="text-xl">→</span>
            </button>
        </div>
    );
}
