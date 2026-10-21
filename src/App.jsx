import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { PRODUCTS } from '../data/catalog.js';
import STORE_INFO from '../content/store-info.json';
import { formatXof, toXof } from '../lib/currency.js';
import { POLICIES } from './content/policies.js';

const StoreContext = createContext(null);
const LOGOS = {
  'AXIS-Y': '/assets/brands/axis-y.png',
  BIODANCE: '/assets/brands/biodance.svg',
  'Beauty of Joseon': '/assets/brands/beauty-of-joseon.png',
  COSRX: '/assets/brands/cosrx.png',
  Celimax: '/assets/brands/celimax.png',
  'Dr. Althea': '/assets/brands/dr-althea.png',
  'DR. MELAXIN': '/assets/brands/dr-melaxin.png',
  KUNDAL: '/assets/brands/kundal.png',
  MEDICUBE: '/assets/brands/medicube.png',
};
const COPY = {
  en: {
    home: 'Home',
    products: 'Shop All',
    best: 'Best Sellers',
    brands: 'Featured Brands',
    concerns: 'Shop By Concern',
    hair: 'Hair & Body',
    about: 'About GlowAfrique',
    contact: 'Contact Us',
    account: 'My Account',
    cart: 'Your Bag',
    empty: 'Your bag is empty.',
    view: 'View All',
    add: 'Add To Bag',
    all: 'All Products',
    search: 'Search Products',
    newsletter: 'Sign Up For New Stories And Personal Offers',
    email: 'Email Address',
    submit: 'Subscribe',
    info: 'Information & Policies',
    return: 'Returns & Refunds',
    shipping: 'Shipping Policy',
    privacy: 'Privacy Policy',
    terms: 'Terms & Conditions',
    cookies: 'Cookie Policy',
    howto: 'How To Use',
    points: 'Glow Points',
    pointsExplain: 'Earn 1 point for each 630 CFA spent and 15 points for each approved review.',
    delivery: 'Free Delivery On Orders Of 45,000 CFA Or More',
    authentic: 'Thoughtfully selected beauty and care products.',
    learn: 'Explore The Collection',
    checkout: 'Checkout',
    remove: 'Remove',
    total: 'Estimated Total',
    continue: 'Continue Shopping',
    noPrice: 'Price Pending',
    pricePending: 'Pricing Will Be Confirmed Before Ordering',
    clearFilters: 'Clear Filters',
    filterResults: 'Products',
    loading: 'Loading…',
    send: 'Send Message',
    name: 'Full Name',
    message: 'Message',
    subject: 'Subject',
    hours: 'Customer support',
    accountText: 'Sign in or create an account to view your orders and Glow Points.',
    signIn: 'Sign In',
    create: 'Create Account',
    password: 'Password',
    first: 'First Name',
    last: 'Last Name',
    signOut: 'Sign Out',
    orders: 'My Orders',
    noOrders: 'Your orders will appear here after you sign in.',
    filter: 'Filter By',
    brand: 'Brand',
    concern: 'Concern',
    sort: 'Sort By',
    priceLow: 'Price: Low To High',
    priceHigh: 'Price: High To Low',
    newest: 'Newest',
    noProducts: 'No products match these filters.',
    skin: 'Shop trusted skincare, hair and body essentials selected for GlowAfrique.',
    bestHeading: 'Best Sellers',
    newHeading: 'Explore The Collection',
    aboutText:
      'GlowAfrique is an independent beauty and care shop serving customers in Côte d’Ivoire. Browse the current product collection, review product information, and contact our team with questions about an item or order.',
    legalNotice:
      'These store policies explain how GlowAfrique handles orders and customer information. Please contact us if you have questions before ordering.',
    published:
      'Product details are shown as provided in the product catalogue. Please check the manufacturer packaging for the latest directions and ingredients.',
    review: 'Write A Review',
    rating: 'Rating',
    reviewText: 'Your Review',
    signInReview: 'Sign in to review this product. Approved reviews earn 15 Glow Points.',
    success: 'Thank you. Your request was received.',
    unavailable: 'This feature is temporarily unavailable. Please contact customer support.',
    language: 'Français',
    pointsCount: 'points',
    brandCollection: 'Featured Brands',
    authenticity: 'Authentic Products',
    service: 'Customer Service',
    shippingFree: 'Free Delivery',
    deliveryNote: 'Free delivery on orders of 45,000 CFA or more.',
    legal: 'Legal Name And Registration',
    address: 'Business Address',
    messageHelp:
      'For questions about products, orders, or customer data, contact GlowAfrique using the details listed here.',
    cookiePreferences: 'Cookie Settings',
    noStore: 'GlowAfrique does not currently use advertising cookies.',
  },
  fr: {
    home: 'Accueil',
    products: 'Boutique',
    best: 'Meilleures Ventes',
    brands: 'Marques Vedettes',
    concerns: 'Acheter Par Besoin',
    hair: 'Cheveux & Corps',
    about: 'À Propos De GlowAfrique',
    contact: 'Contactez-Nous',
    account: 'Mon Compte',
    cart: 'Votre Panier',
    empty: 'Votre panier est vide.',
    view: 'Tout Voir',
    add: 'Ajouter Au Panier',
    all: 'Tous Les Produits',
    search: 'Rechercher Des Produits',
    newsletter: 'Recevez Nos Nouveautés Et Offres',
    email: 'Adresse E-mail',
    submit: 'S’inscrire',
    info: 'Informations Et Politiques',
    return: 'Retours Et Remboursements',
    shipping: 'Politique De Livraison',
    privacy: 'Politique De Confidentialité',
    terms: 'Conditions Générales',
    cookies: 'Politique Relative Aux Cookies',
    howto: 'Mode D’emploi',
    points: 'Glow Points',
    pointsExplain: 'Gagnez 1 point par tranche de 630 CFA dépensés et 15 points par avis approuvé.',
    delivery: 'Livraison Offerte Dès 45 000 CFA D’achat',
    authentic: 'Une sélection de produits de beauté et de soin.',
    learn: 'Découvrir La Sélection',
    checkout: 'Commander',
    remove: 'Retirer',
    total: 'Total Estimé',
    continue: 'Continuer Mes Achats',
    noPrice: 'Prix En Attente',
    pricePending: 'Prix À Confirmer Avant Toute Commande',
    clearFilters: 'Effacer Les Filtres',
    filterResults: 'Produits',
    loading: 'Chargement…',
    send: 'Envoyer Le Message',
    name: 'Nom Complet',
    message: 'Message',
    subject: 'Sujet',
    hours: 'Service Client',
    accountText:
      'Connectez-vous ou créez un compte pour consulter vos commandes et vos Glow Points.',
    signIn: 'Se Connecter',
    create: 'Créer Un Compte',
    password: 'Mot De Passe',
    first: 'Prénom',
    last: 'Nom',
    signOut: 'Se Déconnecter',
    orders: 'Mes Commandes',
    noOrders: 'Vos commandes apparaîtront ici après connexion.',
    filter: 'Filtrer Par',
    brand: 'Marque',
    concern: 'Besoin',
    sort: 'Trier Par',
    priceLow: 'Prix Croissant',
    priceHigh: 'Prix Décroissant',
    newest: 'Nouveautés',
    noProducts: 'Aucun produit ne correspond à ces filtres.',
    skin: 'Découvrez une sélection de soins pour le visage, les cheveux et le corps proposée par GlowAfrique.',
    bestHeading: 'Meilleures Ventes',
    newHeading: 'Découvrir La Sélection',
    aboutText:
      'GlowAfrique est une boutique indépendante de produits de beauté et de soin qui propose sa sélection aux clients en Côte d’Ivoire. Parcourez les produits disponibles et contactez notre équipe pour toute question sur un article ou une commande.',
    legalNotice:
      'Ces politiques expliquent le traitement des commandes et des informations des clients. Contactez-nous si vous avez une question avant de commander.',
    published:
      'Les détails du produit sont ceux du catalogue. Consultez l’emballage du fabricant pour les consignes et ingrédients à jour.',
    review: 'Écrire Un Avis',
    rating: 'Note',
    reviewText: 'Votre Avis',
    signInReview:
      'Connectez-vous pour donner votre avis. Chaque avis approuvé rapporte 15 Glow Points.',
    success: 'Merci. Votre demande a été reçue.',
    unavailable:
      'Cette fonctionnalité est momentanément indisponible. Contactez le service client.',
    language: 'English',
    pointsCount: 'points',
    brandCollection: 'Marques Vedettes',
    authenticity: 'Produits Authentiques',
    service: 'Service Client',
    shippingFree: 'Livraison Offerte',
    deliveryNote: 'Livraison offerte dès 45 000 CFA d’achat.',
    legal: 'Nom Légal Et Immatriculation',
    address: 'Adresse De L’entreprise',
    messageHelp:
      'Pour toute question concernant un produit, une commande ou vos données, contactez GlowAfrique aux coordonnées indiquées ici.',
    cookiePreferences: 'Paramètres Des Cookies',
    noStore: 'GlowAfrique n’utilise actuellement pas de cookies publicitaires.',
  },
};
const text = (locale, key) => COPY[locale]?.[key] || COPY.en[key] || key;
const productImage = (product) =>
  product?.images?.[0] ? `/${product.images[0].replace(/^\//, '')}` : '/images/product-art-01.svg';
const productPath = (product) => `/product/${encodeURIComponent(product.id)}`;
const slug = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
const money = (value, currency = 'XOF') => formatXof(toXof(value, currency));
const productHasVerifiedPrice = (product) =>
  product?.price != null && product.isBetaPrice !== true && product.pricingType !== 'beta';
const localePath = (path, locale) =>
  locale === 'en' ? (path === '/' ? '/en' : `/en${path}`) : path;

function useStore() {
  return useContext(StoreContext);
}
function PageLink({ to, children, ...props }) {
  const { locale } = useStore();
  return (
    <Link to={localePath(to, locale)} {...props}>
      {children}
    </Link>
  );
}

function ProductCard({ product }) {
  const { locale } = useStore();
  return (
    <article className="product-card">
      <PageLink
        className="product-image image-fallback"
        to={productPath(product)}
        aria-label={`${product.brand} ${product.name}`}
      >
        <img loading="lazy" src={productImage(product)} alt={`${product.brand} ${product.name}`} />
      </PageLink>
      <div className="product-info">
        <p className="eyebrow">{product.brand}</p>
        <PageLink to={productPath(product)}>
          <h3>{product.name}</h3>
        </PageLink>
        <p
          className="rating"
          aria-label={product.rating ? `${product.rating} out of 5` : undefined}
        >
          {product.rating ? `★ ${Number(product.rating).toFixed(1)}` : ''}
        </p>
        <p className="price">
          {!productHasVerifiedPrice(product)
            ? text(locale, 'noPrice')
            : money(product.price, product.priceCurrency)}
        </p>
        <AddToBagButton product={product} className="button small" />
      </div>
    </article>
  );
}

function AddToBagButton({ product, className = 'button' }) {
  const { locale, addItem } = useStore();
  const [added, setAdded] = useState(false);
  const resetTimer = useRef(null);
  useEffect(() => () => window.clearTimeout(resetTimer.current), []);
  function add() {
    addItem(product);
    setAdded(true);
    window.clearTimeout(resetTimer.current);
    resetTimer.current = window.setTimeout(() => setAdded(false), 3200);
  }
  const canAdd = productHasVerifiedPrice(product);
  return (
    <div className={`add-to-bag-action${added ? ' is-added' : ''}`}>
      <button type="button" className={`${className}${added ? ' added' : ''}`} disabled={!canAdd} onClick={add}>
        {canAdd ? (added ? `✓ ${locale === 'en' ? 'Added successfully' : 'Ajouté avec succès'}` : text(locale, 'add')) : text(locale, 'noPrice')}
      </button>
      {added ? (
        <button
          type="button"
          className="add-another-button"
          onClick={add}
          aria-label={locale === 'en' ? `Add another ${product.name}` : `Ajouter encore ${product.name}`}
        >
          + {locale === 'en' ? 'Add one more' : 'Ajouter un autre'}
        </button>
      ) : null}
    </div>
  );
}

function ProductGrid({ products }) {
  const { locale } = useStore();
  return products.length ? (
    <div className="product-grid">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  ) : (
    <p className="empty-state">{text(locale, 'noProducts')}</p>
  );
}

