import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { PRODUCTS } from '../data/catalog.js';
import { formatXof, toXof } from '../lib/currency.js';

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
    noPrice: 'Contact Us For Availability',
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
    bestHeading: 'Customer Favorites',
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
    noPrice: 'Contactez-nous pour connaître la disponibilité',
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
    bestHeading: 'Les Préférés',
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
  const { locale, addItem } = useStore();
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
          {product.price == null
            ? text(locale, 'noPrice')
            : money(product.price, product.priceCurrency)}
        </p>
        <button
          type="button"
          className="button small"
          disabled={product.price == null}
          onClick={() => addItem(product)}
        >
          {text(locale, 'add')}
        </button>
      </div>
    </article>
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
  const { locale } = useStore();
  const [bounds, setBounds] = useState({ left: 0, max: 0 });
  const ref = React.useRef(null);
  const move = (direction) => {
    const node = ref.current;
    if (!node) return;
    node.scrollBy({
      left: direction * Math.max(200, node.clientWidth * 0.75),
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    });
  };
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const update = () =>
      setBounds({ left: node.scrollLeft, max: Math.max(0, node.scrollWidth - node.clientWidth) });
    update();
    node.addEventListener('scroll', update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => {
      observer.disconnect();
      node.removeEventListener('scroll', update);
    };
  }, []);
  return (
    <div className="react-carousel-wrap">
      <div className="horizontal-controls" role="group" aria-label={label}>
        <button
          type="button"
          className="icon-button"
          aria-label={locale === 'en' ? 'Scroll Left' : 'Défiler À Gauche'}
          onClick={() => move(-1)}
          disabled={bounds.left < 2}
        >
          ‹
        </button>
        <button
          type="button"
          className="icon-button"
          aria-label={locale === 'en' ? 'Scroll Right' : 'Défiler À Droite'}
          onClick={() => move(1)}
          disabled={bounds.left >= bounds.max - 2}
        >
          ›
        </button>
      </div>
      <div
        ref={ref}
        className={variant === 'brand' ? 'featured-brand-grid' : 'concern-carousel'}
        tabIndex="0"
        role="region"
        aria-label={label}
      >
        {items.map(renderItem)}
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
                  ✧
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
      <section className="promo-strip">
        <span>{text(locale, 'delivery')}</span>
        <PageLink className="button" to="/products">
          {text(locale, 'learn')}
        </PageLink>
      </section>
      <section className="section">
        <SectionHeading title={text(locale, 'newHeading')} href="/products" />
        <ProductGrid products={PRODUCTS.filter((p) => p.isNew).slice(0, 8)} />
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
  const brands = [...new Set(PRODUCTS.map((p) => p.brand).filter(Boolean))].sort();
  const concerns = [
    ...new Set(
      PRODUCTS.flatMap((p) => [...(p.concerns || []), ...(p.category ? [p.category] : [])]),
    ),
  ]
    .filter(Boolean)
    .sort();
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
        <aside className="filter-panel">
          <h2>{text(locale, 'filter')}</h2>
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
        </aside>
        <div className="catalog-results">
          <label>
            {text(locale, 'sort')}{' '}
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="name">A–Z</option>
              <option value="new">{text(locale, 'newest')}</option>
              <option value="price-low">{text(locale, 'priceLow')}</option>
              <option value="price-high">{text(locale, 'priceHigh')}</option>
            </select>
          </label>
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
      <section className="page-intro">
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
  const { locale, addItem, user } = useStore();
  const product = PRODUCTS.find((p) => p.id === id);
  const [reviews, setReviews] = useState([]);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
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
  async function submitReview(event) {
    event.preventDefault();
    setLoading(true);
    setFeedback('');
    const form = new FormData(event.currentTarget);
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
      setFeedback(`${text(locale, 'success')} +15 ${text(locale, 'pointsCount')}.`);
      event.currentTarget.reset();
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
            <img src={productImage(product)} alt={`${product.brand} ${product.name}`} />
          </div>
        </div>
        <div className="product-buy">
          <p className="eyebrow product-brand">{product.brand}</p>
          <h1>{product.name}</h1>
          <p className="price large">
            {product.price == null
              ? text(locale, 'noPrice')
              : money(product.price, product.priceCurrency)}
          </p>
          <p className="muted">{product.category}</p>
          <button
            className="button product-add"
            type="button"
            disabled={product.price == null}
            onClick={() => addItem(product)}
          >
            {text(locale, 'add')}
          </button>
          <p className="muted">{text(locale, 'deliveryNote')}</p>
          {product.description ? (
            <section className="product-accordions">
              <h2>{locale === 'en' ? 'Product Information' : 'Informations Produit'}</h2>
              <p>{product.description}</p>
              {product.howToUse?.length ? (
                <>
                  <h3>{text(locale, 'howto')}</h3>
                  <ul>
                    {product.howToUse.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </>
              ) : null}
              {product.ingredients ? (
                <>
                  <h3>{locale === 'en' ? 'Ingredients' : 'Ingrédients'}</h3>
                  <p>{product.ingredients}</p>
                </>
              ) : null}
            </section>
          ) : null}
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
            offers:
              product.price == null
                ? undefined
                : {
                    '@type': 'Offer',
                    priceCurrency: 'XOF',
                    price: product.price,
                    availability: 'https://schema.org/InStock',
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

function ContactPage() {
  const { locale } = useStore();
  const [feedback, setFeedback] = useState('');
  async function submit(event) {
    event.preventDefault();
    setFeedback(text(locale, 'unavailable'));
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
          <button className="button">{text(locale, 'send')}</button>
          <p role="status">{feedback}</p>
        </form>
        <aside className="contact-details">
          <h2>{text(locale, 'hours')}</h2>
          <p>{text(locale, 'messageHelp')}</p>
        </aside>
      </section>
    </>
  );
}

function PoliciesPage({ type }) {
  const { locale } = useStore();
  const titles = {
    returns: text(locale, 'return'),
    shipping: text(locale, 'shipping'),
    privacy: text(locale, 'privacy'),
    terms: text(locale, 'terms'),
    cookies: text(locale, 'cookies'),
    'how-to-use': text(locale, 'howto'),
  };
  return (
    <section className="policy-page page-intro">
      <p className="eyebrow">GlowAfrique</p>
      <h1>{titles[type] || text(locale, 'info')}</h1>
      <p>{text(locale, 'legalNotice')}</p>
      <p>{text(locale, 'messageHelp')}</p>
      <p>
        <PageLink to="/contact">{text(locale, 'contact')}</PageLink>
      </p>
    </section>
  );
}

function AccountPage() {
  const { locale, user, setUser } = useStore();
  const [mode, setMode] = useState('register');
  const [feedback, setFeedback] = useState('');
  const [busy, setBusy] = useState(false);
  const [orders, setOrders] = useState([]);
  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'same-origin' })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => setUser(data?.user || null))
      .catch(() => {});
  }, [setUser]);
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
      const response = await fetch(`/api/auth/${mode === 'register' ? 'register' : 'login'}`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || text(locale, 'unavailable'));
      setUser(result.user);
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
      <section className="section account-shell">
        <h1>{text(locale, 'account')}</h1>
        <p>
          {user.firstName} {user.lastName} · {user.email}
        </p>
        <p>
          {Number(user.points || 0)} {text(locale, 'pointsCount')}
        </p>
        <button className="button secondary" onClick={signOut}>
          {text(locale, 'signOut')}
        </button>
        <h2>{text(locale, 'orders')}</h2>
        {orders.length ? (
          orders.map((order) => (
            <article className="order-card" key={order.orderNumber}>
              <b>{order.orderNumber}</b>
              <p>
                {order.status} · {money(order.totalXof)}
              </p>
            </article>
          ))
        ) : (
          <p>{text(locale, 'noOrders')}</p>
        )}
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
        <label>
          {text(locale, 'email')}
          <input name="email" type="email" autoComplete="email" required maxLength="254" />
        </label>
        <label>
          {text(locale, 'password')}
          <input
            name="password"
            type="password"
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            minLength="8"
            maxLength="72"
            required
          />
        </label>
        <button className="button" disabled={busy}>
          {busy ? text(locale, 'loading') : text(locale, mode === 'register' ? 'create' : 'signIn')}
        </button>
        <p role="status">{feedback}</p>
      </form>
      <button
        className="text-button"
        onClick={() => setMode((m) => (m === 'register' ? 'login' : 'register'))}
      >
        {mode === 'register' ? text(locale, 'signIn') : text(locale, 'create')}
      </button>
    </section>
  );
}

