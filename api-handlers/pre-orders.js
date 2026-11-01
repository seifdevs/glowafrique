import {
  authHeaders, getDatabase, methodNotAllowed, normalizeEmail, parseBody,
  rateLimit, sameOriginRequest, validEmail,
} from '../lib/auth.js';
import { sendEmail } from '../lib/email.js';

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const TYPES = new Map([['image/jpeg', 'jpg'], ['image/png', 'png'], ['image/webp', 'webp']]);

export default async function preOrders(req, res) {
  authHeaders(res);
  if (methodNotAllowed(req, res, 'POST') || sameOriginRequest(req, res) || await rateLimit(req, res, 'pre-orders')) return;
  const body = parseBody(req);
  if (String(body.company || '').trim()) return res.status(202).json({ ok: true });
  const product = String(body.product || '').trim();
  const name = String(body.name || '').trim();
  const email = normalizeEmail(body.email);
  const phone = String(body.phone || '').trim();
  const image = body.image || {};
  const mimeType = String(image.mimeType || '').toLowerCase();
  const data = String(image.data || '');
  const imageBytes = Buffer.from(data, 'base64');
  const isImage = mimeType === 'image/jpeg'
    ? imageBytes.length >= 4 && imageBytes[0] === 0xff && imageBytes[1] === 0xd8 && imageBytes.at(-2) === 0xff && imageBytes.at(-1) === 0xd9
    : mimeType === 'image/png'
      ? imageBytes.length >= 8 && imageBytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
      : mimeType === 'image/webp'
        ? imageBytes.length >= 12 && imageBytes.toString('ascii', 0, 4) === 'RIFF' && imageBytes.toString('ascii', 8, 12) === 'WEBP'
        : false;
  const recipient = process.env.PREORDER_EMAIL || process.env.SUPPORT_EMAIL || 'glowafrique.ci@gmail.com';
  if (product.length < 2 || product.length > 180 || name.length < 2 || name.length > 120 ||
      !validEmail(email) || !/^[+\d() .-]{8,32}$/.test(phone) || !TYPES.has(mimeType) ||
      !/^[A-Za-z0-9+/]+={0,2}$/.test(data) || imageBytes.toString('base64') !== data || !isImage || imageBytes.length > MAX_IMAGE_BYTES) {
    return res.status(400).json({ error: 'Check the product, image, name, email, and phone number, then try again.' });
  }
  if (!recipient || !process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL)
    return res.status(503).json({ error: 'Pre-orders are temporarily unavailable. Please contact the shop.' });
  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
  const fileName = `pre-order-product.${TYPES.get(mimeType)}`;
  try {
    const createdAt = new Date();
    await sendEmail({
      to: recipient,
      replyTo: email,
      subject: `Pre-order request: ${product}`,
      text: `Product wanted: ${product}\nName: ${name}\nEmail: ${email}\nPhone: ${phone}\n\nThe customer's product screenshot is attached.`,
      html: `<h2>Pre-order request</h2><p><b>Product wanted:</b> ${escapeHtml(product)}</p><p><b>Name:</b> ${escapeHtml(name)}</p><p><b>Email:</b> ${escapeHtml(email)}</p><p><b>Phone:</b> ${escapeHtml(phone)}</p><p>The customer’s product screenshot is attached.</p>`,
      attachments: [{ filename: fileName, content: data }],
    });
    await (await getDatabase()).collection('glowafrique_preorders').insertOne({ product, name, email, phone, createdAt, notificationSent: true });
    return res.status(201).json({ ok: true, receivedAt: createdAt });
  } catch (error) {
    console.error('[pre-orders] submission failed:', error && error.name, error && error.code || '');
    return res.status(503).json({ error: 'Your request could not be sent. Please try again later.' });
  }
}
