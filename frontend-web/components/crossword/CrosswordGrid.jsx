'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { CrosswordCell } from './CrosswordCell';
import * as wanakana from 'wanakana';
import { toast } from 'react-toastify';
import { Keyboard, Sparkles } from 'lucide-react';

export const CrosswordGrid = () => {
  const { gameState, selectCell, inputChar, deleteChar } = useGameStore();
  const containerRef = useRef(null);
  const [cellSize, setCellSize] = useState(32);

  const shownTipGridRef = useRef(null);

  useEffect(() => {
    if (!gameState.grid) return;

    const updateSize = () => {
      const cols = gameState.grid.width;
      const containerWidth = containerRef.current?.clientWidth || window.innerWidth - 32;
      const size = Math.floor(containerWidth / cols) - 1;
      setCellSize(Math.min(40, Math.max(22, size)));
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [gameState.grid?.width]);

  useEffect(() => {
    if (!gameState.grid || gameState.mode === 'kanji') return;

    const gridKey = gameState.grid.generatedAt || gameState.grid;
    if (shownTipGridRef.current === gridKey) return;
    shownTipGridRef.current = gridKey;

    toast.info(
      <div className="relative z-10 flex items-center gap-3 pb-1 text-left">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white shadow-inner">
          <Keyboard size={22} strokeWidth={2.2} />
        </div>
        <div className="min-w-0">
          <div className="mb-0.5 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-white/75">
            <Sparkles size={12} /> Petunjuk cepat
          </div>
          <p className="text-sm font-bold leading-snug text-white">
            Gunakan keyboard Jepang
          </p>
          <p className="text-xs font-medium text-white/70">
            Romaji atau Kana untuk mengisi kotak
          </p>
        </div>
      </div>,
      {
      toastId: 'tts-keyboard-tip',
      autoClose: 3500,
      position: 'top-center',
      closeOnClick: true,
      pauseOnHover: true,
      icon: false,
      closeButton: true,
      className: '!w-[min(92vw,420px)] !min-h-0 !rounded-2xl !border !border-white/20 !bg-gradient-to-r !from-sky-600 !via-blue-600 !to-emerald-500 !p-0 !shadow-2xl !shadow-sky-900/30',
      bodyClassName: '!p-4',
      progressClassName: '!bg-white/80'
    });
  }, [gameState.grid?.generatedAt, gameState.mode]);

  if (!gameState.grid) {
    return (
      <div className="flex items-center justify-center p-8 bg-[var(--card-bg)] rounded-[2rem] shadow-sm border border-[var(--border-color)] w-full max-w-md mx-auto min-h-[300px]">
        <div className="text-gray-500 font-bold uppercase tracking-widest text-xs">Pilih mode untuk memulai...</div>
      </div>
    );
  }

  const handleInput = (char) => {
    let converted = char;
    if (wanakana.isRomaji(char)) {
      converted = wanakana.toHiragana(char);
    }
    inputChar(converted);
  };

  const handleNavigate = (dir) => {
    const { grid, selectedCell } = gameState;
    if (!grid || !selectedCell) return;
    
    let { row, col } = selectedCell;
    
    if (dir === 'up') row--;
    if (dir === 'down') row++;
    if (dir === 'left') col--;
    if (dir === 'right') col++;
    
    if (row >= 0 && row < grid.height && col >= 0 && col < grid.width && !grid.cells[row][col].isBlock) {
      selectCell(row, col);
    }
  };

  const activeWordIds = gameState.selectedCell 
    ? gameState.grid.cells[gameState.selectedCell.row][gameState.selectedCell.col].wordIds 
    : [];
    
  const activeWordId = activeWordIds.find(id => {
    const w = gameState.grid?.words.find(word => word.id === id);
    return w?.direction === gameState.selectedDirection;
  }) || activeWordIds[0];

  const activeWord = gameState.grid?.words.find(word => word.id === activeWordId);

  return (
    <div ref={containerRef} className="w-full max-w-full min-w-0 flex flex-col items-center">
      {activeWord && (
        <div className="lg:hidden w-full bg-accent-blue/10 border border-accent-blue/20 p-3 sm:p-4 mb-4 rounded-2xl shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-accent-blue bg-[var(--background)] border border-[var(--border-color)] px-2 py-0.5 rounded text-[10px] sm:text-xs uppercase tracking-widest">
              {gameState.selectedDirection === 'across' ? 'Mendatar' : 'Menurun'}
            </span>
            <span className="text-[10px] sm:text-xs text-gray-500 font-medium">({activeWord.text.length} kotak)</span>
          </div>
          <div className="font-bold text-foreground text-base sm:text-lg leading-tight">
            {activeWord.clue}
          </div>
        </div>
      )}

      <div className="w-full max-w-full overflow-hidden flex justify-center">
        <div 
          className="grid gap-px bg-[var(--border-color)] p-px rounded-sm shadow-xl"
          style={{ 
            gridTemplateColumns: `repeat(${gameState.grid.width}, ${cellSize}px)`,
            gridTemplateRows: `repeat(${gameState.grid.height}, ${cellSize}px)`,
          }}
        >
          {gameState.grid.cells.map((row, rIdx) => 
          row.map((cell, cIdx) => {
            const isSelected = gameState.selectedCell?.row === rIdx && gameState.selectedCell?.col === cIdx;
            const isHighlighted = !isSelected && cell.wordIds.includes(activeWordId);

            return (
              <CrosswordCell
                key={`${rIdx}-${cIdx}`}
                cell={cell}
                cellSize={cellSize}
                isSelected={isSelected}
                isHighlighted={isHighlighted}
                isKanjiMode={gameState.mode === 'kanji'}
                onSelect={() => selectCell(rIdx, cIdx)}
                onInput={gameState.mode === 'kanji' ? () => {} : handleInput}
                onDelete={deleteChar}
                onNavigate={handleNavigate}
              />
            );
          })
        )}
        </div>
      </div>
    </div>
  );
};
