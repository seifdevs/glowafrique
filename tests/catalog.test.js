import test from 'node:test';
import assert from 'node:assert/strict';
import { PRODUCTS } from '../data/catalog.js';

test('beta storefront catalog has a consistent, explicit XOF test price for every product', () => {
  assert.equal(PRODUCTS.length, 34);
  for (const product of PRODUCTS) {
    assert.ok(Number.isSafeInteger(product.price) && product.price > 0, `${product.id} has a positive whole-number price`);
    assert.equal(product.priceCurrency, 'XOF', `${product.id} remains in XOF`);
    assert.equal(product.pricingType, 'beta', `${product.id} is clearly marked as beta pricing`);
    assert.equal(product.isBetaPrice, true, `${product.id} can display its beta price label`);
    assert.ok(product.images.length > 0 || product.beforeAfter?.images?.length > 0, `${product.id} retains usable product imagery`);
  }
});

test('product concerns in the catalog resolve to actual products', () => {
  const concerns = new Set(PRODUCTS.flatMap((product) => product.concerns || []));
  for (const concern of concerns) {
    assert.ok(PRODUCTS.some((product) => product.category === concern || (product.concerns || []).includes(concern)), `${concern} has a product listing`);
  }
});
