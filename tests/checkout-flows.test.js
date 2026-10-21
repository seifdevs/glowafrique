import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import orderQuote from '../api-handlers/order-quote.js';
import ordersApi from '../api-handlers/orders.js';
import { PRODUCTS } from '../data/catalog.js';
import { validEmail } from '../lib/auth.js';

function response() {
  return {
    headers: {},
    statusCode: 200,
    setHeader(name, value) {
      this.headers[name] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

function configureDatabase() {
  const savedOrders = [];
  const proofs = [];
  const rateLimits = new Map();
  const collections = {
    glowafrique_rate_limits: {
      async createIndex() {},
      async findOneAndUpdate(filter, pipeline) {
        const update = pipeline[0].$set;
        const now = update.count.$cond[0].$gt[1].$literal;
        const prior = rateLimits.get(filter.key);
        const active = prior && prior.expiresAt > now;
        const record = {
          key: filter.key,
          count: active ? prior.count + 1 : 1,
          expiresAt: active ? prior.expiresAt : update.expiresAt.$cond[2].$literal,
        };
        rateLimits.set(filter.key, record);
        return {
          ...record,
        };
      },
    },
    glowafrique_inventory: {
      async createIndex() {},
      find: () => ({ toArray: async () => [] }),
    },
    glowafrique_orders: {
      async createIndex() {},
      async findOne(query) {
        if (query.idempotencyKey)
          return savedOrders.find((order) => order.idempotencyKey === query.idempotencyKey) || null;
        return null;
      },
      async insertOne(order) {
        savedOrders.push(order);
      },
    },
    glowafrique_payment_proofs: {
      async insertOne(proof) {
        proofs.push(proof);
      },
    },
  };
  const database = {
    collection: (name) => collections[name],
    client: {
      startSession: () => ({
        async withTransaction(action) {
          return action();
        },
        async endSession() {},
      }),
    },
  };
  globalThis.__glowAfriqueMongoClientPromise = Promise.resolve({ db: () => database });
  globalThis.__glowAfriqueDatabase = database;
  delete globalThis.__glowAfriqueRateLimitIndexes;
  delete globalThis.__glowAfriqueOrderIndexes;
  return { savedOrders, proofs };
}

function checkoutRequest(paymentMethod, extra = {}) {
  const product = PRODUCTS.find((item) => item.price != null && item.priceCurrency);
  return {
    method: 'POST',
    url: '/api/orders',
    headers: { origin: 'https://shop.test', host: 'shop.test' },
    body: {
      idempotencyKey: `checkout-${paymentMethod}-000001`,
      paymentMethod,
      language: 'en',
      customer: {
        firstName: 'Test',
        lastName: 'Customer',
        email: 'customer@example.com',
        phone: '+2250700000000',
        addressLine1: 'Main Road',
        addressLine2: '',
        city: 'Abidjan',
        division: 'Lagunes',
      },
      items: [{ productId: product.id, quantity: 1 }],
      ...extra,
    },
  };
}

test('Wave checkout can receive a total while inventory awaits confirmation', async () => {
  const previous = {
    mongoUri: process.env.MONGODB_URI,
    shippingFee: process.env.SHIPPING_FEE_XOF,
  };
  process.env.MONGODB_URI = 'mongodb://test.invalid/glowafrique';
  process.env.SHIPPING_FEE_XOF = '0';
  configureDatabase();
  try {
    const product = PRODUCTS.find((item) => item.price != null && item.priceCurrency);
    assert.ok(product);
    const res = response();
    await orderQuote(
      {
        method: 'POST',
        url: '/api/order-quote',
        headers: { origin: 'https://shop.test', host: 'shop.test' },
        body: { email: 'customer@example.com', items: [{ productId: product.id, quantity: 1 }] },
      },
      res,
    );
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.quoteStatus, 'ready');
    assert.equal(res.body.stockConfirmationPending, true);
    assert.equal(Number.isFinite(res.body.totalXof), true);
  } finally {
    if (previous.mongoUri === undefined) delete process.env.MONGODB_URI;
    else process.env.MONGODB_URI = previous.mongoUri;
    if (previous.shippingFee === undefined) delete process.env.SHIPPING_FEE_XOF;
    else process.env.SHIPPING_FEE_XOF = previous.shippingFee;
    delete globalThis.__glowAfriqueMongoClientPromise;
    delete globalThis.__glowAfriqueDatabase;
    delete globalThis.__glowAfriqueRateLimitIndexes;
  }
});

test('Cash on Delivery submits and returns a complete order response', async () => {
  const previous = {
    mongoUri: process.env.MONGODB_URI,
    shippingFee: process.env.SHIPPING_FEE_XOF,
    resendKey: process.env.RESEND_API_KEY,
    resendFrom: process.env.RESEND_FROM_EMAIL,
  };
  process.env.MONGODB_URI = 'mongodb://test.invalid/glowafrique';
  delete process.env.SHIPPING_FEE_XOF;
  delete process.env.RESEND_API_KEY;
  delete process.env.RESEND_FROM_EMAIL;
  const database = configureDatabase();
  try {
    const res = response();
    await ordersApi(checkoutRequest('cash_on_delivery'), res);
    assert.equal(res.statusCode, 201);
    assert.equal(res.body.order.paymentMethod, 'cash_on_delivery');
    assert.equal(typeof res.body.order.orderNumber, 'string');
    assert.equal(database.savedOrders.length, 1);
  } finally {
    if (previous.mongoUri === undefined) delete process.env.MONGODB_URI;
    else process.env.MONGODB_URI = previous.mongoUri;
    if (previous.shippingFee === undefined) delete process.env.SHIPPING_FEE_XOF;
    else process.env.SHIPPING_FEE_XOF = previous.shippingFee;
    if (previous.resendKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = previous.resendKey;
    if (previous.resendFrom === undefined) delete process.env.RESEND_FROM_EMAIL;
    else process.env.RESEND_FROM_EMAIL = previous.resendFrom;
    delete globalThis.__glowAfriqueMongoClientPromise;
    delete globalThis.__glowAfriqueDatabase;
    delete globalThis.__glowAfriqueRateLimitIndexes;
    delete globalThis.__glowAfriqueOrderIndexes;
  }
});

test('Wave order attaches its screenshot for administrator review', async () => {
  const previous = {
    mongoUri: process.env.MONGODB_URI,
    shippingFee: process.env.SHIPPING_FEE_XOF,
    resendKey: process.env.RESEND_API_KEY,
    resendFrom: process.env.RESEND_FROM_EMAIL,
  };
  process.env.MONGODB_URI = 'mongodb://test.invalid/glowafrique';
  process.env.SHIPPING_FEE_XOF = '0';
  delete process.env.RESEND_API_KEY;
  delete process.env.RESEND_FROM_EMAIL;
  const database = configureDatabase();
  try {
    const image = await readFile(new URL('../public/images/wave.jpeg', import.meta.url));
    const res = response();
    await ordersApi(
      checkoutRequest('wave', {
        waveSenderPhone: '+2250700000000',
        waveProof: { mimeType: 'image/jpeg', data: image.toString('base64') },
      }),
      res,
    );
    assert.equal(res.statusCode, 201);
    assert.equal(res.body.order.paymentMethod, 'wave');
    assert.equal(database.savedOrders.length, 1);
    assert.equal(typeof database.savedOrders[0].paymentProofId, 'string');
    assert.equal(database.proofs.length, 1);
    assert.equal(database.proofs[0].orderNumber, res.body.order.orderNumber);
  } finally {
    if (previous.mongoUri === undefined) delete process.env.MONGODB_URI;
    else process.env.MONGODB_URI = previous.mongoUri;
    if (previous.shippingFee === undefined) delete process.env.SHIPPING_FEE_XOF;
    else process.env.SHIPPING_FEE_XOF = previous.shippingFee;
    if (previous.resendKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = previous.resendKey;
    if (previous.resendFrom === undefined) delete process.env.RESEND_FROM_EMAIL;
    else process.env.RESEND_FROM_EMAIL = previous.resendFrom;
    delete globalThis.__glowAfriqueMongoClientPromise;
    delete globalThis.__glowAfriqueDatabase;
    delete globalThis.__glowAfriqueRateLimitIndexes;
    delete globalThis.__glowAfriqueOrderIndexes;
  }
});

test('email validation safely rejects a missing customer email', () => {
  assert.equal(validEmail(undefined), false);
});

test('Wave proof is required and new orders refresh into the control page', () => {
  const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
  const adminOrders = readFileSync(
    new URL('../api-handlers/admin/orders.js', import.meta.url),
    'utf8',
  );
  assert.match(app, /name="waveProofFile"\s+type="file"\s+required/);
  assert.match(app, /setInterval\(refreshControlData, 15000\)/);
  assert.match(adminOrders, /sort\(\{ createdAt: -1 \}\)/);
});
