import { authHeaders, authenticatedUser, getDatabase, methodNotAllowed } from '../lib/auth.js';

const EXTENSIONS = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

export default async function paymentProof(req, res) {
  authHeaders(res);
  if (methodNotAllowed(req, res, 'GET')) return;
  try {
    const user = await authenticatedUser(req);
    if (!user) return res.status(401).json({ error: 'Please sign in to view payment proof.' });
    const proofId = new URL(req.url || '/', 'http://localhost').searchParams.get('id') || '';
    if (!/^[0-9a-f-]{36}$/i.test(proofId)) return res.status(404).json({ error: 'Payment proof not found.' });
    const database = await getDatabase();
    const orderQuery = { paymentProofId: proofId };
    if (user.role !== 'admin') orderQuery.customerId = user._id;
    const order = await database.collection('glowafrique_orders').findOne(orderQuery, { projection: { orderNumber: 1 } });
    if (!order) return res.status(404).json({ error: 'Payment proof not found.' });
    const proof = await database.collection('glowafrique_payment_proofs').findOne({ proofId, orderNumber: order.orderNumber });
    if (!proof || !EXTENSIONS[proof.mimeType]) return res.status(404).json({ error: 'Payment proof not found.' });
    const bytes = Buffer.isBuffer(proof.data) ? proof.data : Buffer.from(proof.data && proof.data.buffer || proof.data || []);
    res.statusCode = 200;
    res.setHeader('Content-Type', proof.mimeType);
    res.setHeader('Content-Length', String(bytes.length));
    res.setHeader('Content-Disposition', `inline; filename="wave-proof.${EXTENSIONS[proof.mimeType]}"`);
    res.setHeader('Cache-Control', 'private, no-store, max-age=0');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
    return res.end(bytes);
  } catch (error) {
    console.error('[payment-proof] access failed:', error && error.name, error && error.code || '');
    return res.status(503).json({ error: 'Payment proof is temporarily unavailable.' });
  }
}
