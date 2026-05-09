import React, { useEffect } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { Trophy, Timer, Flame } from 'lucide-react';

export const ScoreBoard = () => {
  const { gameState } = useGameStore();

  if (!gameState.grid) return null;

  // Formatting time (elapsed time in seconds, we could format it to mm:ss if we had a timer running in store)
  // For now just show score and streak placeholder
  
  return (
    <div className="flex justify-between items-center w-full max-w-4xl mx-auto bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 mb-6">
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center text-red-600 dark:text-red-400">
          <Trophy size={20} />
        </div>
        <div>
          <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">Score</div>
          <div className="text-2xl font-black text-gray-900 dark:text-white leading-none">{gameState.score}</div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1 text-orange-500 text-sm font-medium">
            <Flame size={14} /> Streak
          </div>
          <div className="text-lg font-bold text-orange-600">
            x1
          </div>
        </div>
      </div>
    </div>
  );
};
