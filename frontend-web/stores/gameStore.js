import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as wanakana from 'wanakana';
import { toast } from 'react-toastify';
import { getVocabList, submitPracticeResults } from '@/lib/api';
import { generateCrosswordGrid } from '../utils/gridGenerator';
import { isHiragana, isValidJapanese } from '../utils/japaneseValidators';

console.log("JBook Crossword Engine v2.1 (Manual Mapping Fix) Loaded");

const initialGameState = {
  grid: null,
  selectedCell: null,
  selectedDirection: 'across',
  score: 0,
  hintsUsed: 0,
  isCompleted: false,
  completedWordIds: [],
  gameHistory: [],
  level: '5'
};

export const useGameStore = create(
  persist(
    (set, get) => ({
      gameState: { ...initialGameState },
      user: null,

  startGame: async (level, mode = 'all') => {
    try {
      // Randomize page to get different words each time
      const randomPage = Math.floor(Math.random() * 5) + 1;
      const response = await getVocabList({ level, page: randomPage });
      let kotobaList = response.items || [];
      
      // 1. Fetch more words if necessary
      const fetchDepth = mode === 'all' ? 3 : 50; // Scan even deeper for Kanji mode
      const minPoolSize = mode === 'all' ? 50 : 200; // Target larger pool for specific modes
      
      if (kotobaList.length < minPoolSize) {
        for (let p = 1; p <= fetchDepth; p++) {
          if (p === randomPage) continue;
          try {
            const res = await getVocabList({ level, page: p });
            if (res.items && res.items.length > 0) {
               kotobaList.push(...res.items);
               // Stop if we have enough potential candidates
               if (kotobaList.length > 300) break;
            } else if (p > 10) {
              // If we reached deep pages and getting empty results, stop
              break;
            }
          } catch (e) {}
        }
      }

      // 2. Normalize
      const normalizedKotoba = kotobaList.map(k => {
        const kanjiWord = k.word || k.kanji || k.original_word || "";
        const rawReading = k.hiragana || k.reading || k.furigana || kanjiWord || "";
        const cleanReading = rawReading.split(';')[0].split('(')[0].replace(/[\s\t\n]/g, '').trim();
        return { ...k, word: kanjiWord, hiragana: cleanReading };
      });

      // 3. Filter by valid Japanese and Mode
      let validWords = normalizedKotoba.filter(k => k.hiragana && k.hiragana.length > 1 && isValidJapanese(k.hiragana));
      
      if (mode === 'kanji') {
        validWords = validWords.filter(k => /[\u4e00-\u9faf]/.test(k.word || ""));
      } else if (mode === 'hiragana') {
        validWords = validWords.filter(k => !/[\u4e00-\u9faf]/.test(k.word || ""));
      }

      if (validWords.length < 5) {
        throw new Error(`Terlalu sedikit kata (${validWords.length}) untuk membuat grid di mode ini. Coba level lain.`);
      }

      // 4. Shuffle and Generate
      validWords = validWords.sort(() => Math.random() - 0.5);
      const grid = generateCrosswordGrid(validWords, 12, 12, level);
      
      if (!grid || grid.words.length === 0) {
        throw new Error("Gagal membuat susunan grid. Silakan coba lagi.");
      }

      set({
        gameState: {
          ...get().gameState,
          grid,
          level,
          selectedCell: findFirstCell(grid),
          selectedDirection: 'across',
          isCompleted: false,
          score: 0
        }
      });
    } catch (error) {
      console.error("Error starting game:", error);
      toast.error(error.message || "Terjadi kesalahan saat memulai permainan.");
    }
  },

  selectCell: (row, col) => {
    const { gameState } = get();
    if (!gameState.grid) return;
    
    const cell = gameState.grid.cells[row][col];
    if (cell.isBlock) return;
    
    // Toggle direction if clicking same cell
    let direction = gameState.selectedDirection;
    if (gameState.selectedCell && gameState.selectedCell.row === row && gameState.selectedCell.col === col) {
      direction = direction === 'across' ? 'down' : 'across';
    } else {
      // Auto determine direction based on available words at this cell
      const activeWords = gameState.grid.words.filter(w => cell.wordIds.includes(w.id));
      if (activeWords.length === 1) {
        direction = activeWords[0].direction;
      }
    }
    
    set({
      gameState: {
        ...gameState,
        selectedCell: { row, col },
        selectedDirection: direction
      }
    });
  },

  toggleDirection: () => {
    const { gameState } = get();
    set({
      gameState: {
        ...gameState,
        selectedDirection: gameState.selectedDirection === 'across' ? 'down' : 'across'
      }
    });
  },

  inputChar: (fullValue) => {
    const { gameState } = get();
    const { grid, selectedCell } = gameState;
    
    if (!grid || !selectedCell || gameState.isCompleted) return;
    
    const newGrid = { ...grid };
    const cell = newGrid.cells[selectedCell.row][selectedCell.col];
    
    if (cell.validationState === 'correct') {
       moveToNextCell(get, set);
       return;
    }
    
    // Manual mapping for 'n' cases
    let converted = fullValue;
    const isUppercase = /[A-Z]/.test(fullValue);
    const normalizedValue = fullValue.toLowerCase();
    
    // Handle 'nn' -> 'ん'
    if (normalizedValue === 'nn') {
      converted = isUppercase ? 'ン' : 'ん';
    } 
    // Handle 'na', 'ni', 'nu', 'ne', 'no'
    else if (normalizedValue === 'na') converted = isUppercase ? 'ナ' : 'な';
    else if (normalizedValue === 'ni') converted = isUppercase ? 'ニ' : 'に';
    else if (normalizedValue === 'nu') converted = isUppercase ? 'ヌ' : 'ぬ';
    else if (normalizedValue === 'ne') converted = isUppercase ? 'ネ' : 'ね';
    else if (normalizedValue === 'no') converted = isUppercase ? 'ノ' : 'の';
    // Fallback to wanakana
    else {
      converted = isUppercase ? wanakana.toKatakana(fullValue) : wanakana.toHiragana(fullValue);
    }
    
    // Carry-over logic
    let carryOver = '';
    if (converted.length > 1) {
      const firstChar = converted.charAt(0);
      if (wanakana.isKana(firstChar)) {
        converted = firstChar;
        carryOver = fullValue.substring(1);
      }
    }

    // Update current cell
    cell.userInput = converted;
    
    // Check if current cell is now a complete Japanese character and NO Romaji remains
    const isFinished = wanakana.isKana(converted) && !/[a-zA-Z]/.test(converted);
    
    if (isFinished) {
      // Validate current cell (Lenient: compare Hiragana versions of both)
      const inputHira = wanakana.toHiragana(converted);
      const targetHira = wanakana.toHiragana(cell.char);

      if (inputHira === targetHira) {
        cell.validationState = 'correct';
        gameState.score += 10;
      } else {
        cell.validationState = 'wrong';
        gameState.score = Math.max(0, gameState.score - 5);
      }
      
      set({ gameState: { ...gameState, grid: newGrid } });
      get().checkAnswer();
      
      // Move to next cell
      moveToNextCell(get, set);
      
      // If we have carry-over (like the 't' in 'tt'), input it into the next cell
      if (carryOver) {
        setTimeout(() => {
          get().inputChar(carryOver);
        }, 10);
      }
    } else {
      // Still typing romaji
      set({ gameState: { ...gameState, grid: newGrid } });
    }
  },

  deleteChar: () => {
    const { gameState } = get();
    const { grid, selectedCell, selectedDirection } = gameState;
    
    if (!grid || !selectedCell || gameState.isCompleted) return;
    
    const newGrid = { ...grid };
    const cell = newGrid.cells[selectedCell.row][selectedCell.col];
    
    if (cell.validationState !== 'correct') {
      cell.userInput = '';
      cell.validationState = 'empty';
    }
    
    set({ gameState: { ...gameState, grid: newGrid } });
    
    // Move backward
    moveToPrevCell(get, set);
  },

  useHint: () => {
    const { gameState } = get();
    const { grid, selectedCell } = gameState;
    
    if (!grid || !selectedCell || gameState.isCompleted) return;
    
    const cell = grid.cells[selectedCell.row][selectedCell.col];
    if (cell.validationState === 'correct') return;
    
    cell.userInput = cell.char;
    cell.validationState = 'correct';
    
    set({
      gameState: {
        ...gameState,
        score: Math.max(0, gameState.score - 10),
        hintsUsed: gameState.hintsUsed + 1
      }
    });
    
    get().checkAnswer();
  },

  checkAnswer: () => {
    const { gameState } = get();
    const { grid } = gameState;
    if (!grid) return;
    
    let allComplete = true;
    const completedIds = [...gameState.completedWordIds];
    
    for (const word of grid.words) {
      if (word.isCompleted) continue;
      
      let wordComplete = true;
      for (let i = 0; i < word.text.length; i++) {
        const r = word.direction === 'across' ? word.startRow : word.startRow + i;
        const c = word.direction === 'across' ? word.startCol + i : word.startCol;
        if (grid.cells[r][c].validationState !== 'correct') {
          wordComplete = false;
          break;
        }
      }
      
      if (wordComplete) {
        word.isCompleted = true;
        if (!completedIds.includes(word.id)) {
          completedIds.push(word.id);
          // Bonus streak / completed word logic
        }
      }
      
      if (!wordComplete) {
        allComplete = false;
      }
    }
    
    set({
      gameState: {
        ...gameState,
        completedWordIds: completedIds,
        isCompleted: allComplete,
        isCompleted: allComplete,
      }
    });
    
    if (allComplete) {
      get().submitGame();
    }
  },

  submitGame: async () => {
    const { gameState } = get();
    if (!gameState.grid) return;
    
    try {
      const results = gameState.grid.words
        .filter(w => w.isCompleted)
        .map(w => ({
          type: 'vocab',
          character: w.word || w.text,
          is_correct: true,
          score: w.text.length * 10,
          created_at: new Date().toISOString()
        }));

      if (results.length > 0) {
        await submitPracticeResults(results);
      }
    } catch (e) {
      // Silent fail for 401 or network errors
      if (e.status === 401) return;
      console.error("Failed to submit game progress", e);
    }
  },

  resetGame: () => {
    set({ gameState: { ...initialGameState } });
  },
  
  // Auth (minimal implementation)
  login: async (credentials) => {
    const res = await jbookApi.login(credentials);
    jbookApi.setToken(res.access_token);
    set({ user: { id: '1', username: credentials.username, email: '', token: res.access_token } });
  },
  
  logout: () => {
    if (typeof window !== 'undefined') localStorage.removeItem('jbook_token');
    set({ user: null });
  }
    }),
    {
      name: 'jbook-crossword-storage-v2',
    }
  )
);

