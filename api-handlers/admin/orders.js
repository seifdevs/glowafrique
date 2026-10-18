import {
  authHeaders,
  authenticatedUser,
  getAuthCollections,
  getDatabase,
  parseBody,
  rateLimit,
  sameOriginRequest,
} from '../../lib/auth.js';

const TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

function outputOrder(order) {
  return {
    orderNumber: order.orderNumber,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    customer: order.customer,
    items: order.items,
    subtotalXof: order.subtotalXof,
    shippingXof: order.shippingXof,
    discountXof: order.discountXof,
    totalXof: order.totalXof,
    currency: order.currency,
    status: order.status,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    waveSenderPhone: order.waveSenderPhone || null,
    paymentProofId: order.paymentProofId || null,
    paymentVerification: order.paymentVerification || null,
    pointsEarned: order.pointsEarned,
    pointsAwardedAt: order.pointsAwardedAt,
    statusHistory: order.statusHistory,
  };
}

export default async function adminOrders(req, res) {
  authHeaders(res);
  if (!['GET', 'PATCH'].includes(req.method)) {
    res.setHeader('Allow', 'GET, PATCH');
    return res.status(405).json({ error: 'Method not allowed.' });
  }
  if (await rateLimit(req, res, 'admin-orders')) return;
  try {
    const user = await authenticatedUser(req);
    if (!user)
      return res.status(401).json({ error: 'Please sign in to access the control panel.' });
    if (user.role !== 'admin')
      return res.status(403).json({ error: 'Administrator access is required.' });

    const database = await getDatabase();
    const orders = database.collection('glowafrique_orders');
    await orders.createIndex({ status: 1, createdAt: 1 });

    if (req.method === 'GET') {
      const url = new URL(req.url || '/', 'http://localhost');
      const requestedStatus = url.searchParams.get('status') || 'pending';
      const query =
        requestedStatus === 'payment_verification'
          ? { paymentMethod: 'wave', paymentStatus: 'awaiting_verification' }
          : requestedStatus === 'all'
            ? {}
            : requestedStatus === 'processed'
              ? {
                  status: { $in: ['confirmed', 'processing', 'shipped', 'delivered', 'cancelled'] },
                }
              : Object.hasOwn(TRANSITIONS, requestedStatus)
                ? { status: requestedStatus }
                : null;
      if (query === null) return res.status(400).json({ error: 'Invalid order status.' });
      const limit = Math.min(
        100,
        Math.max(1, Number.parseInt(url.searchParams.get('limit') || '50', 10) || 50),
      );
      const page = Math.max(1, Number.parseInt(url.searchParams.get('page') || '1', 10) || 1);
      const [items, total] = await Promise.all([
        orders
          .find(query)
          .sort({ createdAt: 1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .toArray(),
        orders.countDocuments(query),
      ]);
      return res
        .status(200)
        .json({ orders: items.map(outputOrder), status: requestedStatus, page, limit, total });
    }

    if (sameOriginRequest(req, res)) return;
    const body = parseBody(req);
    const orderNumber = String(body.orderNumber || '').trim();
    const paymentAction = String(body.paymentAction || '').trim();
    if (paymentAction) {
      if (!orderNumber || !['verify', 'reject'].includes(paymentAction))
        return res.status(400).json({ error: 'Choose a valid payment decision.' });
      const rejectionReason = String(body.rejectionReason || '').trim();
      if (
        paymentAction === 'reject' &&
        (rejectionReason.length < 8 || rejectionReason.length > 500)
      )
        return res
          .status(400)
          .json({ error: 'Provide a rejection explanation between 8 and 500 characters.' });
      const pendingPayment = await orders.findOne(
        { orderNumber, paymentMethod: 'wave', paymentStatus: 'awaiting_verification' },
        { projection: { paymentProofId: 1, orderNumber: 1 } },
      );
      if (!pendingPayment)
        return res.status(409).json({
          error:
            'This order is no longer awaiting Wave payment verification. Refresh the order list.',
        });
      const proof = pendingPayment.paymentProofId
        ? await database
            .collection('glowafrique_payment_proofs')
            .findOne({ proofId: pendingPayment.paymentProofId, orderNumber })
        : null;
      const manualReference = String(body.manualReference || '').trim();
      const manualSenderPhone = String(body.manualSenderPhone || '').trim();
      const manualConfirmed = body.manualConfirmed === true;
      if (
        paymentAction === 'verify' &&
        !proof &&
        (!manualConfirmed ||
          manualReference.length < 5 ||
          manualReference.length > 120 ||
          !/^[+\d() .-]{8,32}$/.test(manualSenderPhone))
      ) {
        return res.status(428).json({
          error:
            'No payment screenshot is attached. To verify manually, enter the Wave transaction reference and sender phone, then confirm that you matched the order amount in Wave.',
        });
      }
      const now = new Date();
      const paymentStatus = paymentAction === 'verify' ? 'verified' : 'rejected';
      const verification = {
        decision: paymentStatus,
        reason: paymentAction === 'reject' ? rejectionReason : null,
        decidedAt: now,
        decidedBy: user._id,
      };
      if (paymentAction === 'verify') {
        verification.evidenceSource = proof ? 'uploaded_proof' : 'manual_wave_match';
        if (!proof)
          verification.manualEvidence = {
            reference: manualReference,
            senderPhone: manualSenderPhone,
            confirmedAt: now,
          };
      }
      const updated = await orders.findOneAndUpdate(
        { orderNumber, paymentMethod: 'wave', paymentStatus: 'awaiting_verification' },
        {
          $set: {
            paymentStatus,
            paymentRejectionReason: paymentAction === 'reject' ? rejectionReason : null,
            paymentVerification: verification,
            ...(paymentAction === 'verify' && !proof ? { waveSenderPhone: manualSenderPhone } : {}),
            updatedAt: now,
          },
        },
        { returnDocument: 'after' },
      );
      const updatedOrder = updated && (updated.value || updated);
      if (!updatedOrder)
        return res.status(409).json({ error: 'This Wave payment is not awaiting verification.' });
      return res.status(200).json({ order: outputOrder(updatedOrder) });
    }
    const nextStatus = String(body.status || '').trim();
    if (!orderNumber || !Object.hasOwn(TRANSITIONS, nextStatus))
      return res.status(400).json({ error: 'Provide an order number and a valid status.' });
    const { users } = await getAuthCollections();
    let updatedOrder = null;
    const session = database.client.startSession();
    try {
      await session.withTransaction(async () => {
        const order = await orders.findOne({ orderNumber }, { session });
        if (!order) throw Object.assign(new Error('ORDER_NOT_FOUND'), { statusCode: 404 });
        if (order.status === nextStatus) {
          updatedOrder = order;
          return;
        }
        if (!TRANSITIONS[order.status] || !TRANSITIONS[order.status].includes(nextStatus))
          throw Object.assign(new Error('INVALID_ORDER_TRANSITION'), { statusCode: 409 });
        const now = new Date();
        const patch = {
          $set: { status: nextStatus, updatedAt: now },
          $push: { statusHistory: { status: nextStatus, changedAt: now, actorUserId: user._id } },
        };
        if (nextStatus === 'delivered' && !order.pointsAwardedAt) {
          patch.$set.pointsAwardedAt = now;
          if (
            order.customerId &&
            Number.isSafeInteger(order.pointsEarned) &&
            order.pointsEarned > 0
          ) {
            await users.updateOne(
              { _id: order.customerId },
              { $inc: { points: order.pointsEarned }, $set: { updatedAt: now } },
              { session },
            );
          }
        }
        await orders.updateOne({ _id: order._id, status: order.status }, patch, { session });
        updatedOrder = await orders.findOne({ _id: order._id }, { session });
      });
    } finally {
      await session.endSession();
    }
    return res.status(200).json({ order: outputOrder(updatedOrder) });
  } catch (error) {
    if (error && error.statusCode)
      return res.status(error.statusCode).json({
        error:
          error.message === 'ORDER_NOT_FOUND'
            ? 'Order not found.'
            : 'That order status change is not allowed.',
      });
    console.error(
      '[admin/orders] request failed:',
      error && error.name,
      (error && error.code) || '',
    );
    return res.status(503).json({ error: 'The control panel is temporarily unavailable.' });
  }
}