function Carousel({ items, label, renderItem, variant = 'concern' }) {
  const duration = `${Math.max(32, items.length * (variant === 'brand' ? 5.5 : 4.5))}s`;
  return (
    <div
      className={`infinite-carousel ${variant}-marquee`}
      style={{ '--marquee-duration': duration }}
      tabIndex={0}
      role="region"
      aria-label={label}
    >
      <div
        className="infinite-carousel-track"
      >
        <div className="infinite-carousel-group">
          {items.map(renderItem)}
        </div>
        <div className="infinite-carousel-group" aria-hidden="true" inert>
          {items.map((item, index) =>
            React.cloneElement(renderItem(item), { key: `duplicate-${index}` }),
          )}
        </div>
      </div>
    </div>
  );
}

function SectionHeading({ eyebrow = 'GlowAfrique', title, href }) {
  const { locale } = useStore();
  return (
    <div className="section-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
      </div>
      {href ? <PageLink to={href}>{text(locale, 'view')} →</PageLink> : null}
    </div>
  );
}

function ConcernIcon({ concern }) {
  const name = concern.toLocaleLowerCase();
  let icon = 'sparkle';
  if (/cheveux|hair|corps|body/.test(name)) icon = 'hair';
  else if (/sèche|dry/.test(name)) icon = 'drop';
  else if (/solaire|sun protection|sunscreen/.test(name)) icon = 'sun';
  else if (/acné|imperfection|blemish/.test(name)) icon = 'sparkle';
  else if (/pores|sébum|oil/.test(name)) icon = 'pores';
  else if (/rides|ferm|wrinkle|firmness/.test(name)) icon = 'lines';
  else if (/taches|hyperpigmentation|dark spot/.test(name)) icon = 'spots';
  else if (/yeux|eye care/.test(name)) icon = 'eye';
  else if (/teint|tone/.test(name)) icon = 'tone';
  else if (/barrière|barrier/.test(name)) icon = 'shield';
  else if (/lèvres|lips/.test(name)) icon = 'lips';
  else if (/terne|dull/.test(name)) icon = 'sun';

  const shapes = {
    hair: <><path d="M5 20c1-3 0-5-1-7s0-6 3-8" /><path d="M10 20c1-3 0-5-1-7s0-6 3-8" /><path d="M15 20c1-3 0-5-1-7s0-6 3-8" /><path d="M19 20c1-3 0-5-1-7s0-6 3-8" /></>,
    drop: <><path d="M12 3s-6 6.5-6 11a6 6 0 0 0 12 0c0-4.5-6-11-6-11Z" /><path d="M9 15a3 3 0 0 0 3 3" /></>,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" /></>,
    pores: <><circle cx="8" cy="8" r="1.5" /><circle cx="16" cy="7" r="1" /><circle cx="13" cy="13" r="1.5" /><circle cx="7" cy="16" r="1" /><circle cx="18" cy="17" r="1.5" /></>,
    lines: <><path d="M12 3c4.4 0 7 3.6 7 8s-2.6 10-7 10-7-5.6-7-10 2.6-8 7-8Z" /><path d="M8 10h3m2 0h3M9 15c2 1 4 1 6 0" /></>,
    spots: <><circle cx="12" cy="12" r="7" /><path d="M12 1v3m0 16v3M1 12h3m16 0h3M5 5l2 2m10 10 2 2" /><circle cx="12" cy="12" r="2" /></>,
    eye: <><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" /><circle cx="12" cy="12" r="2.5" /></>,
    tone: <><circle cx="12" cy="12" r="9" /><path d="M12 3v18a9 9 0 0 0 0-18Z" /></>,
    shield: <><path d="M12 3 19 6v5c0 4.5-2.9 8-7 10-4.1-2-7-5.5-7-10V6l7-3Z" /><path d="m9 12 2 2 4-4" /></>,
    lips: <><path d="M3 12s3.3-4 9-4 9 4 9 4-3.3 5-9 5-9-5-9-5Z" /><path d="M3 12c3 0 4-2 9-2s6 2 9 2" /></>,
    sparkle: <><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" /><path d="m19 15 .9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z" /></>,
  };

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" focusable="false">
      {shapes[icon]}
    </svg>
  );
}

function HomePage() {
  const { locale } = useStore();
  const brands = [...new Set(PRODUCTS.map((p) => p.brand).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, locale),
  );
  const concerns = [
    ...new Set(
      PRODUCTS.flatMap((p) => [...(p.concerns || []), ...(p.category ? [p.category] : [])]),
    ),
  ]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, locale));
  const best = PRODUCTS.filter((p) => p.bestSeller).slice(0, 8);
  const discovery = PRODUCTS.filter((p) => !p.bestSeller).slice(0, 8);
  const concernLabel = (category) =>
    locale === 'en'
      ? {
          'Cheveux & corps': 'Hair & body',
          'Peau sèche': 'Dry skin',
          'Peau terne': 'Dullness',
          'Protection solaire': 'Sun protection',
          'Acné & imperfections': 'Acne & blemishes',
          'Pores dilatés & excès de sébum': 'Enlarged pores & excess oil',
          'Rides & fermeté': 'Fine lines & firmness',
          'Taches & hyperpigmentation': 'Dark spots & hyperpigmentation',
          'Contour des yeux': 'Eye care',
          'Teint irrégulier': 'Uneven skin tone',
          'Barrière cutanée': 'Skin barrier',
          Lèvres: 'Lips',
        }[category] || category
      : category;
  return (
    <>
      <section className="hero">
        <picture>
          <img
            src="/images/billboard.jpg"
            alt="GlowAfrique beauty and skincare collection"
            fetchPriority="high"
          />
        </picture>
        <div className="hero-copy">
          <p className="eyebrow">GlowAfrique · Côte d’Ivoire</p>
          <h1>{text(locale, 'skin')}</h1>
          <PageLink className="button" to="/products">
            {text(locale, 'learn')}
          </PageLink>
        </div>
      </section>
      <section className="loyalty-banner">
        <span aria-hidden="true">✦</span>
        <div>
          <h2>{text(locale, 'points')}</h2>
          <p>{text(locale, 'pointsExplain')}</p>
        </div>
        <PageLink className="button small" to="/account">
          {text(locale, 'account')}
        </PageLink>
      </section>
      <section className="section bestseller-section">
        <SectionHeading title={text(locale, 'bestHeading')} href="/collections/best-sellers" />
        <ProductGrid products={best.length ? best : PRODUCTS.slice(0, 8)} />
      </section>
      <section className="section concern-section">
        <SectionHeading title={text(locale, 'concerns')} href="/collections/concerns" />
        <Carousel
          items={concerns}
          label={text(locale, 'concerns')}
          renderItem={(concern) => {
            const count = PRODUCTS.filter(
              (p) => p.category === concern || (p.concerns || []).includes(concern),
            ).length;
            return (
              <PageLink
                className="concern-tile"
                key={concern}
                to={`/collections/concern/${slug(concern)}`}
              >
                <span className="concern-icon" aria-hidden="true">
                  <ConcernIcon concern={concern} />
                </span>
                <span className="concern-label">{concernLabel(concern)}</span>
                <small>
                  {count} {locale === 'en' ? 'products' : 'produits'}
                </small>
              </PageLink>
            );
          }}
        />
      </section>
      <section className="section discovery-section">
        <SectionHeading title={text(locale, 'newHeading')} href="/products" />
        <ProductGrid products={discovery} />
      </section>
      <section className="section featured-brand-section">
        <SectionHeading title={text(locale, 'brands')} href="/collections/brands" />
        <Carousel
          variant="brand"
          items={brands}
          label={text(locale, 'brands')}
          renderItem={(brand) => (
            <PageLink
              key={brand}
              className="brand-tile brand-wordmark"
              to={`/collections/brand/${slug(brand)}`}
              aria-label={`${text(locale, 'brand')}: ${brand}`}
            >
              <img
                className="brand-logo"
                src={LOGOS[brand]}
                alt={brand}
                loading="lazy"
                onError={(event) => {
                  event.currentTarget.hidden = true;
                  event.currentTarget.nextElementSibling.hidden = false;
                }}
              />
              <span className="brand-wordmark-text" hidden>
                {brand}
              </span>
            </PageLink>
          )}
        />
      </section>
      <section className="promo-strip">
        <span>{text(locale, 'delivery')}</span>
        <PageLink className="button" to="/products">
          {text(locale, 'learn')}
        </PageLink>
      </section>
    </>
  );
}

function ProductsPage() {
  const { locale } = useStore();
  const [search, setSearch] = useState('');
  const [brand, setBrand] = useState('');
  const [concern, setConcern] = useState('');
  const [sort, setSort] = useState('name');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const clearFilters = () => {
    setSearch('');
    setBrand('');
    setConcern('');
  };
  const activeFilters = Number(Boolean(search)) + Number(Boolean(brand)) + Number(Boolean(concern));
  const brands = [...new Set(PRODUCTS.map((p) => p.brand).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, locale, { sensitivity: 'base' }),
  );
  const concerns = [
    ...new Set(
      PRODUCTS.flatMap((p) => [...(p.concerns || []), ...(p.category ? [p.category] : [])]),
    ),
  ]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, locale, { sensitivity: 'base' }));
  const results = PRODUCTS.filter(
    (p) =>
      (!search || `${p.name} ${p.brand}`.toLowerCase().includes(search.toLowerCase())) &&
      (!brand || p.brand === brand) &&
      (!concern || p.category === concern || (p.concerns || []).includes(concern)),
  )
    .slice()
    .sort((a, b) =>
      sort === 'price-low'
        ? (a.price ?? Infinity) - (b.price ?? Infinity)
        : sort === 'price-high'
          ? (b.price ?? -Infinity) - (a.price ?? -Infinity)
          : sort === 'new'
            ? Number(b.isNew) - Number(a.isNew)
            : a.name.localeCompare(b.name),
    );
  return (
    <>
      <section className="page-intro">
        <p className="eyebrow">GlowAfrique</p>
        <h1>{text(locale, 'all')}</h1>
        <p>{text(locale, 'skin')}</p>
      </section>
      <section className="catalog-layout">
        {filtersOpen ? <button className="filter-scrim" aria-label={text(locale, 'remove')} onClick={() => setFiltersOpen(false)} /> : null}
        <aside className={`filter-panel${filtersOpen ? ' filter-open' : ''}`} aria-label={text(locale, 'filter')}>
          <div className="filter-panel-head">
            <h2>{text(locale, 'filter')}</h2>
            <button className="icon-button" type="button" aria-label={text(locale, 'remove')} onClick={() => setFiltersOpen(false)}>×</button>
          </div>
          <label>
            {text(locale, 'search')}
            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} />
          </label>
          <label>
            {text(locale, 'brand')}
            <select value={brand} onChange={(e) => setBrand(e.target.value)}>
              <option value="">{text(locale, 'all')}</option>
              {brands.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label>
            {text(locale, 'concern')}
            <select value={concern} onChange={(e) => setConcern(e.target.value)}>
              <option value="">{text(locale, 'all')}</option>
              {concerns.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <button type="button" className="text-button clear-filters" onClick={clearFilters} disabled={!activeFilters}>
            {text(locale, 'clearFilters')}
          </button>
        </aside>
        <div className="catalog-results">
          <div className="catalog-toolbar">
            <button type="button" className="button small mobile-filter-open" onClick={() => setFiltersOpen(true)}>
              {text(locale, 'filter')}{activeFilters ? ` · ${activeFilters}` : ''}
            </button>
            <span className="catalog-result-count">{results.length} {text(locale, 'filterResults')}</span>
            <label className="catalog-sort-label">
            {text(locale, 'sort')}
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="name">A–Z</option>
              <option value="new">{text(locale, 'newest')}</option>
              <option value="price-low">{text(locale, 'priceLow')}</option>
              <option value="price-high">{text(locale, 'priceHigh')}</option>
            </select>
          </label>
          </div>
          <ProductGrid products={results} />
        </div>
      </section>
    </>
  );
}

