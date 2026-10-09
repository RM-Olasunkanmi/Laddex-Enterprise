# Backend integration requirements

The frontend runs entirely on typed fixtures behind replaceable adapters. Nothing was written to a database, no payment is configured, and no production service is touched. This document lists what to build or connect, in the order that unlocks the most.

## Seams (where to plug in)

| Concern                                   | Interface                                                               | Fixture adapter           | Replace with                                                                       |
| ----------------------------------------- | ----------------------------------------------------------------------- | ------------------------- | ---------------------------------------------------------------------------------- |
| Catalogue (products, packs, tiers, stock) | `CatalogueService` (`src/features/catalogue/contracts.ts`)              | `adapters/fixture.ts`     | Payload adapter reading Products, Variants and a new price-tier collection         |
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
- Quote request record, staff pricing and a written response. The indicative total in the builder is not an offer.

## 3. Orders and checkout

- Order, line (variant, qty, unit price at purchase, line total), delivery method and fee with basis (`zone-rule`, `manual-quote`, `none`), returned value, status history, channel, customer reference, exact delivery coordinates (nullable).
- Totals must equal the sum of lines plus delivery; keep the reconciliation tests as acceptance tests for the API.
- Payment (Stripe in the starter, or a Nigeria-appropriate gateway), tax rules and confirmation messaging are not implemented. The checkout page is a preview and says so.
- Nigerian address capture: street, landmark, LGA and state come from the confirmed map location plus free text; validate mobile numbers (`isNgPhone`).

## 4. Delivery

- Zones as real polygons or LGA sets owned by operations, with price rules, plus real distribution points (opening hours, stock). Replace `SAMPLE_ZONES` and `SAMPLE_PICKUP_POINTS`; the UI already separates "sample" from "verified" wording, which should be removed only when data is verified.
- Coverage answer as an API: `POST /delivery/estimate {position, cartWeight} -> {coverage, options[]}`.
- PostGIS is the natural home for polygons and point-in-polygon at scale.

## 5. Dashboard API (authenticated, role-checked on the server)

`GET /analytics/orders?from&to&category&variant&segment&channel&status` returning the `EnrichedOrder` shape (`src/features/spatial-intelligence/types.ts`), with `stateId`, `lgaId`, `zoneId` assigned by a PostGIS spatial join. For larger data move aggregation server-side (the pure functions in `metrics.ts` are the specification) and serve vector tiles or PMTiles for boundaries and points.

- **Authorisation:** analysts receive aggregates only; admins may receive order-level rows. Exact coordinates are personal data; generalise server-side for non-admin roles. The client role toggle is not security.
- **Boundaries:** keep the source metadata in `sources.json`; load Lagos only; add other states' LGAs as needed rather than the national file.
- Remove `synthetic: true` data from production builds and never mix it with real orders.

## 6. Replacing the legacy storefront route

The starter's CMS homepage was replaced by the Laddex homepage (`/`). The starter's `/product/[slug]`, `/category/[slug]`, `/checkout` and `/admin` still exist (made request-time rendered so the build needs no database). When the Payload adapter lands, retire the old product and category routes in favour of `/products/[slug]` and `/shop`, and connect `/order` to the real checkout.

## 7. Operations

- Environment: `DATABASE_URL`, `PAYLOAD_SECRET`, storage and email variables from `.env.example`. A development `.env` is git-ignored.
- Add analytics events (add to cart, begin checkout, purchase) using the starter's existing hooks once real payment exists.
- Run the unit tests and `scripts/qa/*` in CI against a built server.
