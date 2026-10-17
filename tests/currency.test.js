import test from 'node:test';
import assert from 'node:assert/strict';
import { formatXof, pointsForXof, toXof } from '../lib/currency.js';

test('converts explicit USD prices at the fixed 630 XOF rate', () => {
  assert.equal(toXof('1.00', 'USD'), 630);
  assert.equal(toXof('10.50', 'USD'), 6615);
});

test('keeps XOF prices in XOF without converting twice', () => {
  assert.equal(toXof('6300', 'XOF'), 6300);
  assert.equal(formatXof(6300), '6,300 XOF');
});

test('awards one whole point per complete 630 XOF of eligible spending', () => {
  assert.equal(pointsForXof(629), 0);
  assert.equal(pointsForXof(630), 1);
  assert.equal(pointsForXof(1259), 1);
  assert.equal(pointsForXof(1260), 2);
});

test('refuses ambiguous currencies and invalid decimal precision', () => {
  assert.throws(() => toXof(100, ''), /currency must be set/);
  assert.throws(() => toXof('10.999', 'USD'), /Invalid monetary amount/);
});
