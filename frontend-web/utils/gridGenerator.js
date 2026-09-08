const DEFAULT_OPTIONS = {
  minWords: 5,
  maxWords: 10,
  maxAttempts: 5,
  maxNodes: 5000
};

function createEmptyGrid(width, height) {
  return Array.from({ length: height }, (_, row) => (
    Array.from({ length: width }, (_, col) => ({
      row,
      col,
      char: '',
      isBlock: true,
      wordIds: [],
      userInput: '',
      validationState: 'empty',
      penaltyApplied: false
    }))
  ));
}

export function getAnswerText(kotoba, useKanji = false) {
  return useKanji ? kotoba?.word || '' : kotoba?.reading || kotoba?.hiragana || '';
}

export function buildWordGraph(kotobaList, useKanji = false) {
  const nodes = kotobaList.map((kotoba, index) => {
    const text = getAnswerText(kotoba, useKanji);
    return { kotoba, index, text, characters: new Set(text), neighbors: new Set() };
  }).filter(node => node.text.length > 1);

  for (let left = 0; left < nodes.length; left++) {
    for (let right = left + 1; right < nodes.length; right++) {
      const sharesCharacter = [...nodes[left].characters].some(char => nodes[right].characters.has(char));
      if (sharesCharacter) {
        nodes[left].neighbors.add(right);
        nodes[right].neighbors.add(left);
      }
    }
  }
  return nodes;
}

export function findLargestConnectedComponent(graph) {
  const byIndex = new Map(graph.map(node => [node.index, node]));
  const visited = new Set();
  let largest = [];

  for (const node of graph) {
    if (visited.has(node.index)) continue;
    const queue = [node.index];
    const component = [];
    visited.add(node.index);

    while (queue.length) {
      const index = queue.shift();
      const current = byIndex.get(index);
      if (!current) continue;
      component.push(current);
      current.neighbors.forEach(neighbor => {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      });
    }

    if (component.length > largest.length) largest = component;
  }
  return largest;
}

export function selectWordSeeds(kotobaList, useKanji = false, limit = 10) {
  const component = findLargestConnectedComponent(buildWordGraph(kotobaList, useKanji));
  return component
    .sort((left, right) => right.neighbors.size - left.neighbors.size)
    .slice(0, limit)
    .map(node => node.kotoba);
}

export function generateCrosswordGrid(kotobaList, width = 10, height = 10, levelStr = '5', useKanji = false, options = {}) {
  const config = { ...DEFAULT_OPTIONS, ...options };
  const component = findLargestConnectedComponent(buildWordGraph(kotobaList, useKanji))
    .filter(node => node.text.length <= Math.max(width, height))
    .sort((left, right) => right.neighbors.size - left.neighbors.size);
  let best = { cells: createEmptyGrid(width, height), words: [] };
  let attempts = 0;

  // Try several hubs because the most connected word can still produce poor geometry.
  for (const seed of component.slice(0, config.maxAttempts)) {
    attempts += 1;
    const state = { cells: createEmptyGrid(width, height), words: [], nodes: 0 };
    const row = Math.floor(height / 2);
    const col = Math.floor((width - seed.text.length) / 2);
    placeWord(state.cells, state.words, seed.kotoba, row, col, 'across', useKanji);
    searchPlacements(state, component, new Set([seed.index]), width, height, useKanji, config, best);
    if (best.words.length >= config.maxWords) break;
  }

  numberCells(best.cells, best.words);
  return {
    width,
    height,
    cells: best.cells,
    words: best.words,
    choiceBank: buildChoiceBank(best.words, component, options.choiceBank, options.choiceBankLimit),
    level: levelStr,
    attempts,
    generatedAt: new Date().toISOString()
  };
}

function searchPlacements(state, candidates, usedIndexes, width, height, useKanji, config, best) {
  state.nodes += 1;
  if (state.nodes > config.maxNodes) return;

  if (state.words.length > best.words.length) {
    best.cells = cloneCells(state.cells);
    best.words = state.words.map(word => ({ ...word }));
  }
  if (state.words.length >= config.maxWords) return;

  const placedCharacters = new Set(state.words.flatMap(word => [...word.text]));
  const nextCandidates = candidates
    .filter(candidate => !usedIndexes.has(candidate.index))
    .filter(candidate => [...candidate.characters].some(char => placedCharacters.has(char)))
    .sort((left, right) => {
      const leftOverlap = [...left.characters].filter(char => placedCharacters.has(char)).length;
      const rightOverlap = [...right.characters].filter(char => placedCharacters.has(char)).length;
      return rightOverlap - leftOverlap || right.neighbors.size - left.neighbors.size;
    });

  for (const candidate of nextCandidates) {
    const placements = findValidPlacements(state.cells, candidate.kotoba, width, height, useKanji, state.words);
    for (const placement of placements) {
      placeWord(state.cells, state.words, candidate.kotoba, placement.row, placement.col, placement.direction, useKanji);
      usedIndexes.add(candidate.index);
      searchPlacements(state, candidates, usedIndexes, width, height, useKanji, config, best);
      usedIndexes.delete(candidate.index);
      unplaceWord(state.cells, state.words, candidate.kotoba, placement.row, placement.col, placement.direction, useKanji);
      if (state.nodes > config.maxNodes || best.words.length >= config.maxWords) return;
    }
  }
}

