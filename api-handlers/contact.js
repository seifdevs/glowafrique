import {
  authHeaders,
  getDatabase,
  methodNotAllowed,
  parseBody,
  rateLimit,
  sameOriginRequest,
  normalizeEmail,
  validEmail,
} from '../lib/auth.js';
import { sendEmail } from '../lib/email.js';

export default async function contact(req, res) {
  authHeaders(res);
  if (methodNotAllowed(req, res, 'POST')) return;
  if (sameOriginRequest(req, res)) return;
  if (await rateLimit(req, res, 'contact')) return;
  const body = parseBody(req);
  if (String(body.company || '').trim()) return res.status(202).json({ ok: true });
  const name = String(body.name || '').trim();
  const email = normalizeEmail(body.email);
  const subject = String(body.subject || '').trim();
  const message = String(body.message || '').trim();
  if (
    name.length < 2 ||
    name.length > 120 ||
    !validEmail(email) ||
    subject.length < 3 ||
    subject.length > 120 ||
    message.length < 10 ||
    message.length > 3000
  ) {
    return res
      .status(400)
      .json({ error: 'Check your name, email, subject, and message, then try again.' });
  }
  try {
    const createdAt = new Date();
    const inquiry = { name, email, subject, message, status: 'new', createdAt };
    const collection = (await getDatabase()).collection('glowafrique_contact_inquiries');
    await collection.insertOne(inquiry);
    const supportEmail = process.env.SUPPORT_EMAIL;
    if (supportEmail && process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL) {
      try {
        await sendEmail({
          to: supportEmail,
          replyTo: email,
          subject: `Website enquiry: ${subject}`,
          text: `From: ${name} <${email}>\n\n${message}`,
          html: `<p><b>From:</b> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p><p>${escapeHtml(message).replaceAll('\n', '<br>')}</p>`,
        });
      } catch (error) {
        console.error(
          '[contact] enquiry saved but notification email failed:',
          error && error.message,
        );
      }
    }
    return res.status(201).json({ ok: true, receivedAt: createdAt });
  } catch (error) {
    console.error('[contact] save failed:', error && error.name, (error && error.code) || '');
    return res
      .status(503)
      .json({ error: 'Your message could not be saved. Please try again later.' });
  }
}

function escapeHtml(value) {
  return String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character],
  );
}
