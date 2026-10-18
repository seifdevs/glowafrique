import bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'node:crypto';
import {
  authHeaders,
  getAuthCollections,
  getDatabase,
  methodNotAllowed,
  normalizeEmail,
  parseBody,
  rateLimit,
  sameOriginRequest,
  validEmail,
} from '../../lib/auth.js';
import { sendEmail } from '../../lib/email.js';

const TOKEN_TTL_MS = 30 * 60 * 1000;
const GENERIC_SUCCESS =
  'If an account exists for that email, password reset instructions have been sent.';

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

export default async function passwordReset(req, res) {
  authHeaders(res);
  if (methodNotAllowed(req, res, 'POST')) return;
  if (sameOriginRequest(req, res)) return;
  if (await rateLimit(req, res, 'password-reset', { windowMs: 60 * 60 * 1000, limit: 5 })) return;

  const body = parseBody(req);
  const action = body.action === 'reset' ? 'reset' : 'request';
  if (action === 'reset') {
    const token = String(body.token || '');
    const password = typeof body.password === 'string' ? body.password : '';
    if (!/^[A-Za-z0-9_-]{40,100}$/.test(token)) {
      return res.status(400).json({ error: 'This reset link is invalid or has expired.' });
    }
    if (password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
      return res
        .status(400)
        .json({ error: 'Password must be at least 8 characters and no more than 72 UTF-8 bytes.' });
    }
    try {
      const database = await getDatabase();
      const resets = database.collection('glowafrique_password_resets');
      const tokenHash = hashToken(token);
      const now = new Date();
      const reset = await resets.findOneAndDelete({ tokenHash, expiresAt: { $gt: now } });
      const resetRecord = reset?.value || reset;
      if (!resetRecord)
        return res.status(400).json({ error: 'This reset link is invalid or has expired.' });
      const passwordHash = await bcrypt.hash(password, 12);
      const { users, sessions } = await getAuthCollections();
      const updated = await users.updateOne(
        { _id: resetRecord.userId, disabledAt: { $exists: false } },
        { $set: { passwordHash, updatedAt: now, passwordChangedAt: now } },
      );
      if (!updated.matchedCount)
        return res.status(400).json({ error: 'This reset link is invalid or has expired.' });
      await sessions.deleteMany({ userId: resetRecord.userId });
      return res
        .status(200)
        .json({ ok: true, message: 'Your password has been updated. Please sign in.' });
    } catch (error) {
      console.error('[auth/password-reset] reset failed:', error && error.name);
      return res.status(503).json({ error: 'Password reset is temporarily unavailable.' });
    }
  }

  const email = normalizeEmail(body.email);
  if (!validEmail(email)) return res.status(400).json({ error: 'Enter a valid email address.' });
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    return res
      .status(503)
      .json({ error: 'Password reset email is not configured yet. Please contact GlowAfrique.' });
  }
  try {
    const { users } = await getAuthCollections();
    const user = await users.findOne(
      { email, disabledAt: { $exists: false } },
      { projection: { _id: 1 } },
    );
    if (user) {
      const database = await getDatabase();
      const resets = database.collection('glowafrique_password_resets');
      await Promise.all([
        resets.createIndex({ tokenHash: 1 }, { unique: true }),
        resets.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
      ]);
      const token = randomBytes(32).toString('base64url');
      const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);
      await resets.insertOne({
        tokenHash: hashToken(token),
        userId: user._id,
        createdAt: new Date(),
        expiresAt,
      });
      const origin = new URL(String(req.headers.origin)).origin;
      const resetUrl = new URL('/account', origin);
      resetUrl.searchParams.set('resetToken', token);
      try {
        await sendEmail({
          to: email,
          subject: 'Reset your GlowAfrique password',
          text: `Use this link within 30 minutes to reset your password: ${resetUrl.href}`,
          html: `<p>Use this link within 30 minutes to reset your GlowAfrique password:</p><p><a href="${resetUrl.href}">Reset password</a></p><p>If you did not request this, you can ignore this email.</p>`,
        });
      } catch (error) {
        await resets.deleteOne({ tokenHash: hashToken(token) });
        console.error('[auth/password-reset] email delivery failed:', error && error.message);
        return res
          .status(503)
          .json({ error: 'Password reset email could not be sent. Please try again later.' });
      }
    }
    return res.status(200).json({ ok: true, message: GENERIC_SUCCESS });
  } catch (error) {
    console.error('[auth/password-reset] request failed:', error && error.name);
    return res.status(503).json({ error: 'Password reset is temporarily unavailable.' });
  }
}