// Helpers for navigation
function findFirstCell(grid) {
  for (let r = 0; r < grid.height; r++) {
    for (let c = 0; c < grid.width; c++) {
      if (!grid.cells[r][c].isBlock) {
        return { row: r, col: c };
      }
    }
  }
  return null;
}

function moveToNextCell(get, set) {
  const { gameState } = get();
  const { grid, selectedCell, selectedDirection } = gameState;
  if (!grid || !selectedCell) return;
  
  let nextRow = selectedCell.row;
  let nextCol = selectedCell.col;
  
  if (selectedDirection === 'across') {
    nextCol++;
  } else {
    nextRow++;
  }
  
  // Check bounds and block
  if (
    nextRow < grid.height && 
    nextCol < grid.width && 
    !grid.cells[nextRow][nextCol].isBlock
  ) {
    set({ gameState: { ...gameState, selectedCell: { row: nextRow, col: nextCol } } });
  }
}

function moveToPrevCell(get, set) {
  const { gameState } = get();
  const { grid, selectedCell, selectedDirection } = gameState;
  if (!grid || !selectedCell) return;
  
  let nextRow = selectedCell.row;
  let nextCol = selectedCell.col;
  
  if (selectedDirection === 'across') {
    nextCol--;
  } else {
    nextRow--;
  }
  
  // Check bounds and block
  if (
    nextRow >= 0 && 
    nextCol >= 0 && 
    !grid.cells[nextRow][nextCol].isBlock
  ) {
    set({ gameState: { ...gameState, selectedCell: { row: nextRow, col: nextCol } } });
  }
}
