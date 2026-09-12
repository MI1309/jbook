import React, { useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const CrosswordCell = ({
  cell,
  cellSize = 32,
  isSelected,
  isHighlighted,
  isKanjiMode = false,
  onSelect,
  onInput,
  onDelete,
  onNavigate
}) => {
  const inputRef = useRef(null);
  const fontSize = Math.max(12, Math.floor(cellSize * 0.55));
  const numberSize = Math.max(7, Math.floor(cellSize * 0.22));

  useEffect(() => {
    if (isSelected && inputRef.current && !isKanjiMode) {
      const isCrosswordFocused = document.activeElement && document.activeElement.tagName === 'INPUT';
      
      if (window.innerWidth >= 1024 || isCrosswordFocused) {
        inputRef.current.focus();
      }
    }
  }, [isSelected, isKanjiMode]);

  if (cell.isBlock) {
    return (
      <div
        style={{ width: cellSize, height: cellSize }}
        className="bg-gradient-to-br from-slate-200/80 via-sky-100/70 to-emerald-100/80 dark:from-slate-800/80 dark:via-slate-700/70 dark:to-emerald-950/60 border border-white/40 dark:border-white/10"
      />
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
      onSelect();
    }
  };

  const handleChange = (e) => {
    const val = e.target.value;
    if (val !== undefined) {
      onInput(val);
    }
  };

  const baseClasses = "relative border flex items-center justify-center font-medium transition-all duration-150 cursor-pointer outline-none select-none";

  let stateClass = "";
  if (cell.validationState === 'wrong') {
    stateClass = isSelected
      ? "bg-rose-500/25 dark:bg-rose-950/60 border-rose-500 text-rose-600 dark:text-rose-400 shadow-[0_0_0_2px_#f43f5e] z-20 font-black"
      : "bg-rose-500/20 dark:bg-rose-950/50 border-rose-500/90 text-rose-600 dark:text-rose-400 font-bold shadow-[inset_0_0_0_1px_rgba(244,63,94,0.3)]";
  } else if (cell.validationState === 'correct') {
    stateClass = isSelected
      ? "bg-emerald-500/20 dark:bg-emerald-950/50 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-[0_0_0_2px_#10b981] z-20 font-black"
      : "bg-emerald-500/15 dark:bg-emerald-950/30 border-emerald-500/80 text-emerald-600 dark:text-emerald-400 font-bold";
  } else if (isSelected) {
    stateClass = "bg-accent-blue/15 border-accent-blue text-accent-blue shadow-[0_0_0_2px_var(--accent-blue)] z-10 font-bold";
  } else if (isHighlighted) {
    stateClass = "bg-sky-500/10 dark:bg-sky-950/30 border-sky-400/60 dark:border-sky-700 text-foreground font-semibold";
  } else {
    stateClass = "bg-[var(--card-bg)] border-[var(--border-color)] text-foreground";
  }

  return (
    <div 
      style={{ width: cellSize, height: cellSize }}
      className={twMerge(clsx(baseClasses, stateClass))}
      onClick={onSelect}
      onKeyDown={isKanjiMode ? handleKeyDown : undefined}
      tabIndex={isKanjiMode ? 0 : undefined}
    >
      {cell.number && (
        <span
          style={{ fontSize: numberSize }}
          className={clsx(
            "absolute top-0 left-0.5 font-black leading-none",
            cell.validationState === 'wrong'
              ? "text-rose-500 dark:text-rose-400"
              : cell.validationState === 'correct'
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-accent-blue dark:text-sky-300"
          )}
        >
          {cell.number}
        </span>
      )}
      {!isKanjiMode && (
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
      )}
      <span
        style={{ fontSize }}
        className={clsx(
          "pointer-events-none select-none z-10 font-bold flex items-center justify-center w-full h-full",
          cell.validationState === 'wrong'
            ? "text-rose-600 dark:text-rose-400 font-black"
            : cell.validationState === 'correct'
            ? "text-emerald-600 dark:text-emerald-400 font-black"
            : ""
        )}
      >
        {cell.userInput || ''}
      </span>
    </div>
  );
};
