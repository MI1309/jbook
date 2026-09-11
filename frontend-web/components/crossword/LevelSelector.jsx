import React, { useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { Play } from 'lucide-react';
import { clsx } from 'clsx';

export const LevelSelector = () => {
  const { gameState, startGame } = useGameStore();
  const [selectedMode, setSelectedMode] = useState('kanji');
  const [isLoading, setIsLoading] = useState(false);

  const modes = [
    { id: 'kanji', name: 'Full Kanji', desc: 'Hanya kosa kata Kanji' },
    { id: 'hiragana', name: 'Hiragana Only', desc: 'Tanpa Kanji' }
  ];

  const handleStart = async () => {
    setIsLoading(true);
    await startGame(null, selectedMode);
    setIsLoading(false);
  };

  if (gameState.grid) return null;

  return (
    <div className="w-full bg-[var(--card-bg)] p-4 sm:p-8 md:p-10 rounded-3xl shadow-xl border border-[var(--border-color)] text-center">
      <div className="mb-8">
        <h2 className="text-3xl font-japanese font-black text-[var(--foreground)] mb-2">Sesuaikan mode permainan</h2>
      </div>

      <div className="mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
          <span className="animate-pulse text-sm">Loading ...</span>
        ) : (
          <>
            <Play fill="currentColor" size={20} />
            Mulai
          </>
        )}
      </button>
    </div>
  );
};
