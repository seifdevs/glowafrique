const API_ORIGIN = 'https://api.paystack.co';

function apiSecret() {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) throw new Error('PAYSTACK_NOT_CONFIGURED');
  return secret;
}

async function request(path, options = {}, fetchImpl = fetch) {
  const response = await fetchImpl(`${API_ORIGIN}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${apiSecret()}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const body = await response.json();
  if (!response.ok || body?.status !== true) {
    throw new Error(`PAYSTACK_API_${response.status}`);
  }
  return body.data;
}

export async function initializePaystackTransaction(
  { email, amountXof, reference, callbackUrl },
  fetchImpl,
) {
  if (!Number.isSafeInteger(amountXof) || amountXof < 1) {
    throw new Error('PAYSTACK_INVALID_AMOUNT');
  }
  if (!/^[A-Za-z0-9.-]{1,100}$/.test(String(reference || ''))) {
    throw new Error('PAYSTACK_INVALID_REFERENCE');
  }
  const amount = amountXof * 100;
  if (!Number.isSafeInteger(amount)) throw new Error('PAYSTACK_INVALID_AMOUNT');
  const data = await request(
    '/transaction/initialize',
    {
      method: 'POST',
      body: JSON.stringify({
        email,
        amount: String(amount),
        currency: 'XOF',
        reference,
        callback_url: callbackUrl,
        channels: ['mobile_money', 'card'],
      }),
    },
    fetchImpl,
  );
  const authorizationUrl = new URL(String(data?.authorization_url || ''));
  if (authorizationUrl.origin !== 'https://checkout.paystack.com') {
    throw new Error('PAYSTACK_INVALID_CHECKOUT_URL');
  }
  if (data.reference !== reference) throw new Error('PAYSTACK_REFERENCE_MISMATCH');
  return { authorizationUrl: authorizationUrl.href, reference: data.reference };
}

export async function verifyPaystackTransaction(reference, fetchImpl) {
  if (!/^[A-Za-z0-9.-]{1,100}$/.test(String(reference || ''))) {
    throw new Error('PAYSTACK_INVALID_REFERENCE');
  }
  return request(
    `/transaction/verify/${encodeURIComponent(reference)}`,
    { method: 'GET' },
    fetchImpl,
  );
}

export function paystackTransactionMatches(transaction, order) {
  return Boolean(
    transaction?.status === 'success' &&
    transaction?.reference === order.paystackReference &&
    transaction?.currency === 'XOF' &&
    transaction?.amount === order.totalXof * 100,
  );
}
