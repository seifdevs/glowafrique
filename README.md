# GlowAfrique

A responsive, bilingual beauty storefront built with React and Vite. React Router is the only storefront router, and the production build statically renders the supported French and English routes for crawlers and visitors without JavaScript.

## Run locally

```sh
npm install
npm run dev
```

`npm run dev` starts the Vite React storefront and local `/api` handlers together on one origin. Copy `.env.example` to `.env` and configure `MONGODB_URI` to enable account registration, login, orders, reviews, and control-panel data; configure `OPENAI_API_KEY` to enable AI chat replies. Without those values, the frontend still loads and the related APIs return a configuration error. Run through Vite because the React frontend and API routes require it.

## Build and deploy

```sh
npm run build
```

The Vite build creates `dist/` with prerendered storefront routes, bundled styles and scripts, and static assets. In Vercel, use `npm run build` and set the output directory to `dist`. API paths are rewritten to the single `/api/router` function to fit the Hobby plan limit.

## MongoDB account configuration

- Copy `.env.example` to `.env` for local secret storage and set `MONGODB_URI` to your rotated Atlas connection string. `.env` is ignored by Git; configure the same variable in Vercel for the deployed account API.
- The API creates the minimal user and session collections and required unique/expiry indexes. Authentication uses bcrypt password hashes and HttpOnly session cookies. Vite mounts the same API handlers locally; Vercel deploys them as serverless functions.

## Pre-launch configuration

