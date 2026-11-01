import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import preOrders from '../api-handlers/pre-orders.js';

function response() {
  return { headers: {}, statusCode: 200, setHeader(k, v) { this.headers[k] = v; }, status(n) { this.statusCode = n; return this; }, json(data) { this.body = data; return this; } };
}

test('pre-order emails the complete request with the product screenshot attached', async () => {
  const previous = {
    mongoUri: process.env.MONGODB_URI, key: process.env.RESEND_API_KEY,
    from: process.env.RESEND_FROM_EMAIL, recipient: process.env.PREORDER_EMAIL,
    support: process.env.SUPPORT_EMAIL,
    fetch: globalThis.fetch,
  };
  process.env.MONGODB_URI = 'mongodb://test.invalid/glowafrique';
  process.env.RESEND_API_KEY = 'test-key';
  process.env.RESEND_FROM_EMAIL = 'GlowAfrique <shop@example.com>';
  delete process.env.PREORDER_EMAIL;
  delete process.env.SUPPORT_EMAIL;
  const saved = [];
  const counters = new Map();
  const db = { collection(name) {
    if (name === 'glowafrique_rate_limits') return {
      async createIndex() {},
      async findOneAndUpdate({ key }) { const count = (counters.get(key) || 0) + 1; counters.set(key, count); return { key, count, expiresAt: new Date(Date.now() + 60000) }; },
    };
    return { async insertOne(record) { saved.push(record); } };
  } };
  globalThis.__glowAfriqueMongoClientPromise = Promise.resolve({ db: () => db });
  globalThis.__glowAfriqueDatabase = db;
  delete globalThis.__glowAfriqueRateLimitIndexes;
  let emailPayload;
  globalThis.fetch = async (_url, options) => {
    emailPayload = JSON.parse(options.body);
    return { ok: true, async json() { return { id: 'mail-test' }; } };
  };
  try {
    const screenshot = await readFile(new URL('../public/images/wave.jpeg', import.meta.url));
    const res = response();
    await preOrders({
      method: 'POST', url: '/api/pre-orders', headers: { origin: 'https://shop.test', host: 'shop.test' },
      body: { product: 'BIODANCE mask', name: 'Test Customer', email: 'customer@example.com', phone: '+2250700000000', image: { mimeType: 'image/jpeg', name: 'product.jpg', data: screenshot.toString('base64') } },
    }, res);
    assert.equal(res.statusCode, 201);
    assert.equal(emailPayload.to, 'glowafrique.ci@gmail.com');
    assert.match(emailPayload.text, /BIODANCE mask/);
    assert.match(emailPayload.text, /Test Customer/);
    assert.match(emailPayload.text, /customer@example.com/);
    assert.match(emailPayload.text, /\+2250700000000/);
    assert.equal(emailPayload.attachments[0].content, screenshot.toString('base64'));
    assert.equal(saved[0].notificationSent, true);
  } finally {
    for (const [key, value] of [['MONGODB_URI', previous.mongoUri], ['RESEND_API_KEY', previous.key], ['RESEND_FROM_EMAIL', previous.from], ['PREORDER_EMAIL', previous.recipient], ['SUPPORT_EMAIL', previous.support]]) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
    if (previous.fetch) globalThis.fetch = previous.fetch;
    delete globalThis.__glowAfriqueMongoClientPromise;
    delete globalThis.__glowAfriqueDatabase;
    delete globalThis.__glowAfriqueRateLimitIndexes;
  }
});
