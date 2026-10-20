#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceDir = path.join(root, 'Glow Afrique products');
const outputDir = path.join(root, 'public', 'images', 'catalog');
const mappingFile = path.join(root, 'data', 'product-image-overrides.json');
const products = {
  'axis-y-sunday-morning-cleansing-foam': ['axis y sunday morning cleanser foam'],
  'beauty-of-joseon-mate-sun-stick': ['beauty of joseon mate sun stick'],
  'biodance-bio-collagen-real-deep-mask': ['biodance bio collagen real deep mask'],
  'biodance-rejuvenating-caviar-pdrn-mask': ['biodance rejuvenating caviar pdrn mask'],
  'celimax-the-vita-a-retinal-shot-tightening-booster': ['celimax the vita a retinal shot tightening booster'],
  'cosrx-acne-pimple-master-patch': ['cosrx acne pimple master patch'],
  'dr-melaxin-peel-shot-exfoliating-black-rice-ampoule': ['dr melaxin peel shot exfoliating black rice ampoule'],
  'dr-althea-345-relief-cream': ['dr althea 345 relief cream'],
  'dr-althea-147-barrier-cream': ['dr althea 147 barrier cream'],
  'kundal-caffeine-scalp-serum': ['kundal caffeine scalp serum'],
  'kundal-linen-flower-deodorant': ['kundal linen flower deodorant'],
  'kundal-travel-kit-baby-powder': ['kundal travel kit baby powder'],
  'medicube-glow-vanilla-hair-body-mist': ['medicube glow vanilla hair body mist'],
  'medicube-deodorant-vanilla-pistachio': ['medicube deodorant vanilla pistachio'],
  'medicube-kojic-acid-capsule-cream': ['medicube kojic acid capsule cream'],
  'medicube-kojic-acid-turmeric-peel-shot-80ml': ['medicube kojic acid turmeric peel shot 80ml', 'medicube kojic acid peel shot 80ml'],
  'medicube-glow-sunscreen': ['medicube glow sunscreen'],
  'medicube-pdrn-pink-capsule-cream': ['medicube pdrn pink capsule cream'],
  'medicube-lip-sleeping-mask': ['medicube lip sleeping mask'],
  'medicube-pdrn-collagen-jelly-eye-mask': ['medicube pdrn collagen jelly eye mask'],
  'medicube-txa-serum': ['medicube txa serum'],
  'medicube-pdrn-gel-mask': ['medicube pdrn gel mask'],
  'dr-althea-35-relief-mist': ['dr althea 35 relief mist'],
};
const normalize = (value) =>
  value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');

if (!fs.existsSync(sourceDir)) throw new Error(`Supplied image folder not found: ${sourceDir}`);
fs.mkdirSync(outputDir, { recursive: true });
const files = fs.readdirSync(sourceDir, { withFileTypes: true })
  .filter((item) => item.isFile()).map((item) => item.name);
const overrides = {};
for (const [id, aliases] of Object.entries(products)) {
  const matched = files.map((name) => {
    const normalized = normalize(path.parse(name).name);
    const isCover = /^cover\s*/.test(normalized);
    const stem = normalized.replace(/^cover\s*/, '').trim();
    const match = aliases.some((alias) => stem === normalize(alias) || stem.startsWith(`${normalize(alias)} `));
    return { name, isCover, match };
  }).filter((item) => item.match)
    .sort((a, b) => Number(b.isCover) - Number(a.isCover) || a.name.localeCompare(b.name));
  if (!matched.length) continue;
  overrides[id] = matched.map(({ name }, index) => {
    const outputName = `${id}-${index}${path.extname(name).toLowerCase()}`;
    fs.copyFileSync(path.join(sourceDir, name), path.join(outputDir, outputName));
    return `images/catalog/${outputName}`;
  });
}
fs.writeFileSync(mappingFile, `${JSON.stringify(overrides, null, 2)}\n`);
console.log(`Imported ${Object.values(overrides).reduce((n, images) => n + images.length, 0)} images for ${Object.keys(overrides).length} products.`);
