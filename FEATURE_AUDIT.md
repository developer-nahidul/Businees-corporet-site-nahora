# NAHORA Master Feature Inventory & Preservation Checklist

This is the persistent inventory for the existing NAHORA frontend features. “Complete” means the requested interface and meaningful local interaction are present; demo data and unavailable real-world actions remain clearly labeled. A route or placeholder by itself is not counted as complete. Feature IDs are stable references: keep a row when work is incomplete, and update it when implementation or test coverage changes.

The table's `Route / component` field is the frontend trace; `Remaining frontend work` records current behavior and known gaps. The legacy `Partial` status means **PARTIALLY WORKING**. Use **WORKING**, **PARTIALLY WORKING**, **BROKEN**, **UI ONLY**, or **PLANNED** for future status updates. Do not mark an incomplete feature unnecessary or remove its row without explicit Owner approval.

| # | Feature area | Status | Route / component | Remaining frontend work |
|---:|---|---|---|---|
| 1 | Foundation and design system | Partial | `src/components.tsx`, `src/styles.css`, all routes | Continue checking shared component consistency and add dedicated loading, error, and permission states to every page. |
| 2 | Multilingual support | Partial | `src/i18n.ts`, `src/components.tsx`, `src/advanced.tsx` | Shared workspace navigation and Super Admin audit-history headings, filters, actions, and sample records now switch to Bengali. Translate remaining page copy, forms, and tables; retain English as fallback for untranslated strings. |
| 3 | Public marketplace | Partial | `/`, `/deals`, `src/pages.tsx` | Homepage, discovery sections and sample campaigns exist; complete remaining sponsored, nearby, collection and live campaign interactions. |
| 4 | Customer account | Partial | `/account`, `/profile`, `/addresses`, `src/pages.tsx` | Cart, wishlist, recently viewed, profile basics and address book persist locally; profile/address forms validate email and Bangladesh mobile numbers. Remaining account history and preference flows still need richer stored forms. |
| 5 | Product discovery | Partial | `/search`, `/search/all`, `src/pages.tsx`, `src/advanced.tsx` | Product filters and universal local search work; add visual/voice search simulation, role-scoped indexing and richer suggestions/history. |
| 6 | Product details | Partial | `/product/:productId`, `src/pages.tsx` | Gallery, variants, seller, review and Q&A previews exist; expand price history, authenticity, warranty, video and availability alerts. |
| 7 | Multi-vendor cart | Partial | `/cart`, `/checkout`, `src/pages.tsx` | Cart is grouped by merchant with subtotals, per-seller delivery estimates, quantity controls, save-for-later wishlist actions and a persisted sample coupon; checkout reflects current cart items, applied sample discount and selected delivery speed. Unavailable stock handling and richer coupon rules remain. |
| 8 | Customer orders | Partial | `/orders`, `/order-tracking`, `src/pages.tsx`, `src/advanced.tsx` | Order list/details/invoice previews, reorder-to-cart, return/help and processing cancellation requests persist in browser local storage; real fulfillment, partial shipments, refunds and tracking remain demo-only. |
| 9 | Reviews and ratings | Partial | `/reviews`, `/product/:productId` | Rating/review previews exist; complete media attachment previews, helpful/report moderation and merchant response workflow. |
| 10 | Merchant storefront | Partial | `/stores/:storeId`, `src/pages.tsx` | Independent store pages and contact/profile preview exist; expand stories, store post manager and policy/location interactions. |
| 11 | Store location and contact | Partial | `/merchant/settings`, `/stores/:storeId` | Contact toggles and address/map preview exist; complete business-hours editor, each channel's individual configuration and public visibility preview. |
| 12 | Buyer–merchant messaging | Partial | `/inbox`, `src/pages.tsx` | Search, local messages, pin/archive/mute/block/report previews, labels, internal notes, quick replies, translation and local attachment selection work; real delivery and voice/call playback remain unavailable. |
| 13 | Social commerce | Partial | `/community`, `/merchant/social` | Feed/story and merchant shoppable-content previews exist; complete comments/replies, creator collaboration, live-shopping controls and analytics. |
| 14 | Social sharing | Partial | `/share`, `/merchant/marketing` | Product selection, demo-link copy, downloadable SVG share-card preview and honest platform/QR states work; store/campaign/collection card variants, aspect ratios and scannable QR generation remain. |
| 15 | Deals and campaigns | Partial | `/deals`, `/advertiser/*`, `/merchant/marketing` | Campaign creation/list/calendar previews exist; expand coupons, flash/group deals, targeting and approval lifecycle. |
| 16 | Loyalty and membership | Partial | `/rewards`, `/coupons`, `/gift-center` | Points, membership, coupons and gift previews exist; complete redemption rules, history and customer-facing state changes. |
| 17 | Referral and affiliate | Partial | `/referrals`, `/creator/links`, `/creator/earnings` | Link/QR and attribution previews exist; complete share history, referral lifecycle and creator attribution filtering. |
| 18 | Merchant dashboard | Partial | `/merchant`, `MerchantOverviewExtras` in `src/advanced.tsx` | KPI/chart/health/stock/returns/courier summaries exist as samples; refine business-specific calculations, date filters and stateful alerts. |
| 19 | Product management | Partial | `/merchant/products`, `src/advanced.tsx` | Add/edit draft listings and BDT price/status changes persist in browser local storage; CSV files are read in-browser for column mapping and row validation without upload/import. Variant editing, delete confirmation and bulk editing remain. |
| 20 | Universal product catalog | Partial | `/merchant/catalog`, `src/advanced.tsx` | Searchable identity, barcode, category and duplicate review previews are interactive; verified compare-and-select and category-specific listing flows remain. |
| 21 | Inventory and warehouse | Partial | `/merchant/inventory`, `src/advanced.tsx` | Stock adjustments, movement notes, transfer previews and receiving rows persist in browser local storage; full movement history, WAC costing, supplier approvals and barcode/QR designer remain. |
| 22 | Order management | Partial | `/merchant/orders`, `/courier/*` | Sample lifecycle and parcel previews exist; complete bulk processing, branch fulfillment, partial shipment, packing slips and customer shortcuts. |
| 23 | Accounting and financial UI | Partial | `/merchant/accounting` | Commission calculator uses the requested 10% × max(0, net price − WAC COGS) rule; add expenses, cashbook, statements, reconciliation, tax and audit surfaces. |
| 24 | CRM | Partial | `/merchant/customers`, `/merchant/crm` | Sample segments and purchase totals are searchable; local customer notes persist in browser storage; tags, loyalty and export workflow remain. |
| 25 | Store builder | Partial | `/merchant/store-builder` | Reorderable sections, undo/redo and device/theme previews exist; complete component library, typography/color controls, templates, SEO/domain and version history. |
| 26 | Marketing studio | Partial | `/merchant/marketing`, `/merchant/automation`, `/ai` | Campaign, automation and caption suggestions exist; add richer coupon/offer design, content calendar, QR/share history and social preview sizing. |
| 27 | Branch and staff management | Partial | `/merchant/branches`, `/merchant/team`, `/staff/*` | Branch/staff/attendance/permission previews exist; complete franchise, leave, shift, payroll and approval interactions. |
| 28 | Business intelligence | Partial | `/merchant/analytics`, `/ai` | KPI, forecast and stock/price suggestion previews exist; add configurable reports, heatmaps, assumptions and export interactions. |
| 29 | Super Admin | Partial | `/admin/*`, `src/advanced.tsx` | Merchant/customer, finance, moderation, risk, system, privacy and audit previews exist; expand health scoring, dual approval, policy and role matrix detail. |
| 30 | Courier portal | Partial | `/courier/*`, `src/advanced.tsx` | Parcel, COD, booking, agents, disputes and settlement previews exist; complete pickup/status state machine, proof/OTP/weight and RTO interactions. |
| 31 | Advertiser portal | Partial | `/advertiser/*` | Campaign builder, analytics, profile, billing and calendar previews exist; expand audience, placement review, invoice details and campaign editing. |
| 32 | Creator portal | Partial | `/creator/*` | Partnerships, affiliate links, content, earnings and analytics previews exist; complete collaboration history and attribution/report filtering. |
| 33 | Staff portal | Partial | `/staff/*` | Tasks, support, moderation, disputes and calendar previews exist; add team mentions, notes, assignments and role-specific access states. |
| 34 | Developer portal | Partial | `/developer/*` | Documentation, key/webhook/integration and sandbox previews exist; improve searchable docs, code samples, announcements and version navigation. |
| 35 | Merchant Academy | Partial | `/academy` | Courses, lesson cards and progress preview exist; add lesson detail, completion state and searchable training library. |
| 36 | Community | Partial | `/community`, `/customer-community` | Merchant/creator community feed preview exists; complete topics, replies, profile pages and moderation interactions. |
| 37 | AI workspaces | Partial | `/ai`, `src/advanced.tsx` | Eighteen mock tool choices produce reviewable suggestions; outputs are not model-generated and require richer scenario-specific inputs and preview states. |
| 38 | Notification center | Partial | `/notifications-center`, `/notifications`, `src/advanced.tsx`, `src/styles.css` | Category filters, 12 demo activity categories, unread state, mark-all-read and local read history work; the mobile category-filter overflow is fixed. Complete preference wiring and cross-role event generation. |
| 39 | PWA and mobile | Partial | `/mobile-preview`, responsive styles | Responsive layouts, mobile navigation and install/offline previews exist; representative 390px mobile screens are checked. No actual PWA manifest/service worker/offline capability is implemented. |
| 40 | Accessibility and quality assurance | Partial | `/accessibility`, all routes, `src/styles.css` | Larger text, reduced motion and high-contrast/keyboard focus preferences now apply locally; full screen-reader, contrast, modal and cross-route interaction audit remains. |
| 41 | Customer and merchant live API | Partial | `server/app.ts`, `server/db.ts`, `server/security.ts`, `/shop`, `/orders/live`, `/merchant/live`, `/admin/live-merchants` | Server-backed sign-up/sign-in, role checks, admin-reviewed merchant approval, product/stock management, COD order placement, status changes, ownership checks and pending-order cancellation work with SQLite locally and PostgreSQL in managed hosting. Real traffic, email verification/recovery, payment/courier providers, backups, and remaining demo-page integration are not ready. |
| 42 | Managed staging deployment | Partial | `render.yaml`, `server/index.ts`, `server/db.ts`, `README.md` | Render blueprint can provision a PostgreSQL-backed staging service and serve the frontend/API together. Owner must connect the repository, review paid plans, set private admin credentials, and initiate deployment; no resources or real-user data are deployed. Production operations and recovery remain unconfigured. |

