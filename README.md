# Laddex Enterprise

Palm oil by the litre and tapioca by the kilo: a retail and wholesale storefront with delivery-location checking and a spatial business-intelligence dashboard, for Nigeria.

This is the **frontend phase**. It runs on typed fixtures behind replaceable adapters. Prices, sizes, stock, delivery zones, fees, orders and customers are **illustrative** until real data is connected; the interface says so wherever it matters. Built on the [giladfuchs/next-ecommerce](https://github.com/giladfuchs/next-ecommerce) starter (Next.js 16, Payload CMS 3, Tailwind 4), whose commerce architecture is preserved.

## Run it

```bash
pnpm install
pnpm dev            # http://localhost:3344
pnpm build && pnpm start -p 3355
```

The storefront and dashboard need no database. The starter's Payload admin and legacy routes still need `DATABASE_URL` (see `.env.example`).

| Route | What it is |
|---|---|
| `/` | Homepage |
| `/shop`, `/shop/palm-oil`, `/shop/tapioca` | Catalogue |
| `/products/palm-oil?pack=po-25l` | Product page |
| `/cart`, `/order`, `/order/confirmation` | Cart and checkout preview |
| `/delivery` | Address search, map pin, coverage and options |
| `/wholesale`, `/wholesale/quote`, `/wholesale/register`, `/account` | Wholesale and account |
| `/dashboard` | Spatial intelligence (staff). Also `/dashboard/orders`, `customers`, `inventory`, `wholesale`, `reports` |

Review helpers: the black strip at the top of the storefront switches between guest, retail and wholesale (pending or approved) customers. In the dashboard, the Role control reveals order-level views. Append `?latency=3000` or `?fail=data` to dashboard URLs, and `?fail=catalogue` to `/shop`, to see loading and error states. Dashboard state lives in the URL, so views can be shared.

## Verify it

```bash
pnpm typecheck && pnpm lint
pnpm test                                  # 80 unit tests
pnpm build && pnpm start -p 3355 &
BASE=http://localhost:3355 pnpm test:e2e   # 39 browser checks (Chromium via playwright-core)
BASE=http://localhost:3355 node scripts/qa/a11y.mjs        # axe, add MOBILE=1 for phone width
BASE=http://localhost:3355 node scripts/qa/perf.mjs
BASE=http://localhost:3355 node scripts/qa/gallery.mjs     # refresh /screenshots
```

## Documentation

- [Implementation report](docs/IMPLEMENTATION_REPORT.md): what was built, decisions, what remains
- [Design directions and research](docs/design/DESIGN_DIRECTIONS.md), [design system](docs/design/DESIGN_SYSTEM.md), [Figma workspace](docs/FIGMA.md)
- [Geospatial data, methods and limits](docs/GEOSPATIAL.md)
- [Product imagery and replacing the development renders](docs/ASSETS.md)
- [Backend integration requirements](docs/BACKEND_INTEGRATION.md)
- [QA report](docs/QA_REPORT.md)
- Screenshots: [`/screenshots`](screenshots)

## Data and licences

Boundaries: geoBoundaries gbOpen (upstream GRID3), CC BY 4.0, shipped in `public/geo` with source metadata. Basemap tiles (online only): OpenFreeMap, OpenMapTiles, © OpenStreetMap contributors. Starter code: MIT, see `LICENSE`.
