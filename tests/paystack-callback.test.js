import test from 'node:test';
import assert from 'node:assert/strict';
import paystackCallback from '../api-handlers/payments/paystack-callback.js';

function setup(order, providerTransaction) {
  const original = {
    mongoUri: process.env.MONGODB_URI,
    mongoPromise: globalThis.__glowAfriqueMongoClientPromise,
    database: globalThis.__glowAfriqueDatabase,
    limiterIndexes: globalThis.__glowAfriqueRateLimitIndexes,
    paystackKey: process.env.PAYSTACK_SECRET_KEY,
    siteUrl: process.env.PUBLIC_SITE_URL,
    fetch: globalThis.fetch,
  };
  process.env.MONGODB_URI = 'mongodb://test.invalid/glowafrique';
  process.env.PAYSTACK_SECRET_KEY = 'sk_test_callback';
  process.env.PUBLIC_SITE_URL = 'https://shop.example.test';
  const orders = {
    async findOne() {
      return order;
    },
    async updateOne(filter, update) {
      if (
        order.paymentStatus !== filter.paymentStatus ||
        order.paystackReference !== filter.paystackReference
      )
        return { modifiedCount: 0 };
      Object.assign(order, update.$set);
      return { modifiedCount: 1 };
    },
  };
  const counters = {
    async createIndex() {},
    async findOneAndUpdate(filter) {
      return { key: filter.key, count: 1, expiresAt: new Date(Date.now() + 60000) };
    },
  };
  const database = {
    collection(name) {
      return name === 'glowafrique_rate_limits' ? counters : orders;
    },
  };
  globalThis.__glowAfriqueMongoClientPromise = Promise.resolve({ db: () => database });
  globalThis.__glowAfriqueDatabase = database;
  delete globalThis.__glowAfriqueRateLimitIndexes;
  globalThis.fetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({ status: true, data: providerTransaction }),
  });
  const response = {
    headers: {},
    setHeader(name, value) {
      this.headers[name] = value;
    },
    end() {
      this.ended = true;
    },
  };
  const request = {
    method: 'GET',
    url: '/api/payments/paystack/callback?reference=GA-20261019-1234ABCD',
    headers: {
      host: 'shop.example.test',
      'x-forwarded-host': 'shop.example.test',
      'x-forwarded-proto': 'https',
    },
  };
  return {
    original,
    order,
    response,
    request,
    restore() {
      if (original.mongoUri === undefined) delete process.env.MONGODB_URI;
      else process.env.MONGODB_URI = original.mongoUri;
      if (original.mongoPromise === undefined) delete globalThis.__glowAfriqueMongoClientPromise;
      else globalThis.__glowAfriqueMongoClientPromise = original.mongoPromise;
      if (original.database === undefined) delete globalThis.__glowAfriqueDatabase;
      else globalThis.__glowAfriqueDatabase = original.database;
      if (original.limiterIndexes === undefined) delete globalThis.__glowAfriqueRateLimitIndexes;
      else globalThis.__glowAfriqueRateLimitIndexes = original.limiterIndexes;
      if (original.paystackKey === undefined) delete process.env.PAYSTACK_SECRET_KEY;
      else process.env.PAYSTACK_SECRET_KEY = original.paystackKey;
      if (original.siteUrl === undefined) delete process.env.PUBLIC_SITE_URL;
      else process.env.PUBLIC_SITE_URL = original.siteUrl;
      globalThis.fetch = original.fetch;
    },
  };
}

function order() {
  return {
    _id: 'order-id',
    orderNumber: 'GA-20261019-1234ABCD',
    customerLocale: 'en',
    customer: { email: 'shopper@example.test' },
    items: [],
    totalXof: 12500,
    paymentMethod: 'paystack',
    paymentStatus: 'awaiting_provider',
    paystackReference: 'GA-20261019-1234ABCD',
  };
}

test('Paystack callback verifies the provider result before marking an order paid', async () => {
  const mock = setup(order(), {
    id: 987,
    status: 'success',
    reference: 'GA-20261019-1234ABCD',
    amount: 1250000,
    currency: 'XOF',
  });
  try {
    await paystackCallback(mock.request, mock.response);
    assert.equal(mock.order.paymentStatus, 'verified');
    assert.equal(mock.order.paystackTransactionId, '987');
    assert.equal(mock.response.statusCode, 303);
    assert.match(
      mock.response.headers.Location,
      /account\?payment=verified&order=GA-20261019-1234ABCD$/,
    );
  } finally {
    mock.restore();
  }
});

test('Paystack callback does not mark an order paid when the amount differs', async () => {
  const mock = setup(order(), {
    id: 988,
    status: 'success',
    reference: 'GA-20261019-1234ABCD',
    amount: 1250001,
    currency: 'XOF',
  });
  try {
    await paystackCallback(mock.request, mock.response);
    assert.equal(mock.order.paymentStatus, 'awaiting_provider');
    assert.match(mock.response.headers.Location, /account\?payment=pending/);
  } finally {
    mock.restore();
  }
});
