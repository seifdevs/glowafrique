#!/usr/bin/env node
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.join(root, 'products-edit.csv');
const prices = {
  'beauty-of-joseon-mate-sun-stick': 13000,
  'biodance-rejuvenating-caviar-pdrn-mask': 18000,
  'celimax-the-vita-a-retinal-shot-tightening-booster': 14000,
  'cosrx-pimple-patch': 3500,
  'cosrx-acne-pimple-master-patch': 3500,
  'dr-althea-345-relief-cream': 17500,
  'dr-althea-147-barrier-cream': 18000,
  'kundal-caffeine-scalp-serum': 15000,
  'kundal-linen-flower-deodorant': 11000,
  'medicube-glow-vanilla-hair-body-mist': 15000,
  'medicube-deodorant-vanilla-pistachio': 15000,
  'medicube-kojic-acid-capsule-cream': 16000,
  'medicube-kojic-acid-turmeric-peel-shot-80ml': 15000,
  'medicube-glow-sunscreen': 13000,
  'medicube-pdrn-pink-capsule-cream': 16000,
  'medicube-lip-sleeping-mask': 12000,
  'medicube-pdrn-collagen-jelly-eye-mask': 17500,
  'medicube-txa-serum': 15500,
  'medicube-pdrn-gel-mask': 6000,
  'dr-melaxin-peel-shot-exfoliating-black-rice-ampoule': 18000,
  'dr-althea-35-relief-mist': 15500,
};
const unavailable = new Set([
  'axis-y-sunday-morning-cleansing-foam',
  'axix-y-unsay-morning-cleanser-foam',
  'kundal-travel-kit-baby-powder',
  'medicube-kojic-acid-peel-shot-80ml',
  'dr-althea-35-relief-mist-webp',
  'dr-althea-35-relief-mistt',
]);
function parseCsv(input) {
  const rows = [];
  let row = [], cell = '', quoted = false;
  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    if (quoted) {
      if (c === '"' && input[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
    else if (c !== '\r') cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const headers = rows.shift();
  return { headers, rows: rows.filter((r) => r.some(Boolean)).map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i] || '']))) };
}
const csvCell = (value) => {
  const text = String(value ?? '');
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};
const parsed = parseCsv(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
const changed = new Set();
for (const row of parsed.rows) {
  if (prices[row.id] != null) {
    row.price = String(prices[row.id]);
    row.priceCurrency = 'XOF';
    row.pricingType = 'retail';
    changed.add(row.id);
  } else if (unavailable.has(row.id)) {
    row.price = '';
    row.priceCurrency = '';
    row.pricingType = '';
    changed.add(row.id);
  }
}
for (const id of Object.keys(prices)) if (!changed.has(id)) throw new Error(`Product ID not found in catalog source: ${id}`);
const output = [parsed.headers.join(','), ...parsed.rows.map((row) => parsed.headers.map((header) => csvCell(row[header])).join(','))].join('\r\n') + '\r\n';
fs.writeFileSync(file, output);
console.log(`Updated ${Object.keys(prices).length} catalog IDs; cleared unverified beta prices for ${unavailable.size} records.`);