## Traceability defaults

These project-wide facts apply to every inventory row unless a row explicitly says otherwise:

- **Backend/API:** a local Node/Express API supports the live MVP paths in feature 41. Other preview routes still use demo-only data and do not submit real operations.
- **Database:** local development uses the versioned SQLite schema in ignored `.data/nahora.sqlite`; managed hosting uses a separate versioned PostgreSQL schema. The staging database is new and empty. Local SQLite records are neither copied nor deleted. No production backup/restore procedure is configured.
- **Permissions:** API routes enforce customer, approved-merchant, and administrator roles. The legacy portal routes and their sidebars remain preview UI, not access control.
- **Related modules:** each row lists its route and/or implementing source module. Shared UI behavior is in `src/components.tsx`; route wiring is in `src/App.tsx`; demo records are in `src/data.ts`; persistent browser state is in `src/store.ts`, `src/pages.tsx`, and `src/advanced.tsx`.
- **Browser-local data:** keys currently include `nahora-demo-state`, `nahora-theme`, `nahora-language`, `nahora-accessibility`, `nahora-search-history`, `nahora-demo-notifications`, `nahora-customer-profile`, `nahora-customer-orders`, `nahora-customer-addresses`, `nahora-cart-coupon`, and `nahora-demo-records-*`. These are device-local demo data, not account or production records.
- **Server data:** live API accounts, sessions, merchant applications, products, stock, and orders are stored in the selected server database. SQLite is local-development only; Render staging uses PostgreSQL. Local records are not automatically migrated to staging.

