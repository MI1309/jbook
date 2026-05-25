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
        className="flex items-center gap-2 px-4 py-2 bg-accent-green/10 hover:bg-accent-green/20 text-accent-green border border-accent-green/20 rounded-full font-medium transition-colors disabled:opacity-50"
      >
        <Lightbulb size={18} />
        <span>Hint (-10 pt)</span>
      </button>

      <button
        onClick={() => startGame(gameState.level)}
        className="flex items-center gap-2 px-4 py-2 bg-[var(--background)] hover:bg-[var(--card-bg)] text-foreground border border-[var(--border-color)] rounded-full font-medium transition-colors"
      >
        <RotateCcw size={18} />
        <span>Grid Baru</span>
      </button>

      <button
        onClick={resetGame}
        className="flex items-center gap-2 px-6 py-2 bg-accent-blue/10 hover:bg-accent-blue/20 text-accent-blue border border-accent-blue/20 rounded-full font-medium transition-colors"
      >
        <LogOut size={18} />
        <span>Keluar</span>
      </button>
    </div>
  );
};
