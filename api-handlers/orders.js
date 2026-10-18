import { randomBytes, randomUUID } from 'node:crypto';
import {
  authHeaders,
  authenticatedUser,
  getDatabase,
  normalizeEmail,
  parseBody,
  rateLimit,
  validEmail,
  sameOriginRequest,
} from '../lib/auth.js';
import { catalogPriceXof } from '../lib/catalog.js';
import { pointsForXof } from '../lib/currency.js';
import { validatePaymentProof } from '../lib/payment-proof.js';
import { initializePaystackTransaction } from '../lib/payments/paystack.js';
import { notifyOrder } from '../lib/order-notifications.js';

const FREE_DELIVERY_XOF = 45000;
const MAX_ITEMS = 50;

async function ordersCollection() {
  const orders = (await getDatabase()).collection('glowafrique_orders');
  let ready = globalThis.__glowAfriqueOrderIndexes;
  if (!ready) {
    ready = Promise.all([
      orders.createIndex(
        { orderNumber: 1 },
        { unique: true, partialFilterExpression: { orderNumber: { $type: 'string' } } },
      ),
      orders.createIndex(
        { idempotencyKey: 1 },
        { unique: true, partialFilterExpression: { idempotencyKey: { $type: 'string' } } },
      ),
      orders.createIndex(
        { firstPurchaseKey: 1 },
        { unique: true, partialFilterExpression: { firstPurchaseKey: { $type: 'string' } } },
      ),
      orders.createIndex({ customerId: 1, createdAt: -1 }),
      orders.createIndex({ status: 1, createdAt: 1 }),
    ]).then(() => true);
    globalThis.__glowAfriqueOrderIndexes = ready;
  }
  try {
    await ready;
  } catch (error) {
    delete globalThis.__glowAfriqueOrderIndexes;
    throw error;
  }
  return orders;
}

function orderNumber() {
  const day = new Date().toISOString().slice(0, 10).replaceAll('-', '');
  return `GA-${day}-${randomBytes(4).toString('hex').toUpperCase()}`;
}

function safeOrder(order) {
  return {
    orderNumber: order.orderNumber,
    createdAt: order.createdAt,
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentRejectionReason: order.paymentRejectionReason || null,
    paymentMethod: order.paymentMethod,
    currency: order.currency,
    items: order.items,
    customer: order.customer,
    subtotalXof: order.subtotalXof,
    shippingXof: order.shippingXof,
    discountXof: order.discountXof,
    totalXof: order.totalXof,
    pointsEarned: order.pointsEarned,
  };
}

function validCustomer(body, user) {
  const customer = body && typeof body.customer === 'object' && body.customer ? body.customer : {};
  let firstName = String(customer.firstName || (user && user.firstName) || '').trim();
  let lastName = String(customer.lastName || (user && user.lastName) || '').trim();
  const legacyFullName = String(customer.fullName || '').trim();
  if ((!firstName || !lastName) && legacyFullName) {
    const parts = legacyFullName.split(/\s+/);
    firstName = firstName || parts.shift() || '';
    lastName = lastName || parts.join(' ');
  }
  const fullName = legacyFullName || [firstName, lastName].filter(Boolean).join(' ');
  const phone = String(customer.phone || '').trim();
  const addressLine1 = String(customer.addressLine1 || '').trim();
  const addressLine2 = String(customer.addressLine2 || '').trim();
  const city = String(customer.city || '').trim();
  const division = String(customer.division || customer.region || '').trim();
  const region = division;
  const postalCode = String(customer.postalCode || '').trim();
  const country = 'Côte d’Ivoire';
  const deliveryInstructions = String(customer.deliveryInstructions || '').trim();
  const email = user ? user.email : normalizeEmail(customer.email);
  if (fullName.length < 2 || fullName.length > 120) throw new Error('Enter your full name.');
  if (!firstName || firstName.length > 80 || lastName.length > 80 || (!lastName && !legacyFullName))
    throw new Error('Enter a valid first and last name.');
  if (!/^[+\d() .-]{8,32}$/.test(phone))
    throw new Error('Enter a valid phone number, including country code.');
  if (!addressLine1 || addressLine1.length > 180 || addressLine2.length > 180)
    throw new Error('Enter a valid delivery address.');
  if (!city || city.length > 100 || !region || region.length > 100)
    throw new Error('Enter your city and region.');
  if (postalCode.length > 20 || deliveryInstructions.length > 500)
    throw new Error('Check your postal code and delivery instructions.');
  if (!validEmail(email)) throw new Error('Enter a valid email address.');
  return {
    firstName,
    lastName,
    fullName,
    phone,
    email,
    addressLine1,
    addressLine2,
    city,
    region,
    division,
    postalCode,
    country,
    deliveryInstructions,
  };
}

