import {
  authHeaders,
  authenticatedUser,
  getAuthCollections,
  getDatabase,
  parseBody,
  rateLimit,
  sameOriginRequest,
} from '../lib/auth.js';
import { findCatalogProduct } from '../lib/catalog.js';

async function reviewsCollection(database) {
  const reviews = database.collection('glowafrique_reviews');
  await reviews.createIndex({ productId: 1, createdAt: -1 });
  await reviews.createIndex({ productId: 1, userId: 1 }, { unique: true });
  return reviews;
}

export default async function reviewsApi(req, res) {
  authHeaders(res);
  if (!['GET', 'POST'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }
  if (await rateLimit(req, res, 'reviews')) return;
  if (req.method === 'GET') {
    const productId =
      new URL(req.url || '/', 'http://localhost').searchParams.get('productId') || '';
    if (!findCatalogProduct(productId)) return res.status(400).json({ error: 'Invalid product.' });
    try {
      const reviews = await reviewsCollection(await getDatabase());
      const items = await reviews
        .find({ productId }, { projection: { _id: 0, name: 1, rating: 1, text: 1, createdAt: 1 } })
        .sort({ createdAt: -1 })
        .limit(100)
        .toArray();
      return res.status(200).json({ reviews: items });
    } catch (error) {
      console.error('[reviews] list failed:', error && error.name, (error && error.code) || '');
      return res.status(503).json({ error: 'Reviews are temporarily unavailable.' });
    }
  }
  if (sameOriginRequest(req, res)) return;
  try {
    const user = await authenticatedUser(req);
    if (!user)
      return res
        .status(401)
        .json({ error: 'Sign in before submitting a review and earning points.' });
    const body = parseBody(req);
    const productId = String(body.productId || '');
    const product = findCatalogProduct(productId);
    const name = String(body.name || '').trim();
    const text = String(body.text || '').trim();
    const rating = Number(body.rating);
    if (!product) return res.status(400).json({ error: 'Invalid product.' });
    if (
      name.length < 2 ||
      name.length > 60 ||
      text.length < 5 ||
      text.length > 1000 ||
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5
    ) {
      return res
        .status(400)
        .json({ error: 'Enter your name, a rating, and a review between 5 and 1,000 characters.' });
    }
    const database = await getDatabase();
    const reviews = await reviewsCollection(database);
    const { users } = await getAuthCollections();
    const review = {
      productId,
      productName: product.name,
      userId: user._id,
      name,
      rating,
      text,
      createdAt: new Date(),
    };
    const session = database.client.startSession();
    try {
      await session.withTransaction(async () => {
        await reviews.insertOne(review, { session });
        const updated = await users.findOneAndUpdate(
          { _id: user._id },
          { $inc: { points: 15 }, $set: { updatedAt: new Date() } },
          { returnDocument: 'after', session, projection: { points: 1 } },
        );
        review.pointsBalance = Number((updated && updated.points) || 15);
      });
    } finally {
      await session.endSession();
    }
    return res.status(201).json({
      review: { name, rating, text, createdAt: review.createdAt },
      pointsAwarded: 15,
      points: review.pointsBalance,
    });
  } catch (error) {
    if (error && error.code === 11000)
      return res
        .status(409)
        .json({ error: 'You have already submitted a review for this product.' });
    console.error('[reviews] submit failed:', error && error.name, (error && error.code) || '');
    return res.status(503).json({ error: 'Your review could not be saved. Please try again.' });
  }
}
