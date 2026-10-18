import {
  authHeaders,
  authenticatedUser,
  getDatabase,
  parseBody,
  rateLimit,
  sameOriginRequest,
} from '../../lib/auth.js';
import { PRODUCTS } from '../../lib/catalog.js';

export default async function adminInventory(req, res) {
  authHeaders(res);
  if (!['GET', 'PATCH'].includes(req.method)) {
    res.setHeader('Allow', 'GET, PATCH');
    return res.status(405).json({ error: 'Method not allowed.' });
  }
  if (await rateLimit(req, res, 'admin-inventory')) return;
  if (req.method === 'PATCH' && sameOriginRequest(req, res)) return;
  try {
    const user = await authenticatedUser(req);
    if (!user) return res.status(401).json({ error: 'Please sign in to access inventory.' });
    if (user.role !== 'admin')
      return res.status(403).json({ error: 'Administrator access is required.' });
    const database = await getDatabase();
    const inventory = database.collection('glowafrique_inventory');
    await inventory.createIndex({ productId: 1 }, { unique: true });
    if (req.method === 'GET') {
      const counts = await inventory
        .find({}, { projection: { _id: 0, productId: 1, quantity: 1, updatedAt: 1 } })
        .toArray();
      const byId = new Map(counts.map((item) => [item.productId, item]));
      return res.status(200).json({
        inventory: PRODUCTS.map((product) => ({
          productId: product.id,
          productName: product.name,
          quantity: byId.get(product.id)?.quantity ?? null,
          updatedAt: byId.get(product.id)?.updatedAt ?? null,
        })),
      });
    }
    const body = parseBody(req);
    const productId = String(body.productId || '').trim();
    const quantity = Number(body.quantity);
    if (!PRODUCTS.some((product) => product.id === productId)) {
      return res.status(404).json({ error: 'Product not found.' });
    }
    if (!Number.isSafeInteger(quantity) || quantity < 0 || quantity > 100000) {
      return res
        .status(400)
        .json({ error: 'Stock quantity must be a whole number from 0 to 100,000.' });
    }
    const auditLogs = database.collection('glowafrique_admin_audit_logs');
    await Promise.all([
      auditLogs.createIndex({ createdAt: -1 }),
      auditLogs.createIndex({ actorUserId: 1, createdAt: -1 }),
    ]);
    const session = database.client.startSession();
    const updatedAt = new Date();
    try {
      await session.withTransaction(async () => {
        const before = await inventory.findOne(
          { productId },
          { session, projection: { quantity: 1 } },
        );
        await inventory.updateOne(
          { productId },
          { $set: { productId, quantity, updatedAt, updatedBy: user._id } },
          { upsert: true, session },
        );
        if ((before?.quantity ?? null) !== quantity) {
          await auditLogs.insertOne(
            {
              actorUserId: user._id,
              action: 'inventory.quantity',
              targetProductId: productId,
              from: before?.quantity ?? null,
              to: quantity,
              createdAt: updatedAt,
            },
            { session },
          );
        }
      });
    } finally {
      await session.endSession();
    }
    return res.status(200).json({ productId, quantity, updatedAt });
  } catch (error) {
    console.error('[admin/inventory] request failed:', error && error.name);
    return res.status(503).json({ error: 'Inventory is temporarily unavailable.' });
  }
}
