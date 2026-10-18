import bcrypt from 'bcryptjs';
import {
  authHeaders,
  getAuthCollections,
  methodNotAllowed,
  normalizeEmail,
  parseBody,
  rateLimit,
  validEmail,
  createSession,
  sameOriginRequest,
} from '../../lib/auth.js';

export default async function register(req, res) {
  authHeaders(res);
  if (
    methodNotAllowed(req, res, 'POST') ||
    sameOriginRequest(req, res) ||
    (await rateLimit(req, res, 'register'))
  )
    return;
  const body = parseBody(req);
  const email = normalizeEmail(body.email);
  const firstName = String(body.firstName || '').trim();
  const lastName = String(body.lastName || '').trim();
  const password = typeof body.password === 'string' ? body.password : '';
  if (!validEmail(email)) return res.status(400).json({ error: 'Enter a valid email address.' });
  if (firstName.length < 1 || firstName.length > 80 || lastName.length < 1 || lastName.length > 80)
    return res.status(400).json({ error: 'Enter a valid first and last name.' });
  if (password.length < 8 || Buffer.byteLength(password, 'utf8') > 72)
    return res
      .status(400)
      .json({ error: 'Password must be at least 8 characters and no more than 72 UTF-8 bytes.' });
  try {
    const { users } = await getAuthCollections();
    const passwordHash = await bcrypt.hash(password, 12);
    const createdAt = new Date();
    const result = await users.insertOne({
      email,
      firstName,
      lastName,
      passwordHash,
      role: 'customer',
      points: 0,
      createdAt,
      updatedAt: createdAt,
    });
    try {
      await createSession(res, result.insertedId);
    } catch (error) {
      await users.deleteOne({ _id: result.insertedId });
      throw error;
    }
    return res
      .status(201)
      .json({ user: { email, firstName, lastName, createdAt, role: 'customer', points: 0 } });
  } catch (error) {
    if (error && error.code === 11000 && error.keyPattern && error.keyPattern.email) {
      return res.status(409).json({
        code: 'ACCOUNT_EXISTS',
        error: 'An account with this email already exists. Sign in with your password.',
      });
    }
    console.error(
      '[auth/register] database operation failed:',
      error && error.name,
      (error && error.code) || '',
    );
    return res.status(503).json({ error: 'Account service is temporarily unavailable.' });
  }
}