function CollectionPage({ path, search }) {
  const { locale } = useStore();
  const params = new URLSearchParams(search);
  const brandSlug = path.match(/^\/collections\/brand\/([^/]+)/)?.[1];
  const concernSlug = path.match(/^\/collections\/concern\/([^/]+)/)?.[1];
  let results = PRODUCTS;
  if (path.includes('best-sellers')) results = PRODUCTS.filter((p) => p.bestSeller);
  if (brandSlug) results = results.filter((p) => slug(p.brand) === brandSlug);
  if (concernSlug)
    results = results.filter(
      (p) =>
        (p.concerns || []).some((item) => slug(item) === concernSlug) ||
        slug(p.category) === concernSlug,
    );
  if (params.get('brand')) results = results.filter((p) => p.brand === params.get('brand'));
  if (params.get('concern'))
    results = results.filter(
      (p) =>
        p.category === params.get('concern') || (p.concerns || []).includes(params.get('concern')),
    );
  const title = brandSlug
    ? results[0]?.brand || text(locale, 'brandCollection')
    : concernSlug
      ? results[0]?.concerns?.find((x) => slug(x) === concernSlug) ||
        results[0]?.category ||
        text(locale, 'concerns')
      : path.includes('best-sellers')
        ? text(locale, 'best')
        : text(locale, 'all');
  return (
    <>
      <section className="page-intro collection-intro">
        <p className="eyebrow">GlowAfrique</p>
        <h1>{title}</h1>
        <p>
          {results.length} {locale === 'en' ? 'products' : 'produits'}
        </p>
      </section>
      <ProductGrid products={results} />
    </>
  );
}

