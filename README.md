# NAHORA

**One Platform. Every Business. Infinite Possibilities.**

NAHORA is a responsive, Bangladesh-first marketplace project with a React/TypeScript/Vite frontend and a Node.js/Express API.

> **Scope notice:** The existing marketplace and specialist workspace pages remain demo previews. A separate server-backed MVP is available at `/shop`, `/merchant/live`, `/orders/live`, and `/admin/live-merchants`. It supports accounts, merchant approval, product listings, inventory checks, cash-on-delivery orders, and merchant order status updates. It does not process payments, send email/SMS, or connect couriers.

## Get started

### Requirements

- Node.js 20.19+ or 22.12+
- npm

### Install and run

```bash
npm install
Copy-Item .env.example .env
npm run dev
```

Before running, edit `.env` and set your own platform administrator email and a unique password of at least 12 characters. Keep `.env` private; it is ignored by Git. Admin credentials bootstrap the first admin only; they do not reset or replace an existing admin account. `npm run dev` starts the API on `127.0.0.1:3001` and the website on `127.0.0.1:5173`. The browser reaches the API through Vite's same-origin `/api` proxy. Check `http://127.0.0.1:5173/api/health` to verify the API.

The local database is created at `.data/nahora.sqlite` and is not committed. Merchant registration starts in a pending state; the configured administrator signs in and approves it at `/admin/live-merchants`. Approved merchants can add live products at `/merchant/live`; customers can register, place COD orders at `/shop`, and view/cancel pending orders at `/orders/live`.

The API persists user records and hashed passwords on the server. Sessions use random, `HttpOnly`, `SameSite=Strict` cookies; authentication endpoints are rate-limited; order prices and stock are checked on the server. SQLite remains the default for local development; setting `DATABASE_URL` selects PostgreSQL. Both database schemas use versioned, non-destructive initialization.

### Build for production

```bash
npm run build
npm run preview
```

The build command runs the TypeScript project checks and creates the static frontend bundle in `dist/`.

### Run regression tests

```bash
npm test
```

The automated checks cover public/customer/workspace routes, selected existing demo workflows, and server-side account, authorization, catalog, stock, order, cancellation, and merchant-approval workflows. Coverage for every inventory feature and uncovered manual checks is tracked in [FEATURE_AUDIT.md](./FEATURE_AUDIT.md).

### Check dependency advisories

```bash
npm audit
```

The lockfile's previously reported advisories were addressed by upgrading Vitest, React Router, and Zod to patched major versions. Re-run the audit after dependency changes; advisory status can change over time.

### Prepare managed staging

`render.yaml` describes a **staging-only** Render deployment on the `feature/backend-mvp` branch, with a managed PostgreSQL database and the website/API served together. The blueprint uses paid service/database plans; review the current Render pricing before creating resources. No hosting resources have been created by this repository change.

1. Create/sign into your Render account and connect the private GitHub repository.
2. Create a Blueprint from `render.yaml` and review the service and database plans before confirming.
3. Enter `NAHORA_ADMIN_EMAIL` and a unique password of at least 12 characters in Render's private environment-variable prompt. Never put secrets in Git or chat.
4. Deploy the blueprint. Render supplies `DATABASE_URL`; the app applies the versioned schema on startup and `/api/health` checks the database.
5. Use the generated Render URL to test registration, merchant approval, product listings, and COD orders. Use synthetic data only: this is staging, not a production launch.

The staging database starts empty; the local SQLite database is not copied or deleted. PostgreSQL integration tests run in CI against a disposable PostgreSQL service. Before real business traffic, separately configure and verify backups/restore, account verification and recovery, monitoring, privacy/legal requirements, payment/courier integrations, and an approved production release process.

## Safe development and releases

To keep planned changes separate from a stable release:

1. Keep `main` as the reviewed, release-ready branch. Do not develop directly on it.
2. Create feature branches from `develop` (for example, `feature/product-editor`) and merge them into `develop` through pull requests.
3. Use `develop` for integration and preview checks. Merge `develop` into `main` only after review and regression checks.
4. GitHub Actions runs `npm ci`, `npm audit`, `npm test`, and `npm run build` on pushes and pull requests targeting `main` or `develop`.
5. In GitHub repository settings, enable branch protection for both branches and require the CI check and pull-request review before merging. CI alone does not prevent direct pushes.

বাংলায়: `main` স্থিতিশীল release-এর জন্য রাখুন; প্রতিদিনের কাজ feature branch-এ করে pull request দিয়ে `develop`-এ নিন। যাচাই শেষে `develop` থেকে `main`-এ release করুন। GitHub settings-এ branch protection চালু করুন।

