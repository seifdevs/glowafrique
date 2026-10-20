import {
  authHeaders,
  authenticatedUser,
  getDatabase,
  parseBody,
  rateLimit,
  sameOriginRequest,
} from '../../lib/auth.js';
import { getMaintenanceSetting, setMaintenanceSetting } from '../../lib/maintenance.js';

export default async function adminMaintenance(req, res) {
  authHeaders(res);
  if (!['GET', 'POST'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }
  if (await rateLimit(req, res, 'admin-maintenance')) return;
  if (req.method === 'POST' && sameOriginRequest(req, res)) return;
  try {
    const user = await authenticatedUser(req);
    if (!user) return res.status(401).json({ error: 'Please sign in to manage the storefront.' });
    if (user.role !== 'admin')
      return res.status(403).json({ error: 'Administrator access is required.' });

    if (req.method === 'GET') {
      return res.status(200).json(await getMaintenanceSetting());
    }

    const body = parseBody(req);
    if (typeof body.enabled !== 'boolean')
      return res.status(400).json({ error: 'Maintenance state must be true or false.' });

    const setting = await setMaintenanceSetting(body.enabled, user._id);
    const database = await getDatabase();
    await database.collection('glowafrique_admin_audit_logs').insertOne({
      actorUserId: user._id,
      action: 'storefront.maintenance',
      enabled: setting.enabled,
      createdAt: setting.updatedAt,
    });
    return res.status(200).json(setting);
  } catch (error) {
    console.error('[admin/maintenance] request failed:', error && error.name);
    return res.status(503).json({ error: 'Store controls are temporarily unavailable.' });
  }
}
