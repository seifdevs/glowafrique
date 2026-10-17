import { createHash, randomBytes } from 'node:crypto';
import { MongoClient } from 'mongodb';

const SESSION_COOKIE = 'ga_session';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const RATE_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT = 10;
const rateWindows = globalThis.__glowAfriqueAuthRateWindows || new Map();
globalThis.__glowAfriqueAuthRateWindows = rateWindows;

export function parseBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch (_) { return {}; }
  }
  return {};
}

export function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

export function validEmail(email) {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

export function authHeaders(res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
}

export function sameOriginRequest(req, res) {
  const originHeader = String(req.headers.origin || req.headers.referer || '').trim();
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim().toLowerCase();
  let originHost = '';
  try { originHost = new URL(originHeader).host.toLowerCase(); } catch (_) {}
  if (!originHost || !host || originHost !== host) {
    res.status(403).json({ error: 'This request could not be verified. Refresh the page and try again.' });
    return true;
  }
  return false;
}

export function rateLimit(req, res, scope) {
  const ip = String(req.headers['x-forwarded-for'] || 'unknown').split(',')[0].trim();
  const key = scope + ':' + ip;
  const now = Date.now();
  const current = rateWindows.get(key);
  if (!current || now - current.start >= RATE_WINDOW_MS) {
    rateWindows.set(key, { start: now, count: 1 });
    return false;
  }
  if (current.count >= RATE_LIMIT) {
    res.setHeader('Retry-After', String(Math.ceil((RATE_WINDOW_MS - (now - current.start)) / 1000)));
    res.status(429).json({ error: 'Too many attempts. Please try again later.' });
    return true;
  }
  current.count += 1;
  return false;
}

export async function getDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_NOT_CONFIGURED');
  let clientPromise = globalThis.__glowAfriqueMongoClientPromise;
  if (!clientPromise) {
    const client = new MongoClient(uri, { maxPoolSize: 5, serverSelectionTimeoutMS: 8000 });
    clientPromise = client.connect();
    globalThis.__glowAfriqueMongoClientPromise = clientPromise;
  }
  let client;
  try { client = await clientPromise; }
  catch (error) { delete globalThis.__glowAfriqueMongoClientPromise; throw error; }
  let database = globalThis.__glowAfriqueDatabase;
  if (!database) {
    // MongoDB connection strings are not necessarily accepted by the WHATWG URL
    // parser (for example, credentials may contain URI characters). Parse only
    // the optional database path, and prefer the explicit deployment setting.
    const match = uri.match(/^mongodb(?:\+srv)?:\/\/[^/]+\/([^?]*)/i);
    let uriDatabase = match && match[1] ? match[1] : '';
    try { uriDatabase = decodeURIComponent(uriDatabase); } catch (_) {}
    const databaseName = String(process.env.MONGODB_DB || '').trim() || uriDatabase || 'glowafrique';
    database = client.db(databaseName);
    globalThis.__glowAfriqueDatabase = database;
  }
  return database;
}

export async function getAuthCollections() {
  const database = await getDatabase();
  let collectionsPromise = globalThis.__glowAfriqueAuthCollectionsPromise;
  if (!collectionsPromise) {
    const users = database.collection('glowafrique_users');
    const sessions = database.collection('glowafrique_sessions');
    collectionsPromise = Promise.all([
      users.createIndex({ email: 1 }, { unique: true }),
      users.createIndex({ username: 1 }, { unique: true, sparse: true }),
      sessions.createIndex({ tokenHash: 1 }, { unique: true }),
      sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    ]).then(() => ({ users, sessions }));
    globalThis.__glowAfriqueAuthCollectionsPromise = collectionsPromise;
  }
  try { return await collectionsPromise; }
  catch (error) { delete globalThis.__glowAfriqueAuthCollectionsPromise; throw error; }
}

function sha256(value) { return createHash('sha256').update(value).digest('hex'); }

function cookieValue(req) {
  const header = req.headers.cookie || '';
  const item = header.split(';').map((part) => part.trim()).find((part) => part.startsWith(SESSION_COOKIE + '='));
  return item ? item.slice(SESSION_COOKIE.length + 1) : '';
}

function secureCookie() { return process.env.NODE_ENV === 'production' || process.env.VERCEL === '1'; }

export async function createSession(res, userId) {
  const { sessions } = await getAuthCollections();
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await sessions.insertOne({ tokenHash: sha256(token), userId, createdAt: new Date(), expiresAt });
  const secure = secureCookie() ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}${secure}`);
}

export async function authenticatedUser(req) {
  const token = cookieValue(req);
  if (!token) return null;
  const { sessions, users } = await getAuthCollections();
  const session = await sessions.findOne({ tokenHash: sha256(token), expiresAt: { $gt: new Date() } });
  if (!session) return null;
  return users.findOne({ _id: session.userId, disabledAt: { $exists: false } }, { projection: { email: 1, firstName: 1, lastName: 1, username: 1, phone: 1, address: 1, createdAt: 1, role: 1, points: 1 } });
}

export async function destroySession(req, res) {
  const token = cookieValue(req);
  if (token) {
    const { sessions } = await getAuthCollections();
    await sessions.deleteOne({ tokenHash: sha256(token) });
  }
  const secure = secureCookie() ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`);
}

export function methodNotAllowed(req, res, method) {
  if (req.method === method) return false;
  res.setHeader('Allow', method);
  res.status(405).json({ error: 'Method not allowed.' });
  return true;
}
