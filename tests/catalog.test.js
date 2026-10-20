import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PRODUCTS } from '../data/catalog.js';
import { catalogPriceXof } from '../lib/catalog.js';

test('supplied XOF retail prices are verified and unavailable prices cannot be ordered', () => {
  assert.equal(PRODUCTS.length, 34);
  const suppliedPrices = {
    'beauty-of-joseon-mate-sun-stick': 13000,
    'biodance-rejuvenating-caviar-pdrn-mask': 18000,
    'celimax-the-vita-a-retinal-shot-tightening-booster': 14000,
    'cosrx-acne-pimple-master-patch': 3500,
    'cosrx-pimple-patch': 3500,
    'dr-melaxin-peel-shot-exfoliating-black-rice-ampoule': 18000,
    'dr-althea-345-relief-cream': 17500,
    'dr-althea-147-barrier-cream': 18000,
    'dr-althea-35-relief-mist': 15500,
    'kundal-caffeine-scalp-serum': 15000,
    'kundal-linen-flower-deodorant': 11000,
    'medicube-glow-vanilla-hair-body-mist': 15000,
    'medicube-deodorant-vanilla-pistachio': 15000,
    'medicube-kojic-acid-capsule-cream': 16000,
    'medicube-kojic-acid-turmeric-peel-shot-80ml': 15000,
    'medicube-glow-sunscreen': 13000,
    'medicube-pdrn-pink-capsule-cream': 16000,
    'medicube-lip-sleeping-mask': 12000,
    'medicube-pdrn-collagen-jelly-eye-mask': 17500,
    'medicube-txa-serum': 15500,
    'medicube-pdrn-gel-mask': 6000,
  };
  for (const [id, expectedPrice] of Object.entries(suppliedPrices)) {
    const product = PRODUCTS.find((item) => item.id === id);
    assert.ok(product, `${id} exists`);
    assert.equal(product.price, expectedPrice, `${id} has the supplied XOF price`);
    assert.equal(product.pricingType, 'retail', `${id} is no longer beta priced`);
    assert.equal(catalogPriceXof(product), expectedPrice, `${id} is purchasable at its XOF price`);
  }
  for (const id of [
    'axis-y-sunday-morning-cleansing-foam',
    'kundal-travel-kit-baby-powder',
    'medicube-kojic-acid-peel-shot-80ml',
    'dr-althea-35-relief-mist-webp',
    'dr-althea-35-relief-mistt',
  ]) {
    const product = PRODUCTS.find((item) => item.id === id);
    assert.ok(product, `${id} exists`);
    assert.equal(product.price, null, `${id} has no invented price`);
    assert.equal(catalogPriceXof(product), null, `${id} cannot be ordered until priced`);
  }
  for (const product of PRODUCTS) {
    assert.ok(
      product.images.length > 0 || product.beforeAfter?.images?.length > 0,
      `${product.id} retains usable product imagery`,
    );
  }
});

test('requested product copy is localized and does not fabricate ingredient lists', () => {
  const requestedIds = [
    'axis-y-sunday-morning-cleansing-foam',
    'beauty-of-joseon-mate-sun-stick',
    'biodance-rejuvenating-caviar-pdrn-mask',
    'celimax-the-vita-a-retinal-shot-tightening-booster',
    'cosrx-acne-pimple-master-patch',
    'dr-melaxin-peel-shot-exfoliating-black-rice-ampoule',
    'dr-althea-345-relief-cream',
    'dr-althea-35-relief-mist',
    'dr-althea-147-barrier-cream',
    'kundal-caffeine-scalp-serum',
    'kundal-linen-flower-deodorant',
    'kundal-travel-kit-baby-powder',
    'medicube-glow-vanilla-hair-body-mist',
    'medicube-deodorant-vanilla-pistachio',
    'medicube-kojic-acid-capsule-cream',
    'medicube-kojic-acid-turmeric-peel-shot-80ml',
    'medicube-glow-sunscreen',
    'medicube-pdrn-pink-capsule-cream',
    'medicube-lip-sleeping-mask',
    'medicube-pdrn-collagen-jelly-eye-mask',
    'medicube-txa-serum',
    'medicube-pdrn-gel-mask',
  ];
  for (const id of requestedIds) {
    const product = PRODUCTS.find((item) => item.id === id);
    assert.ok(product?.content?.en?.description, `${id} has English About copy`);
    assert.ok(product?.content?.fr?.description, `${id} has French About copy`);
    assert.ok(product.content.en.howToUse, `${id} has English usage guidance`);
    assert.ok(product.content.fr.howToUse, `${id} has French usage guidance`);
    assert.match(product.content.en.ingredients, /Full ingredient list not yet provided/);
    assert.match(product.content.fr.ingredients, /La liste complète des ingrédients/);
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

test('supplied catalog images resolve to local public assets in gallery order', async () => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const overrides = JSON.parse(
    fs.readFileSync(path.join(root, 'data/product-image-overrides.json'), 'utf8'),
  );
  assert.ok(Object.keys(overrides).length >= 20);
  for (const [id, images] of Object.entries(overrides)) {
    const product = PRODUCTS.find((item) => item.id === id);
    assert.ok(product, `${id} exists in the catalog`);
    assert.ok(images.length > 0, `${id} has a cover or gallery image`);
    assert.deepEqual(product.images, images, `${id} uses the supplied image order`);
    for (const image of images) {
      assert.ok(fs.existsSync(path.join(root, 'public', image)), `${image} is present locally`);
    }
  }
});
