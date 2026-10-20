import { authHeaders } from '../lib/auth.js';
import { getMaintenanceSetting } from '../lib/maintenance.js';

export default async function maintenance(req, res) {
  authHeaders(res);
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed.' });
  }
  try {
    const setting = await getMaintenanceSetting();
    return res.status(200).json({ enabled: setting.enabled });
  } catch (error) {
    console.error('[maintenance] status lookup failed:', error && error.name);
    return res.status(503).json({ error: 'Store status is temporarily unavailable.' });
  }
}