**Live-service limitation:** A managed PostgreSQL staging configuration is prepared, but no hosting resources have been created and no public deployment is live. The API's basic account lifecycle and COD-only orders are not ready for production. Most legacy pages are still previews; backups/restore, email verification/recovery, operational monitoring, and payment/courier integrations remain unconfigured.

## Frontend stack

- React 18, TypeScript, Vite, React Router
- Tailwind CSS and shared CSS design tokens
- Lucide React icons
- Zustand for local theme, cart, and toast state
- i18next / react-i18next for English and Bengali dictionaries
- React Hook Form and Zod for demo form validation
- TanStack Table for sortable workspace tables
- Recharts for illustrative dashboard charts
- Framer Motion for a subtle landing-page animation

## Backend stack

- Node.js, Express 5, SQLite (`better-sqlite3`) for local development, and PostgreSQL for managed hosting
- Zod request validation, Helmet security headers, and rate-limited authentication endpoints
- Node `scrypt` password hashing and random server-side sessions stored as hashes
- The live API is same-origin through the Vite `/api` development proxy

## Project structure

| Path | Purpose |
| --- | --- |
| `src/main.tsx` | React entry point, router and global stylesheet setup |
| `src/App.tsx` | Public, customer, and workspace route declarations |
| `src/pages.tsx` | Marketplace, buyer, and shared workspace page surfaces |
| `src/advanced.tsx` | Merchant operations, customer advanced tools, AI mock workspace, universal search, notification center, and mobile previews |
| `src/components.tsx` | Reusable headers, navigation, product cards, status pills, and shared UI |
| `src/data.ts` | Typed demo products, merchants, table records, and portal navigation |
| `src/store.ts` | Local Zustand state for theme, cart, and toast notifications |
| `src/i18n.ts` | English and Bengali translation dictionaries |
| `src/styles.css` | Design system, light/dark themes, and responsive page styling |
| `src/auth.tsx`, `src/api.ts`, `src/live.tsx` | Server session, API client, and live marketplace/customer/merchant/admin screens |
| `server/index.ts` | Local API startup, environment loading, and graceful shutdown |
| `server/app.ts` | Validated account, catalog, order, and approval API routes |
| `server/db.ts` | Versioned SQLite/PostgreSQL schemas, transactions, and database initialization |
| `server/security.ts` | Password hashing, opaque sessions, and API role enforcement |
| `render.yaml` | Owner-reviewed Render staging blueprint; provisions no resources by itself |
| `tailwind.config.js` | Tailwind theme colors and font configuration |
| `vite.config.ts` | Vite configuration and production chunk splitting |

## Routes and available screens

### Public marketplace

| Route | Screen |
| --- | --- |
| `/` | Marketplace home: categories, product picks, stores, seasonal feature, and newsletter preview |
| `/search` | Product discovery with query, category, price, rating, store, location, and sale filters; sorting, pagination, and grid/list layout |
| `/product/:productId` | Product detail, image gallery, interactive variants, seller preview, wishlist, reviews, and Q&A |
| `/stores` | Independent store directory |
| `/stores/:storeId` | Merchant storefront preview with products, policies, and contact options |
| `/deals` | Deals and campaigns preview |
| `/community` | Community and stories preview |
| `/products` | Redirects to `/search` |

### Customer

| Route | Screen |
| --- | --- |
| `/account` | Customer account hub |
| `/orders` | Demo order list, status filters, and support actions |
| `/wishlist` | Local-state saved products |
| `/inbox` | Buyer/merchant conversation preview |
| `/cart` | Multi-seller demo cart with editable quantities |
| `/checkout` | Validated delivery form and payment preview; no order is submitted |
| `/compare` | Interactive product comparison preview |
| `/collections` | Shopping collections preview |
| `/recently-viewed` | Product history in local app state |
| `/saved-searches` | Saved search preview |
| `/reviews` | Reviews and ratings preview |
| `/questions` | Product Q&A preview |
| `/returns` | Return and replacement request preview |
| `/refunds` | Refund status preview |
| `/warranty` | Warranty claim preview |
| `/complaints` | Buyer complaint/support preview |
| `/rewards` | Membership and rewards preview |
| `/coupons` | Coupon wallet preview |
| `/gift-center` | Gift and store-credit preview |
| `/gift-registry` | Gift registry preview |
| `/referrals` | Referral dashboard preview |
| `/assistant` | Shopping assistant preview |
| `/wholesale` | Wholesale and bulk shopping preview |
| `/nearby` | Nearby stores and local deals preview |
| `/price-alerts` | Price and back-in-stock alert preview |
| `/share` | Social sharing preview |
| `/notifications` | Notification preferences preview |
| `/subscriptions` | Recurring product subscription preview |
| `/pre-orders` | Maker pre-order preview |
| `/group-buying` | Group price threshold preview |
| `/authenticity` | Product authenticity QR preview |
| `/order-tracking` | Sample order tracking timeline |
| `/customer-community` | Customer community preview |
| `/profile` | Editable customer profile preview |
| `/addresses` | Bangladesh address book and local add/edit actions |
| `/followed-stores` | Followed merchant storefronts |
| `/brands` | Favourite brands preview |
| `/accessibility` | Display and accessibility preferences |
| `/privacy-settings` | Privacy preference controls |

