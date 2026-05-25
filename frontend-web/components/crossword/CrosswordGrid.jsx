import React from 'react';
import { useGameStore } from '../../stores/gameStore';
import { CrosswordCell } from './CrosswordCell';
import * as wanakana from 'wanakana';

export const CrosswordGrid = () => {
  const { gameState, selectCell, inputChar, deleteChar } = useGameStore();

  if (!gameState.grid) {
    return (
      <div className="flex items-center justify-center p-8 bg-[var(--card-bg)] rounded-[2rem] shadow-sm border border-[var(--border-color)] w-full max-w-md mx-auto min-h-[300px]">
        <div className="text-gray-500 font-bold uppercase tracking-widest text-xs">Pilih level untuk memulai...</div>
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

  // Find active words to highlight the current active word path
  const activeWordIds = gameState.selectedCell 
    ? gameState.grid.cells[gameState.selectedCell.row][gameState.selectedCell.col].wordIds 
    : [];
    
  // Filter by direction if multiple
  const activeWordId = activeWordIds.find(id => {
    const w = gameState.grid?.words.find(word => word.id === id);
    return w?.direction === gameState.selectedDirection;
  }) || activeWordIds[0];

  const activeWord = gameState.grid?.words.find(word => word.id === activeWordId);

  return (
    <div className="w-full flex flex-col items-center">
      {/* Mobile Active Clue Banner */}
      {activeWord && (
        <div className="lg:hidden w-full bg-accent-blue/10 border border-accent-blue/20 p-3 mb-4 rounded-[1.5rem] shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-accent-blue bg-[var(--background)] border border-[var(--border-color)] px-2 py-0.5 rounded text-[10px] uppercase tracking-widest">
              {gameState.selectedDirection === 'across' ? 'Mendatar' : 'Menurun'}
            </span>
            <span className="text-[10px] text-gray-500 font-medium">({activeWord.text.length} kotak)</span>
          </div>
          <div className="font-bold text-foreground text-base leading-tight">
            {activeWord.clue}
          </div>
        </div>
      )}

      <div className="w-full text-center mb-3">
        <p className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest sm:text-xs font-bold text-accent-green bg-accent-green/10 px-3 py-1.5 rounded-full border border-accent-green/20">
          <span className="text-sm">💡</span> Peringatan: Gunakan Keyboard Jepang (Romaji/Kana) untuk pengalaman terbaik.
        </p>
      </div>

      <div className="w-full overflow-x-auto pb-4 px-2 flex justify-center custom-scrollbar">
        <div 
          className="grid gap-px bg-[var(--border-color)] p-px rounded-sm shadow-xl shrink-0"
          style={{ 
            gridTemplateColumns: `repeat(${gameState.grid.width}, minmax(0, 1fr))`
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
                isSelected={isSelected}
                isHighlighted={isHighlighted}
                onSelect={() => selectCell(rIdx, cIdx)}
                onInput={handleInput}
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
