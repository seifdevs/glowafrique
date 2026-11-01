import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { PRODUCTS } from '../data/catalog.js';

test('storefront exposes the requested delivery, loyalty, preorder, and navigation details', async () => {
  const app = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');
  const styles = await readFile(new URL('../css/styles.css', import.meta.url), 'utf8');
  assert.match(app, /className="hero-cta-link" to="\/products"/);
  assert.match(app, /New Stock Coming Soon/);
  assert.doesNotMatch(app, /className="mobile-nav-link" to="\/policies\/how-to-use"/);
  assert.match(app, /to="\/pre-orders"/);
  for (const field of ['product', 'image', 'name', 'email', 'phone'])
    assert.match(app, new RegExp(`name="${field}"`));
  assert.match(app, /Yango delivery/);
  assert.match(app, /Yango delivery requires payment via Wave/);
  assert.match(app, /Glow Points/);
  assert.match(app, /585 CFA/);
  assert.match(app, /one review per product/);
  assert.match(app, /https:\/\/www\.tiktok\.com\/@glowafrique7"/);
  assert.match(styles, /\.loyalty-welcome-backdrop/);
});

test('catalog galleries contain no repeated image content', async () => {
  const { createHash } = await import('node:crypto');
  const { readFile: readAsset } = await import('node:fs/promises');
  const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
  for (const product of PRODUCTS) {
    const hashes = await Promise.all(product.images.map(async (image) => {
      const decoded = decodeURIComponent(image);
      const absolute = decoded.startsWith('images/') ? path.join(root, 'public', decoded) : path.join(root, decoded);
      return createHash('sha256').update(await readAsset(absolute)).digest('hex');
    }));
    assert.equal(new Set(hashes).size, hashes.length, `${product.id} has unique gallery images`);
  }
});