function AdminPage() {
  const { locale } = useStore();
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState('pending');
  const [feedback, setFeedback] = useState('');
  useEffect(() => {
    fetch(`/api/admin/orders?status=${encodeURIComponent(status)}`, { credentials: 'same-origin' })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || text(locale, 'unavailable'));
        setOrders(data.orders || []);
      })
      .catch((error) => setFeedback(error.message));
  }, [locale, status]);
  return (
    <section className="section">
      <h1>GlowAfrique · {locale === 'en' ? 'Administration' : 'Administration'}</h1>
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
      <p role="status">{feedback}</p>
      {orders.map((order) => (
        <article className="order-card" key={order.orderNumber}>
          <h2>{order.orderNumber}</h2>
          <p>
            {order.status} · {order.paymentStatus} · {money(order.totalXof)}
          </p>
          <p>
            {order.customer?.fullName} · {order.customer?.email}
          </p>
        </article>
      ))}
    </section>
  );
}

function Newsletter() {
  const { locale } = useStore();
  const [feedback, setFeedback] = useState('');
  async function submit(e) {
    e.preventDefault();
    setFeedback(text(locale, 'unavailable'));
  }
  return (
    <section className="newsletter">
      <h2>{text(locale, 'newsletter')}</h2>
      <form onSubmit={submit}>
        <label className="sr-only" htmlFor="newsletter-email">
          {text(locale, 'email')}
        </label>
        <input id="newsletter-email" type="email" placeholder={text(locale, 'email')} required />
        <button className="button" aria-label={text(locale, 'submit')}>
          ›
        </button>
      </form>
      <p role="status">{feedback}</p>
    </section>
  );
}

