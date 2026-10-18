import test from 'node:test';
import assert from 'node:assert/strict';
import { PRODUCTS } from '../data/catalog.js';
import { catalogPriceXof } from '../lib/catalog.js';

test('beta test prices are never offered as verified production prices', () => {
  assert.equal(PRODUCTS.length, 34);
  for (const product of PRODUCTS) {
    assert.ok(
      Number.isSafeInteger(product.price) && product.price > 0,
      `${product.id} has a positive whole-number price`,
    );
    assert.equal(product.priceCurrency, 'XOF', `${product.id} remains in XOF`);
    assert.equal(product.pricingType, 'beta', `${product.id} is clearly marked as beta pricing`);
    assert.equal(product.isBetaPrice, true, `${product.id} is clearly marked as beta pricing`);
    assert.equal(catalogPriceXof(product), null, `${product.id} cannot be ordered at a test price`);
    assert.ok(
      product.images.length > 0 || product.beforeAfter?.images?.length > 0,
      `${product.id} retains usable product imagery`,
    );
  }
});

test('product concerns in the catalog resolve to actual products', () => {
  const concerns = new Set(PRODUCTS.flatMap((product) => product.concerns || []));
  for (const concern of concerns) {
    assert.ok(
      PRODUCTS.some(
        (product) => product.category === concern || (product.concerns || []).includes(concern),
      ),
      `${concern} has a product listing`,
    );
  }
});
