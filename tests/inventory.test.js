import test from 'node:test';
import assert from 'node:assert/strict';
import { reserveInventory } from '../lib/inventory.js';

function createInventory(seed) {
  const stock = new Map(
    Object.entries(seed).map(([productId, quantity]) => [productId, { productId, quantity }]),
  );
  return {
    stock,
    database: {
      collection() {
        return {
          async createIndex() {},
          async findOneAndUpdate(filter, update) {
            const item = stock.get(filter.productId);
            if (!item || item.quantity < filter.quantity.$gte) return { value: null };
            item.quantity += update.$inc.quantity;
            return { value: { ...item } };
          },
          async findOne(filter) {
            const item = stock.get(filter.productId);
            return item ? { ...item } : null;
          },
          async updateOne(filter, update) {
            const item = stock.get(filter.productId);
            if (item) item.quantity += update.$inc.quantity;
          },
        };
      },
    },
  };
}

test('inventory reservation is atomic per product and rolls back earlier lines on failure', async () => {
  const mock = createInventory({ cleanser: 5, serum: 0 });
  await assert.rejects(
    reserveInventory(mock.database, [
      { productId: 'cleanser', productName: 'Cleanser', quantity: 2 },
      { productId: 'serum', productName: 'Serum', quantity: 1 },
    ]),
    { statusCode: 409, message: 'Serum does not have enough stock for this quantity.' },
  );
  assert.equal(mock.stock.get('cleanser').quantity, 5);
  assert.equal(mock.stock.get('serum').quantity, 0);
});

test('unconfigured stock fails checkout instead of assuming infinite inventory', async () => {
  const mock = createInventory({});
  await assert.rejects(
    reserveInventory(mock.database, [
      { productId: 'unknown', productName: 'Product', quantity: 1 },
    ]),
    { statusCode: 409, message: 'Product is not available for ordering yet.' },
  );
});
