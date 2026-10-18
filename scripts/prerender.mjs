import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router';
import { createServer } from 'vite';
import { PRODUCTS } from '../data/catalog.js';

const outputDir = path.resolve('dist');
const htmlTemplate = await readFile(path.join(outputDir, 'index.html'), 'utf8');
const slug = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const paths = new Set([
  '/', '/products', '/collections/best-sellers', '/collections/brands', '/collections/concerns',
  '/about', '/contact', '/account', '/admin', '/control',
  ...['returns', 'shipping', 'privacy', 'terms', 'cookies', 'how-to-use', 'how-to-order'].map((type) => `/policies/${type}`),
  ...new Set(PRODUCTS.map((product) => `/product/${encodeURIComponent(product.id)}`)),
  ...new Set(PRODUCTS.map((product) => `/collections/brand/${slug(product.brand)}`).filter((route) => !route.endsWith('/'))),
  ...new Set(PRODUCTS.flatMap((product) => [...(product.concerns || []), ...(product.category ? [product.category] : [])]).filter(Boolean).map((concern) => `/collections/concern/${slug(concern)}`)),
]);
for (const route of [...paths]) paths.add(`/en${route === '/' ? '' : route}`);

const deploymentHost = process.env.PUBLIC_SITE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL || 'http://localhost:5173';
const siteOrigin = new URL(deploymentHost.startsWith('http') ? deploymentHost : `https://${deploymentHost}`).origin;
const cleanPath = (route) => route.startsWith('/en/') ? route.slice(3) : route === '/en' ? '/' : route;
const englishPath = (route) => `/en${route === '/' ? '' : route}`;
const brandFor = (route) => {
  const match = route.match(/^\/collections\/brand\/([^/]+)/);
  return match && PRODUCTS.find((product) => slug(product.brand) === match[1])?.brand;
};
const productFor = (route) => {
  const match = route.match(/^\/product\/([^/]+)/);
  if (!match) return null;
  const id = decodeURIComponent(match[1]);
  return PRODUCTS.find((product) => product.id === id) || null;
};
function metadata(route) {
  const locale = route === '/en' || route.startsWith('/en/') ? 'en' : 'fr';
  const pathName = cleanPath(route);
  const product = productFor(pathName);
  const brand = brandFor(pathName);
  let title = 'GlowAfrique — Beauté et soin';
  let description = locale === 'en' ? 'Explore GlowAfrique’s beauty and care collection in Côte d’Ivoire.' : 'Découvrez la sélection beauté et soin GlowAfrique en Côte d’Ivoire.';
  if (product) { title = `${product.name} — GlowAfrique`; description = product.description || `${product.brand} ${product.name}. ${locale === 'en' ? 'View product information and current availability at GlowAfrique.' : 'Consultez les informations et la disponibilité de ce produit chez GlowAfrique.'}`; }
  else if (brand) { title = `${brand} — GlowAfrique`; description = locale === 'en' ? `Explore GlowAfrique’s ${brand} collection.` : `Découvrez la sélection ${brand} chez GlowAfrique.`; }
  else if (pathName === '/products') { title = `${locale === 'en' ? 'Shop All Products' : 'Tous les produits'} — GlowAfrique`; }
  else if (pathName === '/about') { title = `${locale === 'en' ? 'About GlowAfrique' : 'À propos de GlowAfrique'} — GlowAfrique`; }
  else if (pathName === '/contact') { title = `${locale === 'en' ? 'Contact GlowAfrique' : 'Contacter GlowAfrique'} — GlowAfrique`; }
  else if (pathName.startsWith('/policies/')) { title = `${pathName.split('/').pop().replaceAll('-', ' ')} — GlowAfrique`; description = locale === 'en' ? 'Read GlowAfrique’s store information and customer policies.' : 'Consultez les informations de la boutique et les politiques clients de GlowAfrique.'; }
  else if (pathName.startsWith('/collections/')) { title = `${locale === 'en' ? 'Shop The Collection' : 'Découvrir la sélection'} — GlowAfrique`; }
  return { locale, pathName, title, description };
}
function escapeAttribute(value) { return String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;'); }
function injectHead(html, route) {
  const data = metadata(route);
  const canonical = `${siteOrigin}${route}`;
  const alternate = cleanPath(route);
  const head = [
    `<title>${escapeAttribute(data.title)}</title>`,
    `<meta name="description" content="${escapeAttribute(data.description)}">`,
    `<meta property="og:title" content="${escapeAttribute(data.title)}">`,
    `<meta property="og:description" content="${escapeAttribute(data.description)}">`,
    `<meta property="og:url" content="${escapeAttribute(canonical)}">`,
    `<meta property="og:image" content="${escapeAttribute(siteOrigin)}/images/billboard.jpg">`,
    `<link rel="canonical" href="${escapeAttribute(canonical)}">`,
    `<link rel="alternate" hreflang="fr-CI" href="${escapeAttribute(siteOrigin + alternate)}">`,
    `<link rel="alternate" hreflang="en" href="${escapeAttribute(siteOrigin + englishPath(alternate))}">`,
    `<link rel="alternate" hreflang="x-default" href="${escapeAttribute(siteOrigin + alternate)}">`,
    data.pathName === '/account' || data.pathName === '/admin' ? '<meta name="robots" content="noindex,nofollow">' : '',
  ].filter(Boolean).join('\n');
  return html
    .replace('<html lang="fr">', `<html lang="${data.locale}">`)
    .replace(/<title>[\s\S]*?<\/title>/, '')
    .replace(/<meta name="description"[^>]*>/, '')
    .replace(/<meta property="og:(?:title|description|url|image)"[^>]*>/g, '')
    .replace('</head>', `${head}\n</head>`);
}
function outputPath(route) {
  const relativePath = route.replace(/^\//, '');
  return path.join(outputDir, relativePath, 'index.html');
}

const vite = await createServer({ configFile: path.resolve('vite.config.js'), server: { middlewareMode: true }, appType: 'custom' });
try {
  const { default: App } = await vite.ssrLoadModule('/src/App.jsx');
  const renderedPaths = [...paths].sort((a, b) => a.length - b.length || a.localeCompare(b));
  for (const route of renderedPaths) {
    const renderedApp = renderToString(React.createElement(StaticRouter, { location: route }, React.createElement(App)));
    const jsonLd = {
      '@context': 'https://schema.org', '@type': 'Organization', name: 'GlowAfrique', url: siteOrigin,
      logo: `${siteOrigin}/logo.jpeg`, sameAs: [],
    };
    const website = { '@context': 'https://schema.org', '@type': 'WebSite', name: 'GlowAfrique', url: siteOrigin, inLanguage: metadata(route).locale };
    const breadcrumbs = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'GlowAfrique', item: `${siteOrigin}${route}` }] };
    const structuredData = [jsonLd, website, breadcrumbs].map((item) => `<script type="application/ld+json">${JSON.stringify(item).replaceAll('<', '\\u003c')}</script>`).join('');
    const html = injectHead(htmlTemplate.replace('<div id="root"></div>', `<div id="root">${renderedApp}</div>${structuredData}`), route);
    const file = outputPath(route);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, html);
  }

  const sitemapRows = renderedPaths.filter((route) => !route.startsWith('/en/') && route !== '/en' && !['/account', '/admin'].includes(route)).map((route) => {
    const frenchUrl = `${siteOrigin}${route}`;
    const englishUrl = `${siteOrigin}${englishPath(route)}`;
    return `<url><loc>${escapeAttribute(frenchUrl)}</loc><xhtml:link rel="alternate" hreflang="fr-CI" href="${escapeAttribute(frenchUrl)}"/><xhtml:link rel="alternate" hreflang="en" href="${escapeAttribute(englishUrl)}"/><xhtml:link rel="alternate" hreflang="x-default" href="${escapeAttribute(frenchUrl)}"/></url><url><loc>${escapeAttribute(englishUrl)}</loc><xhtml:link rel="alternate" hreflang="fr-CI" href="${escapeAttribute(frenchUrl)}"/><xhtml:link rel="alternate" hreflang="en" href="${escapeAttribute(englishUrl)}"/><xhtml:link rel="alternate" hreflang="x-default" href="${escapeAttribute(frenchUrl)}"/></url>`;
  }).join('');
  await writeFile(path.join(outputDir, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${sitemapRows}</urlset>`);
  await writeFile(path.join(outputDir, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /account\nDisallow: /admin\nSitemap: ${siteOrigin}/sitemap.xml\n`);
  console.log(`Pre-rendered ${renderedPaths.length} localized routes to real HTML.`);
} finally {
  await vite.close();
}
