import { authHeaders, destroySession, methodNotAllowed, sameOriginRequest } from '../../lib/auth.js';

export default async function logout(req, res) {
  authHeaders(res);
  if (methodNotAllowed(req, res, 'POST') || sameOriginRequest(req, res)) return;
  try {
    await destroySession(req, res);
    return res.status(200).json({ ok: true });
  } catch (_) {
    return res.status(503).json({ error: 'Account service is temporarily unavailable.' });
  }
}
