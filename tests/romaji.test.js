import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeRomaji, normalizeRomajiCandidates, matchRomajiInput } from '../src/utils/romaji.js';

test('normalizeRomaji applies case/width/space normalization', () => {
    assert.equal(normalizeRomaji(' Ｋｏｎｎｉｃｈｉｗａ '), 'konnichiwa');
    assert.equal(normalizeRomaji('KO NNI\tCHI\nWA'), 'konnichiwa');
});

test('normalizeRomaji normalizes punctuation and long vowels consistently', () => {
    assert.equal(normalizeRomaji('konnichiwa、sekai。'), 'konnichiwa,sekai.');
    assert.equal(normalizeRomaji('eーe'), 'e-e');
});

test('matchRomajiInput handles prefix and completion with multiple candidates', () => {
    const expected = normalizeRomajiCandidates('konnichiwa|konnichiha');
    const prefix = matchRomajiInput(expected, 'konni');
    assert.equal(prefix.isValid, true);
    assert.equal(prefix.isComplete, false);

    const complete = matchRomajiInput(expected, 'konnichiha');
    assert.equal(complete.isValid, true);
    assert.equal(complete.isComplete, true);
});

test('matchRomajiInput handles single candidate and repeated syllables', () => {
    const expected = normalizeRomajiCandidates('haha');
    const prefix = matchRomajiInput(expected, 'ha');
    assert.equal(prefix.isValid, true);
    assert.equal(prefix.isComplete, false);

    const complete = matchRomajiInput(expected, 'haha');
    assert.equal(complete.isValid, true);
    assert.equal(complete.isComplete, true);
});

test('matchRomajiInput supports punctuation and comma', () => {
    const expected = normalizeRomajiCandidates('konnichiwa,sekai.');
    const prefix = matchRomajiInput(expected, 'konnichiwa,sek');
    assert.equal(prefix.isValid, true);
    assert.equal(prefix.isComplete, false);

    const complete = matchRomajiInput(expected, 'konnichiwa、sekai。');
    assert.equal(complete.isValid, true);
    assert.equal(complete.isComplete, true);
});
