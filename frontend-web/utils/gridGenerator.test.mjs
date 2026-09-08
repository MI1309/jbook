import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildWordGraph,
  findLargestConnectedComponent,
  generateCrosswordGrid
} from './gridGenerator.js';

const kanjiWords = ['日本', '本日', '日曜日', '毎日', '毎年', '年上', '上手']
  .map((word, index) => ({ id: String(index), word, reading: word, meaning: word }));

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
