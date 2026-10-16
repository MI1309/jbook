import assert from 'node:assert/strict';
import test from 'node:test';
import { allocateQuestionsByType } from './practiceQuestionAllocation.js';

const entries = [
  ...Array.from({ length: 20 }, (_, index) => ({ type: 'kana', item: { id: `kana-${index}` } })),
  ...Array.from({ length: 20 }, (_, index) => ({ type: 'particle', item: { id: `particle-${index}` } })),
];

test('splits mixed Kana and Particle practice evenly within total limit', () => {
  const selected = allocateQuestionsByType(entries, ['kana', 'particle'], 10);

  assert.equal(selected.length, 10);
  assert.equal(selected.filter(entry => entry.type === 'kana').length, 5);
  assert.equal(selected.filter(entry => entry.type === 'particle').length, 5);
});

test('redistributes unused quota when one selected type has a smaller pool', () => {
  const smallKanaPool = [
    { type: 'kana', item: { id: 'kana-1' } },
    ...entries.filter(entry => entry.type === 'particle'),
  ];
  const selected = allocateQuestionsByType(smallKanaPool, ['kana', 'particle'], 10);

  assert.equal(selected.length, 10);
  assert.equal(selected.filter(entry => entry.type === 'kana').length, 1);
  assert.equal(selected.filter(entry => entry.type === 'particle').length, 9);
});

test('caps and balances an older API response that returns the limit for each type', () => {
  const oldApiResponse = [
    ...Array.from({ length: 10 }, (_, index) => ({ type: 'kana', id: `kana-${index}` })),
    ...Array.from({ length: 10 }, (_, index) => ({ type: 'kanji', id: `kanji-${index}` })),
  ];
  const selected = allocateQuestionsByType(oldApiResponse, ['kana', 'kanji'], 10);

  assert.equal(selected.length, 10);
  assert.equal(selected.filter(question => question.type === 'kana').length, 5);
  assert.equal(selected.filter(question => question.type === 'kanji').length, 5);
});
