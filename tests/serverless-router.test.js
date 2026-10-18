import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { routeHandlers, routeKeyFromUrl } from '../api/router.js';
const vercelConfig = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));

test('Vercel exposes one API function for the existing endpoints', () => {
  const functionFiles = readdirSync(new URL('../api/', import.meta.url), { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.js'))
    .map((entry) => entry.name);
  assert.deepEqual(functionFiles, ['router.js']);
  assert.equal(Object.keys(routeHandlers).length, 12);
});

test('rewrites preserve all API paths and dispatch nested routes and query strings', () => {
  for (const key of Object.keys(routeHandlers)) {
    const source = `/api/${key}`;
    assert.ok(vercelConfig.rewrites.some((rewrite) => rewrite.source === source && rewrite.destination === `/api/router?route=${key}`), `${source} should route to its handler`);
  }
  const routes = {
    '/api/router?route=chat': 'chat',
    '/api/router?route=locations': 'locations',
    '/api/router?route=order-quote': 'order-quote',
    '/api/router?route=orders': 'orders',
    '/api/router?route=payment-proof&id=123': 'payment-proof',
    '/api/router?route=reviews&productId=abc': 'reviews',
    '/api/router?route=admin%2Forders&status=pending': 'admin/orders',
    '/api/router?route=auth%2Flogin': 'auth/login',
    '/api/router?route=auth%2Flogout': 'auth/logout',
    '/api/router?route=auth%2Fme': 'auth/me',
    '/api/router?route=auth%2Fprofile': 'auth/profile',
    '/api/router?route=auth%2Fregister': 'auth/register',
  };
  for (const [url, expected] of Object.entries(routes)) assert.equal(routeKeyFromUrl(url), expected, url);
  assert.equal(routeKeyFromUrl('/api/missing'), null);
});
