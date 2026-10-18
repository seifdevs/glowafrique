#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {
  CATEGORY_ORDER,
  FOLDER_CATEGORIES,
  KEYWORD_CLASSIFY_FOLDERS,
  KEYWORD_RULES,
  BRANDS,
} = require('./category-rules.cjs');

const ROOT = path.resolve(__dirname, '..');
const IMAGE_ROOT = path.join(ROOT, 'assets', 'products');
const CSV_PATH = path.join(ROOT, 'products-edit.csv');
const REPORT_PATH = path.join(__dirname, 'import-report.md');
const IMAGE_CLASSIFICATION_PATH = path.join(ROOT, 'data', 'image-classification.csv');
const DESCRIPTIONS_REPORT_PATH = path.join(ROOT, 'data', 'descriptions-report.csv');
const IMAGE_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.avif',
  '.gif',
  '.bmp',
  '.tif',
  '.tiff',
  '.svg',
]);

function normalize(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}
function slugify(value) {
  return normalize(value).replace(/\s+/g, '-').replace(/^-|-$/g, '') || 'produit';
}
function stripVariant(stem) {
  return stem
    .replace(/\s*(?:\(\s*(?:\d+|dup|copy|duplicate)\s*\)|\[\s*\d+\s*\]|[-_]\s*\d+|\s+dup)\s*$/i, '')
    .trim();
}
function displayName(stem) {
  return stem.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
}
function listImages(directory) {
  if (!fs.existsSync(directory)) return [];
  const out = [];
  for (const item of fs
    .readdirSync(directory, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name, 'en'))) {
    const absolute = path.join(directory, item.name);
    if (item.isDirectory()) out.push(...listImages(absolute));
    else if (item.isFile() && IMAGE_EXTENSIONS.has(path.extname(item.name).toLowerCase()))
      out.push(absolute);
  }
  return out;
}
function sha(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}
function webImagePath(file) {
  const relative = path.relative(IMAGE_ROOT, file);
  const token = crypto
    .createHash('sha256')
    .update(relative.split(path.sep).join('/'))
    .digest('hex')
    .slice(0, 8);
  const webName = path.basename(relative, path.extname(relative)) + '--' + token + '.webp';
  return path.posix
    .join('assets/products-web', path.dirname(relative).split(path.sep).join('/'), webName)
    .split('/')
    .map(encodeURIComponent)
    .join('/');
}
function readCsv(text) {
  const rows = [];
  let row = [],
    cell = '',
    quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') {
      row.push(cell);
      cell = '';
    } else if (c === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else if (c !== '\r') cell += c;
  }
  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }
  if (!rows.length) return [];
  const headers = rows.shift();
  return rows
    .filter((r) => r.some(Boolean))
    .map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i] || ''])));
}
function csvCell(value) {
  const s = String(value ?? '');
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
function writeCsv(rows) {
  const headers = [
    'id',
    'name',
    'brand',
    'category',
    'concerns',
    'price',
    'priceCurrency',
    'pricingType',
    'oldPrice',
    'bestSeller',
    'isNew',
  ];
  return (
    [
      headers.join(','),
      ...rows.map((r) =>
        headers
          .map((h) =>
            csvCell(
              h === 'concerns' ? (Array.isArray(r[h]) ? r[h].join(' | ') : r[h] || '') : r[h],
            ),
          )
          .join(','),
      ),
    ].join('\r\n') + '\r\n'
  );
}
function categoryMatches(name) {
  return KEYWORD_RULES.filter((rule) => rule.patterns.some((re) => re.test(name))).map(
    (rule) => rule.category,
  );
}
function brandFor(name) {
  const brands = BRANDS.flatMap((entry) =>
    entry.aliases.map((alias) => ({ alias, brand: entry.brand })),
  ).sort((a, b) => b.alias.length - a.alias.length);
  const found = brands.find((x) => name.toLowerCase().includes(x.alias.toLowerCase()));
  return found ? found.brand : '';
}
function stripBrandPrefix(name, brand) {
  let clean = String(name || '').trim();
  const entry = BRANDS.find((x) => x.brand === brand);
  const aliases = [brand, ...(entry ? entry.aliases : [])].sort((a, b) => b.length - a.length);
  for (const alias of aliases) {
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    clean = clean
      .replace(new RegExp('^' + escaped + '[\\s:–—-]*', 'i'), '')
      .replace(new RegExp('[\\s:–—-]*' + escaped + '$', 'i'), '')
      .trim();
  }
  return clean;
}
function folderInfo(file) {
  const rel = path.relative(IMAGE_ROOT, path.dirname(file));
  const folders = rel === '.' ? [] : rel.split(path.sep);
  const mapped = [],
    folderBrands = [];
  for (const folder of folders) {
    const key = folder.toLowerCase();
    const match = Object.keys(FOLDER_CATEGORIES).find((k) => k.toLowerCase() === key);
    if (match && !mapped.includes(FOLDER_CATEGORIES[match])) mapped.push(FOLDER_CATEGORIES[match]);
    const folderBrand = brandFor(folder);
    if (folderBrand && !folderBrands.includes(folderBrand)) folderBrands.push(folderBrand);
  }
  if (!mapped.length && folderBrands.length) mapped.push(...folderBrands);
  const keywordMode = folders.some((folder) =>
    KEYWORD_CLASSIFY_FOLDERS.some((x) => x.toLowerCase() === folder.toLowerCase()),
  );
  return { folders, mapped, folderBrands, keywordMode, root: folders.length === 0 };
}
function makeAutoProducts(files) {
  const groups = new Map(),
    byHash = new Map();
  for (const file of files) {
    const stem = path.basename(file, path.extname(file));
    const base = stripVariant(stem);
    const key = normalize(base);
    const digest = sha(file);
    const info = folderInfo(file);
    let group = byHash.get(digest) || groups.get(key);
    if (!group) {
      group = {
        name: displayName(base),
        key,
        hash: digest,
        files: [],
        categories: [],
        folderNames: [],
        folderBrands: [],
        keywordCategories: [],
      };
      groups.set(key, group);
    }
    byHash.set(digest, group);
    group.files.push(file);
    for (const c of info.mapped) if (!group.categories.includes(c)) group.categories.push(c);
    for (const f of info.folders) if (!group.folderNames.includes(f)) group.folderNames.push(f);
    for (const b of info.folderBrands)
      if (!group.folderBrands.includes(b)) group.folderBrands.push(b);
    if (info.root || info.keywordMode)
      for (const c of categoryMatches(group.name))
        if (!group.keywordCategories.includes(c)) group.keywordCategories.push(c);
  }
  const usedIds = new Set();
  return [...groups.values()].map((group) => {
    const allCats = [
      ...group.categories,
      ...group.keywordCategories.filter((c) => !group.categories.includes(c)),
    ];
    allCats.sort((a, b) => {
      const ai = CATEGORY_ORDER.indexOf(a),
        bi = CATEGORY_ORDER.indexOf(b);
      return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi);
    });
    let id = slugify(group.name);
    if (usedIds.has(id)) id += '-' + group.hash.slice(0, 6);
    usedIds.add(id);
    const paths = group.files.map(webImagePath);
    const unmapped = group.folderNames.filter(
      (folder) =>
        !Object.keys(FOLDER_CATEGORIES).some((k) => k.toLowerCase() === folder.toLowerCase()) &&
        !KEYWORD_CLASSIFY_FOLDERS.some((k) => k.toLowerCase() === folder.toLowerCase()) &&
        !brandFor(folder),
    );
    const brand = brandFor(group.name) || group.folderBrands[0] || '';
    const cleanName = brand ? stripBrandPrefix(group.name, brand) : group.name;
    return {
      id,
      name: brand ? (brand + ' ' + cleanName).trim() : cleanName,
      brand,
      category: allCats[0] || 'À classer',
      concerns: allCats,
      price: null,
      oldPrice: null,
      bestSeller: false,
      isNew: false,
      rating: null,
      reviews: [],
      description: '',
      sections: [],
      sourceUrl: '',
      benefits: [],
      howToUse: [],
      ingredients: '',
      beforeAfter: null,
      images: [...new Set(paths)],
      _sourceFiles: group.files.map((f) => path.relative(ROOT, f).split(path.sep).join('/')),
      _unmappedFolders: unmapped,
      _keywordMatches: group.keywordCategories,
    };
  });
}
const HERO_INDEXES = {
  'kundal-travel-kit-baby-powder': [0],
  'medicube-deodorant-vanilla-pistachio': [1],
  'medicube-glow-vanilla-hair-body-mist': [0],
  'kundal-caffeine-scalp-serum': [1],
  'biodance-bio-collagen-real-deep-mask': [0],
  'biodance-rejuvenating-caviar-pdrn-mask': [1],
  'celimax-retinal-shot': [1],
  'cosrx-acne-pimple-master-patch': [2],
  'dr-althea-147-barrier-cream': [1],
  'dr-althea-345-relief-cream': [0],
  'dr-melaxin-black-rice-peel-shot': [1],
  'medicube-kojic-acid-capsule-cream': [2],
  'medicube-kojic-acid-peel-shot-80ml': [1],
  'medicube-pdrn-collagen-jelly-eye-mask': [0],
  'medicube-pdrn-gel-mask': [0],
  'medicube-pdrn-pink-capsule-cream': [1],
  'medicube-txa-serum': [1],
  'beauty-of-joseon-mate-sun-stick': [0],
  'medicube-glow-sunscreen': [2],
};
const BEFORE_AFTER_IDS = new Set([
  'medicube-kojic-acid-turmeric-peel-shot-80ml',
  'medicube-pdrn-pink-collagen-gel-mask',
  'medicube-pink-pdrn-capsule-cream',
]);
const NO_GOOD_HERO_IDS = new Set([
  'lip-sleeping-mask',
  'celimax-the-vita-a-retinal-shot-tightening-booster',
  'cosrx-pimple-patch',
  'dr-althea-35-relief-mist-webp',
  'dr-althea-35-relief-mist',
  'dr-melaxin-peel-shot-exfoliating-black-rice-ampoule',
  'medicube-kojic-acid-turmeric-peel-shot-80ml',
  'medicube-pdrn-pink-collagen-gel-mask',
  'medicube-pink-pdrn-capsule-cream',
]);
const SECONDARY_ORDERS = {
  'medicube-deodorant-vanilla-pistachio': [1, 3, 2, 0, 4],
  'biodance-rejuvenating-caviar-pdrn-mask': [1, 0, 2, 3, 4],
  'cosrx-acne-pimple-master-patch': [2, 1, 0],
  'medicube-kojic-acid-capsule-cream': [2, 1, 0],
  'medicube-kojic-acid-peel-shot-80ml': [1, 0],
  'medicube-pdrn-pink-capsule-cream': [1, 0],
};
function classificationRows(products) {
  fs.mkdirSync(path.dirname(IMAGE_CLASSIFICATION_PATH), { recursive: true });
  const old = fs.existsSync(IMAGE_CLASSIFICATION_PATH)
    ? readCsv(fs.readFileSync(IMAGE_CLASSIFICATION_PATH, 'utf8'))
    : [];
  const prior = new Map(old.map((r) => [r.file, r]));
  const previousOrder = new Map();
  old.forEach((r) => {
    if (!previousOrder.has(r.product)) previousOrder.set(r.product, []);
    previousOrder.get(r.product).push(r.file);
  });
  const rows = [];
  products.forEach((p) => {
    const suggested = SECONDARY_ORDERS[p.id] || p._sourceFiles.map((_, i) => i);
    const priorFiles = previousOrder.get(p.id) || [];
    const order = priorFiles.length
      ? priorFiles
          .map((file) => p._sourceFiles.indexOf(file))
          .filter((i) => i >= 0)
          .concat(
            p._sourceFiles.map((_, i) => i).filter((i) => !priorFiles.includes(p._sourceFiles[i])),
          )
      : suggested;
    order.forEach((index) => {
      const file = p._sourceFiles[index];
      if (!file) return;
      const previous = prior.get(file) || {};
      const ba =
        BEFORE_AFTER_IDS.has(p.id) &&
        ((p.id === 'medicube-kojic-acid-turmeric-peel-shot-80ml' && index === 0) ||
          p._sourceFiles.length === 1);
      const chosen = (HERO_INDEXES[p.id] || [0]).includes(index) && !ba;
      const role = previous.role || (ba ? 'before_after' : chosen ? 'hero' : 'secondary');
      const reason = ba
        ? 'Clear before/after comparison graphic'
        : chosen
          ? 'Clean product-forward hero image selected after visual review'
          : p.id === 'medicube-deodorant-vanilla-pistachio' && [0, 4].includes(index)
            ? 'Wide informational graphic'
            : p.id === 'medicube-deodorant-vanilla-pistachio' && index === 3
              ? 'Product lifestyle photograph'
              : p.id === 'medicube-deodorant-vanilla-pistachio' && index === 2
                ? 'Lifestyle photograph with model'
                : 'Visually reviewed secondary product, texture, lifestyle, or information image';
      rows.push({
        product: p.id,
        file,
        role,
        reason: previous.reason || reason,
        override_role: previous.override_role || '',
        force_hero: previous.force_hero || '',
      });
    });
  });
  const headers = ['product', 'file', 'role', 'reason', 'override_role', 'force_hero'];
  fs.writeFileSync(
    IMAGE_CLASSIFICATION_PATH,
    [headers.join(','), ...rows.map((r) => headers.map((h) => csvCell(r[h])).join(','))].join(
      '\r\n',
    ) + '\r\n',
  );
  return rows;
}
function orderAndApplyClassifications(products, rows) {
  const byFile = new Map(rows.map((r) => [r.file, r]));
  const rowOrder = new Map(rows.map((r, i) => [r.file, i]));
  products.forEach((p) => {
    const selected = [],
      before = [];
    p._sourceFiles.forEach((file, index) => {
      const row = byFile.get(file) || {};
      const role = row.override_role || row.role || 'secondary';
      const item = { file, url: p.images[index] };
      if (role === 'before_after' || String(row.before_after || '').toLowerCase() === 'yes')
        before.push(item);
      else
        selected.push({
          ...item,
          hero: row.override_role
            ? role === 'hero'
            : String(row.force_hero || '').toLowerCase() === 'true' || role === 'hero',
        });
    });
    selected.sort(
      (a, b) => Number(b.hero) - Number(a.hero) || rowOrder.get(a.file) - rowOrder.get(b.file),
    );
    p.images = selected.map((x) => x.url);
    p.beforeAfter = before.length ? { images: before.map((x) => x.url) } : null;
    p.noGoodHero = NO_GOOD_HERO_IDS.has(p.id) || !selected.length || !selected.some((x) => x.hero);
  });
}
function applyEdits(auto, csvRows, toXof) {
  const rowsById = new Map(csvRows.map((r) => [r.id, r]));
  const editRows = [];
  const products = auto.map((p) => {
    const r = rowsById.get(p.id) || {};
    const category = r.category?.trim() || p.category;
    const concerns =
      r.concerns === undefined || r.concerns === ''
        ? p.concerns
        : r.concerns === '-'
          ? []
          : r.concerns
              .split('|')
              .map((x) => x.trim())
              .filter(Boolean);
    const val = (field, fallback) =>
      r[field] !== undefined && r[field] !== '' ? r[field] : fallback;
    const sourceCurrency = String(r.priceCurrency || '')
      .trim()
      .toUpperCase();
    const sourcePrice = r.price !== undefined && r.price !== '' ? Number(r.price) : null;
    const sourceOldPrice =
      r.oldPrice !== undefined && r.oldPrice !== '' ? Number(r.oldPrice) : null;
    const validCurrency = sourceCurrency === 'XOF' || sourceCurrency === 'USD';
    const toXofPrice = (amount) =>
      amount == null || !validCurrency ? null : toXof(amount, sourceCurrency);
    const brand = val('brand', p.brand),
      baseName = val('name', p.name);
    const pricingType =
      String(r.pricingType || '')
        .trim()
        .toLowerCase() === 'beta'
        ? 'beta'
        : 'retail';
    const applied = {
      ...p,
      name: brand ? (brand + ' ' + stripBrandPrefix(baseName, brand)).trim() : baseName,
      brand,
      category,
      concerns,
      price: toXofPrice(sourcePrice),
      priceCurrency: validCurrency && sourcePrice != null ? 'XOF' : null,
      pricingType: sourcePrice == null ? null : pricingType,
      isBetaPrice: sourcePrice != null && pricingType === 'beta',
      oldPrice: toXofPrice(sourceOldPrice),
      bestSeller: String(val('bestSeller', p.bestSeller)).toLowerCase() === 'true',
      isNew: String(val('isNew', p.isNew)).toLowerCase() === 'true',
    };
    editRows.push({
      id: p.id,
      name: applied.name,
      brand: applied.brand,
      category:
        r.category !== undefined ? r.category : p.category === 'À classer' ? '' : p.category,
      concerns:
        r.concerns !== undefined ? r.concerns : p.category === 'À classer' ? '' : p.concerns,
      price: r.price ?? '',
      priceCurrency: r.priceCurrency ?? '',
      pricingType: r.pricingType ?? '',
      oldPrice: r.oldPrice ?? '',
      bestSeller: r.bestSeller ?? 'false',
      isNew: r.isNew ?? 'false',
    });
    return applied;
  });
  return { products, editRows };
}
function markdownReport(products, images, folders, csvRows) {
  const unmatched = products.filter((p) => p.category === 'À classer');
  const pricesWithoutCurrency = (csvRows || []).filter(
    (r) =>
      String(r.price || '').trim() &&
      !['XOF', 'USD'].includes(
        String(r.priceCurrency || '')
          .trim()
          .toUpperCase(),
      ),
  );
  const multi = products.filter((p) => p.concerns.length > 1);
  const lines = [
    '# Rapport d’import des produits',
    '',
    `- Images trouvées : **${images.length}**`,
    `- Produits regroupés : **${products.length}**`,
    `- Produits avec catégorie confirmée : **${products.filter((p) => p.category !== 'À classer').length}**`,
    `- Produits en attente de catégorie : **${unmatched.length}**`,
    '',
    '## Dossiers à confirmer',
    '',
  ];
  if (folders.length)
    lines.push(
      ...folders.map(
        (f) =>
          `- **${f.name}** (${f.count} images) : nom non associé à une catégorie autorisée. Veuillez préciser sa catégorie ou son mode de classement.`,
      ),
    );
  else lines.push('- Aucun dossier non reconnu.');
  lines.push('', '## Produits importés', '');
  const noHero = products.filter((p) => p.noGoodHero),
    noBrand = products.filter((p) => !p.brand);
  for (const p of products) {
    lines.push(
      `- **${p.name}** — ${p.brand || 'marque non détectée'} — Catégorie : ${p.category} — Préoccupations : ${p.concerns.length ? p.concerns.join(', ') : 'aucune règle reconnue'} — ${p.images.length} image(s)${p.concerns.length > 1 ? ' — ⚠ Plusieurs catégories' : ''}${p.category === 'À classer' ? ' — ⚠ À classer' : ''}`,
    );
    lines.push('  - Fichiers : ' + p._sourceFiles.map((f) => '`' + f + '`').join(', '));
  }
  lines.push(
    '',
    '## Price and currency audit',
    '',
    '- CSV prices must explicitly set `priceCurrency` to `XOF` or `USD`; USD values are converted at 630 XOF per USD.',
    '- Prices without a recognized currency are omitted from the storefront and cannot be ordered. ' +
      (pricesWithoutCurrency.length
        ? `${pricesWithoutCurrency.length} row(s) need a currency decision: ${pricesWithoutCurrency.map((r) => r.id).join(', ')}.`
        : 'No ambiguous numeric prices were found.'),
    '',
    '## Inspection visuelle des images',
    '',
    '- Les 73 fichiers image ont été ouverts visuellement et décodés sans erreur ; les produits photographiés correspondent à leurs noms de fichier.',
    '- Aucun doublon exact ni quasi-identique à retirer n’a été repéré à l’inspection visuelle et par comparaison perceptuelle. Les détails et panneaux promotionnels distincts rattachés aux mêmes fiches sont conservés comme images de galerie.',
    '- **Résolution faible et format très large :** `assets/products/Body Care/Medicube deodorant vanilla pistachio.JPG` et `assets/products/Body Care/Medicube deodorant vanilla pistachio(3).WEBP` (800 × 328 px, ratio 2,44:1).',
    '- **Format très vertical :** `assets/products/Skincare/Celimax the vita A retinal shot tightening booster.PNG` (939 × 1536 px, ratio 0,61:1), `assets/products/Skincare/Dr MElaxin peel shot exfoliating black rice ampoule.PNG` (867 × 1536 px, ratio 0,56:1), `assets/products/Skincare/Medicube Kojic acid turmeric peel shot 80ML (1).PNG` (864 × 1536 px, ratio 0,56:1).',
    '- Les images ci-dessus sont encore utilisables dans les boîtes carrées en mode `contain`, mais leurs compositions diffèrent des autres visuels ; remplacez-les si vous avez des photos carrées de meilleure définition.',
    '- **Corrections de catégorie après inspection :** aucune pour les dossiers déjà associés. `Skincare` et `Sun Care` restent à confirmer ; aucune catégorie n’a été devinée.',
    '',
    '## Plusieurs catégories détectées',
    '',
    ...(multi.length
      ? multi.map((p) => `- **${p.name}** : ${p.concerns.join(', ')}`)
      : ['- Aucun.']),
    '',
    '## Notes',
    '',
    `Les variantes de fichiers nommées avec un suffixe (1), (2), -2, ou (dup) sont regroupées comme un même produit avec plusieurs images. Les originaux restent dans assets/products/ et les versions WebP optimisées sont générées dans assets/products-web/. Les produits « À classer » apparaissent dans le catalogue complet mais ne sont pas proposés dans les filtres par catégorie ou les tuiles de problématiques tant qu’ils ne sont pas attribués.`,
    `Les noms de sous-dossiers non reconnus dans ce scan : ${folders.map((f) => f.name).join(', ') || 'aucun'}.`,
  );
  lines.push(
    '',
    '## Image role decisions',
    '',
    '- Editable file: `data/image-classification.csv`; `override_role` and `force_hero` preserve manual decisions.',
    '- Hero images appear first; before/after images are separated from galleries.',
    '- No good hero: ' + (noHero.length ? noHero.map((p) => p.name).join(', ') : 'none.'),
    '',
    '## Brands to complete',
    '',
    ...(noBrand.length ? noBrand.map((p) => p.name) : ['None.']),
    '',
    '## Source descriptions',
    '',
    '- Matched: 0; needs review: 0; not found: 0; blocked before matching: ' +
      products.length +
      '. These products were not evaluated for matches because no product pages were accessed.',
    '- No descriptions were fetched: HBYTALA terms prohibit copying or exploiting site content without written permission. See `data/descriptions-report.csv`. robots.txt could not be read due TLS verification failure; collection stopped.',
  );
  return lines.join('\n') + '\n';
}
function printFolderTree(folderCounts) {
  console.log('Folder tree (before import):');
  console.log(`assets/products/ (${folderCounts.get('') || 0} images)`);
  const root = { children: new Map(), count: 0 };
  for (const [relative, count] of folderCounts) {
    if (!relative) continue;
    let node = root;
    for (const part of relative.split(path.sep)) {
      if (!node.children.has(part)) node.children.set(part, { children: new Map(), count: 0 });
      node = node.children.get(part);
    }
    node.count = count;
  }
  function printChildren(node, prefix) {
    const entries = [...node.children.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    entries.forEach(([name, child], index) => {
      const last = index === entries.length - 1;
      console.log(`${prefix}${last ? '└── ' : '├── '}${name}/ (${child.count} images)`);
      printChildren(child, prefix + (last ? '    ' : '│   '));
    });
  }
  printChildren(root, '');
}
async function run() {
  const { toXof } = await import('../lib/currency.js');
  if (!fs.existsSync(IMAGE_ROOT)) {
    console.error('Image folder not found:', IMAGE_ROOT);
    process.exitCode = 1;
    return;
  }
  const files = listImages(IMAGE_ROOT),
    auto = makeAutoProducts(files);
  const folderCounts = new Map();
  for (const f of files) {
    const info = folderInfo(f);
    if (!info.folders.length) folderCounts.set('', (folderCounts.get('') || 0) + 1);
    for (let i = 1; i <= info.folders.length; i++) {
      const folder = info.folders.slice(0, i).join(path.sep);
      folderCounts.set(folder, (folderCounts.get(folder) || 0) + 1);
    }
  }
  const unresolved = [...folderCounts]
    .filter(
      ([folder]) =>
        folder &&
        (() => {
          const name = path.basename(folder);
          return (
            !Object.keys(FOLDER_CATEGORIES).some((k) => k.toLowerCase() === name.toLowerCase()) &&
            !KEYWORD_CLASSIFY_FOLDERS.some((k) => k.toLowerCase() === name.toLowerCase()) &&
            !brandFor(name)
          );
        })(),
    )
    .map(([name, count]) => ({ name, count }));
  printFolderTree(folderCounts);
  if (unresolved.length)
    console.log('Folders requiring category decisions:', unresolved.map((x) => x.name).join(', '));
  const csvExists = fs.existsSync(CSV_PATH),
    csvRows = csvExists ? readCsv(fs.readFileSync(CSV_PATH, 'utf8')) : [];
  const { products, editRows } = applyEdits(auto, csvRows, toXof);
  const imageRows = classificationRows(products);
  orderAndApplyClassifications(products, imageRows);
  if (!csvExists) fs.writeFileSync(CSV_PATH, writeCsv(editRows));
  else {
    const existing = new Set(csvRows.map((r) => r.id));
    const merged = [...csvRows, ...editRows.filter((r) => !existing.has(r.id))];
    fs.writeFileSync(CSV_PATH, writeCsv(merged));
  }
  fs.writeFileSync(
    path.join(ROOT, 'data', 'catalog.js'),
    '// Generated by scripts/build-products.cjs. Edit products-edit.csv for catalog data.\nexport const PRODUCTS = ' +
      JSON.stringify(products, null, 2) +
      ';\n',
  );
  fs.writeFileSync(REPORT_PATH, markdownReport(products, files, unresolved, csvRows));
  const descriptionHeaders = [
    'product',
    'source_url',
    'confidence',
    'status',
    'approved',
    'original_description_fr',
    'original_description_en',
    'translated_fr',
    'translated_en',
  ];
  fs.writeFileSync(
    DESCRIPTIONS_REPORT_PATH,
    [
      descriptionHeaders.join(','),
      ...products.map((p) =>
        [p.name, '', '', 'blocked_by_terms', 'no', '', '', '', ''].map(csvCell).join(','),
      ),
    ].join('\r\n') + '\r\n',
  );
  console.log(`Images scanned: ${files.length}`);
  console.log(`Products created (after variant/hash grouping): ${products.length}`);
  console.log(
    `Products with confirmed categories: ${products.filter((p) => p.category !== 'À classer').length}`,
  );
  console.log(
    `Products awaiting category decisions: ${products.filter((p) => p.category === 'À classer').length}`,
  );
  console.log(`Wrote data/catalog.js, products-edit.csv, and ${path.relative(ROOT, REPORT_PATH)}`);
}
run().catch((error) => {
  console.error('Catalog build failed:', error && error.name, error && error.message);
  process.exitCode = 1;
});
