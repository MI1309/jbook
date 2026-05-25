import React, { useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const CrosswordCell = ({
  cell,
  isSelected,
  isHighlighted,
  onSelect,
  onInput,
  onDelete,
  onNavigate
}) => {
  const inputRef = useRef(null);

  useEffect(() => {
    if (isSelected && inputRef.current) {
      const isCrosswordFocused = document.activeElement && document.activeElement.tagName === 'INPUT';
      
      // Auto-focus if on desktop OR if user is already typing in the grid
      if (window.innerWidth >= 1024 || isCrosswordFocused) {
        inputRef.current.focus();
      }
    }
  }, [isSelected]);

  if (cell.isBlock) {
    return (
      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[var(--border-color)] border border-[var(--border-color)]" />
    );
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      onDelete();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      onNavigate('up');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      onNavigate('down');
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      onNavigate('left');
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      onNavigate('right');
    } else if (e.key === 'Space' || e.key === ' ') {
      e.preventDefault();
      onSelect(); // Toggle direction
    }
  };

  const handleChange = (e) => {
    const val = e.target.value;
    if (val !== undefined) {
      onInput(val);
    }
  };

  const baseClasses = "relative w-8 h-8 sm:w-10 sm:h-10 border flex items-center justify-center text-lg sm:text-xl font-medium transition-colors cursor-pointer outline-none";
  
  const stateClasses = {
    'bg-[var(--card-bg)] border-[var(--border-color)] text-foreground': 
      cell.validationState === 'empty' && !isSelected && !isHighlighted,
    'bg-accent-blue/10 border-accent-blue shadow-[0_0_0_2px_var(--accent-blue)] z-10 text-accent-blue': 
      isSelected,
    'bg-[var(--background)] border-[var(--border-color)] text-foreground': 
      !isSelected && isHighlighted,
    'bg-accent-green/10 border-accent-green text-accent-green': 
      cell.validationState === 'correct',
    'bg-red-500/10 border-red-500 text-red-500': 
      cell.validationState === 'wrong'
  };

  return (
    <div 
      className={twMerge(clsx(baseClasses, stateClasses))}
      onClick={onSelect}
    >
      {cell.number && (
        <span className="absolute top-0 left-0.5 text-[8px] sm:text-[10px] text-gray-500 leading-none">
          {cell.number}
        </span>
      )}
      <input
        ref={inputRef}
        value={cell.userInput || ''}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        maxLength={4}
        autoComplete="off"
        spellCheck="false"
        autoCapitalize="none"
        autoCorrect="off"
        className="w-full h-full absolute inset-0 opacity-0 cursor-pointer text-transparent bg-transparent"
      />
      <span className="pointer-events-none select-none z-10 font-bold text-xl sm:text-2xl flex items-center justify-center w-full h-full">
        {cell.userInput || ''}
      </span>
    </div>
  );
};
