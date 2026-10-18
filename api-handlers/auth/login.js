import bcrypt from 'bcryptjs';
import {
  authHeaders,
  createSession,
  getAuthCollections,
  methodNotAllowed,
  normalizeEmail,
  parseBody,
  rateLimit,
  validEmail,
  sameOriginRequest,
} from '../../lib/auth.js';

export default async function login(req, res) {
  authHeaders(res);
  if (
    methodNotAllowed(req, res, 'POST') ||
    sameOriginRequest(req, res) ||
    (await rateLimit(req, res, 'login'))
  )
    return;
  const body = parseBody(req);
  const identifier = String(body.email || body.identifier || '').trim();
  const email = normalizeEmail(identifier);
  const password = typeof body.password === 'string' ? body.password : '';
  if (
    !identifier ||
    identifier.length > 254 ||
    !password ||
    Buffer.byteLength(password, 'utf8') > 72
  )
    return res.status(400).json({ error: 'Email or password is incorrect.' });
  try {
    const { users } = await getAuthCollections();
    const usernameLogin =
      !validEmail(email) &&
      process.env.ADMIN_USERNAME &&
      identifier.toLowerCase() === process.env.ADMIN_USERNAME.toLowerCase();
    const user = await users.findOne(
      usernameLogin
        ? { username: process.env.ADMIN_USERNAME, role: 'admin', disabledAt: { $exists: false } }
        : { email, disabledAt: { $exists: false } },
    );
    const matches = user ? await bcrypt.compare(password, user.passwordHash) : false;
    if (!matches) return res.status(401).json({ error: 'Email or password is incorrect.' });
    await createSession(res, user._id);
    return res.status(200).json({
      user: {
        email: user.email,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        createdAt: user.createdAt,
        role: user.role || 'customer',
        points: Number(user.points || 0),
      },
    });
  } catch (error) {
    console.error(
      '[auth/login] database operation failed:',
      error && error.name,
      (error && error.code) || '',
    );
    return res.status(503).json({ error: 'Account service is temporarily unavailable.' });
  }
}