function ProductPage({ id }) {
  const { locale, user, setUser } = useStore();
  const product = PRODUCTS.find((p) => p.id === id);
  const [reviews, setReviews] = useState([]);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  useEffect(() => {
    if (!product) return;
    fetch(`/api/reviews?productId=${encodeURIComponent(product.id)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setReviews(data?.reviews || []))
      .catch(() => {});
  }, [product]);
  if (!product)
    return (
      <section className="page-intro">
        <h1>{text(locale, 'noProducts')}</h1>
        <PageLink to="/products">{text(locale, 'continue')}</PageLink>
      </section>
    );
  const similar = PRODUCTS.filter(
    (p) => p.id !== product.id && (p.brand === product.brand || p.category === product.category),
  ).slice(0, 4);
  const productContent = product.content?.[locale] || null;
  async function submitReview(event) {
    event.preventDefault();
    setLoading(true);
    setFeedback('');
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Customer',
          rating: Number(form.get('rating')),
          text: form.get('text'),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || text(locale, 'unavailable'));
      setReviews((items) => [data.review, ...items]);
      if (Number.isFinite(Number(data.points)))
        setUser((current) => (current ? { ...current, points: Number(data.points) } : current));
      setFeedback(`${text(locale, 'success')} +15 ${text(locale, 'pointsCount')}.`);
      formElement.reset();
    } catch (error) {
      setFeedback(error.message);
    } finally {
      setLoading(false);
    }
  }
  return (
    <>
      <nav className="breadcrumbs">
        <PageLink to="/">{text(locale, 'home')}</PageLink> /{' '}
        <PageLink to="/products">{text(locale, 'products')}</PageLink> / {product.name}
      </nav>
      <section className="product-detail">
        <div className="gallery">
          <div className="main-product-image image-fallback">
            <img
              src={product.images?.[selectedImage] ? `/${product.images[selectedImage].replace(/^\//, '')}` : productImage(product)}
              alt={`${product.brand} ${product.name}`}
            />
          </div>
          {(product.images || []).length > 1 ? (
            <div className="thumbs" aria-label={locale === 'en' ? 'Product images' : 'Images du produit'}>
              {product.images.map((image, index) => (
                <button
                  type="button"
                  className={selectedImage === index ? 'active' : ''}
                  key={image}
                  onClick={() => setSelectedImage(index)}
                  aria-label={`${locale === 'en' ? 'Show image' : 'Afficher l’image'} ${index + 1}`}
                  aria-pressed={selectedImage === index}
                >
                  <img src={`/${image.replace(/^\//, '')}`} alt="" loading="lazy" />
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <div className="product-buy">
          <p className="eyebrow product-brand">{product.brand}</p>
          <h1>{product.name}</h1>
          <p className="price large">
            {!productHasVerifiedPrice(product)
              ? text(locale, 'noPrice')
              : money(product.price, product.priceCurrency)}
          </p>
          <p className="muted">{product.category}</p>
          <AddToBagButton product={product} className="button product-add" />
          <p className="muted">{text(locale, 'deliveryNote')}</p>
          <section className="product-accordions">
            <h2>{locale === 'en' ? 'Product Information' : 'Informations Produit'}</h2>
            <article className="product-about">
              <h3>{locale === 'en' ? 'About' : 'À propos'}</h3>
              <p>{productContent?.description || product.description || (locale === 'en' ? `${product.name} by ${product.brand || 'GlowAfrique'} is part of our ${product.category.toLowerCase()} selection. Supplier product details are being confirmed.` : `${product.name} de ${product.brand || 'GlowAfrique'} fait partie de notre sélection ${product.category.toLowerCase()}. Les détails fournisseur sont en cours de confirmation.`)}</p>
            </article>
            <details>
              <summary>{locale === 'en' ? 'How to Use' : 'Mode d’emploi'}</summary>
              <p className="product-how-to-use">{productContent?.howToUse || (locale === 'en' ? 'Manufacturer instructions are pending. Follow the directions printed on the product packaging.' : 'Les instructions du fabricant sont en attente. Suivez les indications figurant sur l’emballage.')}</p>
            </details>
            <details>
              <summary>{locale === 'en' ? 'Ingredients' : 'Ingrédients'}</summary>
              <p>{productContent?.ingredients || (locale === 'en' ? 'Full ingredient list not yet provided by the supplier. Please refer to the product packaging.' : 'La liste complète des ingrédients n’a pas encore été fournie par le fournisseur. Veuillez consulter l’emballage du produit.')}</p>
            </details>
            <details>
              <summary>{locale === 'en' ? 'Product Details' : 'Détails du produit'}</summary>
              <dl>
                <div><dt>{locale === 'en' ? 'Brand' : 'Marque'}</dt><dd>{product.brand || '—'}</dd></div>
                <div><dt>{locale === 'en' ? 'Category' : 'Catégorie'}</dt><dd>{product.category}</dd></div>
                {product.id === 'medicube-kojic-acid-capsule-cream' ? <div><dt>{locale === 'en' ? 'Net weight' : 'Poids net'}</dt><dd>53 g</dd></div> : null}
                {product.id === 'medicube-glow-sunscreen' ? <><div><dt>{locale === 'en' ? 'Size' : 'Format'}</dt><dd>50 ml</dd></div><div><dt>{locale === 'en' ? 'Sun protection' : 'Protection solaire'}</dt><dd>{locale === 'en' ? 'Broad-spectrum SPF 50' : 'Large spectre SPF 50'}</dd></div></> : null}
                {product.id === 'dr-althea-35-relief-mist' ? <div><dt>{locale === 'en' ? 'Size' : 'Format'}</dt><dd>100 ml</dd></div> : null}
                {product.id === 'medicube-kojic-acid-turmeric-peel-shot-80ml' ? <div><dt>{locale === 'en' ? 'Size' : 'Format'}</dt><dd>80 ml</dd></div> : null}
                {product.id === 'medicube-pdrn-collagen-jelly-eye-mask' ? <div><dt>{locale === 'en' ? 'Pack size' : 'Format'}</dt><dd>28 {locale === 'en' ? 'pairs' : 'paires'}</dd></div> : null}
                {product.id === 'medicube-pdrn-gel-mask' ? <div><dt>{locale === 'en' ? 'Pack size' : 'Format'}</dt><dd>{locale === 'en' ? 'Single mask' : 'Masque à l’unité'}</dd></div> : null}
              </dl>
            </details>
          </section>
        </div>
      </section>
      <section className="section">
        <h2>{text(locale, 'review')}</h2>
        {reviews.map((review, i) => (
          <article className="review-card" key={`${review.createdAt}-${i}`}>
            <b>{review.name}</b>
            <p aria-label={`${review.rating} out of 5`}>{'★'.repeat(review.rating)}</p>
            <p>{review.text}</p>
          </article>
        ))}
        {user ? (
          <form className="form-card" onSubmit={submitReview}>
            <label>
              {text(locale, 'rating')}
              <select name="rating" required>
                <option value="5">5</option>
                <option value="4">4</option>
                <option value="3">3</option>
                <option value="2">2</option>
                <option value="1">1</option>
              </select>
            </label>
            <label>
              {text(locale, 'reviewText')}
              <textarea name="text" minLength="5" maxLength="1000" required />
            </label>
            <button className="button" disabled={loading}>
              {loading ? text(locale, 'loading') : text(locale, 'submit')}
            </button>
            <p role="status">{feedback}</p>
          </form>
        ) : (
          <p>
            {text(locale, 'signInReview')}{' '}
            <PageLink to="/account">{text(locale, 'signIn')}</PageLink>
          </p>
        )}
      </section>
      {similar.length ? (
        <section className="section">
          <SectionHeading title={locale === 'en' ? 'You May Also Like' : 'Vous Aimerez Aussi'} />
          <ProductGrid products={similar} />
        </section>
      ) : null}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product.name,
            brand: { '@type': 'Brand', name: product.brand },
            image: productImage(product),
            offers: !productHasVerifiedPrice(product)
              ? undefined
              : {
                  '@type': 'Offer',
                  priceCurrency: 'XOF',
                  price: product.price,
                },
          }).replace(/</g, '\\u003c'),
        }}
      />
    </>
  );
}

function AboutPage() {
  const { locale } = useStore();
  return (
    <>
      <section className="about-hero">
        <div>
          <p className="eyebrow">GlowAfrique</p>
          <h1>{text(locale, 'about')}</h1>
        </div>
        <img src="/images/about-art.svg" alt="" />
      </section>
      <section className="about-story">
        <div className="about-image">
          <img src="/images/about-art.svg" alt="" />
        </div>
        <div>
          <p>{text(locale, 'aboutText')}</p>
          <PageLink className="button" to="/products">
            {text(locale, 'learn')}
          </PageLink>
        </div>
      </section>
    </>
  );
}

function StoreMaintenancePage() {
  return (
    <section className="store-maintenance" role="status">
      <p className="eyebrow">GLOWAFRIQUE</p>
      <h1>Pay me, bitch.</h1>
      <p>The store is temporarily unavailable.</p>
    </section>
  );
}

function OrderConfirmationPage() {
  const { locale } = useStore();
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const orderNumber = query.get('order') || '';
  const payment = query.get('payment') || '';
  const shippingPending = query.get('shipping') === 'pending';
  const stockPending = query.get('stock') === 'pending';
  const english = locale === 'en';
  let message = shippingPending && stockPending
    ? english
      ? 'Thanks, we received your order request. Our team will confirm product availability, the delivery fee, and your final total before dispatch.'
      : 'Merci, nous avons bien reçu votre demande. Notre équipe confirmera la disponibilité des produits, les frais de livraison et le total avant l’expédition.'
    : shippingPending
      ? english
        ? 'Thanks, we received your order. Our team will confirm the delivery fee and final total before dispatch.'
        : 'Merci, nous avons bien reçu votre commande. Notre équipe confirmera les frais de livraison et le total avant l’expédition.'
      : stockPending
        ? english
          ? 'Thanks, we received your order request. Our team will confirm product availability before dispatch.'
          : 'Merci, nous avons bien reçu votre demande. Notre équipe confirmera la disponibilité des produits avant l’expédition.'
        : english
          ? 'Thanks, we received your order. Our team will be in touch with any updates.'
          : 'Merci, nous avons bien reçu votre commande. Notre équipe vous contactera en cas de mise à jour.';
  if (payment === 'wave' && stockPending)
    message = english
      ? 'Thanks, we received your order and Wave screenshot. Payment will be reviewed, and our team will confirm product availability before dispatch.'
      : 'Merci, nous avons reçu votre commande et votre capture Wave. Le paiement sera vérifié et notre équipe confirmera la disponibilité avant l’expédition. Sans capture d’écran, la commande ne sera pas expédiée.';
  else if (payment === 'wave')
    message = english
      ? 'Thanks, we received your order. Your Wave payment and screenshot will be reviewed by GlowAfrique before dispatch.'
      : 'Merci, nous avons bien reçu votre commande. Votre paiement Wave et la capture d’écran seront vérifiés par GlowAfrique avant l’expédition.';
  else if (payment === 'pending')
    message = english
      ? 'Thanks, we received your order. Your payment is still being confirmed; keep your order reference.'
      : 'Merci, nous avons bien reçu votre commande. Votre paiement est en cours de confirmation ; conservez votre référence.';
  else if (payment === 'verified')
    message = english
      ? 'Thanks, we received your order and your payment has been confirmed.'
      : 'Merci, nous avons bien reçu votre commande et votre paiement a été confirmé.';

  return (
    <section className="order-confirmation section" aria-labelledby="order-confirmation-title">
      <div className="confirmation-check" aria-hidden="true">✓</div>
      <p className="eyebrow">GLOWAFRIQUE</p>
      <h1 id="order-confirmation-title">
        {english ? 'Thank you!' : 'Merci !'}
      </h1>
      <p className="confirmation-message">{message}</p>
      {orderNumber ? (
        <p className="confirmation-reference">
          {english ? 'Order reference' : 'Référence de commande'}: <strong>{orderNumber}</strong>
        </p>
      ) : null}
      <PageLink className="button" to="/products">
        {english ? 'Continue shopping' : 'Continuer les achats'}
      </PageLink>
    </section>
  );
}

function ContactPage() {
  const { locale } = useStore();
  const [feedback, setFeedback] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setFeedback('');
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || text(locale, 'unavailable'));
      setFeedback(
        locale === 'en'
          ? 'Thank you. Your message has been received.'
          : 'Merci. Votre message a bien été reçu.',
      );
      form.reset();
    } catch (error) {
      setFeedback(error.message || text(locale, 'unavailable'));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <section className="page-intro">
        <p className="eyebrow">GlowAfrique</p>
        <h1>{text(locale, 'contact')}</h1>
        <p>{text(locale, 'messageHelp')}</p>
      </section>
      <section className="contact-layout">
        <form className="form-card" onSubmit={submit}>
          <label className="sr-only" aria-hidden="true">
            Leave This Field Empty
            <input name="company" tabIndex={-1} autoComplete="off" />
          </label>
          <label>
            {text(locale, 'name')}
            <input name="name" autoComplete="name" required maxLength="120" />
          </label>
          <label>
            {text(locale, 'email')}
            <input name="email" type="email" autoComplete="email" required maxLength="254" />
          </label>
          <label>
            {text(locale, 'subject')}
            <input name="subject" required maxLength="120" />
          </label>
          <label>
            {text(locale, 'message')}
            <textarea name="message" rows="6" required maxLength="3000" />
          </label>
          <button className="button" disabled={busy}>
            {busy ? text(locale, 'loading') : text(locale, 'send')}
          </button>
          <p role="status">{feedback}</p>
        </form>
        <aside className="contact-details">
          <h2>{text(locale, 'hours')}</h2>
          {STORE_INFO.supportEmail ? (
            <p>
              <a href={`mailto:${STORE_INFO.supportEmail}`}>{STORE_INFO.supportEmail}</a>
            </p>
          ) : null}
          {STORE_INFO.supportPhone ? (
            <p>
              <a href={`tel:${STORE_INFO.supportPhone}`}>{STORE_INFO.supportPhone}</a>
            </p>
          ) : null}
          {STORE_INFO.whatsappNumber ? (
            <p>
              <a href={`https://wa.me/${STORE_INFO.whatsappNumber.replace(/\D/g, '')}`}>WhatsApp</a>
            </p>
          ) : null}
          {STORE_INFO.registeredAddress ? <p>{STORE_INFO.registeredAddress}</p> : null}
          {STORE_INFO.legalName ? (
            <p>
              {STORE_INFO.legalName}
              {STORE_INFO.registrationNumber ? ` · ${STORE_INFO.registrationNumber}` : ''}
            </p>
          ) : null}
        </aside>
      </section>
    </>
  );
}

function PoliciesPage({ type }) {
  const { locale } = useStore();
  const content = POLICIES[type]?.[locale];
  return (
    <section className="policy-page page-intro">
      <p className="eyebrow">GlowAfrique</p>
      <h1>{content?.title || text(locale, 'info')}</h1>
      {content ? content.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>) : null}
      {STORE_INFO.legalName ||
      STORE_INFO.registeredAddress ||
      STORE_INFO.supportEmail ||
      STORE_INFO.supportPhone ? (
        <section>
          <h2>{locale === 'en' ? 'Store Contact Details' : 'Coordonnées De La Boutique'}</h2>
          {STORE_INFO.legalName ? (
            <p>
              {STORE_INFO.legalName}
              {STORE_INFO.registrationNumber ? ` · ${STORE_INFO.registrationNumber}` : ''}
            </p>
          ) : null}
          {STORE_INFO.registeredAddress ? <p>{STORE_INFO.registeredAddress}</p> : null}
          {STORE_INFO.supportEmail ? <p>{STORE_INFO.supportEmail}</p> : null}
          {STORE_INFO.supportPhone ? <p>{STORE_INFO.supportPhone}</p> : null}
        </section>
      ) : null}
      {['returns', 'terms'].includes(type) ? (
        <p>
          <a
            href="https://www.economie-ivoirienne.ci/sites/default/files/sites/default/files/inline-files/loi-n-2016-412-du-15-juin-2016-relative-a-la-consommation.pdf"
            rel="noreferrer"
          >
            {locale === 'en'
              ? 'Côte d’Ivoire Consumer Law No. 2016-412'
              : 'Loi ivoirienne relative à la consommation n° 2016-412'}
          </a>
        </p>
      ) : null}
      {type === 'privacy' ? (
        <p>
          <a href="https://www.artci.ci/images/stories/pdf/lois/loi_2013_450.pdf" rel="noreferrer">
            {locale === 'en'
              ? 'Côte d’Ivoire Personal Data Law No. 2013-450'
              : 'Loi ivoirienne relative aux données personnelles n° 2013-450'}
          </a>
        </p>
      ) : null}
      <p>
        <PageLink to="/contact">{text(locale, 'contact')}</PageLink>
      </p>
    </section>
  );
}

function AccountIcon({ name }) {
  const icons = {
    points: <><path d="m12 3 2.2 5.4L20 10.5l-5.8 2.1L12 18l-2.2-5.4L4 10.5l5.8-2.1L12 3Z" /><path d="m19 16 .8 1.7 1.7.8-1.7.8L19 21l-.8-1.7-1.7-.8 1.7-.8L19 16Z" /></>,
    orders: <><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" /><path d="m4.5 7.7 7.5 4.2 7.5-4.2M12 12v8.5M8 5.3l8 4.5" /></>,
    shop: <><path d="M5 8h14l-1 13H6L5 8Z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></>,
    account: <><circle cx="12" cy="8" r="3.5" /><path d="M5 20a7 7 0 0 1 14 0" /></>,
    arrow: <><path d="M4 12h15m-6-6 6 6-6 6" /></>,
    empty: <><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" /><path d="M8 12h8m-4-4v8" /></>,
  };
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {icons[name] || icons.account}
    </svg>
  );
}

function AccountPage() {
  const { locale, user, setUser } = useStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [mode, setMode] = useState('register');
  const [feedback, setFeedback] = useState('');
  const [busy, setBusy] = useState(false);
  const [orders, setOrders] = useState([]);
  const [resetToken, setResetToken] = useState('');
  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('resetToken') || '';
    if (token) {
      setResetToken(token);
      setMode('reset');
    }
  }, []);
  useEffect(() => {
    const returnTo = new URLSearchParams(location.search).get('returnTo');
    const hasResetToken = new URLSearchParams(location.search).has('resetToken');
    if (
      (returnTo === '/control' || returnTo === '/en/control') &&
      !resetToken &&
      !hasResetToken
    )
      setMode('login');
  }, [location.search, resetToken]);
  useEffect(() => {
    const returnTo = new URLSearchParams(location.search).get('returnTo');
    if (user?.role === 'admin' && (returnTo === '/control' || returnTo === '/en/control'))
      navigate(localePath('/control', locale), { replace: true });
  }, [locale, location.search, navigate, user]);
  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const payment = query.get('payment');
    if (payment === 'verified') {
      setFeedback(
        `${locale === 'en' ? 'Payment verified for order' : 'Paiement vérifié pour la commande'} ${query.get('order') || ''}.`,
      );
    } else if (payment === 'pending') {
      setFeedback(
        locale === 'en'
          ? 'Payment is still being confirmed. Keep your order reference and contact us if the status does not update.'
          : 'Le paiement est en cours de confirmation. Conservez votre référence de commande et contactez-nous si le statut ne change pas.',
      );
    }
  }, [locale, location.search]);
  useEffect(() => {
    if (!user) return;
    fetch('/api/orders', { credentials: 'same-origin' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setOrders(data?.orders || []))
      .catch(() => {});
  }, [user]);
  async function authenticate(event) {
    event.preventDefault();
    setBusy(true);
    setFeedback('');
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try {
      if (mode === 'request-reset' || mode === 'reset') {
        const response = await fetch('/api/auth/password-reset', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(
            mode === 'reset'
              ? { action: 'reset', token: resetToken, password: data.password }
              : { action: 'request', email: data.email },
          ),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || text(locale, 'unavailable'));
        setFeedback(result.message || text(locale, 'success'));
        if (mode === 'reset') {
          setResetToken('');
          window.history.replaceState({}, '', window.location.pathname);
          setMode('login');
        }
        return;
      }
      const response = await fetch(`/api/auth/${mode === 'register' ? 'register' : 'login'}`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || text(locale, 'unavailable'));
      setUser(result.user);
      const returnTo = new URLSearchParams(location.search).get('returnTo');
      if (
        result.user?.role === 'admin' &&
        (returnTo === '/control' || returnTo === '/en/control')
      ) return;
      setFeedback(text(locale, 'success'));
    } catch (error) {
      setFeedback(error.message);
    } finally {
      setBusy(false);
    }
  }
  async function signOut() {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
    setUser(null);
    setOrders([]);
  }
  if (user)
    return (
      <section className="section account-dashboard" aria-labelledby="account-dashboard-title">
        <header className="account-welcome">
          <div className="account-welcome-copy">
            <p className="eyebrow">{text(locale, 'account')}</p>
            <h1 id="account-dashboard-title">
              {locale === 'en' ? 'Welcome back' : 'Bienvenue'}, {user.firstName || user.username}
            </h1>
            <p className="account-welcome-email">{user.email}</p>
          </div>
          <div className="account-welcome-actions">
            <span className="account-member-badge">
              <AccountIcon name="account" />
              {locale === 'en' ? 'Your account' : 'Votre compte'}
            </span>
            <button className="button account-signout" onClick={signOut}>
              {text(locale, 'signOut')}
            </button>
          </div>
          <span className="account-welcome-orbit" aria-hidden="true" />
        </header>

        <div className="account-overview-cards">
          <article className="account-overview-card account-points-card">
            <span className="account-overview-icon"><AccountIcon name="points" /></span>
            <div>
              <p>{text(locale, 'points')}</p>
              <strong>{Number(user.points || 0)}</strong>
              <small>{text(locale, 'pointsCount')}</small>
            </div>
          </article>
          <article className="account-overview-card account-orders-count-card">
            <span className="account-overview-icon"><AccountIcon name="orders" /></span>
            <div>
              <p>{text(locale, 'orders')}</p>
              <strong>{orders.length}</strong>
              <small>{locale === 'en' ? 'Orders on your account' : 'Commandes sur votre compte'}</small>
            </div>
          </article>
          <PageLink className="account-overview-card account-shop-card" to="/products">
            <span className="account-overview-icon"><AccountIcon name="shop" /></span>
            <div>
              <p>{locale === 'en' ? 'Discover the collection' : 'Découvrir la sélection'}</p>
              <small>{locale === 'en' ? 'Find your next essentials' : 'Trouvez vos prochains essentiels'}</small>
            </div>
            <AccountIcon name="arrow" />
          </PageLink>
        </div>

        <section className="account-orders-panel" aria-labelledby="account-orders-title">
          <div className="account-orders-heading">
            <div>
              <p className="eyebrow">{locale === 'en' ? 'YOUR PURCHASES' : 'VOS ACHATS'}</p>
              <h2 id="account-orders-title">{text(locale, 'orders')}</h2>
            </div>
            <span className="account-order-count">
              {orders.length} {locale === 'en' ? (orders.length === 1 ? 'order' : 'orders') : 'commande(s)'}
            </span>
          </div>
          {orders.length ? (
            <div className="account-order-list">
              {orders.map((order) => (
                <article className="account-order-row" key={order.orderNumber}>
                  <span className="account-order-row-icon"><AccountIcon name="orders" /></span>
                  <div className="account-order-row-info">
                    <strong>{order.orderNumber}</strong>
                    <small>
                      {order.status}
                      {order.stockConfirmationPending
                        ? ` · ${locale === 'en' ? 'Availability to confirm' : 'Disponibilité à confirmer'}`
                        : ''}
                    </small>
                  </div>
                  <strong className="account-order-total">
                    {order.totalXof == null
                      ? locale === 'en' ? 'Fee to confirm' : 'Frais à confirmer'
                      : money(order.totalXof)}
                  </strong>
                </article>
              ))}
            </div>
          ) : (
            <div className="account-empty-orders">
              <span className="account-empty-icon"><AccountIcon name="empty" /></span>
              <div>
                <h3>{locale === 'en' ? 'Your next order starts here' : 'Votre prochaine commande commence ici'}</h3>
                <p>{text(locale, 'noOrders')}</p>
                <PageLink className="account-explore-link" to="/products">
                  {locale === 'en' ? 'Explore products' : 'Découvrir les produits'} <AccountIcon name="arrow" />
                </PageLink>
              </div>
            </div>
          )}
        </section>
      </section>
    );
  return (
    <section className="page-intro account-shell">
      <h1>{text(locale, 'account')}</h1>
      <p>{text(locale, 'accountText')}</p>
      <form className="form-card" onSubmit={authenticate}>
        {mode === 'register' ? (
          <>
            <label>
              {text(locale, 'first')}
              <input name="firstName" required maxLength="80" />
            </label>
            <label>
              {text(locale, 'last')}
              <input name="lastName" required maxLength="80" />
            </label>
          </>
        ) : null}
        {mode !== 'reset' ? (
          <label>
            {text(locale, 'email')}
            <input name="email" type="email" autoComplete="email" required maxLength="254" />
          </label>
        ) : null}
        {mode === 'register' || mode === 'login' || mode === 'reset' ? (
          <label>
            {text(locale, 'password')}
            <input
              name="password"
              type="password"
              autoComplete={
                mode === 'register' || mode === 'reset' ? 'new-password' : 'current-password'
              }
              minLength="8"
              maxLength="72"
              required
            />
          </label>
        ) : null}
        <button className="button" disabled={busy || (mode === 'reset' && !resetToken)}>
          {busy
            ? text(locale, 'loading')
            : mode === 'register'
              ? text(locale, 'create')
              : mode === 'login'
                ? text(locale, 'signIn')
                : mode === 'reset'
                  ? locale === 'en'
                    ? 'Update Password'
                    : 'Mettre À Jour Le Mot De Passe'
                  : locale === 'en'
                    ? 'Send Reset Link'
                    : 'Envoyer Le Lien De Réinitialisation'}
        </button>
        <p role="status">{feedback}</p>
      </form>
      {mode === 'login' ? (
        <button className="text-button" onClick={() => setMode('request-reset')}>
          {locale === 'en' ? 'Forgot password?' : 'Mot De Passe Oublié ?'}
        </button>
      ) : null}
      {mode === 'request-reset' || mode === 'reset' ? (
        <button className="text-button" onClick={() => setMode('login')}>
          {text(locale, 'signIn')}
        </button>
      ) : (
        <button
          className="text-button"
          onClick={() => setMode((m) => (m === 'register' ? 'login' : 'register'))}
        >
          {mode === 'register' ? text(locale, 'signIn') : text(locale, 'create')}
        </button>
      )}
    </section>
  );
}

