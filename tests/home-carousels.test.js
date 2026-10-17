import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { PRODUCTS } from '../data/catalog.js';

const main = readFileSync(new URL('../js/main.js', import.meta.url), 'utf8');
const styles = readFileSync(new URL('../css/styles.css', import.meta.url), 'utf8');

test('homepage concern carousel links every catalog concern to the filtered collection route', () => {
  const concerns = new Set(PRODUCTS.flatMap((product) => [...(product.concerns || []), ...(product.category ? [product.category] : [])]).filter((concern) => concern && concern !== 'À classer'));
  assert.match(main, /collection\.html\?concern=/);
  for (const concern of concerns) {
    assert.ok(PRODUCTS.some((product) => product.category === concern || (product.concerns || []).includes(concern)), `${concern} should show relevant products`);
  }
});

test('homepage brand carousel uses genuine local assets and filtered brand routes', () => {
  const logoPaths = [...main.matchAll(/'([^']+)': '\.\/assets\/brands\/([^']+)'/g)].map(([, brand, file]) => ({ brand, file }));
  const brands = new Set(PRODUCTS.map((product) => product.brand).filter(Boolean));
  assert.match(main, /collection\.html\?brand=/);
  assert.equal(logoPaths.length, brands.size, 'each catalog brand should have a logo asset');
  for (const { brand, file } of logoPaths) {
    assert.ok(brands.has(brand), `${brand} should occur in the product catalog`);
    assert.ok(existsSync(new URL(`../assets/brands/${file}`, import.meta.url)), `${file} should exist locally`);
    assert.ok(PRODUCTS.some((product) => product.brand === brand), `${brand} should link to products`);
  }
});

test('both homepage carousels support horizontal scroll, snap, and reduced motion', () => {
  assert.match(styles, /\.concern-carousel,\.featured-brand-grid\{[^}]*overflow-x:auto/);
  assert.match(styles, /scroll-snap-type:x mandatory/);
  assert.match(styles, /touch-action:pan-x/);
  assert.match(styles, /prefers-reduced-motion:reduce\)\{\.concern-carousel,\.featured-brand-grid\{scroll-behavior:auto/);
  assert.match(main, /data-horizontal-scroll/);
  assert.match(main, /ArrowLeft.*ArrowRight/);
});
