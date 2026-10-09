# Backend integration requirements

Development can run on typed fixtures behind replaceable adapters. Production
defaults to the Payload adapter, and Paystack remains disabled until the schema
migration and owner-approved catalogue and delivery data are deployed.

## Seams (where to plug in)

| Concern                                   | Interface                                                               | Fixture adapter           | Replace with                                                                       |
| ----------------------------------------- | ----------------------------------------------------------------------- | ------------------------- | ---------------------------------------------------------------------------------- |
| Catalogue (products, packs, tiers, stock) | `CatalogueService` (`src/features/catalogue/contracts.ts`)              | `adapters/fixture.ts`     | Payload adapter reading Products, Variants and a new price-tier collection         |
| Catalogue (live)                          | same                                                                    | `adapters/payload.ts` (`LADDEX_CATALOGUE_SOURCE=payload`) | Laddex field groups on Products/Variants; tiers only for `wholesale-approved` |
| Address search                            | `GeocodingService` (`src/features/delivery/contracts.ts`)               | gazetteer and Nominatim   | Nigeria-aware geocoder with a production licence                                   |
| Delivery pricing                          | `DeliveryPricingService`                                                | `pricing.ts` weight bands | Server-side rules per zone, returned for a cart and location                       |
| Routing                                   | `RoutingService`                                                        | none                      | Road-network routing for travel distance and time                                  |
| Dashboard data                            | `DashboardDataService` (`src/features/spatial-intelligence/dataset.ts`) | seeded synthetic orders   | Authenticated orders API (see below)                                               |
| Cart, customer, delivery location         | `createPersistedStore` (localStorage)                                   | the stores themselves     | Payload cart (`@payloadcms/plugin-ecommerce`) and session user; keep the selectors |

Components import types and selectors, never fixtures. Fixtures are imported only by adapters and tests. The catalogue is handed to client components through `CatalogueProvider`, so a new adapter changes one function (`getCatalogue`).

## 1. Catalogue and pricing

- Model palm oil in litres and tapioca in kilograms: `contentBase` per variant, a `unitKind`, and integer **kobo** prices (never floats).
- Add `wholesaleTiers[{minQty, unitPriceKobo}]` and `wholesaleMinQty` per variant, and keep them separate from list price. **Return tier prices only to approved wholesale accounts.** The UI treats everything else as indicative; the server must not leak tiers or accept them from a client.
- Stock per variant, ideally per distribution point.
- Replace the pricing function with a server computation and keep `priceFor` as the display mirror. `pricing.test.ts` documents the rules to match (tier selection, minimums, eligibility).

## 2. Customers and wholesale approval

- `CustomerAccess`: guest, retail, wholesale-pending, wholesale-approved, from the authenticated session. Remove the persona switcher and role switch from production builds.
- Wholesale application record (business, type, contacts, status, reviewer, timestamps) with an admin approval action. Review time is deliberately not promised in the UI.
- Implemented as `wholesale-applications` (public create, staff-only read/decide) and `quote-requests` collections. Approval is a staff edit: set the linked user's `wholesaleStatus` to `approved`, which unlocks tier pricing in the catalogue adapter.
- Quote request record, staff pricing and a written response. The indicative total in the builder is not an offer.
- Implemented as the `quote-requests` collection above.

## 3. Orders and checkout

- Order, line (variant, qty, unit price at purchase, line total), delivery method and fee with basis (`zone-rule`, `manual-quote`, `none`), returned value, status history, channel, customer reference, exact delivery coordinates (nullable).
- Totals must equal the sum of lines plus delivery; keep the reconciliation tests as acceptance tests for the API.
- Paystack checkout is implemented: `POST /api/checkout/prepare` prices lines
  server-side, while `POST /api/paystack/initialize` creates an idempotent,
  immutable checkout snapshot. The webhook verifies signature, transaction,
  currency, amount, customer and metadata before atomically allocating stock
  and creating one order. If stock changed after payment, it requests a full
  refund. Confirmation trusts the durable checkout session, not the redirect.
- Nigerian address capture: street, landmark, LGA and state come from the confirmed map location plus free text; validate mobile numbers (`isNgPhone`).

## 4. Delivery

- Zones as real polygons or LGA sets owned by operations, with price rules, plus real distribution points (opening hours, stock). Replace `SAMPLE_ZONES` and `SAMPLE_PICKUP_POINTS`; the UI already separates "sample" from "verified" wording, which should be removed only when data is verified.
- Implemented for the regions model as `delivery-zones` and
  `distribution-points`. `pnpm seed:laddex` creates inactive sample zones and
  an unverified approximate Epe point; operations must replace and approve them.
- Coverage answer as an API: `POST /delivery/estimate {position, cartWeight} -> {coverage, options[]}`.
- Implemented in `src/app/api/delivery/estimate/route.ts`: bundled state
  boundaries (Cloudflare-safe, no disk reads), active regions when present, and
  distance to the approximate Epe-area point. Replace the point and fixture
  reads with verified operations data before publishing delivery promises.
- PostGIS is the natural home for polygons and point-in-polygon at scale.

## 5. Dashboard API (authenticated, role-checked on the server)

`GET /analytics/orders?from&to&category&variant&segment&channel&status` returning the `EnrichedOrder` shape (`src/features/spatial-intelligence/types.ts`), with `stateId`, `lgaId`, `zoneId` assigned by a PostGIS spatial join. For larger data move aggregation server-side (the pure functions in `metrics.ts` are the specification) and serve vector tiles or PMTiles for boundaries and points.
- Implemented as `GET /api/analytics/orders` (v1): reads Payload orders with the `laddex` fulfilment group, joins state/region against bundled boundaries (plus Lagos LGAs), and maps plugin statuses to dashboard statuses. Admins receive exact coordinates; other signed-in users receive generalised points; anonymous callers get 401.

- **Authorisation:** analysts receive aggregates only; admins may receive order-level rows. Exact coordinates are personal data; generalise server-side for non-admin roles. The client role toggle is not security.
- **Boundaries:** keep the source metadata in `sources.json`; load Lagos only; add other states' LGAs as needed rather than the national file.
- Remove `synthetic: true` data from production builds and never mix it with real orders.

## 6. Replacing the legacy storefront route

The starter's CMS homepage was replaced by the Laddex homepage (`/`). The starter's `/product/[slug]`, `/category/[slug]`, `/checkout` and `/admin` still exist (made request-time rendered so the build needs no database). When the Payload adapter lands, retire the old product and category routes in favour of `/products/[slug]` and `/shop`, and connect `/order` to the real checkout.

## 7. Operations

- Environment: `DATABASE_URL`, `PAYLOAD_SECRET`, storage and email variables from `.env.example`. A development `.env` is git-ignored.
- Add analytics events (add to cart, begin checkout, purchase) using the starter's existing hooks once real payment exists.
- Run the unit tests and `scripts/qa/*` in CI against a built server.
