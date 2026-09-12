import React from 'react';
import { useGameStore } from '../../stores/gameStore';
import { Trophy } from 'lucide-react';

export const ScoreBoard = () => {
  const { gameState } = useGameStore();

  if (!gameState.grid && gameState.mode !== 'kanji') return null;

  return (
    <div className="flex justify-between items-center w-full bg-[var(--card-bg)] p-3 sm:p-4 rounded-xl shadow-sm border border-[var(--border-color)] mb-6">
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 bg-accent-blue/10 rounded-full flex items-center justify-center text-accent-blue">
          <Trophy size={20} />
        </div>
        <div>
          <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">Score</div>
          <div className="text-2xl font-black text-foreground leading-none">{gameState.score}</div>
        </div>
      </div>

      <div className="flex items-center gap-6">
      </div>
    </div>
  );
};
