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
      inputRef.current.focus();
    }
  }, [isSelected]);

  if (cell.isBlock) {
    return (
      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-900 dark:bg-black border border-gray-800" />
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
    'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white': 
      cell.validationState === 'empty' && !isSelected && !isHighlighted,
    'bg-red-100 dark:bg-red-900/40 border-red-400': 
      isSelected,
    'bg-red-50 dark:bg-red-900/20 border-red-200': 
      !isSelected && isHighlighted,
    'bg-green-100 dark:bg-green-900 border-green-500 text-green-700 dark:text-green-300': 
      cell.validationState === 'correct',
    'bg-red-100 dark:bg-red-900 border-red-500 text-red-700 dark:text-red-300': 
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
        className="w-full h-full absolute inset-0 opacity-0 cursor-pointer"
        value={cell.userInput || ''}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        maxLength={4}
        readOnly={cell.validationState === 'correct'}
        autoComplete="off"
        spellCheck="false"
      />
      <span className="pointer-events-none select-none z-10 font-bold text-xl sm:text-2xl flex items-center justify-center w-full h-full">
        {cell.userInput || ''}
      </span>
    </div>
  );
};