## Permanent preservation checklist

- [ ] Before a change, identify affected feature IDs and record their current status, routes, related modules, local-storage keys, and known gaps.
- [ ] Preserve the current workflows and browser-local demo data; do not remove or silently replace a feature.
- [ ] Obtain explicit Owner approval before removing a feature, changing access behavior, or making a destructive data change.
- [ ] After a change, update the affected inventory rows and run the automated regression suite and production build.
- [ ] Record any feature-specific manual checks, failures, and uncovered areas; do not claim untested features are regression-safe.

## Regression coverage

| Coverage | Automated check | Current result |
|---|---|---|
| Public, customer, and workspace navigation | `tests/app.routes.test.tsx` renders declared public routes, `customerRoutes`, and every `portalNavigation` entry; asserts the missing-page fallback is absent. | Covered |
| Cart, wishlist, recently viewed, and theme state | `tests/store.test.ts` checks cart count/quantity updates, persisted state, and theme application. | Covered |
| Customer profile and address workflows | `tests/app.routes.test.tsx` submits a valid profile; adds a default address and checks existing addresses remain intact. | Covered |
| Cart coupon and checkout safety | `tests/app.routes.test.tsx` applies the sample coupon and submits valid checkout details; verifies no order record is created. | Covered |
| Merchant product and inventory workflows | `tests/app.routes.test.tsx` adds a product draft and adjusts stock; verifies saved records and low-stock status. | Covered |
| Notification history | `tests/app.routes.test.tsx` marks all sample notices read and checks all 12 records remain. | Covered |
| Bengali language switch on the Super Admin audit screen | `tests/app.routes.test.tsx` changes locale using the header control and checks Bengali heading, search placeholder, filter action, record, and saved preference. | Covered |
| PostgreSQL schema and live marketplace workflows | `tests/postgres.test.ts` exercises schema initialization, health check, account creation, merchant approval, product stock, COD order placement, and cancellation when `TEST_DATABASE_URL` is set; CI supplies a disposable PostgreSQL service. | Covered in CI |
| Every other feature interaction | Route smoke test confirms pages render, but does not assert their business interactions. Older manual checks are labeled separately below. | Not automated |

