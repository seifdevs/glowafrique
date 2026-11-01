import test from 'node:test';
import assert from 'node:assert/strict';
import reviewsApi from '../api-handlers/reviews.js';

function response() {
  return { headers: {}, statusCode: 200, setHeader(k, v) { this.headers[k] = v; }, status(n) { this.statusCode = n; return this; }, json(body) { this.body = body; return this; } };
}

test('one signed-in customer can earn 20 points for one rated review per product', async () => {
  const previousUri = process.env.MONGODB_URI;
  process.env.MONGODB_URI = 'mongodb://test.invalid/glowafrique';
  const token = 'review-test-session';
  const user = { _id: 'customer-1', email: 'customer@example.com', points: 0 };
  const savedReviews = [];
  let rateCount = 0;
  const collections = {
    glowafrique_rate_limits: { async createIndex() {}, async findOneAndUpdate() { rateCount += 1; return { count: rateCount, expiresAt: new Date(Date.now() + 60_000) }; } },
    glowafrique_sessions: { async createIndex() {}, async findOne() { return { userId: user._id }; } },
    glowafrique_users: {
      async createIndex() {}, async findOne() { return user; },
      async findOneAndUpdate(_query, update) { user.points += update.$inc.points; return { value: { points: user.points } }; },
    },
    glowafrique_reviews: {
      async createIndex() {},
      async insertOne(review) {
        if (savedReviews.some((saved) => saved.productId === review.productId && String(saved.userId) === String(review.userId))) {
          const error = new Error('duplicate review'); error.code = 11000; throw error;
        }
        savedReviews.push(review);
      },
    },
  };
  const database = {
    collection(name) { return collections[name]; },
    client: { startSession() { return { async withTransaction(action) { return action(); }, async endSession() {} }; } },
  };
  globalThis.__glowAfriqueMongoClientPromise = Promise.resolve({ db: () => database });
  globalThis.__glowAfriqueDatabase = database;
  delete globalThis.__glowAfriqueRateLimitIndexes;
  delete globalThis.__glowAfriqueAuthCollectionsPromise;
  try {
    const request = () => ({
      method: 'POST', url: '/api/reviews', headers: { origin: 'https://shop.test', host: 'shop.test', cookie: `ga_session=${token}` },
      body: { productId: 'biodance-bio-collagen-real-deep-mask', name: 'Test Customer', rating: 5, text: 'Lovely sheet mask.' },
    });
    const first = response();
    await reviewsApi(request(), first);
    assert.equal(first.statusCode, 201);
    assert.equal(first.body.pointsAwarded, 20);
    assert.equal(first.body.points, 20);
    assert.equal(first.body.review.rating, 5);
    assert.equal(first.body.review.text, 'Lovely sheet mask.');
    const duplicate = response();
    await reviewsApi(request(), duplicate);
    assert.equal(duplicate.statusCode, 409);
    assert.match(duplicate.body.error, /already submitted/i);
    assert.equal(savedReviews.length, 1);
  } finally {
    if (previousUri === undefined) delete process.env.MONGODB_URI; else process.env.MONGODB_URI = previousUri;
    delete globalThis.__glowAfriqueMongoClientPromise;
    delete globalThis.__glowAfriqueDatabase;
    delete globalThis.__glowAfriqueRateLimitIndexes;
    delete globalThis.__glowAfriqueAuthCollectionsPromise;
  }
});
