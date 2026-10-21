import test from 'node:test';
import assert from 'node:assert/strict';
import register from '../api-handlers/auth/register.js';
import login from '../api-handlers/auth/login.js';
import me from '../api-handlers/auth/me.js';
import logout from '../api-handlers/auth/logout.js';
import passwordReset from '../api-handlers/auth/password-reset.js';
import bcrypt from 'bcryptjs';

function matches(document, query) {
  return Object.entries(query).every(([key, expected]) => {
    if (key === '$or') return expected.some((condition) => matches(document, condition));
    const actual = document[key];
    if (expected && typeof expected === 'object' && '$gt' in expected) return actual > expected.$gt;
    if (expected && typeof expected === 'object' && '$exists' in expected)
      return expected.$exists ? key in document : !(key in document);
    return actual === expected;
  });
}

function createDatabase() {
  let nextId = 1;
  const users = [];
  const sessions = [];
  const resets = [];
  const counters = new Map();
  const collections = {
    glowafrique_users: {
      async createIndex() {},
      async insertOne(document) {
        if (users.some((user) => user.email === document.email)) {
          const error = new Error('duplicate email');
          error.code = 11000;
          error.keyPattern = { email: 1 };
          throw error;
        }
        const user = { ...document, _id: `user-${nextId++}` };
        users.push(user);
        return { insertedId: user._id };
      },
      async findOne(query) {
        return users.find((user) => matches(user, query)) || null;
      },
      async deleteOne(query) {
        const index = users.findIndex((user) => matches(user, query));
        if (index >= 0) users.splice(index, 1);
      },
      async updateOne(query, update) {
        const user = users.find((entry) => matches(entry, query));
        if (!user) return { matchedCount: 0 };
        Object.assign(user, update.$set || {});
        return { matchedCount: 1 };
      },
    },
    glowafrique_sessions: {
      async createIndex() {},
      async insertOne(document) {
        sessions.push(document);
        return { insertedId: `session-${nextId++}` };
      },
      async findOne(query) {
        return sessions.find((session) => matches(session, query)) || null;
      },
      async deleteOne(query) {
        const index = sessions.findIndex((session) => matches(session, query));
        if (index >= 0) sessions.splice(index, 1);
      },
      async deleteMany(query) {
        for (let index = sessions.length - 1; index >= 0; index -= 1) {
          if (matches(sessions[index], query)) sessions.splice(index, 1);
        }
      },
    },
    glowafrique_password_resets: {
      async createIndex() {},
      async insertOne(document) {
        resets.push(document);
      },
      async findOneAndDelete(query) {
        const index = resets.findIndex((reset) => matches(reset, query));
        return index < 0 ? { value: null } : { value: resets.splice(index, 1)[0] };
      },
      async deleteOne(query) {
        const index = resets.findIndex((reset) => matches(reset, query));
        if (index >= 0) resets.splice(index, 1);
      },
    },
    glowafrique_rate_limits: {
      async createIndex() {},
      async findOneAndUpdate(filter, pipeline) {
        const key = filter.key;
        const update = pipeline[0].$set;
        const now = update.count.$cond[0].$gt[1].$literal;
        const prior = counters.get(key);
        const active = prior && prior.expiresAt > now;
        const result = {
          key,
          count: active ? prior.count + 1 : 1,
          expiresAt: active ? prior.expiresAt : update.expiresAt.$cond[2].$literal,
        };
        counters.set(key, result);
        return result;
      },
    },
  };
  return {
    users,
    sessions,
    resets,
    client: { db: () => ({ collection: (name) => collections[name] }) },
  };
}

