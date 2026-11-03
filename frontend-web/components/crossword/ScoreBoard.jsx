import React from 'react';
import { useGameStore } from '../../stores/gameStore';
import { Trophy } from 'lucide-react';

export const ScoreBoard = () => {
  const { gameState } = useGameStore();

  if (!gameState.grid) return null;

  const completedCount = gameState.completedWordIds.length;
  const totalWords = gameState.grid.words.length;
  const levelLabel = gameState.level ? `N${gameState.level}` : 'Semua';
  const modeLabel = gameState.mode === 'hiragana' ? 'Hiragana' : 'Kanji';

  return (
    <div className="mb-6 flex w-full flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-3 shadow-sm sm:p-4">
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 bg-accent-blue/10 rounded-full flex items-center justify-center text-accent-blue">
          <Trophy size={20} />
        </div>
        <div>
          <div className="hidden text-xs font-bold uppercase tracking-wider text-gray-500 sm:block">Score</div>
          <div className="text-2xl font-black text-foreground leading-none">{gameState.score}</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2 text-xs sm:gap-6">
        <div className="text-right">
          <span className="block text-gray-500">Kata</span>
          <span className="font-bold tabular-nums text-foreground">{completedCount}/{totalWords}</span>
        </div>
        <div className="text-right">
          <span className="block text-gray-500">Hint</span>
          <span className="font-bold tabular-nums text-foreground">{gameState.hintsUsed}</span>
        </div>
        <div className="flex gap-1.5" aria-label={`Mode ${modeLabel}, level ${levelLabel}`}>
          <span className="rounded-full bg-accent-green/10 px-2.5 py-1 font-bold text-accent-green">{modeLabel}</span>
          <span className="rounded-full bg-accent-blue/10 px-2.5 py-1 font-bold text-accent-blue">{levelLabel}</span>
        </div>
      </div>
    </div>
  );
};
