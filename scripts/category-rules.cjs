// Edit these rules when your real catalog needs different grouping.
// Folder names take priority. Leave an unclear folder unmapped until it is confirmed.
const CATEGORY_ORDER = [
  'Lèvres',
  'Acné',
  "Cicatrices d'acné",
  'Hyperpigmentation',
  'Teint terne',
  'Peau sèche',
  'Rougeurs & irritations',
  'Cheveux & corps',
];

const FOLDER_CATEGORIES = {
  'body care': 'Cheveux & corps',
  'hair care': 'Cheveux & corps',
  'lip care': 'Lèvres',
  // Add confirmed folder mappings here, for example: 'Sun Care': 'Peau sèche'
};

// Only use filename rules inside a folder after explicitly deciding it is a catch-all.
const KEYWORD_CLASSIFY_FOLDERS = [];

const KEYWORD_RULES = [
  {
    category: 'Lèvres',
    patterns: [/\blip\b/i, /lèvres?/i, /gloss/i, /baume.*lèvres/i, /rouge.*lèvres/i],
  },
  { category: "Cicatrices d'acné", patterns: [/cicatrice/i, /\bscar(s)?\b/i] },
  {
    category: 'Acné',
    patterns: [
      /acne|acné/i,
      /blemish/i,
      /imperfection/i,
      /salicylique|salicylic/i,
      /pimple|patch/i,
    ],
  },
  {
    category: 'Hyperpigmentation',
    patterns: [
      /pigment/i,
      /dark spot/i,
      /taches?/i,
      /brightening/i,
      /éclaircissant/i,
      /kojic/i,
      /\btxa\b/i,
    ],
  },
  {
    category: 'Teint terne',
    patterns: [
      /vitamin.?c|vitamine.?c/i,
      /éclat|glow|radiance|illuminat/i,
      /retinal/i,
      /\bpdrn\b/i,
    ],
  },
  {
    category: 'Peau sèche',
    patterns: [
      /hydrat|moistur|\bdry\b/i,
      /crème nourrissante/i,
      /hyaluron/i,
      /barrier|collagen|collagène/i,
    ],
  },
  {
    category: 'Rougeurs & irritations',
    patterns: [/rougeur|irritation/i, /apaisant|calming|sensitive|centella|cica|relief/i],
  },
  {
    category: 'Cheveux & corps',
    patterns: [/hair|cheveux|shampoo|shampooing|body|corps|deodorant|déodorant|mist/i],
  },
];

const BRANDS = require('../data/brands.json');

module.exports = {
  CATEGORY_ORDER,
  FOLDER_CATEGORIES,
  KEYWORD_CLASSIFY_FOLDERS,
  KEYWORD_RULES,
  BRANDS,
};
