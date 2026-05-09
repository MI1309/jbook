function createEmptyGrid(width, height) {
  const cells = [];
  for (let r = 0; r < height; r++) {
    const row = [];
    for (let c = 0; c < width; c++) {
      row.push({
        row: r,
        col: c,
        char: '',
        isBlock: true, // by default, everything is a block
        wordIds: [],
        userInput: '',
        validationState: 'empty'
      });
    }
    cells.push(row);
  }
  return cells;
}

export function generateCrosswordGrid(kotobaList, width = 10, height = 10, levelStr = '5') {
  const cells = createEmptyGrid(width, height);
  const words = [];
  
  // Sort words by hiragana length descending
  const sortedKotoba = [...kotobaList]
    .filter(k => k && k.hiragana)
    .sort((a, b) => (b.hiragana?.length || 0) - (a.hiragana?.length || 0));
  
  if (sortedKotoba.length === 0) {
    return {
      width,
      height,
      cells,
      words: [],
      level: levelStr,
      generatedAt: new Date().toISOString()
    };
  }
  
  // Backtracking placement
  const success = backtrack(cells, words, sortedKotoba, 0, width, height);
  
  if (!success) {
    console.warn("Backtracking failed to place all words, using best-effort.");
  }
  
  // Assign clue numbers
  numberCells(cells, words);
  
  return {
    width,
    height,
    cells,
    words,
    level: levelStr,
    generatedAt: new Date().toISOString()
  };
}

function backtrack(cells, words, kotobaList, index, width, height) {
  if (index >= kotobaList.length || words.length >= 15) return true;
  
  const kotoba = kotobaList[index];
  
  // First word special case
  if (words.length === 0) {
    if (kotoba.hiragana.length > width) return backtrack(cells, words, kotobaList, index + 1, width, height);
    
    const startRow = Math.floor(height / 2);
    const startCol = Math.floor((width - kotoba.hiragana.length) / 2);
    placeWord(cells, words, kotoba, startRow, startCol, 'across');
    if (backtrack(cells, words, kotobaList, index + 1, width, height)) return true;
    unplaceWord(cells, words, kotoba, startRow, startCol, 'across');
    return false;
  }
  
  const candidates = findValidPlacements(cells, kotoba, width, height);
  candidates.sort((a, b) => b.score - a.score);
  
  for (const cand of candidates.slice(0, 5)) { // Try top 5 candidates
    placeWord(cells, words, kotoba, cand.row, cand.col, cand.direction);
    if (backtrack(cells, words, kotobaList, index + 1, width, height)) return true;
    unplaceWord(cells, words, kotoba, cand.row, cand.col, cand.direction);
  }
  
  // Try skipping this word
  return backtrack(cells, words, kotobaList, index + 1, width, height);
}

function unplaceWord(cells, words, kotoba, startRow, startCol, direction) {
  const chars = kotoba.hiragana.split('');
  for (let i = 0; i < chars.length; i++) {
    const r = direction === 'across' ? startRow : startRow + i;
    const c = direction === 'across' ? startCol + i : startCol;
    
    cells[r][c].wordIds = cells[r][c].wordIds.filter(id => id !== kotoba.id);
    if (cells[r][c].wordIds.length === 0) {
      cells[r][c].isBlock = true;
      cells[r][c].char = '';
    }
  }
  const wordIdx = words.findIndex(w => w.id === kotoba.id);
  if (wordIdx !== -1) words.splice(wordIdx, 1);
}

function placeWord(cells, words, kotoba, startRow, startCol, direction) {
  const chars = kotoba.hiragana.split('');
  
  for (let i = 0; i < chars.length; i++) {
    const r = direction === 'across' ? startRow : startRow + i;
    const c = direction === 'across' ? startCol + i : startCol;
    
    if (cells[r] && cells[r][c]) {
      cells[r][c].isBlock = false;
      cells[r][c].char = chars[i];
      cells[r][c].wordIds.push(kotoba.id);
    }
  }
  
  words.push({
    id: kotoba.id,
    text: kotoba.hiragana,
    reading: kotoba.hiragana,
    word: kotoba.word,
    meaning: kotoba.meaning || kotoba.word,
    clue: kotoba.meaning || kotoba.word,
    direction,
    startRow,
    startCol,
    level: kotoba.level,
    isCompleted: false
  });
}

function findValidPlacements(cells, kotoba, width, height) {
  const candidates = [];
  const chars = kotoba.hiragana.split('');
  
  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      // Check Across
      if (canPlace(cells, chars, r, c, 'across', width, height)) {
        const score = calculatePlacementScore(cells, chars, r, c, 'across');
        if (score > 0) {
          candidates.push({ row: r, col: c, direction: 'across', score });
        }
      }
      // Check Down
      if (canPlace(cells, chars, r, c, 'down', width, height)) {
        const score = calculatePlacementScore(cells, chars, r, c, 'down');
        if (score > 0) {
          candidates.push({ row: r, col: c, direction: 'down', score });
        }
      }
    }
  }
  
  return candidates;
}

function canPlace(cells, chars, startRow, startCol, direction, width, height) {
  let intersections = 0;
  
  // Bounds check
  if (direction === 'across' && startCol + chars.length > width) return false;
  if (direction === 'down' && startRow + chars.length > height) return false;
  
  // Check preceding and succeeding cells (should be blocks to avoid merging words)
  if (direction === 'across') {
    if (startCol > 0 && !cells[startRow][startCol - 1].isBlock) return false;
    if (startCol + chars.length < width && !cells[startRow][startCol + chars.length].isBlock) return false;
  } else {
    if (startRow > 0 && !cells[startRow - 1][startCol].isBlock) return false;
    if (startRow + chars.length < height && !cells[startRow + chars.length][startCol].isBlock) return false;
  }
  
  for (let i = 0; i < chars.length; i++) {
    const r = direction === 'across' ? startRow : startRow + i;
    const c = direction === 'across' ? startCol + i : startCol;
    const cell = cells[r][c];
    
    // Conflict with existing letter
    if (!cell.isBlock && cell.char !== chars[i]) return false;
    
    if (!cell.isBlock && cell.char === chars[i]) {
      intersections++;
    } else {
      // If it's a block, make sure adjacent cells perpendicular to the direction are also blocks
      // to avoid side-by-side words without intersection
      if (direction === 'across') {
        if (r > 0 && !cells[r - 1][c].isBlock) return false;
        if (r < height - 1 && !cells[r + 1][c].isBlock) return false;
      } else {
        if (c > 0 && !cells[r][c - 1].isBlock) return false;
        if (c < width - 1 && !cells[r][c + 1].isBlock) return false;
      }
    }
  }
  
  // Must intersect at least once
  return intersections > 0;
}

function calculatePlacementScore(cells, chars, startRow, startCol, direction) {
  let score = 0;
  for (let i = 0; i < chars.length; i++) {
    const r = direction === 'across' ? startRow : startRow + i;
    const c = direction === 'across' ? startCol + i : startCol;
    if (!cells[r][c].isBlock && cells[r][c].char === chars[i]) {
      score++;
    }
  }
  return score;
}

function numberCells(cells, words) {
  let currentNumber = 1;
  // Sort words by start location (top to bottom, left to right)
  const sortedWords = [...words].sort((a, b) => {
    if (a.startRow === b.startRow) {
      return a.startCol - b.startCol;
    }
    return a.startRow - b.startRow;
  });
  
  for (const word of sortedWords) {
    const cell = cells[word.startRow][word.startCol];
    if (!cell.number) {
      cell.number = currentNumber++;
    }
  }
}
