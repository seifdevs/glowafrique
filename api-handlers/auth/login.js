import bcrypt from 'bcryptjs';
import {
  authHeaders,
  createControlSession,
  createSession,
  getAuthCollections,
  methodNotAllowed,
  normalizeEmail,
  parseBody,
  rateLimit,
  validEmail,
  sameOriginRequest,
  verifyControlCredentials,
} from '../../lib/auth.js';

const controlAttempts = globalThis.__glowAfriqueControlLoginAttempts || new Map();
globalThis.__glowAfriqueControlLoginAttempts = controlAttempts;

export default async function login(req, res) {
  authHeaders(res);
  if (methodNotAllowed(req, res, 'POST') || sameOriginRequest(req, res)) return;
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
  const controlUsername = process.env.CONTROL_USERNAME || 'admin';
  if (identifier.toLowerCase() === controlUsername.toLowerCase()) {
    const ip = String(req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || 'unknown')
      .split(',')[0]
      .trim();
    const now = Date.now();
    const previous = controlAttempts.get(ip);
    const attempts = previous && now - previous.start < 15 * 60 * 1000 ? previous.count : 0;
    if (attempts >= 10) {
      res.setHeader(
        'Retry-After',
        String(Math.max(1, Math.ceil((15 * 60 * 1000 - (now - previous.start)) / 1000))),
      );
      return res.status(429).json({ error: 'Too many attempts. Please try again later.' });
    }
    controlAttempts.set(ip, {
      start: previous && attempts ? previous.start : now,
      count: attempts + 1,
    });
    if (!verifyControlCredentials(identifier, password))
      return res.status(401).json({ error: 'Username or password is incorrect.' });
    controlAttempts.delete(ip);
    createControlSession(res);
    return res.status(200).json({ user: { username: controlUsername, role: 'admin' } });
  }
  if (await rateLimit(req, res, 'login')) return;
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
