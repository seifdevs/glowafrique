import {
  authenticatedUser,
  getDatabase,
  methodNotAllowed,
  normalizeEmail,
  parseBody,
  rateLimit,
  sameOriginRequest,
  validEmail,
} from '../lib/auth.js';
import { catalogPriceXof } from '../lib/catalog.js';

const FREE_DELIVERY_XOF = 45000;

export default async function orderQuote(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (
    methodNotAllowed(req, res, 'POST') ||
    sameOriginRequest(req, res) ||
    (await rateLimit(req, res, 'order-quote'))
  )
    return;
  try {
    const body = parseBody(req);
    if (!Array.isArray(body.items) || !body.items.length || body.items.length > 50)
      return res.status(400).json({ error: 'Your cart is empty.' });
    let subtotalXof = 0;
    const requestedQuantities = new Map();
    const { PRODUCTS } = await import('../lib/catalog.js');
    for (const line of body.items) {
      const product = PRODUCTS.find((item) => item.id === String(line.productId || ''));
      const quantity = Number(line.quantity);
      if (!product || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 99)
        return res.status(400).json({ error: 'Check your cart items and quantities.' });
      const productId = product.id;
      const combinedQuantity = (requestedQuantities.get(productId) || 0) + quantity;
      if (combinedQuantity > 99)
        return res.status(400).json({ error: 'Product quantities cannot exceed 99.' });
      requestedQuantities.set(productId, combinedQuantity);
      const unit = catalogPriceXof(product);
      if (unit == null) return res.status(409).json({ error: 'A product price is unavailable.' });
      subtotalXof += unit * quantity;
      if (!Number.isSafeInteger(subtotalXof))
        return res.status(400).json({ error: 'The order total is outside the supported range.' });
    }
    const inventory = (await getDatabase()).collection('glowafrique_inventory');
    const inventoryRows = await inventory
      .find({ productId: { $in: [...requestedQuantities.keys()] } })
      .toArray();
    const stockById = new Map(inventoryRows.map((item) => [item.productId, item.quantity]));
    const stockConfirmationPending = [...requestedQuantities].some(([productId, quantity]) => {
      const stock = stockById.get(productId);
      return !Number.isSafeInteger(stock) || stock < quantity;
    });
    const user = await authenticatedUser(req);
    const email = user ? user.email : normalizeEmail(body.email);
    if (!validEmail(email))
      return res.status(200).json({
        subtotalXof,
        discountXof: 0,
        shippingXof: null,
        totalXof: null,
        currency: 'XOF',
        quoteStatus: 'enter-email',
        stockConfirmationPending,
      });
    const orders = (await getDatabase()).collection('glowafrique_orders');
    const previousPurchase = await orders.findOne(
      { $or: [{ firstPurchaseKey: email }, { 'customer.email': email }] },
      { projection: { _id: 1 } },
    );
    const discountXof = previousPurchase ? 0 : Math.floor(subtotalXof / 10);
    const eligibleSubtotal = subtotalXof - discountXof;
    const configuredFee =
      process.env.SHIPPING_FEE_XOF === undefined || process.env.SHIPPING_FEE_XOF === ''
        ? null
        : Number(process.env.SHIPPING_FEE_XOF);
    const feeConfigured = Number.isSafeInteger(configuredFee) && configuredFee >= 0;
    const shippingXof =
      eligibleSubtotal >= FREE_DELIVERY_XOF ? 0 : feeConfigured ? configuredFee : null;
    const shippingQuotePending = shippingXof == null;
    if (stockConfirmationPending || shippingQuotePending)
      return res.status(200).json({
        subtotalXof,
        discountXof,
        shippingXof,
        totalXof: null,
        currency: 'XOF',
        quoteStatus: 'confirmation-pending',
        stockConfirmationPending,
        shippingQuotePending,
      });
    return res.status(200).json({
      subtotalXof,
      discountXof,
      shippingXof,
      totalXof: eligibleSubtotal + shippingXof,
      currency: 'XOF',
      quoteStatus: 'ready',
      stockConfirmationPending: false,
      shippingQuotePending: false,
    });
  } catch (error) {
    console.error('[order-quote] quote failed:', error && error.name, (error && error.code) || '');
    return res.status(503).json({ error: 'The order total is temporarily unavailable.' });
  }
}
