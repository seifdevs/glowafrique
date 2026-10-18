import chat from '../api-handlers/chat.js';
import contact from '../api-handlers/contact.js';
import locations from '../api-handlers/locations.js';
import newsletter from '../api-handlers/newsletter.js';
import orderQuote from '../api-handlers/order-quote.js';
import orders from '../api-handlers/orders.js';
import paymentProof from '../api-handlers/payment-proof.js';
import reviews from '../api-handlers/reviews.js';
import adminOrders from '../api-handlers/admin/orders.js';
import login from '../api-handlers/auth/login.js';
import logout from '../api-handlers/auth/logout.js';
import me from '../api-handlers/auth/me.js';
import profile from '../api-handlers/auth/profile.js';
import passwordReset from '../api-handlers/auth/password-reset.js';
import register from '../api-handlers/auth/register.js';
import paystackCallback from '../api-handlers/payments/paystack-callback.js';

export const routeHandlers = Object.freeze({
  chat,
  contact,
  locations,
  newsletter,
  'order-quote': orderQuote,
  orders,
  'payment-proof': paymentProof,
  reviews,
  'admin/orders': adminOrders,
  'auth/login': login,
  'auth/logout': logout,
  'auth/me': me,
  'auth/profile': profile,
  'auth/password-reset': passwordReset,
  'auth/register': register,
  'payments/paystack/callback': paystackCallback,
});

export function routeKeyFromUrl(url) {
  const requestUrl = new URL(url || '/', 'http://localhost');
  const explicitRoute = requestUrl.searchParams.get('route');
  if (explicitRoute && Object.hasOwn(routeHandlers, explicitRoute)) return explicitRoute;
  const pathRoute = requestUrl.pathname.replace(/^\/api\/?/, '').replace(/\/$/, '');
  return Object.hasOwn(routeHandlers, pathRoute) ? pathRoute : null;
}

export default async function apiRouter(req, res) {
  const routeKey = routeKeyFromUrl(req.url);
  const handler = routeKey && routeHandlers[routeKey];
  if (!handler) return res.status(404).json({ error: 'not_found' });
  return handler(req, res);
}
