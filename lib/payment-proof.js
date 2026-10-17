const MAX_PROOF_BYTES = 2 * 1024 * 1024;
const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

export function validatePaymentProof(payload) {
  const encoded = String(payload && payload.data || '');
  if (!encoded || encoded.length > Math.ceil(MAX_PROOF_BYTES * 4 / 3) + 8) throw new Error('Upload a payment screenshot no larger than 2 MB.');
  const data = Buffer.from(encoded, 'base64');
  if (!data.length || data.length > MAX_PROOF_BYTES || data.toString('base64') !== encoded) throw new Error('The payment screenshot is invalid or exceeds 2 MB.');
  const mimeType = String(payload && payload.mimeType || '').toLowerCase();
  const jpeg = mimeType === 'image/jpeg' && data.length >= 4 && data[0] === 0xff && data[1] === 0xd8 && data[data.length - 2] === 0xff && data[data.length - 1] === 0xd9;
  const png = mimeType === 'image/png' && data.length >= 45 && data.subarray(0, 8).equals(PNG_SIGNATURE) && data.toString('ascii', 12, 16) === 'IHDR' && data.readUInt32BE(16) > 0 && data.readUInt32BE(20) > 0 && data.toString('ascii', data.length - 8, data.length - 4) === 'IEND';
  const webp = mimeType === 'image/webp' && data.length >= 20 && data.toString('ascii', 0, 4) === 'RIFF' && data.readUInt32LE(4) === data.length - 8 && data.toString('ascii', 8, 12) === 'WEBP' && ['VP8 ', 'VP8L', 'VP8X'].includes(data.toString('ascii', 12, 16));
  if (!jpeg && !png && !webp) throw new Error('Upload a valid JPEG, PNG, or WebP payment screenshot.');
  return { mimeType, data };
}

export { MAX_PROOF_BYTES };
