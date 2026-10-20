import { sendEmail } from './email.js';

const escapeHtml = (value) =>
  String(value ?? '').replace(
    /[&<>"']/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character],
  );

const formatMoney = (amount, locale) =>
  new Intl.NumberFormat(locale === 'en' ? 'en' : 'fr-CI', {
    style: 'currency',
    currency: 'XOF',
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));

export async function notifyOrder(order, event, send = sendEmail) {
  if (!order?.customer?.email) return false;
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) return false;
  const locale = order.customerLocale === 'en' ? 'en' : 'fr';
  const statusNames = {
    confirmed: locale === 'en' ? 'confirmed' : 'confirmée',
    processing: locale === 'en' ? 'being prepared' : 'en préparation',
    shipped: locale === 'en' ? 'shipped' : 'expédiée',
    delivered: locale === 'en' ? 'delivered' : 'livrée',
    cancelled: locale === 'en' ? 'cancelled' : 'annulée',
  };
  const title =
    event === 'payment_verified'
      ? locale === 'en'
        ? 'Payment confirmed'
        : 'Paiement confirmé'
      : event === 'payment_rejected'
        ? locale === 'en'
          ? 'Payment needs attention'
          : 'Action requise sur le paiement'
        : event === 'status'
          ? locale === 'en'
            ? 'Order status updated'
            : 'Mise à jour de commande'
          : locale === 'en'
            ? 'We received your GlowAfrique order'
            : 'Nous avons reçu votre commande GlowAfrique';
  const orderStatus = statusNames[order.status] || order.status;
  const statusLine =
    event === 'payment_verified'
      ? locale === 'en'
        ? 'Your payment has been verified. The store team will continue processing your order.'
        : 'Votre paiement a été vérifié. L’équipe de la boutique va poursuivre la préparation de votre commande.'
      : event === 'payment_rejected'
        ? `${locale === 'en' ? 'Your payment proof could not be approved. Please contact the store team.' : 'Votre justificatif de paiement n’a pas pu être validé. Contactez l’équipe de la boutique.'}${order.paymentRejectionReason ? ` ${locale === 'en' ? 'Reason' : 'Motif'}: ${order.paymentRejectionReason}` : ''}`
        : event === 'status'
          ? `${locale === 'en' ? 'Your order is now' : 'Votre commande est maintenant'} ${orderStatus}.`
          : order.paymentMethod === 'wave' && order.paymentStatus === 'awaiting_verification'
            ? locale === 'en'
              ? 'Your Wave payment is waiting for review. We will contact you after verification.'
              : 'Votre paiement Wave est en attente de vérification. Nous vous contacterons après son examen.'
            : order.stockConfirmationPending && order.shippingQuotePending
              ? locale === 'en'
                ? 'We received your order request. Our team will confirm product availability, the delivery fee, and the final total before dispatch.'
                : 'Nous avons reçu votre demande. Notre équipe confirmera la disponibilité des produits, les frais de livraison et le total avant l’expédition.'
              : order.stockConfirmationPending
              ? locale === 'en'
                ? 'We received your order request. Our team will confirm product availability before dispatch.'
                : 'Nous avons reçu votre demande. Notre équipe confirmera la disponibilité des produits avant l’expédition.'
              : order.shippingQuotePending
              ? locale === 'en'
                ? 'We received your order request. Our team will confirm the delivery fee and final total before dispatch.'
                : 'Nous avons reçu votre demande de commande. Notre équipe confirmera les frais de livraison et le total avant l’expédition.'
              : locale === 'en'
                ? 'We received your order request. Our team will confirm the delivery details.'
                : 'Nous avons reçu votre demande de commande. Notre équipe confirmera les détails de livraison.';
  const items = (order.items || [])
    .map((item) => `<li>${escapeHtml(item.productName)} × ${Number(item.quantity) || 0}</li>`)
    .join('');
  const total =
    order.totalXof == null
      ? locale === 'en' ? 'To be confirmed' : 'À confirmer'
      : formatMoney(order.totalXof, locale);
  const greeting = order.customer.firstName
    ? `${locale === 'en' ? 'Hello' : 'Bonjour'} ${escapeHtml(order.customer.firstName)},`
    : locale === 'en'
      ? 'Hello,'
      : 'Bonjour,';
  await send({
    to: order.customer.email,
    subject: `${title} · ${order.orderNumber}`,
    text: `${greeting}\n\n${statusLine}\nOrder: ${order.orderNumber}\nTotal: ${total}\n${(order.items || []).map((item) => `- ${item.productName} x ${item.quantity}`).join('\n')}`,
    html: `<p>${greeting}</p><p>${escapeHtml(statusLine)}</p><p><strong>${locale === 'en' ? 'Order' : 'Commande'}:</strong> ${escapeHtml(order.orderNumber)}</p><ul>${items}</ul><p><strong>${locale === 'en' ? 'Total' : 'Total'}:</strong> ${escapeHtml(total)}</p>`,
  });
  return true;
}
