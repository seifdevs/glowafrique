import test from 'node:test';
import assert from 'node:assert/strict';
import { notifyOrder } from '../lib/order-notifications.js';

test('transactional order emails are skipped until a sender is configured', async () => {
  const originalApiKey = process.env.RESEND_API_KEY;
  const originalFrom = process.env.RESEND_FROM_EMAIL;
  delete process.env.RESEND_API_KEY;
  delete process.env.RESEND_FROM_EMAIL;
  try {
    assert.equal(
      await notifyOrder({ customer: { email: 'shopper@example.test' } }, 'created'),
      false,
    );
  } finally {
    if (originalApiKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = originalApiKey;
    if (originalFrom === undefined) delete process.env.RESEND_FROM_EMAIL;
    else process.env.RESEND_FROM_EMAIL = originalFrom;
  }
});

test('order email content escapes merchant and customer data', async () => {
  const originalApiKey = process.env.RESEND_API_KEY;
  const originalFrom = process.env.RESEND_FROM_EMAIL;
  process.env.RESEND_API_KEY = 'test-key';
  process.env.RESEND_FROM_EMAIL = 'GlowAfrique <shop@example.test>';
  let sent;
  try {
    const result = await notifyOrder(
      {
        customerLocale: 'en',
        customer: { email: 'shopper@example.test', firstName: '<img src=x>' },
        orderNumber: 'GA-20261019-1234ABCD',
        paymentMethod: 'wave',
        paymentStatus: 'awaiting_verification',
        status: 'pending',
        totalXof: 12500,
        items: [{ productName: '<script>alert(1)</script>', quantity: 2 }],
      },
      'created',
      async (message) => {
        sent = message;
      },
    );
    assert.equal(result, true);
    assert.equal(sent.to, 'shopper@example.test');
    assert.match(sent.subject, /GA-20261019-1234ABCD/);
    assert.doesNotMatch(sent.html, /<img src=x>/);
    assert.doesNotMatch(sent.html, /<script>/);
    assert.match(sent.html, /waiting for review/i);
    assert.match(sent.text, /12,500/);
  } finally {
    if (originalApiKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = originalApiKey;
    if (originalFrom === undefined) delete process.env.RESEND_FROM_EMAIL;
    else process.env.RESEND_FROM_EMAIL = originalFrom;
  }
});
