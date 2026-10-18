import test from 'node:test';
import assert from 'node:assert/strict';
import { rateLimit } from '../lib/auth.js';

test('shared rate limiting stores hashed client keys, blocks excess calls, and resets expired windows', async () => {
  const originalMongoUri = process.env.MONGODB_URI;
  const records = new Map();
  const collection = {
    async createIndex() {},
    async findOneAndUpdate(filter, pipeline) {
      const update = pipeline[0].$set;
      const now = update.count.$cond[0].$gt[1].$literal;
      const key = update.key?.$literal || filter.key;
      const prior = records.get(key);
      const active = prior && prior.expiresAt > now;
      const record = {
        key,
        count: active ? prior.count + 1 : 1,
        expiresAt: active ? prior.expiresAt : update.expiresAt.$cond[2].$literal,
      };
      records.set(key, record);
      return record;
    },
  };
  const database = { collection: () => collection };
  const mongo = { db: () => database };
  process.env.MONGODB_URI = 'mongodb://test.invalid/glowafrique';
  globalThis.__glowAfriqueMongoClientPromise = Promise.resolve(mongo);
  globalThis.__glowAfriqueDatabase = database;
  delete globalThis.__glowAfriqueRateLimitIndexes;

  try {
    const response = () => ({
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
    });
    const request = { headers: { 'x-forwarded-for': '203.0.113.8' } };
    for (let attempt = 0; attempt < 10; attempt += 1) {
      assert.equal(await rateLimit(request, response(), 'test-login'), false);
    }
    const blocked = response();
    assert.equal(await rateLimit(request, blocked, 'test-login'), true);
    assert.equal(blocked.statusCode, 429);
    assert.equal(Number(blocked.headers['Retry-After']) > 0, true);
    assert.equal(
      [...records.keys()].every((key) => /^[a-f0-9]{64}$/.test(key)),
      true,
    );

    const freshResponse = response();
    assert.equal(await rateLimit(request, freshResponse, 'expired-window'), false);
    const expired = [...records.values()].find((record) => record.key !== [...records.keys()][0]);
    expired.count = 99;
    expired.expiresAt = new Date(0);
    assert.equal(await rateLimit(request, response(), 'expired-window'), false);
    assert.equal(records.get(expired.key).count, 1);
  } finally {
    if (originalMongoUri === undefined) delete process.env.MONGODB_URI;
    else process.env.MONGODB_URI = originalMongoUri;
    delete globalThis.__glowAfriqueMongoClientPromise;
    delete globalThis.__glowAfriqueDatabase;
    delete globalThis.__glowAfriqueRateLimitIndexes;
  }
});
