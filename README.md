# GlowAfrique

A responsive, bilingual beauty storefront mounted through React and Vite. The HTML files are lightweight Vite entry shells; React mounts the storefront app, and the existing catalog and interaction module supplies the current shop behavior.

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

The Vite build creates `dist/` with all storefront pages, classic scripts, styles, and static assets. In Vercel, use `npm run build` and set the output directory to `dist`. The optional clean page URLs in `vercel.json` map to their matching HTML files.

## MongoDB account configuration

- Copy `.env.example` to `.env` for local secret storage and set `MONGODB_URI` to your rotated Atlas connection string. `.env` is ignored by Git; configure the same variable in Vercel for the deployed account API.
- The API creates the minimal user and session collections and required unique/expiry indexes. Authentication uses bcrypt password hashes and HttpOnly session cookies. Vite mounts the same API handlers locally; Vercel deploys them as serverless functions.

## Orders, XOF prices, and administration

- Product prices in `products-edit.csv` must include an explicit `priceCurrency` value of `XOF` or `USD`. USD values are converted at the fixed rate of 630 XOF per USD when `npm run build-products` regenerates the catalog. Unpriced or currency-ambiguous products cannot be ordered. **The current 34 product rows have blank prices**, so prices must be entered before checkout can be completed; no prices have been guessed.
- Checkout validates products and quantities against the generated server catalog, calculates amounts in XOF, applies a 10% first-purchase discount, and stores orders in `glowafrique_orders`. Orders start as `pending` and `unpaid`; the site does not currently process online payments. Delivery is free at 45,000 XOF. Set `SHIPPING_FEE_XOF` to the actual fee before accepting smaller orders.
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
9. Re-run `npm run build-products` after editing product roles, brands, or merchandising. It regenerates `js/products.js` and the import reports. Product image optimization remains a separate command (`npm run optimize-products`).
10. The import report records source image paths, category assignments, visual inspection findings, hero quality flags, brand gaps, and description restrictions. Originals and optimized versions are kept separately.

The current source folder contains 73 images grouped into 34 product records (70 gallery images plus 3 before/after images). Numbered variants are why image-file count and product count differ. At present, 8 records have a confirmed category; 26 records from `Skincare` and `Sun Care` are listed in the full catalog without being added to category or concern listings until those folders are classified.

## Edit site content and translations

- `js/content.js` holds editable storefront settings and the homepage/about/contact section structure and copy keys.
- `js/i18n.js` is the single French/English dictionary for interface labels and editable section copy. French is the default; the FR | EN toggle saves the selection in local storage.
- `src/main.jsx` mounts the React application and `src/App.jsx` starts the shared storefront. `js/main.js` currently provides the existing catalog and interaction behavior inside the React-mounted app. Product names use the catalog's original language and preserve brand capitalization.

## Pages

- `index.html`: home, two-row bestseller grid, featured brands, rewards, category tiles, tips, FAQ, social block.
- `products.html`: all categorized products, filters, sorting, and load-more pagination.
- `collection.html`: category/concern, best-seller, and brand listings.
- `product.html`: product gallery and related products.
- `about.html`: editable brand story and values.
- `contact.html`: contact form, contact details, and FAQ.
- `policies.html`: how-to-use guidance, ordering, returns/refunds, shipping, payment methods, privacy, and terms.
- `account.html`: email/password registration and login backed by MongoDB Atlas on Vercel.
- `control.html` / `/control`: server-authorized order-management interface for administrators.

## Storefront configuration and integrations

- `js/content.js` contains the 10% first-order announcement, 45,000 CFA free-delivery threshold, CFA currency, and rewards conversion settings.
- One authenticated review per product awards 15 server-stored points. Purchase points are calculated from the discounted XOF merchandise subtotal and credited to the customer account after an administrator marks the order delivered. Contact and newsletter forms are still not connected to a messaging or mailing-list service.
- The Glow Guide uses a Vercel serverless endpoint at `api/chat.js` with OpenAI's Responses API. Set `OPENAI_API_KEY` as a server-side deployment environment variable; optionally set `OPENAI_MODEL`. The browser never receives the key. Without a configured endpoint, the guide uses its local catalog/FAQ fallback.
- Add the official WhatsApp number, contact email, social links, and approved store policy details to `js/content.js` before publishing. Policies in `policies.html` are original starter copy and should be aligned with the business's actual terms.
