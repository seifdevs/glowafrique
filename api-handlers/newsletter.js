import {
  authHeaders,
  getDatabase,
  methodNotAllowed,
  normalizeEmail,
  parseBody,
  rateLimit,
  sameOriginRequest,
  validEmail,
} from '../lib/auth.js';

export default async function newsletter(req, res) {
  authHeaders(res);
  if (methodNotAllowed(req, res, 'POST')) return;
  if (sameOriginRequest(req, res)) return;
  if (await rateLimit(req, res, 'newsletter')) return;
  const body = parseBody(req);
  const email = normalizeEmail(body.email);
  if (!validEmail(email) || body.consent !== true) {
    return res
      .status(400)
      .json({ error: 'Enter a valid email and agree to receive GlowAfrique updates.' });
  }
  try {
    const subscribers = (await getDatabase()).collection('glowafrique_newsletter_subscribers');
    await subscribers.createIndex({ email: 1 }, { unique: true });
    await subscribers.updateOne(
      { email },
      {
        $set: { status: 'subscribed', consentGivenAt: new Date(), source: 'storefront' },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true },
    );
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('[newsletter] save failed:', error && error.name, (error && error.code) || '');
    return res.status(503).json({ error: 'Newsletter signup is temporarily unavailable.' });
  }
}
