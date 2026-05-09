import React from 'react';
import { useGameStore } from '../../stores/gameStore';
import { CrosswordCell } from './CrosswordCell';
import * as wanakana from 'wanakana';

export const CrosswordGrid = () => {
  const { gameState, selectCell, inputChar, deleteChar } = useGameStore();

  if (!gameState.grid) {
    return (
      <div className="flex items-center justify-center p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg w-full max-w-md mx-auto min-h-[300px]">
        <div className="text-gray-500">Pilih level untuk memulai...</div>
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

  return (
    <div className="flex justify-center p-4">
      <div 
        className="grid gap-px bg-gray-300 dark:bg-gray-700 p-px rounded-sm shadow-xl"
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
  );
};
