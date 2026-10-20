import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { cpSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const apiRoutes = {
  '/api/orders': '/api-handlers/orders.js',
  '/api/order-quote': '/api-handlers/order-quote.js',
  '/api/locations': '/api-handlers/locations.js',
  '/api/payment-proof': '/api-handlers/payment-proof.js',
  '/api/reviews': '/api-handlers/reviews.js',
  '/api/admin/orders': '/api-handlers/admin/orders.js',
  '/api/admin/inventory': '/api-handlers/admin/inventory.js',
  '/api/admin/maintenance': '/api-handlers/admin/maintenance.js',
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
                try {
                  req.body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
                } catch (_) {
                  return res.status(400).json({ error: 'Invalid JSON request body.' });
                }
              } else req.body = {};

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
