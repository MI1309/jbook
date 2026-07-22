import React, { useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { Play } from 'lucide-react';
import { clsx } from 'clsx';

export const LevelSelector = () => {
  const { gameState, startGame } = useGameStore();
  const [selectedLevel, setSelectedLevel] = useState('5');
  const [selectedMode, setSelectedMode] = useState('all');
  const [isLoading, setIsLoading] = useState(false);

  const levels = [
    { id: '5', name: 'N5', desc: 'Beginner' },
    { id: '4', name: 'N4', desc: 'Basic' },
    { id: '3', name: 'N3', desc: 'Intermediate' },
    { id: '2', name: 'N2', desc: 'Pre-Advanced' },
    { id: '1', name: 'N1', desc: 'Advanced' }
  ];

  const modes = [
    { id: 'all', name: 'Campuran', desc: 'Semua kata' },
    { id: 'kanji', name: 'Full Kanji', desc: 'Hanya kosa kata Kanji' },
    { id: 'hiragana', name: 'Hiragana Only', desc: 'Tanpa Kanji' }
  ];

  const handleStart = async () => {
    setIsLoading(true);
    await startGame(selectedLevel, selectedMode);
    setIsLoading(false);
  };

  if (gameState.grid) return null;

  return (
    <div className="w-full bg-[var(--card-bg)] p-4 sm:p-8 md:p-10 rounded-3xl shadow-xl border border-[var(--border-color)] text-center">
      <div className="mb-8">
        <h2 className="text-3xl font-japanese font-black text-[var(--foreground)] mb-2">JBook Crossword</h2>
        <p className="text-gray-500 dark:text-gray-400">Sesuaikan mode permainan Anda</p>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">Pilih Level JLPT</label>
        <div className="grid grid-cols-5 gap-1.5 sm:gap-3">
          {levels.map(lvl => {
            return (
              <button
                key={lvl.id}
                onClick={() => setSelectedLevel(lvl.id)}
                className={clsx(
                  "relative flex flex-col items-center p-2 sm:p-3 rounded-xl border-2 transition-all",
                  selectedLevel === lvl.id
                    ? "border-accent-blue bg-accent-blue/10 text-accent-blue shadow-sm"
                    : "border-[var(--border-color)] hover:border-accent-blue/40 text-gray-500"
                )}
              >
                <span className="font-bold text-sm sm:text-lg">{lvl.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-8">
        <label className="block text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">Mode Soal</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {modes.map(m => (
            <button
              key={m.id}
              onClick={() => setSelectedMode(m.id)}
              className={clsx(
                "flex flex-col p-3 rounded-xl border-2 transition-all text-left",
                selectedMode === m.id
                  ? "border-accent-green bg-accent-green/10 shadow-sm"
                  : "border-[var(--border-color)] hover:border-accent-green/40"
              )}
            >
              <span className={clsx(
                "font-bold text-sm",
                selectedMode === m.id ? "text-accent-green" : "text-gray-500"
              )}>{m.name}</span>
              <span className="text-[10px] text-gray-500">{m.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleStart}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-accent-blue to-accent-green hover:opacity-90 text-white py-4 rounded-xl font-bold text-lg transition-all active:scale-95 disabled:opacity-70 shadow-xl shadow-accent-blue/20"
      >
        {isLoading ? (
          <span className="animate-pulse text-sm">Menyiapkan Grid...</span>
        ) : (
          <>
            <Play fill="currentColor" size={20} />
            Mulai Bermain
          </>
        )}
      </button>
    </div>
  );
};
