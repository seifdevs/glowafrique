import { authHeaders, authenticatedUser, methodNotAllowed } from '../lib/auth.js';

export default async function controlPage(req, res) {
  authHeaders(res);
  if (methodNotAllowed(req, res, 'GET')) return;
  try {
    const user = await authenticatedUser(req);
    if (!user) {
      res.status(302).setHeader('Location', '/control.html');
      return res.end();
    }
    // The HTML shell contains only the admin sign-in gate. All order data and
    // mutations remain protected by authenticated server-side admin checks.
    res.status(302).setHeader('Location', '/control.html');
    return res.end();
  } catch (error) {
    console.error('[control] authorization failed:', error && error.name, error && error.code || '');
    return res.status(503).json({ error: 'The control panel is temporarily unavailable.' });
  }
}
