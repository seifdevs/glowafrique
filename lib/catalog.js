import { PRODUCTS } from '../data/catalog.js';
import { toXof } from './currency.js';

export function findCatalogProduct(id) {
  return PRODUCTS.find((product) => product.id === id) || null;
}

export function catalogPriceXof(product) {
  if (!product || product.price == null || !product.priceCurrency) return null;
  try { return toXof(product.price, product.priceCurrency); }
  catch (_) { return null; }
}

export { PRODUCTS };
