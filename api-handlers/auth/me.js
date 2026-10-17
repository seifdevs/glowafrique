import { authHeaders, authenticatedUser, methodNotAllowed } from '../../lib/auth.js';

export default async function me(req, res) {
  authHeaders(res);
  if (methodNotAllowed(req, res, 'GET')) return;
  try {
    const user = await authenticatedUser(req);
    if (!user) return res.status(401).json({ error: 'Please sign in.' });
    return res.status(200).json({ user: { email: user.email, firstName: user.firstName || '', lastName: user.lastName || '', phone: user.phone || '', address: user.address || null, createdAt: user.createdAt, role: user.role || 'customer', points: Number(user.points || 0) } });
  } catch (error) {
    console.error('[auth/me] database operation failed:', error && error.name, error && error.code || '');
    return res.status(503).json({ error: 'Account service is temporarily unavailable.' });
  }
}