export default async function ordersApi(req, res) {
  authHeaders(res);
  if (!['GET', 'POST'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }
  if (await rateLimit(req, res, `orders-${String(req.method || '').toLowerCase()}`)) return;
  if (req.method === 'POST' && sameOriginRequest(req, res)) return;
  try {
    const user = await authenticatedUser(req);
    if (req.method === 'GET') {
      if (!user) return res.status(401).json({ error: 'Please sign in to view your orders.' });
      const limit = Math.min(
        50,
        Math.max(
          1,
          Number.parseInt(
            new URL(req.url || '/', 'http://localhost').searchParams.get('limit') || '20',
            10,
          ) || 20,
        ),
      );
      const page = Math.max(
        1,
        Number.parseInt(
          new URL(req.url || '/', 'http://localhost').searchParams.get('page') || '1',
          10,
        ) || 1,
      );
      const orders = await ordersCollection();
      const query = { customerId: user._id };
      const [items, total] = await Promise.all([
        orders
          .find(query, { projection: { _id: 0 } })
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .toArray(),
        orders.countDocuments(query),
      ]);
      return res.status(200).json({ orders: items.map(safeOrder), page, limit, total });
    }

    const body = parseBody(req);
    const paymentMethod = String(body.paymentMethod || '').trim();
    if (!['cash_on_delivery', 'wave', 'paystack'].includes(paymentMethod))
      return res.status(400).json({ error: 'Choose Cash on Delivery, Wave, or Paystack.' });
    if (paymentMethod === 'paystack' && !process.env.PAYSTACK_SECRET_KEY)
      return res.status(503).json({ error: 'Hosted payment is not configured yet.' });
    if (paymentMethod === 'paystack' && process.env.VITE_PAYSTACK_ENABLED !== 'true')
      return res.status(503).json({ error: 'Hosted payment is not enabled yet.' });
    const waveSenderPhone = String(body.waveSenderPhone || '').trim();
    let waveProof = null;
    if (paymentMethod === 'wave') {
      if (!/^[+\d() .-]{8,32}$/.test(waveSenderPhone))
        return res
          .status(400)
          .json({ error: 'Enter the phone number used to send your Wave payment.' });
      try {
        waveProof = { ...validatePaymentProof(body.waveProof), proofId: randomUUID() };
      } catch (error) {
        return res.status(400).json({ error: error.message });
      }
    }
    const idempotencyKey = String(body.idempotencyKey || '').trim();
    if (!/^[A-Za-z0-9_-]{16,100}$/.test(idempotencyKey))
      return res.status(400).json({ error: 'Refresh the checkout and try again.' });
    if (!Array.isArray(body.items) || !body.items.length || body.items.length > MAX_ITEMS)
      return res.status(400).json({ error: 'Your cart is empty or contains too many items.' });
    let customer;
    try {
      customer = validCustomer(body, user);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }

    const combined = new Map();
    for (const item of body.items) {
      const productId = String((item && item.productId) || '');
      const quantity = Number(item && item.quantity);
      if (!productId || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 99)
        return res.status(400).json({ error: 'Check each product quantity and try again.' });
      const variant = String((item && item.variant) || '').trim();
      const key = productId + '::' + variant;
      combined.set(key, {
        productId,
        variant,
        quantity: (combined.get(key)?.quantity || 0) + quantity,
      });
      if (combined.get(key).quantity > 99)
        return res.status(400).json({ error: 'Product quantities cannot exceed 99.' });
    }
    const { PRODUCTS } = await import('../lib/catalog.js');
    const items = [];
    let subtotalXof = 0;
    for (const line of combined.values()) {
      const { productId, quantity, variant: requestedVariant } = line;
      const product = PRODUCTS.find((entry) => entry.id === productId);
      if (!product)
        return res
          .status(400)
          .json({ error: 'One of the products in your cart is no longer available.' });
      const unitPriceXof = catalogPriceXof(product);
      if (unitPriceXof == null)
        return res.status(409).json({
          error: `A verified XOF price is not configured for ${product.name}. Please contact GlowAfrique.`,
        });
      const lineTotalXof = unitPriceXof * quantity;
      if (!Number.isSafeInteger(lineTotalXof) || !Number.isSafeInteger(subtotalXof + lineTotalXof))
        return res.status(400).json({ error: 'The order total is outside the supported range.' });
      const variants = Array.isArray(product.variants) ? product.variants : [];
      if (
        requestedVariant &&
        !variants.some((variant) => String(variant.name || variant) === requestedVariant)
      )
        return res.status(400).json({ error: 'Choose a valid product variant.' });
      items.push({
        productId,
        productName: product.name,
        variant: requestedVariant || null,
        quantity,
        unitPriceXof,
        lineTotalXof,
      });
      subtotalXof += lineTotalXof;
    }
    const orders = await ordersCollection();
    const firstPurchaseKey = customer.email;
    const previousPurchase = await orders.findOne(
      { $or: [{ firstPurchaseKey }, { 'customer.email': customer.email }] },
      { projection: { _id: 1 } },
    );
    const discountXof = previousPurchase ? 0 : Math.floor(subtotalXof / 10);
    const eligibleSubtotalXof = subtotalXof - discountXof;
    const shippingFee =
      process.env.SHIPPING_FEE_XOF === undefined || process.env.SHIPPING_FEE_XOF === ''
        ? null
        : Number(process.env.SHIPPING_FEE_XOF);
    if (
      eligibleSubtotalXof < FREE_DELIVERY_XOF &&
      (!Number.isSafeInteger(shippingFee) || shippingFee < 0)
    ) {
      return res.status(503).json({
        error:
          'Delivery fees for orders under 45,000 XOF are not configured yet. Please contact GlowAfrique to confirm your order.',
      });
    }
    const shippingXof = eligibleSubtotalXof >= FREE_DELIVERY_XOF ? 0 : shippingFee;
    const totalXof = subtotalXof - discountXof + shippingXof;
    const document = {
      orderNumber: orderNumber(),
      idempotencyKey,
      customerId: user ? user._id : null,
      ...(previousPurchase ? {} : { firstPurchaseKey }),
      customer,
      items,
      subtotalXof,
      shippingXof,
      discountXof,
      totalXof,
      currency: 'XOF',
      status: 'pending',
      paymentMethod,
      paymentStatus:
        paymentMethod === 'wave'
          ? 'awaiting_verification'
          : paymentMethod === 'paystack'
            ? 'awaiting_provider'
            : 'due_on_delivery',
      customerLocale: body.language === 'en' ? 'en' : 'fr',
      ...(paymentMethod === 'wave' ? { waveSenderPhone, paymentProofId: waveProof.proofId } : {}),
      pointsEarned: user ? pointsForXof(eligibleSubtotalXof) : 0,
      pointsAwardedAt: null,
      statusHistory: [
        { status: 'pending', changedAt: new Date(), actorUserId: user ? user._id : null },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    let proofs = null;
    try {
      if (waveProof) {
        proofs = (await getDatabase()).collection('glowafrique_payment_proofs');
        await proofs.insertOne({
          proofId: waveProof.proofId,
          orderNumber: document.orderNumber,
          mimeType: waveProof.mimeType,
          data: waveProof.data,
          createdAt: new Date(),
        });
      }
      await orders.insertOne(document);
    } catch (error) {
      if (waveProof && proofs)
        await proofs.deleteOne({ proofId: waveProof.proofId }).catch(() => {});
      if (error && error.code === 11000) {
        const existing = await orders.findOne({ idempotencyKey }, { projection: { _id: 0 } });
        const sameCustomer =
          existing &&
          ((user && existing.customerId && String(user._id) === String(existing.customerId)) ||
            (!user && !existing.customerId && existing.customer.email === customer.email));
        if (sameCustomer)
          return res.status(200).json({
            order: safeOrder(existing),
            duplicate: true,
            ...(existing.paystackAuthorizationUrl
              ? { authorizationUrl: existing.paystackAuthorizationUrl }
              : {}),
          });
        return res.status(409).json({
          error: 'This order was already submitted. Refresh the page to start another order.',
        });
      }
      throw error;
    }
    if (paymentMethod === 'paystack') {
      try {
        const siteOrigin =
          process.env.PUBLIC_SITE_URL ||
          `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers['x-forwarded-host'] || req.headers.host}`;
        const callbackUrl = new URL('/api/payments/paystack/callback', siteOrigin).href;
        const transaction = await initializePaystackTransaction({
          email: customer.email,
          amountXof: totalXof,
          reference: document.orderNumber,
          callbackUrl,
        });
        document.paystackReference = transaction.reference;
        document.paystackAuthorizationUrl = transaction.authorizationUrl;
        document.paymentStatus = 'awaiting_provider';
        document.updatedAt = new Date();
        await orders.updateOne(
          { orderNumber: document.orderNumber, paymentStatus: 'awaiting_provider' },
          {
            $set: {
              paystackReference: transaction.reference,
              paystackAuthorizationUrl: transaction.authorizationUrl,
              updatedAt: document.updatedAt,
            },
          },
        );
        return res.status(201).json({
          order: safeOrder(document),
          authorizationUrl: transaction.authorizationUrl,
        });
      } catch (error) {
        await orders.deleteOne({ orderNumber: document.orderNumber }).catch(() => {});
        console.error('[orders] Paystack initialization failed:', error && error.message);
        return res
          .status(503)
          .json({ error: 'Hosted payment could not be started. Your order was not placed.' });
      }
    }
    try {
      await notifyOrder(document, 'created');
    } catch (error) {
      console.error('[orders] confirmation email failed:', error && error.name);
    }
    return res.status(201).json({ order: safeOrder(document) });
  } catch (error) {
    console.error('[orders] request failed:', error && error.name, (error && error.code) || '');
    return res.status(503).json({
      error: 'Orders are temporarily unavailable. Please try again or contact GlowAfrique.',
    });
  }
}