### Role workspaces

Each workspace has a role-specific sidebar and header. Overview routes include illustrative metrics, charts, activity, quick actions, and searchable records. Merchant areas include onboarding, product and universal catalog, inventory, order fulfillment, CRM, accounting, store builder, procurement, returns, marketing automation, social commerce, branches/team, subscriptions and data portability. Super Admin also includes risk, system, privacy and audit previews; courier includes bulk booking, agent and dispute views. Other portals retain their dedicated campaign, creator, staff and developer screens. All values and actions are demo-only.

| Workspace | Routes |
| --- | --- |
| Merchant | `/merchant`, `/merchant/onboarding`, `/merchant/products`, `/merchant/catalog`, `/merchant/inventory`, `/merchant/orders`, `/merchant/customers`, `/merchant/accounting`, `/merchant/store-builder`, `/merchant/procurement`, `/merchant/returns`, `/merchant/marketing`, `/merchant/automation`, `/merchant/social`, `/merchant/analytics`, `/merchant/branches`, `/merchant/team`, `/merchant/subscription`, `/merchant/data`, `/merchant/settings` |
| Super Admin | `/admin`, `/admin/merchants`, `/admin/customers`, `/admin/catalog`, `/admin/finance`, `/admin/campaigns`, `/admin/support`, `/admin/risk`, `/admin/governance`, `/admin/system`, `/admin/privacy`, `/admin/audit`, `/admin/analytics` |
| Courier | `/courier`, `/courier/parcels`, `/courier/pickups`, `/courier/bulk-booking`, `/courier/tracking`, `/courier/agents`, `/courier/remittance`, `/courier/disputes`, `/courier/settlements`, `/courier/areas`, `/courier/reports` |
| Advertiser | `/advertiser`, `/advertiser/campaigns`, `/advertiser/create`, `/advertiser/calendar`, `/advertiser/analytics`, `/advertiser/billing`, `/advertiser/profile` |
| Creator & Affiliate | `/creator`, `/creator/partnerships`, `/creator/links`, `/creator/content`, `/creator/earnings`, `/creator/analytics` |
| Staff | `/staff`, `/staff/tasks`, `/staff/support`, `/staff/moderation`, `/staff/disputes`, `/staff/calendar` |
| Developer | `/developer`, `/developer/docs`, `/developer/keys`, `/developer/webhooks`, `/developer/integrations`, `/developer/sandbox`, `/developer/changelog` |

### Server-backed MVP routes

| Route | Function |
| --- | --- |
| `/login`, `/register` | Server-backed customer/merchant accounts; merchant sign-up requires administrator approval |
| `/shop` | Lists approved merchants' live database products and places COD orders with server-validated price and stock |
| `/orders/live` | Shows the signed-in customer's live order history and allows cancellation while pending |
| `/merchant/live` | Approved merchant listing and stock view, plus order status changes |
| `/admin/live-merchants` | Administrator-only merchant application approvals |

### Learning and help

- `/academy` — Merchant Academy courses and progress preview
- `/help` — Help center preview
- `/privacy` — Privacy and trust information preview
- `/search/all` — local universal search for products, stores, customers, orders and workspace pages
- `/ai` — reviewable AI-themed mock suggestions
- `/notifications-center` — category-filtered demo notifications and read state
- `/mobile-preview` — install prompt and offline-state UI previews (not actual PWA/offline functionality)

## Shared interactions

