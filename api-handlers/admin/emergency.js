import {
  authenticatedUser,
  getDatabase,
  parseBody,
  rateLimit,
  sameOriginRequest,
} from '../../lib/auth.js';
import { getMaintenanceSetting, setMaintenanceSetting } from '../../lib/maintenance.js';

function html(res, status, content) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
  return res.status(status).end(content);
}

function renderPage(enabled, notice = '') {
  const state = enabled ? 'OFFLINE' : 'ONLINE';
  const action = enabled ? 'false' : 'true';
  const button = enabled ? 'Bring storefront back online' : 'Take storefront offline';
  const noticeMarkup = notice ? `<p class="notice" role="status">${notice}</p>` : '';
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow,noarchive"><title>Store Status</title>
<style>
:root{color-scheme:light;--ink:#3a211c;--line:#eadbc8;--accent:#e86942}*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;background:linear-gradient(145deg,#f6e4d8,#fffaf4 68%);font:16px/1.6 system-ui,sans-serif;color:var(--ink)}main{width:min(620px,100%);padding:clamp(24px,5vw,48px);border:1px solid var(--line);border-radius:20px;background:#fffdf9;box-shadow:0 20px 70px #3a211c17}small{font-size:11px;font-weight:700;letter-spacing:2px;color:#a35739}h1{margin:12px 0 22px;font-size:clamp(30px,5vw,46px);line-height:1.15;font-weight:600}.state{padding:12px 15px;border-radius:10px;font-weight:700;background:${enabled ? '#fff0ed' : '#eaf6ee'};color:${enabled ? '#a43e31' : '#286746'}}p{color:#705c51}.notice{font-weight:600}form{margin-top:24px}button{min-height:48px;padding:12px 20px;border:0;border-radius:28px;background:linear-gradient(115deg,#f47a32,#e94f72);color:white;font:600 15px system-ui,sans-serif;cursor:pointer}button:focus-visible{outline:3px solid #3a211c;outline-offset:3px}
</style></head><body><main><small>GLOWAFRIQUE / PRIVATE STORE CONTROL</small>
<h1>Emergency storefront control</h1><p class="state">Public storefront: ${state}</p>
<p>This switch replaces customer pages with an English shutdown notice and blocks customer-facing APIs. Administrator tools and payment callbacks remain available.</p>
${noticeMarkup}<form method="post" action="/kackenlacken"><input type="hidden" name="enabled" value="${action}"><button type="submit">${button}</button></form>
</main></body></html>`;
}

export default async function emergencyControl(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
  if (!['GET', 'POST'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST');
    return html(res, 405, '<!doctype html><html lang="en"><title>Method not allowed</title><h1>Method not allowed</h1></html>');
  }
  if (req.method === 'POST' && sameOriginRequest(req, res)) return;
  if (await rateLimit(req, res, 'admin-emergency')) return;

  try {
    const user = await authenticatedUser(req);
    if (!user || user.role !== 'admin')
      return html(res, 404, '<!doctype html><html lang="en"><title>Not found</title><h1>404</h1></html>');

    if (req.method === 'GET') {
      const setting = await getMaintenanceSetting();
      return html(res, 200, renderPage(setting.enabled));
    }

    const submitted = parseBody(req).enabled;
    if (submitted !== true && submitted !== false && submitted !== 'true' && submitted !== 'false')
      return html(res, 400, renderPage((await getMaintenanceSetting()).enabled, 'Invalid store state.'));

    const enabled = submitted === true || submitted === 'true';
    const setting = await setMaintenanceSetting(enabled, user._id);
    const database = await getDatabase();
    await database.collection('glowafrique_admin_audit_logs').insertOne({
      actorUserId: user._id,
      action: 'storefront.maintenance',
      enabled,
      createdAt: setting.updatedAt,
    });
    return html(
      res,
      200,
      renderPage(
        enabled,
        enabled ? 'The public storefront is offline.' : 'The public storefront is back online.',
      ),
    );
  } catch (error) {
    console.error('[admin/emergency] request failed:', error && error.name);
    return html(
      res,
      503,
      '<!doctype html><html lang="en"><title>Unavailable</title><h1>Store controls are temporarily unavailable.</h1></html>',
    );
  }
}
