import test from 'node:test';
import assert from 'node:assert/strict';
import {
  initializePaystackTransaction,
  paystackTransactionMatches,
  verifyPaystackTransaction,
} from '../lib/payments/paystack.js';

test('Paystack hosted initialization sends verified XOF totals in provider subunits', async () => {
  const originalKey = process.env.PAYSTACK_SECRET_KEY;
  process.env.PAYSTACK_SECRET_KEY = 'sk_test_unit_test';
  let call;
  try {
    const result = await initializePaystackTransaction(
      {
        email: 'shopper@example.test',
        amountXof: 45000,
        reference: 'GA-20261019-1234ABCD',
        callbackUrl: 'https://shop.example.test/api/payments/paystack/callback',
      },
      async (url, options) => {
        call = { url, options };
        return {
          ok: true,
          status: 200,
          json: async () => ({
            status: true,
            data: {
              authorization_url: 'https://checkout.paystack.com/hosted-session',
              reference: 'GA-20261019-1234ABCD',
            },
          }),
        };
      },
    );
    assert.equal(call.url, 'https://api.paystack.co/transaction/initialize');
    assert.equal(call.options.headers.Authorization, 'Bearer sk_test_unit_test');
    assert.deepEqual(JSON.parse(call.options.body), {
      email: 'shopper@example.test',
      amount: '4500000',
      currency: 'XOF',
      reference: 'GA-20261019-1234ABCD',
      callback_url: 'https://shop.example.test/api/payments/paystack/callback',
      channels: ['mobile_money', 'card'],
    });
    assert.equal(result.authorizationUrl, 'https://checkout.paystack.com/hosted-session');
    assert.equal(result.reference, 'GA-20261019-1234ABCD');
  } finally {
    if (originalKey === undefined) delete process.env.PAYSTACK_SECRET_KEY;
    else process.env.PAYSTACK_SECRET_KEY = originalKey;
  }
});

test('Paystack verification reads only the provider reference and confirms exact amount, currency, and status', async () => {
  const originalKey = process.env.PAYSTACK_SECRET_KEY;
  process.env.PAYSTACK_SECRET_KEY = 'sk_test_unit_test';
  try {
    let url;
    const transaction = await verifyPaystackTransaction('GA-20261019-1234ABCD', async (target) => {
      url = target;
      return {
        ok: true,
        status: 200,
        json: async () => ({ status: true, data: { status: 'success' } }),
      };
    });
    assert.equal(url, 'https://api.paystack.co/transaction/verify/GA-20261019-1234ABCD');
    const order = { totalXof: 12000, paystackReference: 'GA-20261019-1234ABCD' };
    assert.deepEqual(transaction, { status: 'success' });
    assert.equal(
      paystackTransactionMatches(
        { status: 'success', reference: order.paystackReference, currency: 'XOF', amount: 1200000 },
        order,
      ),
      true,
    );
    assert.equal(
      paystackTransactionMatches(
        { status: 'success', reference: order.paystackReference, currency: 'XOF', amount: 1200001 },
        order,
      ),
      false,
    );
    assert.equal(
      paystackTransactionMatches(
        { status: 'pending', reference: order.paystackReference, currency: 'XOF', amount: 1200000 },
        order,
      ),
      false,
    );
    assert.equal(
      paystackTransactionMatches(
        { status: 'success', reference: order.paystackReference, currency: 'USD', amount: 1200000 },
        order,
      ),
      false,
    );
  } finally {
    if (originalKey === undefined) delete process.env.PAYSTACK_SECRET_KEY;
    else process.env.PAYSTACK_SECRET_KEY = originalKey;
  }
});
