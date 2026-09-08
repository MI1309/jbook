import React from 'react';
import { useGameStore } from '../../stores/gameStore';
import { Trophy, Flame } from 'lucide-react';

export const ScoreBoard = () => {
  const { gameState } = useGameStore();

  if (!gameState.grid && gameState.mode !== 'kanji') return null;

  // Formatting time (elapsed time in seconds, we could format it to mm:ss if we had a timer running in store)
  // For now just show score and streak placeholder
  
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
        {gameState.mode === 'kanji' && (
          <div className="flex flex-col items-center">
            <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">Terjawab</div>
            <div className="text-lg font-bold text-foreground">
              {gameState.kanjiAnswered ? gameState.currentKanjiQuestion + 1 : gameState.currentKanjiQuestion} / {gameState.kanjiQuestions.length}
            </div>
          </div>
        )}
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
