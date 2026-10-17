import { readFileSync } from 'node:fs';
import bcrypt from 'bcryptjs';
import { getAuthCollections } from '../lib/auth.js';

// Load only the required server-side values without echoing them to the terminal.
try {
  const envText = readFileSync(new URL('../.env', import.meta.url), 'utf8');
  for (const line of envText.split(/\r?\n/)) {
    const match = line.match(/^\s*(ADMIN_USERNAME|ADMIN_PASSWORD|ADMIN_EMAIL|MONGODB_URI|MONGODB_DB)\s*=\s*(.*)\s*$/);
    if (match && process.env[match[1]] === undefined) process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2');
  }
} catch { /* Environment may be injected by the host. */ }

const username = String(process.env.ADMIN_USERNAME || '').trim();
const password = String(process.env.ADMIN_PASSWORD || '');
const email = String(process.env.ADMIN_EMAIL || `${username}@glowafrique.local`).trim().toLowerCase();
if (!username || password.length < 12 || !email.includes('@')) {
  console.error('Admin bootstrap requires ADMIN_USERNAME, a 12+ character ADMIN_PASSWORD, and a valid ADMIN_EMAIL.');
  process.exit(1);
}

const { users } = await getAuthCollections();
const [usernameOwner, emailOwner] = await Promise.all([
  users.findOne({ username }),
  users.findOne({ email }),
]);
const identityOwners = [usernameOwner, emailOwner].filter(Boolean);
if (identityOwners.some((user) => user.role !== 'admin') || (usernameOwner && emailOwner && String(usernameOwner._id) !== String(emailOwner._id))) {
  console.error('Admin bootstrap stopped because the configured identity conflicts with an existing account.');
  process.exit(1);
}
const existing = usernameOwner || emailOwner;
const now = new Date();
const passwordHash = await bcrypt.hash(password, 12);
if (existing) {
  await users.updateOne({ _id: existing._id, role: 'admin' }, { $set: { username, email, passwordHash, updatedAt: now } });
} else {
  await users.insertOne({ username, email, passwordHash, role: 'admin', points: 0, firstName: 'GlowAfrique', lastName: 'Admin', createdAt: now, updatedAt: now });
}
console.log('Administrator bootstrap completed.');