- **Language:** use the header language button to switch English/Bengali. Document language and text direction follow the selected locale; product names remain as supplied in the product data, with Bengali names used where a translation is provided.
- **Language preference:** the selected locale is stored locally in the browser and restored on reload. Shared navigation and the Super Admin audit-history screen have Bengali translations; untranslated page content still falls back to English.
- **Theme:** switch light/dark mode from the header. The choice is stored in browser local storage.
- **Quick navigation:** press `Ctrl+K` to open the command palette; press `Escape` to close it.
- **Unified activity:** the header notification button opens the notification center; mark entries read and filter by category locally.
- **Universal search:** use `/search/all` to search sample products, stores, customers, orders, campaigns, conversations, reports and workspace routes. Recent search terms are stored locally.
- **AI previews:** `/ai` offers 18 reviewable mock suggestions; no model, upload processing or autonomous business decisions are connected.
- **Cart and buyer history:** add/change/remove products, save cart items to the wishlist, and record recently viewed items in local app state. The cart groups seller subtotals, estimates delivery per merchant, previews the `NAHORA10` sample coupon and feeds current cart contents into checkout. Checkout carries the sample coupon forward and recalculates totals when delivery speed changes. These changes do not persist as an order.
- **Order history:** `/orders` supports local order details/invoice previews, reorder-to-cart, return/help and processing cancellation request previews. Sample request states persist in browser storage and do not contact merchants or couriers.
- **Local persistence:** cart, wishlist, recently viewed items, theme, locale, accessibility preferences, universal search history, notification read state, address book, and selected merchant record changes are stored in browser local storage. This is device-local demo state, not an account sync.
- **Forms:** checkout, campaign, buyer request, review and affiliate-link interfaces demonstrate client-side validation/interactions. Submit actions only update local preview UI or show a notice.
- **Messaging:** filter conversations, switch stores, add local draft messages, pin/archive/mute conversations, choose labels, save internal notes, use quick replies and preview translation/attachments. Nothing is sent outside the browser preview.
- **Tables and search:** workspace tables support local search and sorting; product discovery supports local query, category, price, rating, store, location and sale filtering, sorting, and pagination.
- **Merchant records:** product add/edit, price and status changes, in-browser CSV column mapping and row-validation previews, inventory adjustments, warehouse transfer/receiving previews, catalog identity prompts and CRM notes update device-local demo state. Product, inventory, catalog, and CRM record edits persist in browser local storage; CSV data is not uploaded or imported, and no stock or listing is published.
- **Product sharing:** `/share` supports product selection, copying a clearly marked demo link and downloading an SVG card preview. Social publishing is unavailable; the QR interface explicitly states it is not scannable.
- **Account data:** `/profile` supports editing validated customer contact details; `/addresses` supports adding/editing, setting a single default, and confirming/removing delivery addresses with Bangladesh mobile validation. These records persist only in this browser's local storage.
- **Responsive layout:** public pages and portal navigation adapt to mobile and desktop widths.

## Design and demo data

- Brand palette: forest green `#123B32`, green `#176B52`, accent gold `#D7A84B`, and a soft neutral canvas.
- English is the default locale; Bengali text uses a Bengali-capable font stack.
- Currency display starts in Bangladeshi Taka (৳ BDT).
- Sample merchants, locations, and products are Bangladesh-oriented.
- Status badges, dashboard metrics, tracking, review, and financial examples are not verified real-world information.

## Current scope and next frontend work

The project is not yet a production marketplace. Most original specialist screens are still structured demo workflows. The live API MVP is limited to customer/merchant accounts, merchant approval, basic product listings and stock, COD orders, and order status. Email verification and recovery, audited production backups, production database/hosting, real payment processing, courier connections, customer communications, and the remaining business modules have not been implemented.

**Do not expose the current SQLite deployment to real public business traffic.** It is designed for local development and a single application process; the server defaults to localhost. Before production, choose managed PostgreSQL or another supported durable database, hosting with TLS and persistent backups, email verification/password recovery, monitoring, privacy/retention rules, and payment/courier providers. Never put service credentials in frontend `VITE_*` variables or source control. Real payment and courier credentials require the Owner to create provider accounts and configure server-side secrets.

To run only the API locally, use `npm run dev:api`. To serve only the UI, use `npm run dev:web` (the API must also be running for `/shop`, login, and live workspaces).

## Verification

Run `npm test` for automated regression checks and `npm run build` to type-check and create the production bundle. The existing audit records prior manual smoke checks for all 121 current public, customer and portal routes, plus selected workflows; automated test coverage is narrower and listed in [FEATURE_AUDIT.md](./FEATURE_AUDIT.md) alongside outstanding frontend work.
