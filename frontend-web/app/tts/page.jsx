'use client';

import React from 'react';
import { useGameStore } from '../../stores/gameStore';
import { LevelSelector } from '../../components/crossword/LevelSelector';
import { ScoreBoard } from '../../components/crossword/ScoreBoard';
import { CrosswordGrid } from '../../components/crossword/CrosswordGrid';
import { GameControls } from '../../components/crossword/GameControls';
import { CluePanel } from '../../components/crossword/CluePanel';
import { CompletionModal } from '../../components/crossword/CompletionModal';

export default function CrosswordPage() {
  const { gameState } = useGameStore();

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[var(--background)] transition-colors duration-300 font-sans text-[var(--foreground)] selection:bg-accent-blue/20">
      <div className="w-full max-w-7xl mx-auto py-4 sm:py-8 px-2 sm:px-4 md:px-8">
        <header className="mb-6 sm:mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-japanese font-black mb-3 tracking-tighter text-[var(--foreground)]">
            テカ-テキ <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-blue to-accent-green">Silang</span>
          </h1>
          <div className="h-1 w-16 bg-gradient-to-r from-accent-blue to-accent-green rounded-full mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 font-bold text-sm sm:text-lg">Latih kosa kata bahasa Jepang JLPT kamu di sini.</p>
        </header>

        {!gameState.grid ? (
          <LevelSelector />
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full min-w-0">
            <ScoreBoard />
            
            <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 items-start relative w-full min-w-0 mt-4">
              <div className="w-full lg:w-7/12 min-w-0 flex flex-col items-center">
                <CrosswordGrid />
                <GameControls />
              </div>
              
              <div className="w-full lg:w-5/12 min-w-0">
                <CluePanel />
              </div>
            </div>
          </div>
        )}

        <CompletionModal />
      </div>
    </div>
  );
};
