import { loadEnv } from 'vite';
import { getAuthCollections, normalizeEmail, validEmail } from '../lib/auth.js';

const env = loadEnv('development', process.cwd(), '');
for (const key of ['MONGODB_URI', 'MONGODB_DB']) {
  if (process.env[key] === undefined && env[key] !== undefined) process.env[key] = env[key];
}

const email = normalizeEmail(process.argv[2]);
if (!validEmail(email)) {
  console.error('Usage: node scripts/promote-admin.mjs existing-user@example.com');
  process.exitCode = 1;
} else {
  try {
    const { users } = await getAuthCollections();
    const result = await users.updateOne(
      { email, disabledAt: { $exists: false } },
      { $set: { role: 'admin', roleGrantedAt: new Date(), updatedAt: new Date() } },
    );
    if (!result.matchedCount) {
      console.error(
        'No active account exists for that email. Create the account first, then run this command again.',
      );
      process.exitCode = 1;
    } else {
      console.log('Administrator role granted to the existing account.');
    }
  } catch (error) {
    console.error(
      'Could not grant administrator access:',
      error && error.name,
      (error && error.code) || '',
    );
    process.exitCode = 1;
  } finally {
    const database = globalThis.__glowAfriqueDatabase;
    if (database && database.client) await database.client.close();
  }
}
