# Quality assurance report

Everything below was executed in the build sandbox against the code in this repository. Commands are given so each result can be reproduced.

## Static checks and tests

| Check | Command | Result |
|---|---|---|
| TypeScript | `pnpm typecheck` | pass, no errors |
| Lint | `pnpm lint` | 0 errors, 0 warnings (third-party `.claude/**` skill files are ignored) |
| Unit tests | `pnpm test` | **80 passed** in 5 files |
| Production build | `pnpm build` | pass (the starter's sitemap logs a caught Postgres connection error because no database exists; the build is unaffected) |

Unit tests cover: pricing and tier eligibility (guests and pending accounts are never charged tiers), catalogue filter, sort and normalisation, delivery fee bands and quote-required states, spatial join against the **real** boundary files (all 20 LGAs, gazetteer points, pickup points in their zones, swapped coordinates, points outside Lagos), synthetic order reconciliation (lines to totals, storefront price parity), every KPI definition including zero denominators and cancelled/returned handling, aggregation reconciliation at all four scales, filters and selection logic, and design-token sync and contrast.

## Browser tests (real Chromium, production server)

`BASE=http://localhost:3355 node scripts/qa/e2e.mjs`: **39 of 39 passed, with no console errors** (requests to the external basemap and geocoder hosts, which the sandbox blocks, are excluded). Covered:

- Homepage, category navigation, filters, sort, empty state, error state with retry.
- Product page: variant selection, quantity, add to cart, cart drawer, cart persistence.
- Retail versus wholesale switching: guest sees "indicative" tiers; approved wholesale is charged tier price (12 packs at the 12+ tier checked to the naira); registration moves the account to "awaiting approval"; reorder from history.
- Quote builder validation and submission preview.
- Delivery: search, result selection, coverage statement, confirm, options; map canvas renders; click places a pin and resolves an LGA; zone without a price rule shows "quote required"; point outside the sample zones is labelled.
- Checkout preview validation, totals with delivery, confirmation.
- Dashboard: loading state, error state with retry, zone selection updates every figure and keeps filters, area list orders equal inspector orders, product and date filters recompute together, single-order inspection shows only that order and restores the previous context, analyst role cannot see order rows, all staff sections load.
- Keyboard: skip link first, visible focus rings, filters and cart drawer operable without a mouse (Escape closes the drawer).
- Mobile (390 px): no horizontal overflow on 11 storefront routes, drawer navigation, sticky buy bar, tabbed dashboard.

During development the same suite found and led to fixes for: a conditional hook that crashed the wholesale page, a nested form that broke checkout hydration, a MapLibre CSS rule that collapsed the map height, and ambiguous KPI locators. These are fixed.

## Accessibility (automated)

`node scripts/qa/a11y.mjs` and `MOBILE=1 node scripts/qa/a11y.mjs`: axe-core WCAG 2.0/2.1 A and AA over 15 routes at desktop and mobile widths: **0 violations**. The first run found 14 route-level failures (accessible names not containing visible text, one low-contrast dimmed pack option, scroll regions without keyboard access); all were fixed and re-scanned.

Not done: manual screen-reader testing, magnification and forced-colours review, and a formal WCAG audit. Automated tools catch only part of the issues.

## Performance (production build, local server, unthrottled)

`BASE=http://localhost:3355 node scripts/qa/perf.mjs`. Transfer sizes are compressed bytes from the network layer; times come from one run on a fast local machine with no network throttling, so use the sizes and CLS as the meaningful numbers and treat times as indicative.

| Route | JS | CSS | Fonts | Largest contentful paint | CLS |
|---|---|---|---|---|---|
| Home | 153 to 159 KB | 16 KB | 176 KB | 0.2 to 1.0 s | 0 |
| Shop (palm oil) | 154 to 163 KB | 16 KB | 176 KB | 0.2 to 0.5 s | 0 |
| Product | 163 to 172 KB | 16 KB | 176 KB | 0.3 s | 0 |
| Delivery (with map) | 428 to 497 KB | 27 KB | 141 KB | 0.2 s | 0 to 0.05 |
| Dashboard (with map) | 458 to 466 KB | 27 KB | 141 to 176 KB | 0.2 to 0.6 s | 0 to 0.005 |

MapLibre is loaded with a dynamic import, so it adds roughly 270 KB only on the two routes that show a map. Lagos boundaries are 87 KB; the 285 KB state file loads only for the dashboard. A catalogue layout shift (CLS 0.112) was found and removed by giving the Suspense boundary a same-size skeleton.

## Visual review

25 screenshots in `/screenshots` (desktop and mobile; default, selected, filtered, empty, loading and admin states) were inspected after each iteration. Issues found and fixed this way include an oversized empty hero ladder, cramped pack tables, a tiny map on narrow screens (now an aspect-aware default extent), single-column product cards that made mobile pages 9,600 px tall (now two columns), and a map that scrolled out of view when an order was selected.

## Known gaps

- **Online map and geocoder untested.** The sandbox blocks OpenFreeMap and Nominatim, so only the offline fallbacks ran. Test both on a connected machine.
- Dragging the pin and the map's pan/zoom gestures were not exercised by automation (click placement was).
- Only Chromium was tested. No Safari or Firefox runs, and no real-device touch testing.
- Performance was not measured on throttled mobile networks or CPUs.
- The Figma file could not receive screenshots (see `FIGMA.md`).
- No tests exist for the legacy Payload storefront; it was kept intact and its routes were not browser-tested (they need a database).