function makeResponse() {
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

function request(method, body = {}, cookie = '') {
  return {
    method,
    url: '/api/auth/test',
    body,
    headers: {
      origin: 'https://shop.example.test',
      host: 'shop.example.test',
      cookie,
    },
  };
}

test('register, login, session lookup, logout, duplicate registration, and CSRF protection', async () => {
  const original = {
    mongoUri: process.env.MONGODB_URI,
    mongoPromise: globalThis.__glowAfriqueMongoClientPromise,
    database: globalThis.__glowAfriqueDatabase,
    authIndexes: globalThis.__glowAfriqueAuthCollectionsPromise,
    rateIndexes: globalThis.__glowAfriqueRateLimitIndexes,
    nodeEnv: process.env.NODE_ENV,
    vercel: process.env.VERCEL,
  };
  const database = createDatabase();
  process.env.MONGODB_URI = 'mongodb://unit.test/glowafrique';
  process.env.NODE_ENV = 'test';
  delete process.env.VERCEL;
  globalThis.__glowAfriqueMongoClientPromise = Promise.resolve(database.client);
  globalThis.__glowAfriqueDatabase = undefined;
  delete globalThis.__glowAfriqueAuthCollectionsPromise;
  delete globalThis.__glowAfriqueRateLimitIndexes;

  try {
    const form = {
      email: 'Shopper@Example.test',
      firstName: 'Awa',
      lastName: 'Traoré',
      password: 'Correct-Horse-123',
    };
    const created = makeResponse();
    await register(request('POST', form), created);
    assert.equal(created.statusCode, 201);
    assert.equal(created.body.user.email, 'shopper@example.test');
    const registeredCookie = created.headers['Set-Cookie'];
    assert.match(registeredCookie, /HttpOnly/);
    assert.match(registeredCookie, /SameSite=Lax/);
    assert.doesNotMatch(registeredCookie, /; Secure/);
    const rawToken = registeredCookie.split(';')[0].split('=')[1];
    assert.equal(database.sessions.length, 1);
    assert.notEqual(database.sessions[0].tokenHash, rawToken);

    const duplicate = makeResponse();
    await register(request('POST', form), duplicate);
    assert.equal(duplicate.statusCode, 409);
    assert.equal(database.users.length, 1);

    const loginResponse = makeResponse();
    await login(request('POST', { email: form.email, password: form.password }), loginResponse);
    assert.equal(loginResponse.statusCode, 200);
    const loginCookie = loginResponse.headers['Set-Cookie'].split(';')[0];
    assert.equal(database.sessions.length, 2);

    const sessionResponse = makeResponse();
    await me(request('GET', {}, loginCookie), sessionResponse);
    assert.equal(sessionResponse.statusCode, 200);
    assert.equal(sessionResponse.body.user.email, 'shopper@example.test');

    const logoutResponse = makeResponse();
    await logout(request('POST', {}, loginCookie), logoutResponse);
    assert.equal(logoutResponse.statusCode, 200);
    assert.match([].concat(logoutResponse.headers['Set-Cookie']).join('; '), /Max-Age=0/);
    assert.equal(database.sessions.length, 1);
    const expiredSession = makeResponse();
    await me(request('GET', {}, loginCookie), expiredSession);
    assert.equal(expiredSession.statusCode, 401);

    const csrfFailure = makeResponse();
    await register(
      { ...request('POST', form), headers: { host: 'shop.example.test' } },
      csrfFailure,
    );
    assert.equal(csrfFailure.statusCode, 403);
  } finally {
    if (original.mongoUri === undefined) delete process.env.MONGODB_URI;
    else process.env.MONGODB_URI = original.mongoUri;
    if (original.mongoPromise === undefined) delete globalThis.__glowAfriqueMongoClientPromise;
    else globalThis.__glowAfriqueMongoClientPromise = original.mongoPromise;
    if (original.database === undefined) delete globalThis.__glowAfriqueDatabase;
    else globalThis.__glowAfriqueDatabase = original.database;
    if (original.authIndexes === undefined) delete globalThis.__glowAfriqueAuthCollectionsPromise;
    else globalThis.__glowAfriqueAuthCollectionsPromise = original.authIndexes;
    if (original.rateIndexes === undefined) delete globalThis.__glowAfriqueRateLimitIndexes;
    else globalThis.__glowAfriqueRateLimitIndexes = original.rateIndexes;
    if (original.nodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = original.nodeEnv;
    if (original.vercel === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = original.vercel;
  }
});

test('password reset sends a hashed, expiring one-use token and invalidates existing sessions', async () => {
  const original = {
    mongoUri: process.env.MONGODB_URI,
    mongoPromise: globalThis.__glowAfriqueMongoClientPromise,
    database: globalThis.__glowAfriqueDatabase,
    authIndexes: globalThis.__glowAfriqueAuthCollectionsPromise,
    rateIndexes: globalThis.__glowAfriqueRateLimitIndexes,
    nodeEnv: process.env.NODE_ENV,
    vercel: process.env.VERCEL,
    resendKey: process.env.RESEND_API_KEY,
    resendFrom: process.env.RESEND_FROM_EMAIL,
    fetch: globalThis.fetch,
  };
  const database = createDatabase();
  database.users.push({
    _id: 'reset-user',
    email: 'reset@example.test',
    firstName: 'Nadia',
    lastName: 'Kone',
    passwordHash: await bcrypt.hash('Previous-Password-123', 4),
    role: 'customer',
  });
  database.sessions.push({
    tokenHash: 'existing-hashed-session',
    userId: 'reset-user',
    expiresAt: new Date(Date.now() + 60000),
  });
  process.env.MONGODB_URI = 'mongodb://unit.test/glowafrique';
  process.env.NODE_ENV = 'test';
  process.env.RESEND_API_KEY = 'test-resend-key';
  process.env.RESEND_FROM_EMAIL = 'GlowAfrique <shop@example.test>';
  delete process.env.VERCEL;
  globalThis.__glowAfriqueMongoClientPromise = Promise.resolve(database.client);
  globalThis.__glowAfriqueDatabase = undefined;
  delete globalThis.__glowAfriqueAuthCollectionsPromise;
  delete globalThis.__glowAfriqueRateLimitIndexes;
  let emailBody;
  globalThis.fetch = async (_url, options) => {
    emailBody = JSON.parse(options.body);
    return { ok: true, status: 200, json: async () => ({ id: 'email-id' }) };
  };
  try {
    const requested = makeResponse();
    await passwordReset(
      request('POST', { action: 'request', email: 'reset@example.test', language: 'en' }),
      requested,
    );
    assert.equal(requested.statusCode, 200);
    assert.equal(database.resets.length, 1);
    const tokenMatch = emailBody.text.match(/resetToken=([A-Za-z0-9_-]+)/);
    assert.ok(tokenMatch);
    assert.notEqual(database.resets[0].tokenHash, tokenMatch[1]);
    assert.ok(database.resets[0].expiresAt > new Date());

    const password = 'New-Strong-Password-456';
    const changed = makeResponse();
    await passwordReset(
      request('POST', { action: 'reset', token: tokenMatch[1], password }),
      changed,
    );
    assert.equal(changed.statusCode, 200);
    assert.equal(await bcrypt.compare(password, database.users[0].passwordHash), true);
    assert.equal(database.resets.length, 0);
    assert.equal(database.sessions.length, 0);

    const reused = makeResponse();
    await passwordReset(
      request('POST', { action: 'reset', token: tokenMatch[1], password }),
      reused,
    );
    assert.equal(reused.statusCode, 400);
  } finally {
    if (original.mongoUri === undefined) delete process.env.MONGODB_URI;
    else process.env.MONGODB_URI = original.mongoUri;
    if (original.mongoPromise === undefined) delete globalThis.__glowAfriqueMongoClientPromise;
    else globalThis.__glowAfriqueMongoClientPromise = original.mongoPromise;
    if (original.database === undefined) delete globalThis.__glowAfriqueDatabase;
    else globalThis.__glowAfriqueDatabase = original.database;
    if (original.authIndexes === undefined) delete globalThis.__glowAfriqueAuthCollectionsPromise;
    else globalThis.__glowAfriqueAuthCollectionsPromise = original.authIndexes;
    if (original.rateIndexes === undefined) delete globalThis.__glowAfriqueRateLimitIndexes;
    else globalThis.__glowAfriqueRateLimitIndexes = original.rateIndexes;
    if (original.nodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = original.nodeEnv;
    if (original.vercel === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = original.vercel;
    if (original.resendKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = original.resendKey;
    if (original.resendFrom === undefined) delete process.env.RESEND_FROM_EMAIL;
    else process.env.RESEND_FROM_EMAIL = original.resendFrom;
    globalThis.fetch = original.fetch;
  }
});