- Fill the actual legal name, registration details, registered address, customer-service email and phone, and WhatsApp number in `content/store-info.json`. Those fields deliberately stay blank until the business owner supplies the real information.
- Replace beta/test product prices in `products-edit.csv` with owner-approved values and mark them `pricingType=retail`. Beta prices are intentionally rejected by both the storefront and API.
- Set `SHIPPING_FEE_XOF` to the real below-threshold delivery fee. Delivery is free from 45,000 XOF after the first-order discount.
- Configure `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and `SUPPORT_EMAIL` to activate contact notifications, password reset, and order/payment/status emails.
- Set `PUBLIC_SITE_URL` to the canonical HTTPS domain. Configure the Paystack secret in Vercel and set the public `VITE_PAYSTACK_ENABLED=true` only after the merchant account is approved for Côte d’Ivoire payments. The shopper is sent to Paystack-hosted checkout; the server verifies the transaction before it marks the order paid.
- Set `MONGODB_URI` and `MONGODB_DB` in Vercel. Store every API secret as a server-side environment variable; never add it to a `VITE_` variable.
- Confirm delivery areas, estimated delivery times, and account/order email templates with the store team before launch. The site does not invent a delivery schedule or company identity.

## Orders, XOF prices, and administration

- Product prices in `products-edit.csv` must include an explicit `priceCurrency` value of `XOF` or `USD`. USD values are converted at the fixed rate of 630 XOF per USD when `npm run build-products` regenerates the catalog. The current catalog contains beta/test prices; they are hidden from shoppers and rejected by the order API. Replace them with owner-confirmed prices and set `pricingType` to the production value before enabling checkout for those products.
- Checkout validates products and quantities against the generated server catalog, calculates amounts in XOF, applies a 10% first-purchase discount, and stores orders in `glowafrique_orders`. Orders start as `pending`; Cash on Delivery remains available, Wave proofs require manual review, and optional hosted Paystack checkout requires both `PAYSTACK_SECRET_KEY` and `VITE_PAYSTACK_ENABLED=true`. The Paystack callback confirms transactions against Paystack before marking them paid. Delivery is free at 45,000 XOF. Set `SHIPPING_FEE_XOF` to the actual fee before accepting smaller orders.
- Authenticated purchase points are calculated from discounted merchandise subtotal, excluding delivery, at one point per complete 630 XOF. Points are credited only after an administrator marks the order delivered. One saved review per customer and product awards 15 points. Guest checkout is available, but guests do not receive account points.
- `/control` requires a signed-in administrator, and its order APIs enforce the admin role on the server. Create an account normally, then grant an administrator role from a trusted machine with database access: `npm run admin:promote -- customer@example.com`. The command only promotes an existing account; it does not create or expose credentials.
- Configure MongoDB using `.env.example` as a template. Never commit `.env`. The login database-name selection bug that raised `ERR_INVALID_URL` with otherwise valid MongoDB settings is fixed; a local diagnostic login now reaches the database and returns the expected invalid-credentials response.

## Product images and catalog

1. Keep original files in `assets/products/`, organized in subfolders. The importer scans every depth and never moves or edits originals.
2. Generate optimized WebP copies (Pillow required) with `npm run optimize-products`. Copies go into `assets/products-web/` at up to 1200 px and quality 88; image backgrounds use the brand ivory.
3. Run `npm run build-products`. Files with numbered or duplicate suffixes are grouped as one product gallery. The command prints the folder tree before generating outputs.
4. Edit `products-edit.csv` to add prices, brands, categories, best-seller flags, and new-product flags. The CSV overrides the automatic suggestions the next time you run `npm run build-products`.
5. Edit `data/image-classification.csv` to change each image role or order. The importer places the hero first, then uses the CSV row order for secondary images. Set `override_role` to `hero`, `secondary`, or `before_after`; set `force_hero` to `true` to force an image to the front. Before/after composites are stored in the product's `beforeAfter.images`, separate from its gallery.
6. Edit brand names and filename aliases in `data/brands.json`. The generated product `name` contains the brand prefix once; the storefront renders it in uppercase while preserving accents. `brand` remains a separate data field for brand filters.
7. Category folder mappings and keyword rules live in `scripts/category-rules.cjs`. Unknown folders are listed in `scripts/import-report.md` and remain unclassified until assigned. The full products catalog lists every record; unclassified products are omitted from category/concern navigation and category filters until assigned.
8. `data/descriptions-report.csv` records that source descriptions are blocked. The supplied HBYTALA terms prohibit copying or exploiting its site content without written permission, so no source pages were fetched, and no descriptions were copied or translated. The report includes blank sections for review if you provide permission and an authorized source later.
9. Re-run `npm run build-products` after editing product roles, brands, or merchandising. It regenerates `data/catalog.js` and the import reports. Product image optimization remains a separate command (`npm run optimize-products`).
10. The import report records source image paths, category assignments, visual inspection findings, hero quality flags, brand gaps, and description restrictions. Originals and optimized versions are kept separately.

The current source folder contains 73 images grouped into 34 product records (70 gallery images plus 3 before/after images). Numbered variants are why image-file count and product count differ. At present, 8 records have a confirmed category; 26 records from `Skincare` and `Sun Care` are listed in the full catalog without being added to category or concern listings until those folders are classified.

## Edit site content and translations

- `src/main.jsx` hydrates the statically rendered React application. `src/App.jsx` includes the storefront routes, components, and French/English interface copy. Product names use the catalog's original language and preserve brand capitalization.

## Pages

- `/`: homepage, best sellers, featured brands, concern collections, loyalty information.
- `/products`, `/collections/*`, `/product/*`: searchable and filtered product listings, brand/concern collections, and product detail pages.
- `/about`, `/contact`, `/policies/*`: store information, contact, and policy routes.
- `/account`: account registration, login, and order history backed by MongoDB.
- `/admin`: order-management interface; all order API operations enforce administrator authorization on the server.

## Storefront configuration and integrations

- The React storefront includes the 10% first-order announcement, 45,000 CFA free-delivery threshold, CFA currency, and rewards conversion display.
- One authenticated review per product awards 15 server-stored points. Purchase points are calculated from the discounted XOF merchandise subtotal and credited to the customer account after an administrator marks the order delivered. Contact and newsletter forms are still not connected to a messaging or mailing-list service.
- The Glow Guide uses a Vercel serverless endpoint at `api/chat.js` with OpenAI's Responses API. Set `OPENAI_API_KEY` as a server-side deployment environment variable; optionally set `OPENAI_MODEL`. The browser never receives the key. Without a configured endpoint, the guide uses its local catalog/FAQ fallback.
- Set the verified legal business name, business address, support email and phone, social account URLs, and confirmed shipping/returns terms before launch. These details must be supplied by the store owner; do not publish invented identity or policy facts.
