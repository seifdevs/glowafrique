#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceDir = path.join(root, 'Glow Afrique products');
const outputDir = path.join(root, 'public', 'images', 'catalog');
const mappingFile = path.join(root, 'data', 'product-covers.json');
const coverSources = {
  'axis-y-sunday-morning-cleansing-foam': 'COVER - AXIS Y Sunday morning cleansing foam.WEBP',
  'beauty-of-joseon-mate-sun-stick': 'COVER-Beauty of joseon mate sun stick .WEBP',
  'biodance-bio-collagen-real-deep-mask': 'COVER-BIODANCE bio collagen real deep mask.WEBP',
  'biodance-rejuvenating-caviar-pdrn-mask': 'COVER-BIODANCE rejuvenating caviar PDRN mask.WEBP',
  'celimax-the-vita-a-retinal-shot-tightening-booster': 'COVER-Celimax retinal shot.WEBP',
  'cosrx-acne-pimple-master-patch': 'COVER-COSRX Acne Pimple Master Patch.JPG',
  'dr-melaxin-peel-shot-exfoliating-black-rice-ampoule': 'COVER DR MELAXIN black rice peel shot.WEBP',
  'dr-althea-147-barrier-cream': 'COVER Dr Althea 147 barrier cream.WEBP',
  'kundal-caffeine-scalp-serum': 'COVER KUNDAL caffeine scalp serum.WEBP',
  'kundal-linen-flower-deodorant': 'COVER Kundal linen flower deodorant .WEBP',
  'kundal-travel-kit-baby-powder': 'COVER KUNDAL Travel KIT-baby powder.JPG',
  'medicube-glow-vanilla-hair-body-mist': 'COVER Medicube glow vanilla hair body mist.WEBP',
  'medicube-deodorant-vanilla-pistachio': 'COVER Medicube deodorant vanilla pistachio.WEBP',
  'medicube-kojic-acid-capsule-cream': 'COVER Medicube kojic acid CAPSULE CREAM.WEBP',
  'medicube-kojic-acid-turmeric-peel-shot-80ml': 'COVER Medicube kojic acid peel shot 80ML.WEBP',
  'medicube-glow-sunscreen': 'COVER Medicube glow sunscreen.WEBP',
  'medicube-lip-sleeping-mask': 'COVER Medicube lip sleeping mask.WEBP',
  'medicube-pdrn-collagen-jelly-eye-mask': 'COVER Medicube PDRN collagen jelly eye mask.WEBP',
  'medicube-pdrn-gel-mask': 'COVER Medicube PDRN gel mask.WEBP',
};

if (!fs.existsSync(sourceDir)) throw new Error(`Supplied image folder not found: ${sourceDir}`);
fs.mkdirSync(outputDir, { recursive: true });
const covers = {};
for (const [id, name] of Object.entries(coverSources)) {
  const source = path.join(sourceDir, name);
  if (!fs.existsSync(source)) throw new Error(`Cover image not found for ${id}: ${name}`);
  const outputName = `${id}-cover${path.extname(name).toLowerCase()}`;
  fs.copyFileSync(source, path.join(outputDir, outputName));
  covers[id] = `images/catalog/${outputName}`;
}
fs.writeFileSync(mappingFile, `${JSON.stringify(covers, null, 2)}\n`);
console.log(`Imported ${Object.keys(covers).length} product covers.`);
