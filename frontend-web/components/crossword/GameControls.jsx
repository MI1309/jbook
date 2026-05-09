import React from 'react';
import { useGameStore } from '../../stores/gameStore';
import { Lightbulb, RotateCcw, LogOut } from 'lucide-react';

export const GameControls = () => {
  const { gameState, useHint, startGame, resetGame } = useGameStore();

  if (!gameState.grid) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 p-4">
      <button
        onClick={useHint}
        disabled={gameState.isCompleted}
        className="flex items-center gap-2 px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 rounded-full font-medium transition-colors disabled:opacity-50"
      >
        <Lightbulb size={18} />
        <span>Hint (-10 pt)</span>
      </button>

      <button
        onClick={() => startGame(gameState.level)}
        className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300 rounded-full font-medium transition-colors"
      >
        <RotateCcw size={18} />
        <span>Grid Baru</span>
      </button>

      <button
        onClick={resetGame}
        className="flex items-center gap-2 px-6 py-2 bg-gray-800 hover:bg-black text-white rounded-full font-medium transition-colors"
      >
        <LogOut size={18} />
        <span>Keluar</span>
      </button>
    </div>
  );
};