function Header() {
  const { locale, cart, setCartOpen } = useStore();
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [points, setPoints] = useState(0);
  const navigate = useNavigate();
  useEffect(() => {
    try {
      setPoints(Number(window.localStorage.getItem('ga-points') || 0));
    } catch {
      setPoints(0);
    }
  }, []);
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
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
          <img width="150" height="54" src="/logo.jpeg" alt="GlowAfrique" />
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
            ✦ <b>{points}</b> {text(locale, 'pointsCount')}
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
            ♧<i id="cart-count">{count}</i>
          </button>
        </div>
      </header>
      <nav
        className={`category-nav ${menuOpen ? 'menu-open' : ''}`}
        aria-label={text(locale, 'products')}
      >
        <PageLink to="/products">{text(locale, 'products')}</PageLink>
        <PageLink to="/collections/best-sellers">{text(locale, 'best')}</PageLink>
        <div className="nav-dropdown">
          <PageLink to="/collections/brands">{text(locale, 'brands')}⌄</PageLink>
          <div className="dropdown-menu">
            {[...new Set(PRODUCTS.map((p) => p.brand).filter(Boolean))].sort().map((brand) => (
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
              .sort()
              .map((concern) => (
                <PageLink key={concern} to={`/collections/concern/${slug(concern)}`}>
                  {concern}
                </PageLink>
              ))}
          </div>
        </div>
        <PageLink to="/policies/how-to-use">{text(locale, 'howto')}</PageLink>
        <PageLink to="/contact">{text(locale, 'contact')}</PageLink>
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
          <span>◉</span>
          <p>{text(locale, 'authentic')}</p>
        </article>
        <article>
          <span>☏</span>
          <p>{text(locale, 'service')}</p>
        </article>
        <article>
          <span>▣</span>
          <p>{text(locale, 'delivery')}</p>
        </article>
      </section>
      <footer className="site-footer">
        <div className="footer-columns">
          <section className="footer-about">
            <h3>{text(locale, 'about')}</h3>
            <p>{text(locale, 'aboutText')}</p>
            <PageLink to="/about">{text(locale, 'view')} →</PageLink>
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
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} GlowAfrique</span>
          <span>{text(locale, 'pointsExplain')}</span>
        </div>
      </footer>
    </>
  );
}