function findValidPlacements(cells, kotoba, width, height, useKanji, wordsForPlacement) {
  const chars = getAnswerText(kotoba, useKanji).split('');
  const placements = [];

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      for (const direction of ['across', 'down']) {
        const placement = { row, col, direction };
        if (!canPlace(cells, chars, placement, width, height, wordsForPlacement)) continue;
        const intersections = intersectionScore(cells, chars, placement);
        if (intersections === 0) continue;
        const distance = Math.abs(row - height / 2) + Math.abs(col - width / 2);
        placements.push({ ...placement, score: intersections * 100 - distance });
      }
    }
  }
  return placements.sort((left, right) => right.score - left.score);
}

function canPlace(cells, chars, placement, width, height, wordsForPlacement) {
  const { row, col, direction } = placement;
  const endRow = row + (direction === 'down' ? chars.length - 1 : 0);
  const endCol = col + (direction === 'across' ? chars.length - 1 : 0);
  if (row < 0 || col < 0 || endRow >= height || endCol >= width) return false;

  const before = direction === 'down' ? [row - 1, col] : [row, col - 1];
  const after = direction === 'down' ? [endRow + 1, col] : [row, endCol + 1];
  if (isOccupied(cells, ...before) || isOccupied(cells, ...after)) return false;

  for (let index = 0; index < chars.length; index++) {
    const currentRow = row + (direction === 'down' ? index : 0);
    const currentCol = col + (direction === 'across' ? index : 0);
    const cell = cells[currentRow][currentCol];
    if (!cell.isBlock && cell.char !== chars[index]) return false;
    if (!cell.isBlock && cell.wordIds.some(wordId => {
      const existingWord = wordsForPlacement.find(word => word.id === wordId);
      return existingWord?.direction === direction;
    })) return false;

    // Keep parallel words visually separated unless this cell is the crossing point.
    if (cell.isBlock) {
      const sideA = direction === 'across' ? [currentRow - 1, currentCol] : [currentRow, currentCol - 1];
      const sideB = direction === 'across' ? [currentRow + 1, currentCol] : [currentRow, currentCol + 1];
      if (isOccupied(cells, ...sideA) || isOccupied(cells, ...sideB)) return false;
    }
  }
  return intersectionScore(cells, chars, placement) > 0;
}

function intersectionScore(cells, chars, placement) {
  let score = 0;
  for (let index = 0; index < chars.length; index++) {
    const row = placement.row + (placement.direction === 'down' ? index : 0);
    const col = placement.col + (placement.direction === 'across' ? index : 0);
    if (!cells[row][col].isBlock && cells[row][col].char === chars[index]) score++;
  }
  return score;
}

function isOccupied(cells, row, col) {
  return row >= 0 && row < cells.length && col >= 0 && col < cells[0].length && !cells[row][col].isBlock;
}

function placeWord(cells, words, kotoba, startRow, startCol, direction, useKanji) {
  const text = getAnswerText(kotoba, useKanji);
  text.split('').forEach((char, index) => {
    const row = startRow + (direction === 'down' ? index : 0);
    const col = startCol + (direction === 'across' ? index : 0);
    cells[row][col].isBlock = false;
    cells[row][col].char = char;
    if (!cells[row][col].wordIds.includes(kotoba.id)) cells[row][col].wordIds.push(kotoba.id);
  });
  words.push({
    id: kotoba.id,
    text,
    reading: kotoba.reading || kotoba.hiragana,
    word: kotoba.word,
    meaning: kotoba.meaning || kotoba.word,
    clue: kotoba.meaning || kotoba.word,
    direction,
    startRow,
    startCol,
    length: text.length,
    level: kotoba.level,
    isCompleted: false
  });
}

function unplaceWord(cells, words, kotoba, startRow, startCol, direction, useKanji) {
  const text = getAnswerText(kotoba, useKanji);
  text.split('').forEach((_, index) => {
    const row = startRow + (direction === 'down' ? index : 0);
    const col = startCol + (direction === 'across' ? index : 0);
    cells[row][col].wordIds = cells[row][col].wordIds.filter(id => id !== kotoba.id);
    if (cells[row][col].wordIds.length === 0) {
      cells[row][col].isBlock = true;
      cells[row][col].char = '';
    }
  });
  const wordIndex = words.findIndex(word => word.id === kotoba.id);
  if (wordIndex >= 0) words.splice(wordIndex, 1);
}

function buildChoiceBank(words, candidates, suppliedBank, choiceBankLimit) {
  const used = new Set(words.flatMap(word => [...word.text]));
  const pool = suppliedBank || candidates.flatMap(candidate => [...candidate.text]);
  const distractors = [...new Set(pool)].filter(char => !used.has(char)).sort(() => Math.random() - 0.5);
  const extras = Number.isFinite(choiceBankLimit)
    ? distractors.slice(0, Math.max(0, choiceBankLimit - used.size))
    : distractors;
  return [...used, ...extras].sort(() => Math.random() - 0.5);
}

function cloneCells(cells) {
  return cells.map(row => row.map(cell => ({ ...cell, wordIds: [...cell.wordIds] })));
}

function numberCells(cells, words) {
  let number = 1;
  [...words]
    .sort((left, right) => left.startRow - right.startRow || left.startCol - right.startCol)
    .forEach(word => {
      const cell = cells[word.startRow][word.startCol];
      if (!cell.number) cell.number = number++;
    });
}