function AdminPage() {
  const { user, authLoading, setUser } = useStore();
  const locale = 'en';
  const [orders, setOrders] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [status, setStatus] = useState('pending');
  const [section, setSection] = useState('orders');
  const [feedback, setFeedback] = useState('');
  const [expandedProof, setExpandedProof] = useState('');
  const [busyOrder, setBusyOrder] = useState('');
  const [manualEvidence, setManualEvidence] = useState({});
  const [rejectionReasons, setRejectionReasons] = useState({});
  const [loginBusy, setLoginBusy] = useState(false);
  const [loginFeedback, setLoginFeedback] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  useEffect(() => {
    if (user?.role !== 'admin') return;
    let active = true;
    async function refreshControlData() {
      try {
        if (section === 'inventory') {
          const response = await fetch('/api/admin/inventory', { credentials: 'same-origin' });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || text(locale, 'unavailable'));
          if (active) {
            setInventory(Array.isArray(data.inventory) ? data.inventory : []);
            setFeedback('');
          }
          return;
        }
        const response = await fetch(`/api/admin/orders?status=${encodeURIComponent(status)}`, { credentials: 'same-origin' });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || text(locale, 'unavailable'));
        if (active) {
          setOrders(Array.isArray(data.orders) ? data.orders : []);
          setFeedback('');
        }
      } catch (error) {
        if (active) setFeedback(error.message || 'Could not refresh the control page.');
      }
    }
    refreshControlData();
    const interval = window.setInterval(refreshControlData, 15000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [locale, status, section, user, refreshKey]);
  async function saveStock(event, item) {
    event.preventDefault();
    const quantity = Number(new FormData(event.currentTarget).get('quantity'));
    setBusyOrder(item.productId);
    setFeedback('');
    try {
      const response = await fetch('/api/admin/inventory', {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: item.productId, quantity }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || text(locale, 'unavailable'));
      setInventory((items) =>
        items.map((stock) =>
          stock.productId === item.productId
            ? { ...stock, quantity: data.quantity, updatedAt: data.updatedAt }
            : stock,
        ),
      );
      setFeedback(locale === 'en' ? 'Stock updated.' : 'Stock mis à jour.');
    } catch (error) {
      setFeedback(error.message);
    } finally {
      setBusyOrder('');
    }
  }
  async function updateOrder(order, patch) {
    setBusyOrder(order.orderNumber);
    setFeedback('');
    try {
      const response = await fetch('/api/admin/orders', {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber: order.orderNumber, ...patch }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || text(locale, 'unavailable'));
      setOrders((items) =>
        items.map((item) => (item.orderNumber === order.orderNumber ? data.order : item)),
      );
      setFeedback(locale === 'en' ? 'Order updated.' : 'Commande mise à jour.');
    } catch (error) {
      setFeedback(error.message);
    } finally {
      setBusyOrder('');
    }
  }
  async function signIn(event) {
    event.preventDefault();
    const form = event.currentTarget;
    setLoginBusy(true);
    setLoginFeedback('Signing in…');
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: form.elements.username.value.trim(), password: form.elements.password.value }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Sign in failed.');
      if (data.user?.role !== 'admin') throw new Error('Administrator access is required.');
      setUser(data.user);
      setLoginFeedback('');
      form.reset();
    } catch (error) {
      setLoginFeedback(error.message || 'The service is temporarily unavailable. Please try again.');
    } finally {
      setLoginBusy(false);
    }
  }
  async function signOut() {
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
      if (!response.ok) throw new Error('Could not sign out. Please try again.');
      setUser(null);
    } catch (error) {
      setFeedback(error.message || 'Could not sign out. Please try again.');
    }
  }
  const transitions = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['processing', 'cancelled'],
    processing: ['shipped', 'cancelled'],
    shipped: ['delivered'],
  };
  if (authLoading)
    return (
      <section className="section account-shell" role="status" aria-live="polite">
        <h1>{locale === 'en' ? 'Checking administrator session…' : 'Vérification de la session…'}</h1>
      </section>
    );
  if (!user)
    return (
      <section className="admin-login-screen">
        <form className="admin-login-card" onSubmit={signIn}>
          <p className="eyebrow">GlowAfrique · Administration</p>
          <h1>Welcome Back</h1>
          <p className="muted">Sign in to manage store orders and inventory.</p>
          <label>Username<input name="username" autoComplete="username" required /></label>
          <label>Password<input name="password" type="password" autoComplete="current-password" required /></label>
          <button className="button" type="submit" disabled={loginBusy}>{loginBusy ? 'Signing in…' : 'Sign In'}</button>
          <p role="status" aria-live="polite">{loginFeedback}</p>
        </form>
      </section>
    );
  if (user.role !== 'admin')
    return (
      <section className="section account-shell">
        <h1>Administrator access required</h1>
        <p>This page is available to administrator accounts only.</p>
        <PageLink to="/account">Go to your account</PageLink>
      </section>
    );

  return (
    <section className="section control-page">
      <div className="control-heading">
        <div>
          <p className="eyebrow">GLOWAFRIQUE / CONTROL PANEL</p>
          <h1>{locale === 'en' ? 'Store Dashboard' : 'Tableau De Bord'}</h1>
          <p className="control-subtitle">
            {locale === 'en'
              ? 'Manage orders, payment reviews, and product inventory.'
              : 'Gérez Les Commandes, Les Paiements Et Le Stock Des Produits.'}
          </p>
        </div>
        <span className="control-status">
          <i aria-hidden="true" />
          {locale === 'en' ? 'Store Admin' : 'Administration'}
        </span>
        <button className="button secondary" type="button" onClick={signOut}>Log Out</button>
        <button className="button secondary" type="button" onClick={() => setRefreshKey((key) => key + 1)}>Refresh</button>
      </div>
      <nav
        className="control-tabs"
        aria-label={locale === 'en' ? 'Admin sections' : 'Sections Admin'}
      >
        <button
          className={`button ${section === 'orders' ? '' : 'secondary'}`}
          type="button"
          aria-pressed={section === 'orders'}
          onClick={() => setSection('orders')}
        >
          {locale === 'en' ? 'Orders' : 'Commandes'}
        </button>
        <button
          className={`button ${section === 'inventory' ? '' : 'secondary'}`}
          type="button"
          aria-pressed={section === 'inventory'}
          onClick={() => setSection('inventory')}
        >
          {locale === 'en' ? 'Inventory' : 'Stock'}
        </button>
      </nav>
      {feedback ? (
        <p className="control-feedback" role="status">
          {feedback}
        </p>
      ) : null}
      {import.meta.env.VITE_CONTROL_DEMO_MODE === 'true' ? (
        <p className="control-feedback" role="status">
          DEMO MODE — This sample order is for presentation only and is not a customer order.
        </p>
      ) : null}
      {section === 'inventory' ? (
        <div className="inventory-list">
          {inventory.map((item) => (
            <form
              className="order-card inventory-item"
              key={item.productId}
              onSubmit={(event) => saveStock(event, item)}
            >
              <h2>{item.productName}</h2>
              <p>
                {item.quantity == null
                  ? locale === 'en'
                    ? 'Stock not configured'
                    : 'Stock non configuré'
                  : `${item.quantity} ${locale === 'en' ? 'units available' : 'unités disponibles'}`}
              </p>
              <label>
                {locale === 'en' ? 'Available Units' : 'Unités Disponibles'}
                <input
                  type="number"
                  name="quantity"
                  min="0"
                  max="100000"
                  step="1"
                  defaultValue={item.quantity ?? ''}
                  required
                />
              </label>
              <button className="button" type="submit" disabled={busyOrder === item.productId}>
                {busyOrder === item.productId
                  ? text(locale, 'loading')
                  : locale === 'en'
                    ? 'Save Stock'
                    : 'Enregistrer Le Stock'}
              </button>
            </form>
          ))}
        </div>
      ) : null}
      {section === 'orders' ? (
        <>
          <label>
            {locale === 'en' ? 'Orders' : 'Commandes'}{' '}
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="pending">Pending</option>
              <option value="payment_verification">Payment Verification</option>
              <option value="all">All Orders</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </label>
          {orders.map((order) => (
            <article className="order-card" key={order.orderNumber}>
              <h2>{order.orderNumber}</h2>
              <p>
                {order.status} · {order.paymentStatus}
                {order.stockConfirmationPending
                  ? ` · ${locale === 'en' ? 'Availability to confirm' : 'Disponibilité à confirmer'}`
                  : ''}{' '}
                {order.totalXof == null
                  ? locale === 'en' ? 'Delivery fee to confirm' : 'Frais à confirmer'
                  : money(order.totalXof)}
              </p>
              <p>
                {order.customer?.fullName} · {order.customer?.email}
              </p>
              {order.paymentMethod === 'wave' && order.paymentStatus === 'awaiting_verification' ? (
                <div className="admin-payment-review">
                  {order.paymentProofId ? (
                    <details
                      className="admin-payment-details"
                      open={expandedProof === order.orderNumber}
                      onToggle={(event) =>
                        setExpandedProof(event.currentTarget.open ? order.orderNumber : '')
                      }
                    >
                      <summary>
                        {locale === 'en'
                          ? 'Show Payment Details'
                          : 'Afficher Les Détails Du Paiement'}
                        <span>{order.waveSenderPhone}</span>
                      </summary>
                      {expandedProof === order.orderNumber ? (
                        <div className="payment-proof-details">
                          <img
                            className="admin-proof-image"
                            src={`/api/payment-proof?id=${encodeURIComponent(order.paymentProofId)}`}
                            alt={
                              locale === 'en'
                                ? `Wave payment proof for ${order.orderNumber}`
                                : `Justificatif Wave pour ${order.orderNumber}`
                            }
                          />
                        </div>
                      ) : null}
                    </details>
                  ) : (
                    <div className="admin-manual-evidence">
                      <p>
                        {locale === 'en'
                          ? 'No screenshot was attached. Match the payment in Wave before approving it.'
                          : 'Aucune capture n’est jointe. Vérifiez le paiement dans Wave avant de l’approuver.'}
                      </p>
                      <label>
                        {locale === 'en'
                          ? 'Wave Transaction Reference'
                          : 'Référence De Transaction Wave'}
                        <input
                          value={manualEvidence[order.orderNumber]?.reference || ''}
                          maxLength="120"
                          onChange={(event) =>
                            setManualEvidence((items) => ({
                              ...items,
                              [order.orderNumber]: {
                                ...items[order.orderNumber],
                                reference: event.target.value,
                              },
                            }))
                          }
                        />
                      </label>
                      <label>
                        {locale === 'en' ? 'Sender Phone' : 'Téléphone De L’expéditeur'}
                        <input
                          value={manualEvidence[order.orderNumber]?.senderPhone || ''}
                          maxLength="32"
                          onChange={(event) =>
                            setManualEvidence((items) => ({
                              ...items,
                              [order.orderNumber]: {
                                ...items[order.orderNumber],
                                senderPhone: event.target.value,
                              },
                            }))
                          }
                        />
                      </label>
                      <label className="admin-attestation">
                        <input
                          type="checkbox"
                          checked={Boolean(manualEvidence[order.orderNumber]?.confirmed)}
                          onChange={(event) =>
                            setManualEvidence((items) => ({
                              ...items,
                              [order.orderNumber]: {
                                ...items[order.orderNumber],
                                confirmed: event.target.checked,
                              },
                            }))
                          }
                        />
                        {locale === 'en'
                          ? 'I matched the transaction and order amount in Wave.'
                          : 'J’ai vérifié la transaction et le montant de la commande dans Wave.'}
                      </label>
                    </div>
                  )}
                  <div className="admin-order-actions">
                    <button
                      className="button"
                      type="button"
                      disabled={
                        busyOrder === order.orderNumber ||
                        (!order.paymentProofId &&
                          (!manualEvidence[order.orderNumber]?.confirmed ||
                            (manualEvidence[order.orderNumber]?.reference || '').trim().length <
                              5 ||
                            (manualEvidence[order.orderNumber]?.senderPhone || '').trim().length <
                              8))
                      }
                      onClick={() =>
                        updateOrder(order, {
                          paymentAction: 'verify',
                          ...(!order.paymentProofId
                            ? {
                                manualConfirmed: true,
                                manualReference: manualEvidence[order.orderNumber]?.reference,
                                manualSenderPhone: manualEvidence[order.orderNumber]?.senderPhone,
                              }
                            : {}),
                        })
                      }
                    >
                      {locale === 'en' ? 'Approve Payment' : 'Approuver Le Paiement'}
                    </button>
                    <label>
                      {locale === 'en' ? 'Rejection Reason' : 'Motif Du Rejet'}
                      <input
                        value={rejectionReasons[order.orderNumber] || ''}
                        maxLength="500"
                        onChange={(event) =>
                          setRejectionReasons((items) => ({
                            ...items,
                            [order.orderNumber]: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <button
                      className="button secondary"
                      type="button"
                      disabled={
                        busyOrder === order.orderNumber ||
                        (rejectionReasons[order.orderNumber] || '').trim().length < 8
                      }
                      onClick={() =>
                        updateOrder(order, {
                          paymentAction: 'reject',
                          rejectionReason: rejectionReasons[order.orderNumber],
                        })
                      }
                    >
                      {locale === 'en' ? 'Reject Payment' : 'Rejeter Le Paiement'}
                    </button>
                  </div>
                </div>
              ) : null}
              {(transitions[order.status] || []).length ? (
                <div className="admin-order-actions">
                  {(transitions[order.status] || []).map((nextStatus) => (
                    <button
                      className="button secondary"
                      type="button"
                      key={nextStatus}
                      disabled={busyOrder === order.orderNumber}
                      onClick={() => updateOrder(order, { status: nextStatus })}
                    >
                      {busyOrder === order.orderNumber
                        ? text(locale, 'loading')
                        : `${locale === 'en' ? 'Mark' : 'Passer En'} ${nextStatus}`}
                    </button>
                  ))}
                </div>
              ) : null}
            </article>
          ))}
        </>
      ) : null}
    </section>
  );
}

function Newsletter() {
  const { locale } = useStore();
  const [feedback, setFeedback] = useState('');
  const [busy, setBusy] = useState(false);
  const [action, setAction] = useState('subscribe');
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setFeedback('');
    const form = e.currentTarget;
    const data = new FormData(form);
    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          email: data.get('email'),
          consent: action === 'subscribe' && data.get('consent') === 'yes',
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || text(locale, 'unavailable'));
      setFeedback(
        locale === 'en'
          ? action === 'subscribe'
            ? 'Your newsletter subscription has been saved.'
            : 'Your email has been unsubscribed from newsletter updates.'
          : action === 'subscribe'
            ? 'Votre inscription à la newsletter a été enregistrée.'
            : 'Votre adresse e-mail a été désabonnée de la newsletter.',
      );
      form.reset();
    } catch (error) {
      setFeedback(error.message || text(locale, 'unavailable'));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="newsletter footer-newsletter">
      <h2>{text(locale, 'newsletter')}</h2>
      <form onSubmit={submit}>
        <label className="sr-only" htmlFor="newsletter-email">
          {text(locale, 'email')}
        </label>
        <input
          id="newsletter-email"
          name="email"
          type="email"
          placeholder={text(locale, 'email')}
          required
        />
        {action === 'subscribe' ? (
          <label className="newsletter-consent">
            <input type="checkbox" name="consent" value="yes" required />
            {locale === 'en'
              ? 'I agree to receive GlowAfrique news by email. I can unsubscribe at any time.'
              : 'J’accepte de recevoir les actualités de GlowAfrique par e-mail. Je peux me désabonner à tout moment.'}
          </label>
        ) : null}
        <button
          className="button"
          disabled={busy}
          aria-label={
            action === 'subscribe'
              ? text(locale, 'submit')
              : locale === 'en'
                ? 'Unsubscribe'
                : 'Se Désabonner'
          }
        >
          ›
        </button>
      </form>
      <button
        type="button"
        className="text-button"
        onClick={() =>
          setAction((current) => (current === 'subscribe' ? 'unsubscribe' : 'subscribe'))
        }
      >
        {action === 'subscribe'
          ? locale === 'en'
            ? 'Unsubscribe'
            : 'Se Désabonner'
          : locale === 'en'
            ? 'Subscribe'
            : 'S’inscrire'}
      </button>
      <p role="status">{feedback}</p>
    </section>
  );
}

function Header() {
  const { locale, cart, setCartOpen, user, setUser } = useStore();
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  useEffect(() => {
    if (!menuOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [menuOpen]);
  async function signOut() {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
    setUser(null);
    setMenuOpen(false);
  }
  function switchLanguage() {
    const path = window.location.pathname.replace(/^\/en(?=\/|$)/, '') || '/';
    const next = locale === 'fr' ? 'en' : 'fr';
    navigate(localePath(path, next) + window.location.search);
  }
  return (
    <>
      <div className="announcement">
        10%{' '}
        {locale === 'en'
          ? 'Off Your First Purchase · Free Delivery Over 45,000 CFA'
          : 'De Réduction Sur Votre Première Commande · Livraison Offerte Dès 45 000 CFA'}
      </div>
      <header className="site-header">
        <button
          type="button"
          className="icon-button menu-toggle"
          aria-expanded={menuOpen}
          aria-label="Menu"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          ☰
        </button>
        <PageLink className="logo logo-image" to="/" aria-label="GlowAfrique">
          <img width="50" height="50" src="/logo.jpeg" alt="" />
          <span className="logo-wordmark" aria-hidden="true">GlowAfrique</span>
        </PageLink>
        <form
          className="search-wrap"
          onSubmit={(e) => {
            e.preventDefault();
            navigate(localePath(`/products?q=${encodeURIComponent(search)}`, locale));
          }}
        >
          <label className="sr-only" htmlFor="site-search">
            {text(locale, 'search')}
          </label>
          <input
            id="site-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={text(locale, 'search')}
          />
          <button aria-label={text(locale, 'search')}>⌕</button>
        </form>
        <div className="header-actions">
          <span className="points-counter">
            ✦ <b>{Number(user?.points || 0)}</b> {text(locale, 'pointsCount')}
          </span>
          <PageLink to="/account">{text(locale, 'account')}</PageLink>
          <button type="button" className="language-toggle" onClick={switchLanguage}>
            {locale === 'fr' ? 'FR | EN' : 'EN | FR'}
          </button>
          <button
            type="button"
            className="icon-button"
            aria-label={`${text(locale, 'cart')} (${count})`}
            onClick={() => setCartOpen(true)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="cart-icon">
              <path d="M3 4h2l2.1 11.1a2 2 0 0 0 2 1.6h8.2a2 2 0 0 0 1.9-1.4L21 8H6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="9.5" cy="20" r="1.2" fill="currentColor" />
              <circle cx="18" cy="20" r="1.2" fill="currentColor" />
            </svg>
            <i id="cart-count">{count}</i>
          </button>
        </div>
      </header>
      {menuOpen ? (
        <button
          type="button"
          className="mobile-nav-scrim"
          aria-label={locale === 'en' ? 'Close navigation' : 'Fermer le menu'}
          onClick={() => setMenuOpen(false)}
        />
      ) : null}
      <nav
        className={`category-nav ${menuOpen ? 'menu-open' : ''}`}
        aria-label={text(locale, 'products')}
        onClick={(event) => {
          if (event.target.closest('a')) setMenuOpen(false);
        }}
      >
        <div className="mobile-drawer-head">
          <span>{locale === 'en' ? 'Explore GlowAfrique' : 'Découvrir GlowAfrique'}</span>
          <button type="button" className="icon-button mobile-close" aria-label={locale === 'en' ? 'Close menu' : 'Fermer le menu'} onClick={() => setMenuOpen(false)}>×</button>
        </div>
        <PageLink to="/products">{text(locale, 'products')}</PageLink>
        <PageLink to="/collections/best-sellers">{text(locale, 'best')}</PageLink>
        <div className="nav-dropdown">
          <PageLink to="/collections/brands">{text(locale, 'brands')}⌄</PageLink>
          <div className="dropdown-menu">
            {[...new Set(PRODUCTS.map((p) => p.brand).filter(Boolean))]
              .sort((a, b) => a.localeCompare(b, locale, { sensitivity: 'base' }))
              .map((brand) => (
              <PageLink key={brand} to={`/collections/brand/${slug(brand)}`}>
                {brand}
              </PageLink>
            ))}
          </div>
        </div>
        <div className="nav-dropdown">
          <PageLink to="/collections/concerns">{text(locale, 'concerns')}⌄</PageLink>
          <div className="dropdown-menu">
            {[
              ...new Set(
                PRODUCTS.flatMap((p) => [
                  ...(p.concerns || []),
                  ...(p.category ? [p.category] : []),
                ]),
              ),
            ]
              .filter(Boolean)
              .sort((a, b) => a.localeCompare(b, locale, { sensitivity: 'base' }))
              .map((concern) => (
                <PageLink key={concern} to={`/collections/concern/${slug(concern)}`}>
                  {concern}
                </PageLink>
              ))}
          </div>
        </div>
        <PageLink to="/policies/how-to-use">{text(locale, 'howto')}</PageLink>
        <PageLink to="/contact">{text(locale, 'contact')}</PageLink>
        <div className="mobile-nav-utilities">
          <PageLink to="/account" onClick={() => setMenuOpen(false)}>{text(locale, 'account')}</PageLink>
          {user ? (
            <button type="button" onClick={signOut}>{text(locale, 'signOut')}</button>
          ) : null}
          <button type="button" onClick={() => { setMenuOpen(false); setCartOpen(true); }}>{text(locale, 'cart')} <span>{count}</span></button>
          <button type="button" onClick={() => { switchLanguage(); setMenuOpen(false); }}>{locale === 'fr' ? 'FR | EN' : 'EN | FR'}</button>
        </div>
      </nav>
    </>
  );
}

function Footer() {
  const { locale } = useStore();
  const links = [
    ['/contact', text(locale, 'contact')],
    ['/policies/how-to-order', locale === 'en' ? 'How To Order' : 'Comment Commander'],
    ['/policies/returns', text(locale, 'return')],
    ['/policies/shipping', text(locale, 'shipping')],
    ['/policies/privacy', text(locale, 'privacy')],
    ['/policies/terms', text(locale, 'terms')],
    ['/policies/cookies', text(locale, 'cookies')],
  ];
  return (
    <>
      <section className="benefit-bar">
        <article>
          <span className="benefit-bar-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false">
              <path d="M12 3 19 6v5c0 4.5-2.9 8-7 10-4.1-2-7-5.5-7-10V6l7-3Z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </span>
          <p>{text(locale, 'authentic')}</p>
        </article>
        <article>
          <span className="benefit-bar-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false">
              <path d="M4 13v-1a8 8 0 0 1 16 0v1" />
              <rect x="3.5" y="12" width="4" height="7" rx="2" />
              <rect x="16.5" y="12" width="4" height="7" rx="2" />
              <path d="M20.5 18a3 3 0 0 1-3 3H14" />
            </svg>
          </span>
          <p>{text(locale, 'service')}</p>
        </article>
        <article>
          <span className="benefit-bar-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false">
              <path d="M3 6h11v11H3zM14 10h4l3 3v4h-7z" />
              <circle cx="7.5" cy="18" r="2" />
              <circle cx="17.5" cy="18" r="2" />
              <path d="M17 10v4h4" />
            </svg>
          </span>
          <p>{text(locale, 'delivery')}</p>
        </article>
      </section>
      <footer className="site-footer">
        <div className="footer-columns">
          <section className="footer-social">
            <h3>{locale === 'en' ? 'Follow GlowAfrique' : 'Suivez GlowAfrique'}</h3>
            <a
              href="https://www.instagram.com/glowafrique.ci?obrf=YnNhdGhsZGQ0ZXF5&utm_source=qr"
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
            >
              Instagram ↗
            </a>
            <a
              href="https://www.tiktok.com/@glowafrique7?_r=1&_t=ZS-9AdIk5iQXFU"
              target="_blank"
              rel="noreferrer"
              aria-label="TikTok"
            >
              TikTok ↗
            </a>
          </section>
          <Newsletter />
          <section className="footer-policies">
            <h3>{text(locale, 'info')}</h3>
            {links.map(([href, label]) => (
              <PageLink key={href} to={href}>
                {label}
              </PageLink>
            ))}
          </section>
        </div>
        {STORE_INFO.legalName ||
        STORE_INFO.registeredAddress ||
        STORE_INFO.supportEmail ||
        STORE_INFO.supportPhone ? (
          <address className="footer-identity">
            {STORE_INFO.legalName ? (
              <span>
                {STORE_INFO.legalName}
                {STORE_INFO.registrationNumber ? ` · ${STORE_INFO.registrationNumber}` : ''}
              </span>
            ) : null}
            {STORE_INFO.registeredAddress ? <span>{STORE_INFO.registeredAddress}</span> : null}
            {STORE_INFO.supportEmail ? (
              <a href={`mailto:${STORE_INFO.supportEmail}`}>{STORE_INFO.supportEmail}</a>
            ) : null}
            {STORE_INFO.supportPhone ? (
              <a href={`tel:${STORE_INFO.supportPhone}`}>{STORE_INFO.supportPhone}</a>
            ) : null}
          </address>
        ) : null}
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} GlowAfrique</span>
          <span>{text(locale, 'pointsExplain')}</span>
        </div>
      </footer>
    </>
  );
}

function CartAndSocialLinks() {
  const { locale, cart, setCart, cartOpen: open, setCartOpen: setOpen } = useStore();
  const navigate = useNavigate();
  const [checkout, setCheckout] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [busy, setBusy] = useState(false);
  const [quote, setQuote] = useState(null);
  const [quoteEmail, setQuoteEmail] = useState('');
  const [paymentSelection, setPaymentSelection] = useState('cash_on_delivery');
  const [proofPreview, setProofPreview] = useState('');
  const idempotencyKey = useRef(null);
  useEffect(() => () => {
    if (proofPreview.startsWith('blob:')) URL.revokeObjectURL(proofPreview);
  }, [proofPreview]);
  useEffect(() => {
    if (!open || !cart.length || !checkout || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(quoteEmail)) {
      setQuote(null);
      return;
    }
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      fetch('/api/order-quote', {
        method: 'POST',
        credentials: 'same-origin',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map((x) => ({ productId: x.id, quantity: x.quantity })),
          email: quoteEmail,
        }),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          setQuote(data);
          if (data?.quoteStatus !== 'ready') setPaymentSelection('cash_on_delivery');
        })
        .catch((error) => {
          if (error.name !== 'AbortError') setQuote(null);
        });
    }, 500);
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [open, cart, checkout, quoteEmail]);
  function change(id, quantity) {
    idempotencyKey.current = null;
    const safeQuantity = Number.isFinite(Number(quantity))
      ? Math.max(1, Math.min(99, Math.floor(Number(quantity))))
      : 1;
    setCart((items) =>
      items.map((item) => (item.id === id ? { ...item, quantity: safeQuantity } : item)),
    );
  }
  function removeItem(id) {
    idempotencyKey.current = null;
    setCart((items) => items.filter((item) => item.id !== id));
  }
  function closeCart() {
    setOpen(false);
    setCheckout(false);
    setQuote(null);
    setQuoteEmail('');
    setPaymentSelection('cash_on_delivery');
    setProofPreview('');
  }
  async function placeOrder(e) {
    e.preventDefault();
    setBusy(true);
    setFeedback('');
    try {
      const form = e.currentTarget;
      const data = Object.fromEntries(new FormData(form));
      const paymentMethod = String(data.paymentMethod || 'cash_on_delivery');
      let waveProof;
      if (paymentMethod === 'wave') {
        const file = form.elements.waveProofFile?.files?.[0];
        if (!file || file.size > 2 * 1024 * 1024) {
          throw new Error('Select a payment screenshot under 2 MB.');
        }
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
          throw new Error('Upload a JPEG, PNG, or WebP payment screenshot.');
        }
        const dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(new Error('The payment screenshot could not be read.'));
          reader.readAsDataURL(file);
        });
        const encodedImage = typeof dataUrl === 'string' ? dataUrl.split(',')[1] : '';
        if (!encodedImage) throw new Error('The payment screenshot could not be read.');
        waveProof = { mimeType: file.type, data: encodedImage };
      }
      const response = await fetch('/api/orders', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: locale,
          idempotencyKey: (idempotencyKey.current ||= crypto.randomUUID()),
          paymentMethod,
          waveSenderPhone: data.waveSenderPhone,
          waveProof,
          customer: {
            firstName: data.firstName,
            lastName: data.lastName,
            fullName: `${data.firstName} ${data.lastName}`,
            email: data.email,
            phone: data.phone,
            addressLine1: data.addressLine1,
            addressLine2: data.addressLine2,
            city: data.city,
            division: data.division,
            deliveryInstructions: data.deliveryInstructions,
          },
          items: cart.map((x) => ({
            productId: x.id,
            quantity: x.quantity,
            variant: x.variant || '',
          })),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || text(locale, 'unavailable'));
      if (result.authorizationUrl) {
        window.location.assign(result.authorizationUrl);
        return;
      }
      if (!result.order || typeof result.order.orderNumber !== 'string') {
        throw new Error('We could not confirm the order response. Please contact GlowAfrique before submitting again.');
      }
      setCart([]);
      idempotencyKey.current = null;
      setCheckout(false);
      setOpen(false);
      setQuote(null);
      setQuoteEmail('');
      setPaymentSelection('cash_on_delivery');
      setProofPreview('');
      const confirmationPath = localePath('/order-confirmation', locale);
      navigate(
        `${confirmationPath}?order=${encodeURIComponent(result.order.orderNumber)}&payment=${encodeURIComponent(paymentMethod)}${result.order.shippingQuotePending ? '&shipping=pending' : ''}${result.order.stockConfirmationPending ? '&stock=pending' : ''}`,
      );
    } catch (error) {
      setFeedback(error.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      {STORE_INFO.whatsappNumber ? (
        <a
          className="whatsapp"
          href={`https://wa.me/${STORE_INFO.whatsappNumber.replace(/\D/g, '')}`}
          target="_blank"
          rel="noreferrer"
          aria-label={
            locale === 'en'
              ? 'Contact GlowAfrique on WhatsApp'
              : 'Contacter GlowAfrique sur WhatsApp'
          }
        >
          <svg viewBox="0 0 32 32" aria-hidden="true">
            <path
              fill="currentColor"
              d="M16 3a12.8 12.8 0 0 0-11 19.3L3.4 29l6.9-1.8A12.9 12.9 0 1 0 16 3Zm0 23.2c-2 0-3.9-.5-5.6-1.5l-.4-.2-4.1 1.1 1.1-4-.3-.4A10.1 10.1 0 1 1 16 26.2Zm5.6-7.6c-.3-.2-1.8-.9-2.1-1s-.5-.2-.7.2-.8 1-1 1.2-.4.2-.7.1a8.2 8.2 0 0 1-2.5-1.5 9.4 9.4 0 0 1-1.7-2.1c-.2-.3 0-.5.2-.7l.5-.6.3-.6c.1-.2 0-.4 0-.6l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6a1.2 1.2 0 0 0-.9.4 3.7 3.7 0 0 0-1.1 2.7 6.4 6.4 0 0 0 1.3 3.3 14.7 14.7 0 0 0 5.6 5 6.2 6.2 0 0 0 3.8.8 3.2 3.2 0 0 0 2.1-1.5 2.7 2.7 0 0 0 .2-1.5c-.1-.2-.3-.3-.6-.5Z"
            />
          </svg>
        </a>
      ) : null}
      <a
        className="instagram-float"
        href="https://www.instagram.com/glowafrique.ci?obrf=YnNhdGhsZGQ0ZXF5&utm_source=qr"
        target="_blank"
        rel="noreferrer"
        aria-label={locale === 'en' ? 'Follow GlowAfrique on Instagram' : 'Suivez GlowAfrique sur Instagram'}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect
            x="3"
            y="3"
            width="18"
            height="18"
            rx="5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
          <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
          <circle cx="17.5" cy="6.8" r="1.2" fill="currentColor" />
        </svg>
      </a>
      {open ? (
        <div
          className="cart-overlay"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeCart();
            }
          }}
        >
          <section
            className={`cart-drawer open${checkout ? ' checkout-open' : ''}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cart-title"
          >
            <header className="cart-drawer-header">
              <div>
                <p className="eyebrow">GLOWAFRIQUE · {checkout ? 'CHECKOUT' : 'YOUR BAG'}</p>
                <h2 id="cart-title">{checkout ? text(locale, 'checkout') : text(locale, 'cart')}</h2>
                {!checkout ? (
                  <p className="cart-item-count">
                    {cart.reduce((count, item) => count + item.quantity, 0)} {locale === 'en' ? 'items selected' : 'articles sélectionnés'}
                  </p>
                ) : null}
              </div>
              <button className="icon-button cart-close" type="button" onClick={closeCart} aria-label={locale === 'en' ? 'Close bag' : 'Fermer le panier'}>
                ×
              </button>
            </header>
            {feedback ? <p role="status">{feedback}</p> : null}
            {!checkout ? (
              <>
                {cart.length ? (
                  <div className="cart-items-list">
                  {cart.map((item) => {
                    const product = PRODUCTS.find((p) => p.id === item.id);
                    return product ? (
                      <article className="cart-line" key={item.id}>
                        <img src={productImage(product)} alt="" />
                        <div className="cart-line-main">
                          <b className="cart-product-name">{product.name}</b>
                          <p className="cart-product-price">
                            {!productHasVerifiedPrice(product)
                              ? text(locale, 'noPrice')
                              : money(product.price, product.priceCurrency)}
                          </p>
                          <div className="cart-line-actions">
                            <div className="cart-quantity-control" role="group" aria-label={locale === 'en' ? 'Quantity' : 'Quantité'}>
                              <button type="button" disabled={item.quantity <= 1} onClick={() => change(item.id, item.quantity - 1)} aria-label={locale === 'en' ? 'Decrease quantity' : 'Diminuer la quantité'}>−</button>
                              <span aria-live="polite">{item.quantity}</span>
                              <button type="button" disabled={item.quantity >= 99} onClick={() => change(item.id, item.quantity + 1)} aria-label={locale === 'en' ? 'Increase quantity' : 'Augmenter la quantité'}>+</button>
                            </div>
                            <button className="cart-remove-button" type="button" onClick={() => removeItem(item.id)}>
                              {locale === 'en' ? 'Remove' : 'Retirer'}
                            </button>
                          </div>
                        </div>
                      </article>
                    ) : null;
                  })}
                  </div>
                ) : (
                  <div className="cart-empty-state">
                    <span aria-hidden="true">✦</span>
                    <h3>{text(locale, 'empty')}</h3>
                    <p>{locale === 'en' ? 'Your next skincare favorite is waiting to be discovered.' : 'Votre prochain soin préféré vous attend.'}</p>
                    <button className="button secondary" type="button" onClick={() => { closeCart(); navigate(localePath('/products', locale)); }}>{locale === 'en' ? 'Explore the collection' : 'Découvrir la collection'}</button>
                  </div>
                )}
                {cart.length ? (
                  <div className="cart-summary-card">
                    <p className="cart-total-row"><span>{text(locale, 'total')}</span><strong>
                      {quote?.quoteStatus === 'ready' && quote.totalXof != null
                        ? money(quote.totalXof)
                        : locale === 'en' ? 'Confirmed at checkout' : 'Confirmé à la commande'}
                    </strong></p>
                    <p className="cart-delivery-note">{text(locale, 'deliveryNote')}</p>
                <button
                  className="button cart-checkout-button"
                  disabled={!cart.length}
                  onClick={() => {
                    setCheckout(true);
                    setFeedback('');
                    setPaymentSelection('cash_on_delivery');
                    setQuoteEmail('');
                    setQuote(null);
                    setProofPreview('');
                  }}
                >
                  {text(locale, 'checkout')} <span aria-hidden="true">→</span>
                </button>
                  </div>
                ) : null}
              </>
            ) : (
              <form className="checkout-form" onSubmit={placeOrder}>
                <label>
                  {text(locale, 'first')}
                  <input name="firstName" required maxLength="80" />
                </label>
                <label>
                  {text(locale, 'last')}
                  <input name="lastName" required maxLength="80" />
                </label>
                <label>
                  {text(locale, 'email')}
                  <input
                    name="email"
                    type="email"
                    required
                    maxLength="254"
                    onChange={(event) => {
                      setQuoteEmail(event.target.value);
                      setQuote(null);
                      setPaymentSelection('cash_on_delivery');
                    }}
                  />
                </label>
                <label>
                  {locale === 'en' ? 'Phone Number' : 'Téléphone'}
                  <input name="phone" type="tel" required placeholder="+225…" />
                </label>
                <label>
                  {locale === 'en' ? 'Street Address' : 'Adresse'}
                  <input name="addressLine1" required maxLength="180" />
                </label>
                <label>
                  {locale === 'en' ? 'Building / Landmark' : 'Bâtiment / Repère'}
                  <input name="addressLine2" maxLength="180" />
                </label>
                <div className="checkout-address-row">
                  <label>
                    {locale === 'en' ? 'City' : 'Ville'}
                    <input name="city" required maxLength="100" />
                  </label>
                  <label>
                    {locale === 'en' ? 'Region' : 'Région'}
                    <input name="division" required maxLength="100" />
                  </label>
                </div>
                <fieldset className="payment-methods">
                  <legend>{locale === 'en' ? 'Payment Method' : 'Mode De Paiement'}</legend>
                  <label>
                    <input
                      name="paymentMethod"
                      type="radio"
                      value="cash_on_delivery"
                      defaultChecked
                      onChange={() => {
                        setPaymentSelection('cash_on_delivery');
                        setProofPreview('');
                      }}
                    />{' '}
                    Cash on Delivery
                  </label>
                  <label>
                    <input
                      name="paymentMethod"
                      type="radio"
                      value="wave"
                      disabled={quote?.quoteStatus === 'confirmation-pending' || quote?.quoteStatus === 'enter-email'}
                      onChange={() => setPaymentSelection('wave')}
                    />{' '}
                    Wave
                  </label>
                  {import.meta.env.VITE_PAYSTACK_ENABLED === 'true' ? (
                    <label>
                      <input
                        name="paymentMethod"
                        type="radio"
                        value="paystack"
                        disabled={quote?.quoteStatus !== 'ready'}
                        onChange={() => setPaymentSelection('paystack')}
                      />
                      {locale === 'en'
                        ? 'Pay Online (Card Or Mobile Money)'
                        : 'Payer En Ligne (Carte Ou Mobile Money)'}
                    </label>
                  ) : null}
                </fieldset>
                {quote?.quoteStatus !== 'ready' ? (
                  <p className="checkout-delivery-note" role="status">
                    {quote?.stockConfirmationPending && quote?.shippingQuotePending
                      ? locale === 'en'
                        ? 'Cash on Delivery is available. We will confirm product availability, the delivery fee, and your final total before dispatch.'
                        : 'Le paiement à la livraison est disponible. Nous confirmerons la disponibilité des produits, les frais de livraison et le total avant l’expédition.'
                      : quote?.stockConfirmationPending
                        ? locale === 'en'
                          ? 'Cash on Delivery is available. We will confirm product availability before dispatch.'
                          : 'Le paiement à la livraison est disponible. Nous confirmerons la disponibilité des produits avant l’expédition.'
                        : locale === 'en'
                          ? 'Cash on Delivery is available. We will confirm your delivery fee and final total before dispatch.'
                          : 'Le paiement à la livraison est disponible. Nous confirmerons les frais de livraison et le total avant l’expédition.'}
                  </p>
                ) : null}
                {quote?.quoteStatus === 'ready' && quote.stockConfirmationPending ? (
                  <p className="checkout-delivery-note" role="status">
                    {locale === 'en'
                      ? 'We will confirm product availability before dispatch. Wave orders can include a screenshot and will remain pending review.'
                      : 'Nous confirmerons la disponibilité avant l’expédition. Les paiements Wave avec capture resteront en attente de vérification.'}
                  </p>
                ) : null}
                {paymentSelection === 'wave' ? (
                  <>
                    <aside className="wave-payment-instructions">
                      <div>
                        <p className="eyebrow">WAVE · PAIEMENT SÉCURISÉ</p>
                        <h3>{locale === 'en' ? 'Pay with Wave' : 'Payer avec Wave'}</h3>
                        <p>
                          {locale === 'en'
                            ? 'Scan this QR code in Wave, complete your transfer, then upload a clear screenshot of the successful payment. Orders without a payment screenshot will not be shipped.'
                            : 'Scannez ce QR code avec Wave et effectuez le paiement. Téléversez ensuite une capture d’écran lisible de la transaction réussie. Sans capture d’écran du paiement, la commande ne sera pas expédiée.'}
                        </p>
                        {quote?.totalXof != null ? <strong className="wave-qr-amount">{money(quote.totalXof)}</strong> : null}
                      </div>
                      <img
                        src="/images/wave.jpeg"
                        alt={locale === 'en' ? 'GlowAfrique Wave payment QR code' : 'Code QR Wave pour le paiement GlowAfrique'}
                      />
                    </aside>
                    <label>
                      Wave Sender Phone
                      <input name="waveSenderPhone" type="tel" placeholder="+225…" required />
                    </label>
                    <label>
                      Wave Payment Screenshot
                      <input
                        name="waveProofFile"
                        type="file"
                        required
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          setProofPreview((previous) => {
                            if (previous.startsWith('blob:')) URL.revokeObjectURL(previous);
                            return file ? URL.createObjectURL(file) : '';
                          });
                        }}
                      />
                    </label>
                    {proofPreview ? (
                      <img
                        className="wave-proof-preview"
                        src={proofPreview}
                        alt="Payment screenshot preview"
                      />
                    ) : null}
                  </>
                ) : null}
                <button className="button" disabled={busy}>
                  {busy ? text(locale, 'loading') : text(locale, 'checkout')}
                </button>
                <button
                  type="button"
                  className="text-button"
                  onClick={() => {
                    setCheckout(false);
                    setPaymentSelection('cash_on_delivery');
                    setQuoteEmail('');
                    setQuote(null);
                    setProofPreview('');
                  }}
                >
                  {text(locale, 'continue')}
                </button>
              </form>
            )}
          </section>
        </div>
      ) : null}
    </>
  );
}

function RouteContent() {
  const location = useLocation();
  const pathname = location.pathname.replace(/^\/en(?=\/|$)/, '') || '/';
  const normalized = pathname;
  const id =
    normalized.match(/^\/product\/([^/]+)/)?.[1] ||
    (normalized === '/product' ? new URLSearchParams(location.search).get('id') : null);
  if (normalized === '/' || normalized === '/index') return <HomePage />;
  if (normalized === '/products') return <ProductsPage />;
  if (normalized === '/collection' || normalized.startsWith('/collections/'))
    return (
      <CollectionPage
        path={normalized === '/collection' ? '/collection' : normalized}
        search={location.search}
      />
    );
  if (id) return <ProductPage id={decodeURIComponent(id)} />;
  if (normalized === '/about') return <AboutPage />;
  if (normalized === '/contact') return <ContactPage />;
  if (normalized === '/account') return <AccountPage />;
  if (normalized === '/order-confirmation') return <OrderConfirmationPage />;
  if (normalized === '/control' || normalized === '/admin') return <AdminPage />;
  if (normalized === '/policies' || normalized.startsWith('/policies/'))
    return (
      <PoliciesPage
        type={normalized.split('/')[2] || new URLSearchParams(location.search).get('type')}
      />
    );
  return (
      <section className="page-intro">
      <h1>404</h1>
      <PageLink to="/">{text(location.pathname.startsWith('/en') ? 'en' : 'fr', 'home')}</PageLink>
    </section>
  );
}

export default function App() {
  const location = useLocation();
  const normalizedPath = location.pathname.replace(/^\/en(?=\/|$)/, '') || '/';
  const isAdminRoute = /^\/(control|admin)\/?$/.test(normalizedPath);
  const locale = location.pathname.startsWith('/en') ? 'en' : 'fr';
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const authStateResolved = useRef(false);
  const updateUser = useCallback((nextUser) => {
    authStateResolved.current = true;
    setUser(nextUser);
    setAuthLoading(false);
  }, []);
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(false);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname, location.search]);
  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'same-origin' })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!authStateResolved.current) {
          authStateResolved.current = true;
          setUser(data?.user || null);
        }
      })
      .catch(() => {
        if (!authStateResolved.current) {
          authStateResolved.current = true;
          setUser(null);
        }
      })
      .finally(() => setAuthLoading(false));
  }, []);
  useEffect(() => {
    let active = true;
    const checkMaintenance = () => {
      fetch('/api/maintenance', { credentials: 'same-origin', cache: 'no-store' })
        .then((response) => (response.ok ? response.json() : null))
        .then((data) => {
          if (active && data) setMaintenanceEnabled(data.enabled === true);
        })
        .catch(() => {});
    };
    checkMaintenance();
    const interval = window.setInterval(checkMaintenance, 10000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('ga-cart') || '[]');
      if (Array.isArray(saved)) setCart(saved);
    } catch {
      setCart([]);
    }
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem('ga-cart', JSON.stringify(cart));
    } catch {
      /* Storage may be disabled by the browser. */
    }
  }, [cart]);
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  const addItem = (product) =>
    setCart((items) => {
      const existing = items.find((item) => item.id === product.id);
      return existing
        ? items.map((item) =>
            item.id === product.id ? { ...item, quantity: Math.min(99, item.quantity + 1) } : item,
          )
        : [...items, { id: product.id, quantity: 1 }];
    });
  const value = useMemo(
    () => ({ locale, cart, setCart, cartOpen, setCartOpen, addItem, user, setUser: updateUser, authLoading }),
    [locale, cart, cartOpen, user, authLoading, updateUser],
  );
  return (
    <StoreContext.Provider value={value}>
      {!isAdminRoute && !maintenanceEnabled ? <Header /> : null}
      <main id="page-content" className={isAdminRoute ? 'admin-shell' : undefined}>
        {maintenanceEnabled && !isAdminRoute ? <StoreMaintenancePage /> : <RouteContent />}
      </main>
      {!isAdminRoute && !maintenanceEnabled ? <Footer /> : null}
      {!isAdminRoute && !maintenanceEnabled ? <CartAndSocialLinks /> : null}
    </StoreContext.Provider>
  );
}

export { COPY, LOGOS, slug, localePath };
