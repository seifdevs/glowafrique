import { getDatabase, methodNotAllowed, rateLimit } from '../../lib/auth.js';
import {
  paystackTransactionMatches,
  verifyPaystackTransaction,
} from '../../lib/payments/paystack.js';
import { notifyOrder } from '../../lib/order-notifications.js';

export default async function paystackCallback(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (methodNotAllowed(req, res, 'GET')) return;
  if (await rateLimit(req, res, 'paystack-callback', { windowMs: 60 * 1000, limit: 60 })) return;
  const url = new URL(req.url || '/', 'http://localhost');
  const reference = String(url.searchParams.get('reference') || '');
  const forwardedHost = String(req.headers['x-forwarded-host'] || req.headers.host || '')
    .split(',')[0]
    .trim();
  const forwardedProto = String(req.headers['x-forwarded-proto'] || 'https')
    .split(',')[0]
    .trim();
  const requestedOrigin = String(
    process.env.PUBLIC_SITE_URL || (forwardedHost ? `${forwardedProto}://${forwardedHost}` : ''),
  ).trim();
  let siteOrigin = '';
  try {
    siteOrigin = new URL(
      requestedOrigin.startsWith('http') ? requestedOrigin : `https://${requestedOrigin}`,
    ).origin;
  } catch (_) {
    return res.status(503).json({ error: 'Payment confirmation is temporarily unavailable.' });
  }
  if (!siteOrigin || siteOrigin === 'http://localhost') {
    return res.status(503).json({ error: 'Payment confirmation is temporarily unavailable.' });
  }
  const redirectTo = (path) => {
    res.statusCode = 303;
    res.setHeader('Location', new URL(path, siteOrigin).href);
    return res.end();
  };
  if (!reference) return redirectTo('/account?payment=pending');

  try {
    const database = await getDatabase();
    const orders = database.collection('glowafrique_orders');
    const order = await orders.findOne({ paymentMethod: 'paystack', paystackReference: reference });
    if (!order) return redirectTo('/account?payment=not-found');
    if (order.paymentStatus !== 'awaiting_provider') {
      return redirectTo(
        `/${order.customerLocale === 'en' ? 'en/' : ''}account?payment=${order.paymentStatus === 'verified' ? 'verified' : 'pending'}&order=${encodeURIComponent(order.orderNumber)}`,
      );
    }
    const transaction = await verifyPaystackTransaction(reference);
    if (!paystackTransactionMatches(transaction, order)) {
      return redirectTo(
        `/${order.customerLocale === 'en' ? 'en/' : ''}account?payment=pending&order=${encodeURIComponent(order.orderNumber)}`,
      );
    }
    const now = new Date();
    const updated = await orders.updateOne(
      { _id: order._id, paymentStatus: 'awaiting_provider', paystackReference: reference },
      {
        $set: {
          paymentStatus: 'verified',
          paystackTransactionId: String(transaction.id || ''),
          paymentVerification: { decision: 'verified', evidenceSource: 'paystack', decidedAt: now },
          updatedAt: now,
        },
      },
    );
    const payment =
      updated.modifiedCount || order.paymentStatus === 'verified' ? 'verified' : 'pending';
    if (payment === 'verified' && updated.modifiedCount) {
      try {
        await notifyOrder({ ...order, paymentStatus: 'verified' }, 'payment_verified');
      } catch (error) {
        console.error('[paystack/callback] order email failed:', error && error.name);
      }
    }
    return redirectTo(
      `/${order.customerLocale === 'en' ? 'en/' : ''}account?payment=${payment}&order=${encodeURIComponent(order.orderNumber)}`,
    );
  } catch (error) {
    console.error('[paystack/callback] verification failed:', error && error.name);
    return redirectTo('/account?payment=pending');
  }
}
