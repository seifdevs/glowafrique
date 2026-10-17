export const USD_TO_XOF = 630;

function minorUnits(value) {
  const text = String(value ?? '').trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(text)) throw new Error('Invalid monetary amount.');
  const [whole, fraction = ''] = text.split('.');
  const amount = Number(whole) * 100 + Number((fraction + '00').slice(0, 2));
  if (!Number.isSafeInteger(amount)) throw new Error('Monetary amount is outside the supported range.');
  return amount;
}

export function toXof(value, currency) {
  const code = String(currency || '').trim().toUpperCase();
  if (code !== 'XOF' && code !== 'USD') throw new Error('A product price currency must be set to XOF or USD.');
  const cents = minorUnits(value);
  if (code === 'XOF' && cents % 100 !== 0) throw new Error('XOF amounts must be whole francs.');
  return code === 'USD' ? Math.round(cents * USD_TO_XOF / 100) : cents / 100;
}

export function formatXof(value) {
  const amount = Number(value);
  if (!Number.isSafeInteger(amount) || amount < 0) throw new Error('Invalid XOF amount.');
  return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(amount)} XOF`;
}

export function pointsForXof(eligibleSubtotalXof) {
  if (!Number.isSafeInteger(eligibleSubtotalXof) || eligibleSubtotalXof < 0) throw new Error('Invalid eligible subtotal.');
  return Math.floor(eligibleSubtotalXof / USD_TO_XOF);
}
