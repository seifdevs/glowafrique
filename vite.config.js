import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { cpSync, existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const apiRoutes = {
  '/kackenlacken': '/api-handlers/admin/emergency.js',
  '/en/kackenlacken': '/api-handlers/admin/emergency.js',
  '/api/orders': '/api-handlers/orders.js',
  '/api/order-quote': '/api-handlers/order-quote.js',
  '/api/locations': '/api-handlers/locations.js',
  '/api/payment-proof': '/api-handlers/payment-proof.js',
  '/api/reviews': '/api-handlers/reviews.js',
  '/api/admin/orders': '/api-handlers/admin/orders.js',
  '/api/admin/inventory': '/api-handlers/admin/inventory.js',
  '/api/admin/emergency': '/api-handlers/admin/emergency.js',
  '/api/maintenance': '/api-handlers/maintenance.js',
  '/api/contact': '/api-handlers/contact.js',
  '/api/newsletter': '/api-handlers/newsletter.js',
  '/api/auth/register': '/api-handlers/auth/register.js',
  '/api/auth/login': '/api-handlers/auth/login.js',
  '/api/auth/logout': '/api-handlers/auth/logout.js',
  '/api/auth/me': '/api-handlers/auth/me.js',
  '/api/auth/profile': '/api-handlers/auth/profile.js',
  '/api/auth/password-reset': '/api-handlers/auth/password-reset.js',
  '/api/payments/paystack/callback': '/api-handlers/payments/paystack-callback.js',
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  for (const key of [
    'MONGODB_URI',
    'MONGODB_DB',
    'RESEND_API_KEY',
    'RESEND_FROM_EMAIL',
    'SUPPORT_EMAIL',
    'PUBLIC_SITE_URL',
    'PAYSTACK_SECRET_KEY',
    'VITE_PAYSTACK_ENABLED',
    'ADMIN_USERNAME',
    'ADMIN_PASSWORD',
    'ADMIN_EMAIL',
    'SHIPPING_FEE_XOF',
  ]) {
    if (process.env[key] === undefined && env[key] !== undefined) process.env[key] = env[key];
  }

  return {
    plugins: [
      react(),
      {
        name: 'local-api-functions',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            const requestUrl = new URL(req.url || '/', 'http://localhost');
            const pathname = requestUrl.pathname;

            // Local-only showcase fixture. It is opt-in, requires the control
            // login cookie, and never replaces a configured database.
            if (
              process.env.CONTROL_DEMO_MODE === 'true' &&
              !process.env.MONGODB_URI &&
              pathname === '/api/admin/orders' &&
              req.method === 'GET'
            ) {
              const { hasControlSession } = await import('./lib/auth.js');
              if (!hasControlSession(req)) {
                res.statusCode = 401;
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                return res.end(JSON.stringify({ error: 'Please sign in to access the control panel.' }));
              }
              const order = {
                orderNumber: 'DEMO-20261021-001',
                status: 'pending',
                paymentMethod: 'cash_on_delivery',
                paymentStatus: 'pending',
                shippingQuotePending: false,
                stockConfirmationPending: false,
                subtotalXof: 27000,
                discountXof: 2700,
                shippingXof: 0,
                totalXof: 24300,
                createdAt: new Date().toISOString(),
                customer: {
                  fullName: 'Amina Demo Customer',
                  email: 'amina.demo@example.com',
                  phone: '+225 07 00 00 00 00',
                  addressLine1: 'Rue des Jardins',
                  city: 'Abidjan',
                  division: 'Cocody',
                },
                items: [{ name: 'GlowAfrique Skincare Set', quantity: 1, unitPriceXof: 27000 }],
              };
              const waveOrder = {
                orderNumber: 'DEMO-20261021-002',
                status: 'pending',
                paymentMethod: 'wave',
                paymentStatus: 'awaiting_verification',
                paymentProofId: 'demo-wave-proof-001',
                waveSenderPhone: '+225 07 11 22 33 44',
                shippingQuotePending: false,
                stockConfirmationPending: false,
                subtotalXof: 36000,
                discountXof: 3600,
                shippingXof: 0,
                totalXof: 32400,
                createdAt: new Date(Date.now() - 60_000).toISOString(),
                customer: {
                  fullName: 'Mariam Demo Customer',
                  email: 'mariam.demo@example.com',
                  phone: '+225 07 11 22 33 44',
                  addressLine1: 'Boulevard Latrille',
                  city: 'Abidjan',
                  division: 'Cocody',
                },
                items: [{ name: 'GlowAfrique Radiance Set', quantity: 1, unitPriceXof: 36000 }],
              };
              const status = requestUrl.searchParams.get('status') || 'pending';
              const orders = status === 'pending'
                ? [order, waveOrder]
                : status === 'payment_verification'
                  ? [waveOrder]
                  : status === 'all'
                    ? [order, waveOrder]
                    : [];
              res.statusCode = 200;
              res.setHeader('Cache-Control', 'no-store');
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              return res.end(JSON.stringify({ orders, total: orders.length, page: 1, limit: 50 }));
            }
            if (
              process.env.CONTROL_DEMO_MODE === 'true' &&
              !process.env.MONGODB_URI &&
              pathname === '/api/payment-proof' &&
              requestUrl.searchParams.get('id') === 'demo-wave-proof-001'
            ) {
              const { hasControlSession } = await import('./lib/auth.js');
              if (!hasControlSession(req)) {
                res.statusCode = 401;
                return res.end('Please sign in to access the control panel.');
              }
              res.statusCode = 200;
              res.setHeader('Cache-Control', 'no-store');
              res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
              return res.end(readFileSync(resolve('public/images/demo-wave-proof.svg')));
            }
            const modulePath = apiRoutes[pathname];
            if (!modulePath) return next();

            res.status = function (code) {
              this.statusCode = code;
              return this;
            };
            res.json = function (payload) {
              if (!this.headersSent)
                this.setHeader('Content-Type', 'application/json; charset=utf-8');
              this.end(JSON.stringify(payload));
            };

            try {
              const chunks = [];
              let size = 0;
              for await (const chunk of req) {
                size += chunk.length;
                if (size > 3 * 1024 * 1024) {
                  return res.status(413).json({ error: 'Request body is too large.' });
                }
                chunks.push(chunk);
              }
              if (size) {
                const rawBody = Buffer.concat(chunks).toString('utf8');
                if (String(req.headers['content-type'] || '').includes('application/x-www-form-urlencoded')) {
                  req.body = Object.fromEntries(new URLSearchParams(rawBody));
                } else {
                  try {
                    req.body = JSON.parse(rawBody);
                  } catch (_) {
                    return res.status(400).json({ error: 'Invalid JSON request body.' });
                  }
                }
              } else req.body = {};

              if (pathname === '/kackenlacken' || pathname === '/en/kackenlacken')
                req.url = '/api/router?route=admin/emergency';
              const route = await server.ssrLoadModule('/api/router.js');
              await route.default(req, res);
            } catch (error) {
              server.config.logger.error(
                `[local-api] ${pathname} failed: ${(error && error.name) || 'Error'}`,
              );
              if (!res.writableEnded) res.status(500).json({ error: 'Local API request failed.' });
            }
          });
        },
      },
      {
        name: 'copy-static-product-assets',
        closeBundle() {
          const source = resolve('assets');
          if (existsSync(source)) cpSync(source, resolve('dist', 'assets'), { recursive: true });
        },
      },
    ],
    build: {
      rollupOptions: {
        input: resolve('index.html'),
      },
    },
  };
});
