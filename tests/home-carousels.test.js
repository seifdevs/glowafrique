import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { PRODUCTS } from '../data/catalog.js';

const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const styles = readFileSync(new URL('../css/styles.css', import.meta.url), 'utf8');

test('homepage concern carousel links every catalog concern to the filtered collection route', () => {
  const concerns = new Set(
    PRODUCTS.flatMap((product) => [
      ...(product.concerns || []),
      ...(product.category ? [product.category] : []),
    ]).filter((concern) => concern && concern !== 'À classer'),
  );
  assert.match(app, /collections\/concern\/\$\{slug\(concern\)\}/);
  assert.match(app, /function Carousel\(/);
  for (const concern of concerns) {
    assert.ok(
      PRODUCTS.some(
        (product) => product.category === concern || (product.concerns || []).includes(concern),
      ),
      `${concern} should show relevant products`,
    );
  }
});

test('homepage brand carousel uses genuine local assets and filtered brand routes', () => {
  const logoBlock = app.match(/const LOGOS = \{([\s\S]*?)\};/)?.[1] || '';
  const logoPaths = [
    ...logoBlock.matchAll(/(?:'([^']+)'|([A-Z][A-Za-z0-9 .-]*)):\s*'([^']+)'/g),
  ].map(([, quoted, bare, file]) => ({
    brand: quoted || bare.trim(),
    file: file.split('/').at(-1),
  }));
  const brands = new Set(PRODUCTS.map((product) => product.brand).filter(Boolean));
  assert.match(app, /collections\/brand\/\$\{slug\(brand\)\}/);
  assert.equal(logoPaths.length, brands.size, 'each catalog brand should have a logo asset');
  for (const { brand, file } of logoPaths) {
    assert.ok(brands.has(brand), `${brand} should occur in the product catalog`);
    assert.ok(
      existsSync(new URL(`../assets/brands/${file}`, import.meta.url)),
      `${file} should exist locally`,
    );
    assert.ok(
      PRODUCTS.some((product) => product.brand === brand),
      `${brand} should link to products`,
    );
  }
});

test('both homepage carousels support horizontal scroll, snap, and reduced motion', () => {
  assert.match(styles, /\.concern-carousel,\.featured-brand-grid\{[^}]*overflow-x:auto/);
  assert.match(styles, /scroll-snap-type:x mandatory/);
  assert.match(styles, /touch-action:pan-x/);
  assert.match(
    styles,
    /prefers-reduced-motion:reduce\)\{\.concern-carousel,\.featured-brand-grid\{scroll-behavior:auto/,
  );
  assert.match(app, /className={`infinite-carousel \$\{variant\}-marquee`}/);
  assert.match(app, /className="infinite-carousel-track"/);
  assert.match(app, /aria-hidden="true" inert/);
  assert.match(styles, /animation:infinite-home-marquee[^}]*infinite/);
  assert.match(styles, /prefers-reduced-motion:reduce\)\{\.infinite-carousel-track\{animation:none/);
});
