import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildWordGraph,
  findLargestConnectedComponent,
  generateCrosswordGrid,
  shuffleInPlace
} from './gridGenerator.js';

const kanjiWords = ['日本', '本日', '日曜日', '毎日', '毎年', '年上', '上手']
  .map((word, index) => ({ id: String(index), word, reading: word, meaning: word }));

function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

test('seed can differ on identical input with different RNG', () => {
  const validIds = new Set(kanjiWords.map(word => word.id));
  const seedIds = Array.from({ length: 5 }, (_, index) => {
    const grid = generateCrosswordGrid(kanjiWords, 20, 20, '5', true, {
      maxNodes: 20000,
      rng: mulberry32(index + 1)
    });
    return grid.words[0]?.id;
  });

  assert.ok(new Set(seedIds).size >= 2, `Expected varied seeds, got ${seedIds.join(', ')}`);
  assert.ok(seedIds.every(id => validIds.has(id)));
});

test('same RNG seed produces identical grid', () => {
  const firstGrid = generateCrosswordGrid(kanjiWords, 20, 20, '5', true, {
    maxNodes: 20000,
    rng: mulberry32(42)
  });
  const secondGrid = generateCrosswordGrid(kanjiWords, 20, 20, '5', true, {
    maxNodes: 20000,
    rng: mulberry32(42)
  });

  assert.deepEqual(firstGrid.words.map(word => word.id), secondGrid.words.map(word => word.id));
  assert.ok(firstGrid.words.length >= 5);
});

test('fisher-yates shuffle produces a permutation, not identity', () => {
  const values = [1, 2, 3, 4, 5];
  const shuffled = shuffleInPlace([...values], mulberry32(7));

  assert.deepEqual([...shuffled].sort(), values);
  assert.notDeepEqual(shuffled, values);
});

test('grid always keeps minimum 5 words with real crossings', () => {
  for (let seed = 1; seed <= 10; seed++) {
    const grid = generateCrosswordGrid(kanjiWords, 20, 20, '5', true, {
      maxNodes: 20000,
      rng: mulberry32(seed)
    });

    assert.ok(grid.words.length >= 5, `Seed ${seed} generated ${grid.words.length} words`);
    assert.ok(grid.words.some(word => word.direction === 'down'), `Seed ${seed} has no crossing`);
  }
});

test('builds the largest connected word component', () => {
  const graph = buildWordGraph([...kanjiWords, { id: 'isolated', word: '猫', reading: 'ねこ' }], true);
  const component = findLargestConnectedComponent(graph);
  assert.equal(component.length, kanjiWords.length);
});

test('generates five or more kanji entries with real across/down crossings', () => {
  const grid = generateCrosswordGrid(kanjiWords, 20, 20, '5', true, { maxNodes: 20000 });
  const downWords = grid.words.filter(word => word.direction === 'down');
  assert.ok(grid.words.length >= 5);
  assert.ok(downWords.length >= 1);
  assert.ok(grid.words.every(word => word.text === word.word));
  grid.cells.flat().forEach(cell => {
    const directions = cell.wordIds.map(id => grid.words.find(word => word.id === id)?.direction).filter(Boolean);
    assert.equal(new Set(directions).size, directions.length);
  });
});

test('stops searching once the requested minimum crossword size is reached', () => {
  const grid = generateCrosswordGrid(kanjiWords, 20, 20, '5', true, {
    minWords: 5,
    maxWords: 10,
    maxNodes: 5000,
    stopAtMinWords: true
  });

  assert.equal(grid.words.length, 5);
  assert.ok(grid.words.some(word => word.direction === 'down'));
});

test('uses reading as the hiragana grid answer', () => {
  const words = ['かな', 'なに', 'にほん', 'ほんや', 'やま', 'まど', 'どこ']
    .map((reading, index) => ({ id: String(index), word: `漢${index}`, reading, meaning: reading }));
  const grid = generateCrosswordGrid(words, 20, 20, '5', false, { maxNodes: 20000 });
  assert.ok(grid.words.length >= 5);
  assert.ok(grid.words.every(word => words.some(item => item.reading === word.text)));
});

test('adds distractors to the generated choice bank', () => {
  const grid = generateCrosswordGrid(kanjiWords, 20, 20, '5', true, {
    choiceBank: ['日', '本', '学', '校', '生', '先', '年', '上', '人', '大', '小', '中'],
    choiceBankLimit: 12
  });
  assert.ok(grid.choiceBank.length >= 8);
  assert.ok(grid.words.every(word => [...word.text].every(char => grid.choiceBank.includes(char))));
});
