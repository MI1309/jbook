'use client';

import { useState, useEffect, useRef } from 'react';
import { useTheme } from '@/context/ThemeContext';

export default function TTSGrid({ gridData, clues, onComplete }) {
    const { theme } = useTheme();
    const size = gridData.length;
    const [userGrid, setUserGrid] = useState(
        Array(size).fill(0).map(() => Array(size).fill(''))
    );
    const [selected, setSelected] = useState({ r: -1, c: -1 });
    const [direction, setDirection] = useState('H'); // 'H' or 'V'
    const [solvedWords, setSolvedWords] = useState([]);
    
    const inputRefs = useRef([]);

    useEffect(() => {
        // Find the first valid cell to select
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (gridData[r][c] !== '') {
                    setSelected({ r, c });
                    return;
                }
            }
        }
    }, [gridData]);

    const handleCellClick = (r, c) => {
        if (gridData[r][c] === '') return;
        
        if (selected.r === r && selected.c === c) {
            setDirection(prev => prev === 'H' ? 'V' : 'H');
        } else {
            setSelected({ r, c });
        }
    };

    const handleKeyDown = (e, r, c) => {
        if (e.key === 'Backspace') {
            const newGrid = [...userGrid];
            newGrid[r][c] = '';
            setUserGrid(newGrid);
            moveFocus(-1);
        } else if (e.key === 'ArrowRight') {
            setDirection('H');
            moveFocus(1, r, c + 1);
        } else if (e.key === 'ArrowLeft') {
            setDirection('H');
            moveFocus(1, r, c - 1);
        } else if (e.key === 'ArrowDown') {
            setDirection('V');
            moveFocus(1, r + 1, c);
        } else if (e.key === 'ArrowUp') {
            setDirection('V');
            moveFocus(1, r - 1, c);
        } else if (e.key.length === 1 && /^[a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]$/.test(e.key)) {
            const newGrid = [...userGrid];
            newGrid[r][c] = e.key;
            setUserGrid(newGrid);
            checkWordCompletion(newGrid);
            moveFocus(1);
        }
    };

    const moveFocus = (step, targetR = -1, targetC = -1) => {
        let nr = targetR !== -1 ? targetR : selected.r + (direction === 'V' ? step : 0);
        let nc = targetC !== -1 ? targetC : selected.c + (direction === 'H' ? step : 0);

        if (nr >= 0 && nr < size && nc >= 0 && nc < size && gridData[nr][nc] !== '') {
            setSelected({ r: nr, c: nc });
        }
    };

    const checkWordCompletion = (currentGrid) => {
        const newSolved = [];
        clues.forEach(clue => {
            let wordInGrid = '';
            for (let i = 0; i < clue.length; i++) {
                const r = clue.row + (clue.direction === 'V' ? i : 0);
                const c = clue.col + (clue.direction === 'H' ? i : 0);
                wordInGrid += currentGrid[r][c];
            }
            if (wordInGrid === clue.word) {
                newSolved.push(clue.id);
            }
        });
        
        setSolvedWords(newSolved);
        if (newSolved.length === clues.length && clues.length > 0) {
            onComplete && onComplete();
        }
    };

    const isCellInActiveWord = (r, c) => {
        if (selected.r === -1) return false;
        // Check if (r,c) belongs to the word passing through selected cell in current direction
        const activeClue = clues.find(clue => {
            if (clue.direction !== direction) return false;
            const rowEnd = clue.row + (clue.direction === 'V' ? clue.length - 1 : 0);
            const colEnd = clue.col + (clue.direction === 'H' ? clue.length - 1 : 0);
            return (
                selected.r >= clue.row && selected.r <= rowEnd &&
                selected.c >= clue.col && selected.c <= colEnd &&
                r >= clue.row && r <= rowEnd &&
                c >= clue.col && c <= colEnd
            );
        });
        return !!activeClue;
    };

    const getCellNumber = (r, c) => {
        const clue = clues.find(clue => clue.row === r && clue.col === c);
        if (!clue) return null;
        // Simple numbering based on index
        return clues.indexOf(clue) + 1;
    };

    const isSolved = (r, c) => {
        return clues.some(clue => {
            if (!solvedWords.includes(clue.id)) return false;
            const rowEnd = clue.row + (clue.direction === 'V' ? clue.length - 1 : 0);
            const colEnd = clue.col + (clue.direction === 'H' ? clue.length - 1 : 0);
            return r >= clue.row && r <= rowEnd && c >= clue.col && c <= colEnd;
        });
    };

    return (
        <div className="flex flex-col md:flex-row gap-8 items-start justify-center p-4">
            {/* Grid Display */}
            <div 
                className="grid gap-1 bg-gray-200 dark:bg-gray-800 p-2 rounded-xl shadow-2xl"
                style={{ 
                    gridTemplateColumns: `repeat(${size}, minmax(30px, 45px))`,
                    gridTemplateRows: `repeat(${size}, minmax(30px, 45px))`
                }}
            >
                {gridData.map((row, r) => 
                    row.map((cell, c) => {
                        const isEmpty = cell === '';
                        const isSelected = selected.r === r && selected.c === c;
                        const isActiveWord = isCellInActiveWord(r, c);
                        const number = getCellNumber(r, c);
                        const solved = isSolved(r, c);

                        return (
                            <div 
                                key={`${r}-${c}`}
                                onClick={() => handleCellClick(r, c)}
                                className={`
                                    relative flex items-center justify-center text-xl font-bold rounded-sm cursor-pointer transition-all duration-200
                                    ${isEmpty ? 'bg-transparent' : (
                                        isSelected ? 'bg-red-500 text-white scale-105 z-10' :
                                        solved ? 'bg-green-100 dark:bg-green-900/30 text-green-600' :
                                        isActiveWord ? 'bg-red-100 dark:bg-red-950/20' : 'bg-white dark:bg-gray-900'
                                    )}
                                    ${!isEmpty && theme === 'dark' ? 'border border-gray-800' : ''}
                                `}
                            >
                                {number && (
                                    <span className="absolute top-0.5 left-1 text-[8px] font-black opacity-50 select-none">
                                        {number}
                                    </span>
                                )}
                                {!isEmpty && (
                                    <input
                                        type="text"
                                        maxLength="1"
                                        value={userGrid[r][c]}
                                        readOnly
                                        onKeyDown={(e) => handleKeyDown(e, r, c)}
                                        className="w-full h-full bg-transparent text-center outline-none uppercase font-serif"
                                        autoFocus={isSelected}
                                    />
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Clues Display */}
            <div className="w-full md:w-80 space-y-6">
                <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-red-950/20 shadow-xl">
                    <h3 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-600"></span>
                        Petunjuk (Clues)
                    </h3>
                    
                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        {clues.map((clue, i) => (
                            <div 
                                key={clue.id}
                                onClick={() => {
                                    setSelected({ r: clue.row, c: clue.col });
                                    setDirection(clue.direction);
                                }}
                                className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                                    solvedWords.includes(clue.id) 
                                        ? 'bg-green-50 dark:bg-green-950/10 border-green-200 dark:border-green-900/30 opacity-60' 
                                        : (selected.r === clue.row && selected.c === clue.col && direction === clue.direction
                                            ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/30 ring-1 ring-red-500'
                                            : 'bg-gray-50 dark:bg-gray-800 border-transparent hover:border-red-200'
                                          )
                                }`}
                            >
                                <div className="flex gap-3 items-start">
                                    <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-md">
                                        {i + 1}
                                    </span>
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-tighter opacity-50 mb-1">
                                            {clue.direction === 'H' ? 'Mendatar' : 'Menurun'} • {clue.length} Huruf
                                        </p>
                                        <p className="text-sm font-bold leading-tight">
                                            {clue.meaning}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
