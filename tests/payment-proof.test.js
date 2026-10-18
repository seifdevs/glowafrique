import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validatePaymentProof } from '../lib/payment-proof.js';

test('accepts the real Wave QR JPEG asset as a proof image', async () => {
  const image = await readFile(new URL('../public/images/wave.jpeg', import.meta.url));
  const result = validatePaymentProof({ mimeType: 'image/jpeg', data: image.toString('base64') });
  assert.equal(result.mimeType, 'image/jpeg');
  assert.deepEqual(result.data, image);
});

test('rejects a mismatched MIME type and non-image upload', () => {
  const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0x00, 0xff, 0xd9]).toString('base64');
  assert.throws(() => validatePaymentProof({ mimeType: 'image/png', data: jpeg }));
  assert.throws(() =>
    validatePaymentProof({
      mimeType: 'image/svg+xml',
      data: Buffer.from('<svg/>').toString('base64'),
    }),
  );
});

test('rejects oversized payment proof files', () => {
  const data = Buffer.alloc(2 * 1024 * 1024 + 1).toString('base64');
  assert.throws(() => validatePaymentProof({ mimeType: 'image/jpeg', data }));
});
