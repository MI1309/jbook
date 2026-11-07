import assert from 'node:assert/strict';
import test from 'node:test';
import { applyPilotFallback } from './bunpo-fallback.mjs';

const pilotSections = {
    mainFunction: { summary: 'Pilot summary', points: ['Pilot point'] },
};
const pilot = {
    'wa-desu': { title: '～は～です', sections: pilotSections },
};

test('uses pilot sections when database sections are null', () => {
    const grammar = { slug: 'wa-desu', title: '～は～です', sections: null };

    assert.deepEqual(applyPilotFallback(grammar, 'wa-desu', pilot).sections, pilotSections);
});

test('preserves non-empty database sections over pilot sections', () => {
    const databaseSections = { mainFunction: { summary: 'Database summary' } };
    const grammar = { slug: 'wa-desu', title: '～は～です', sections: databaseSections };

    assert.equal(applyPilotFallback(grammar, 'wa-desu', pilot).sections, databaseSections);
});

test('uses pilot sections when database sections are an empty object', () => {
    const grammar = { slug: 'wa-desu', title: '～は～です', sections: {} };

    assert.deepEqual(applyPilotFallback(grammar, 'wa-desu', pilot).sections, pilotSections);
});

test('preserves partial non-empty database sections over the full pilot', () => {
    const databaseSections = { mainFunction: { summary: 'Database summary' } };
    const grammar = { slug: 'wa-desu', title: '～は～です', sections: databaseSections };

    assert.equal(applyPilotFallback(grammar, 'wa-desu', pilot).sections, databaseSections);
});

test('leaves sections unchanged when no pilot entry matches', () => {
    const grammar = { slug: 'other-pattern', title: 'Other pattern', sections: null };

    assert.equal(applyPilotFallback(grammar, 'other-pattern', pilot), grammar);
});