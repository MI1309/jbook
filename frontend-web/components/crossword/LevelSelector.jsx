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
    <div className="w-full max-w-lg mx-auto bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 text-center">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2">JBook Crossword</h2>
        <p className="text-gray-500">Sesuaikan mode permainan Anda</p>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">Pilih Level JLPT</label>
        <div className="grid grid-cols-5 gap-3">
          {levels.map(lvl => {
            return (
              <button
                key={lvl.id}
                onClick={() => setSelectedLevel(lvl.id)}
                className={clsx(
                  "relative flex flex-col items-center p-3 rounded-xl border-2 transition-all",
                  selectedLevel === lvl.id 
                    ? "border-red-500 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 shadow-sm" 
                    : "border-gray-100 dark:border-gray-800 hover:border-red-200 text-gray-600 dark:text-gray-400"
                )}
              >
                <span className="font-bold text-lg">{lvl.name}</span>
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
                  ? "border-red-500 bg-red-50 dark:bg-red-900/30 shadow-sm" 
                  : "border-gray-100 dark:border-gray-800 hover:border-red-200"
              )}
            >
              <span className={clsx(
                "font-bold text-sm",
                selectedMode === m.id ? "text-red-700 dark:text-red-300" : "text-gray-700 dark:text-gray-300"
              )}>{m.name}</span>
              <span className="text-[10px] text-gray-500">{m.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleStart}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-bold text-lg transition-transform active:scale-95 disabled:opacity-70 shadow-xl shadow-red-500/20"
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