function CartAndChat() {
  const { locale, cart, setCart, cartOpen: open, setCartOpen: setOpen } = useStore();
  const [checkout, setCheckout] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [busy, setBusy] = useState(false);
  const [total, setTotal] = useState(null);
  const [proofPreview, setProofPreview] = useState('');
  useEffect(() => {
    if (!open || !cart.length) return;
    fetch('/api/order-quote', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: cart.map((x) => ({ productId: x.id, quantity: x.quantity })) }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setTotal(data?.totalXof ?? null))
      .catch(() => setTotal(null));
  }, [open, cart]);
  function change(id, quantity) {
    setCart((items) =>
      items
        .map((item) => (item.id === id ? { ...item, quantity } : item))
        .filter((item) => item.quantity > 0),
    );
  }
  async function placeOrder(e) {
    e.preventDefault();
    setBusy(true);
    setFeedback('');
    const data = Object.fromEntries(new FormData(e.currentTarget));
    const paymentMethod = data.paymentMethod;
    let waveProof;
    if (paymentMethod === 'wave') {
      const file = e.currentTarget.elements.waveProofFile.files?.[0];
      if (!file || file.size > 2 * 1024 * 1024) {
        setFeedback('Select a payment screenshot under 2 MB.');
        setBusy(false);
        return;
      }
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      waveProof = { mimeType: file.type, data: String(dataUrl).split(',')[1] };
    }
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idempotencyKey: crypto.randomUUID(),
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
      setFeedback(
        paymentMethod === 'wave'
          ? locale === 'en'
            ? 'Thank you. Your payment will be reviewed by GlowAfrique.'
            : 'Merci. Votre paiement sera vérifié par GlowAfrique.'
          : locale === 'en'
            ? `Order ${result.order.orderNumber} placed.`
            : `Commande ${result.order.orderNumber} enregistrée.`,
      );
      setCart([]);
      setCheckout(false);
    } catch (error) {
      setFeedback(error.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageLink className="whatsapp" to="/contact" aria-label={text(locale, 'contact')}>
        ◉
      </PageLink>
      <aside className="shop-assistant" aria-label="GlowAfrique assistant">
        <b>Glow Guide</b>
        <button
          type="button"
          onClick={(e) => e.currentTarget.parentElement.classList.toggle('active')}
        >
          ✦
        </button>
        <p>
          {locale === 'en'
            ? 'How can I help you explore the shop?'
            : 'Comment puis-je vous aider à découvrir la boutique ?'}
        </p>
      </aside>
      {open ? (
        <div
          className="cart-overlay"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setOpen(false);
              setCheckout(false);
            }
          }}
        >
          <section
            className="cart-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cart-title"
          >
            <button
              className="icon-button"
              onClick={() => {
                setOpen(false);
                setCheckout(false);
              }}
              aria-label={text(locale, 'remove')}
            >
              ×
            </button>
            <h2 id="cart-title">{checkout ? text(locale, 'checkout') : text(locale, 'cart')}</h2>
            {feedback ? <p role="status">{feedback}</p> : null}
            {!checkout ? (
              <>
                {cart.length ? (
                  cart.map((item) => {
                    const product = PRODUCTS.find((p) => p.id === item.id);
                    return product ? (
                      <article className="cart-line" key={item.id}>
                        <img src={productImage(product)} alt="" />
                        <div>
                          <b>{product.name}</b>
                          <p>
                            {product.price == null
                              ? text(locale, 'noPrice')
                              : money(product.price, product.priceCurrency)}
                          </p>
                          <label>
                            {locale === 'en' ? 'Quantity' : 'Quantité'}
                            <input
                              type="number"
                              min="0"
                              max="99"
                              value={item.quantity}
                              onChange={(e) => change(item.id, Number(e.target.value))}
                            />
                          </label>
                        </div>
                        <button className="text-button" onClick={() => change(item.id, 0)}>
                          {text(locale, 'remove')}
                        </button>
                      </article>
                    ) : null;
                  })
                ) : (
                  <p>{text(locale, 'empty')}</p>
                )}
                <p>
                  {text(locale, 'total')}: {total == null ? text(locale, 'loading') : money(total)}
                </p>
                <p className="muted">{text(locale, 'deliveryNote')}</p>
                <button
                  className="button"
                  disabled={!cart.length}
                  onClick={() => {
                    setCheckout(true);
                    setFeedback('');
                  }}
                >
                  {text(locale, 'checkout')}
                </button>
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
                  <input name="email" type="email" required maxLength="254" />
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
                    />{' '}
                    Cash on Delivery
                  </label>
                  <label>
                    <input name="paymentMethod" type="radio" value="wave" /> Wave
                  </label>
                </fieldset>
                <label>
                  Wave Sender Phone
                  <input name="waveSenderPhone" type="tel" placeholder="+225…" />
                </label>
                <label>
                  Wave Payment Screenshot
                  <input
                    name="waveProofFile"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      setProofPreview(file ? URL.createObjectURL(file) : '');
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
                <button className="button" disabled={busy}>
                  {busy ? text(locale, 'loading') : text(locale, 'checkout')}
                </button>
                <button type="button" className="text-button" onClick={() => setCheckout(false)}>
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
  const locale = location.pathname.startsWith('/en') ? 'en' : 'fr';
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [user, setUser] = useState(null);
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
    () => ({ locale, cart, setCart, cartOpen, setCartOpen, addItem, user, setUser }),
    [locale, cart, cartOpen, user],
  );
  return (
    <StoreContext.Provider value={value}>
      <Header />
      <main id="page-content">
        <RouteContent />
      </main>
      <Footer />
      <CartAndChat />
    </StoreContext.Provider>
  );
}

export { COPY, LOGOS, slug, localePath };