### Test status by inventory ID

`Route smoke only` verifies the screen renders, not that every control works. `Interaction` means an automated workflow assertion exists. `Historical manual` records earlier checks, not a current automated guarantee.

| ID | Regression status |
|---:|---|
| 1 | Route smoke only; shared UI behavior also exercises routes in the suite. |
| 2 | Interaction: Bengali switch and audit page content; full translation coverage is not tested. |
| 3 | Route smoke only; marketplace purchases/payments are not connected. |
| 4 | Interaction: profile save and address add/default/data preservation. |
| 5 | Route smoke only; universal search had a historical manual check. |
| 6 | Route smoke only. |
| 7 | Interaction: cart state, sample coupon, and checkout no-order guarantee; checkout form validation is only partially covered. |
| 8 | Route smoke only; order history and cancellation workflows are not currently automated. |
| 9 | Route smoke only. |
| 10 | Route smoke only. |
| 11 | Route smoke only. |
| 12 | Route smoke only; messaging is local demo behavior. |
| 13 | Route smoke only. |
| 14 | Route smoke only. |
| 15 | Route smoke only. |
| 16 | Route smoke only. |
| 17 | Route smoke only. |
| 18 | Route smoke only. |
| 19 | Interaction: add/persist product draft without replacing prior rows; CSV validation has historical manual coverage. |
| 20 | Route smoke only. |
| 21 | Interaction: stock adjustment persistence and low-stock classification. |
| 22 | Route smoke only. |
| 23 | Route smoke only; commission math has a historical manual check. |
| 24 | Route smoke only. |
| 25 | Route smoke only; section reorder/undo had a historical manual check. |
| 26 | Route smoke only. |
| 27 | Route smoke only. |
| 28 | Route smoke only. |
| 29 | Route smoke; audit history Bengali labels are exercised, not administrative permissions. |
| 30 | Route smoke only. |
| 31 | Route smoke only. |
| 32 | Route smoke only. |
| 33 | Route smoke only. |
| 34 | Route smoke only. |
| 35 | Route smoke only. |
| 36 | Route smoke only. |
| 37 | Route smoke only; mock suggestions had a historical manual check. |
| 38 | Interaction: mark all read while preserving history; 390px notification-filter layout checked in browser with no overflow. |
| 39 | Route smoke only; 8 representative pages checked at 390px and 1280px, not every screen or breakpoint. |
| 40 | Route smoke only; accessibility preferences had historical manual checks, not per-screen assertions. |
| 41 | API tests: account registration, password hashing, role restrictions, merchant approval, cross-store product ownership, server-calculated order totals, stock checks/rollback, cancellation and logout; PostgreSQL workflow integration runs in CI. |
| 42 | Render blueprint is statically configured; no external staging deployment or live browser check has been performed. |

## Verification completed

- `npm test` runs automated assertions covering route rendering, selected legacy demo workflows, and live API account, permission, product, inventory, order, cancellation, and merchant-approval workflows; see the runner output for the current count.
- `npm run build` runs TypeScript project checks and Vite production bundling.
- CI provisions a disposable PostgreSQL instance and runs the PostgreSQL marketplace integration test; local runs skip that test unless `TEST_DATABASE_URL` is supplied.
- The previous audit recorded manual smoke checks for all 121 routes and exercised commission math, store-builder reordering/undo, onboarding progress, AI mock suggestions, notification read state, universal customer search, Bengali switching, mobile horizontal overflow, accessibility preferences, CSV parsing/mapping, address persistence, product draft persistence, and profile validation. Those historical manual checks are not a substitute for the automated coverage listed above.
- Browser-checked `/`, `/cart`, `/profile`, `/addresses`, `/merchant/products`, `/merchant/inventory`, `/notifications-center`, and `/admin/audit` at 390px and 1280px: no horizontal overflow or console/page errors. The check found and fixed an overflow in notification category filters.
- Other responsive layouts and uncovered feature workflows still require manual/browser verification when those areas change.

## Explicit scope limits

Only the separate live API MVP submits and stores COD orders. It does not collect payment or connect email, SMS, courier, or refund providers. Most existing routes remain frontend previews. PostgreSQL support and a staging blueprint are prepared, but the external deployment is not created; the API's basic account flows are not production-ready. Keep real operations on an existing system until the Owner provisions/reviews hosting and configures verification/recovery, security monitoring, and backups.
