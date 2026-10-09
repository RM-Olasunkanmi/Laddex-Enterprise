# Implementation report: Laddex frontend phase

## Starting point

The brief named `giladfuchs/next-ecommerce` (Next.js 16, Payload CMS 3, PostgreSQL, Tailwind 4) as the foundation. The repository first opened in the session was an unrelated project, so the work was moved to the new `Laddex-Enterprise` repository, seeded with the starter as a clean baseline commit (`7317c8f`, MIT licence retained). The starter's own code is untouched except four deliberate edits: the dependency list, `devIndicators: false` in `next.config.ts`, `export const dynamic = "force-dynamic"` in the legacy `(app)` layout (so the build needs no database), and removal of the legacy CMS homepage route, which the Laddex homepage replaces.

## Architecture

A new route group `src/app/(laddex)` has its own root layout, so the Payload admin and legacy routes keep working beside it. Nothing duplicates the commerce model: pricing, cart, delivery and analytics are pure TypeScript behind interfaces that a Payload adapter can implement.

```
src/
  app/(laddex)/            storefront (store group) and /dashboard (own dense shell)
  components/              navigation, commerce, product, wholesale, checkout, delivery, maps, analytics, charts, lx
  features/                catalogue, cart, customer, delivery, spatial-intelligence  (types, contracts, adapters, selectors, stores)
  fixtures/                products, geography (zones, gazetteer), orders (generator), customers (history)
  lib/                     design (tokens), geo (pip, area, distance, boundaries), data (stores, PRNG), formatters
  styles/laddex.css        tokens as CSS variables and component classes
public/geo/                real boundary files and source metadata
scripts/                   geo:build, qa (e2e, a11y, perf, gallery, shot)
docs/                      design, Figma, geospatial, assets, integration, QA, this report
```

State: one mechanism, `createPersistedStore` (a small `useSyncExternalStore` wrapper over localStorage) for cart, customer and delivery location, and one reducer with context for the dashboard. No state library was added.

## Delivered against the brief

| Deliverable | Status |
|---|---|
| Working frontend | Built; runs in dev and production |
| Design system | Tokens (code and Figma), component inventory, validated chart palette |
| Figma workspace | Created and populated; screenshots could not be uploaded (see `FIGMA.md`) |
| UI/UX Pro Max | Installed via the documented CLI path (`uipro init --ai claude`), used for research, and its default recommendation was evaluated and rejected |
| Storefront | Home, catalogue, product, cart and drawer, account, retail and wholesale paths, checkout preview and confirmation |
| Retail / wholesale | Same catalogue and pricing function. Wholesale tiers shown as indicative until an account is approved; quote builder, registration with approval states, order history and reorder |
| Delivery location | Search, map pin, LGA and sample-zone coverage by spatial join, options, fee estimate where a rule exists, quote-required and outside-coverage states |
| Real map | MapLibre with real GRID3/geoBoundaries LGA and state polygons; camera moves only on deliberate actions; reduced-motion respected |
| Spatial dashboard | Four aggregation scales (state, LGA, zone, pickup point) plus individual orders (admin), linked map, charts, inspector and tables; staff sections for orders, customers, inventory, wholesale, reports |
| Statistics engine | Pure typed functions with definitions, zero-denominator handling, cancelled and returned handling, period-over-period change |
| Tests | 80 unit tests, 39 browser checks, axe scan of 15 routes at two widths |
| Documentation | This folder |

## Decisions worth knowing

- **Honest data labelling.** Prices, sizes, stock, zones, fees, orders and customer histories are fixtures. A "Sample data" tag, notices, and "to be confirmed" product fields appear wherever they matter. No testimonial, certification, origin, delivery time or customer count appears anywhere.
- **Unit price first.** Each pack shows price per litre or per kilo, and sorting by it is offered only inside a single category, because litres and kilograms are not comparable.
- **No claim of verified coverage.** Zones are labelled sample, distances are labelled straight-line, and a pricing rule's absence yields "quote required" rather than a guess.
- **No fabricated analysis.** Clustering, density surfaces and heatmaps were left out because synthetic data would make them present invented patterns as insight. The primitives (point-in-polygon, area, aggregation) are in place for them.
- **Legacy Payload commerce preserved but bypassed on the new routes.** Cart and checkout in the new flow are frontend-only previews. The integration path is in `BACKEND_INTEGRATION.md`.

## Remaining work

Backend adapters and persistence, payment, real authentication and role enforcement, real photography, real zones and prices, production geocoder and routing, verifying the online basemap and geocoder on a connected machine, cross-browser and real-device testing, a screen-reader review, and tracking the legacy routes' retirement. See `BACKEND_INTEGRATION.md` and `QA_REPORT.md`.
