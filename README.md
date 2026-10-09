# Laddex Enterprise

Laddex Enterprise: palm oil, tapioca flakes, Garri Igbo and Ijebu Garri. A storefront that serves households, resellers and event buyers, with nationwide delivery checking and a spatial business-intelligence dashboard, for Nigeria.

This is the **frontend phase**. It runs on typed fixtures behind replaceable adapters. Prices, sizes, stock, delivery rates, fees, orders and customers are **illustrative** until real data is connected; the interface says so wherever it matters. Built on the [giladfuchs/next-ecommerce](https://github.com/giladfuchs/next-ecommerce) starter (Next.js 16, Payload CMS 3, Tailwind 4), whose commerce architecture is preserved.

## Run it

```bash
pnpm install
pnpm dev            # http://localhost:3344
pnpm build && pnpm start -p 3355
```

The storefront and dashboard need no database. The starter's Payload admin and legacy routes still need `DATABASE_URL` (see `.env.example`).

| Route                                                               | What it is                                                                                                                             |
| ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                                                                 | Homepage with About, products, three ways to buy, nationwide delivery                                                                  |
| `/shop`, `/shop/palm-oil`, `/shop/tapioca`, `/shop/garri`           | Catalogue                                                                                                                              |
| `/products/garri-igbo?pack=gi-25kg`                                 | Product page (also `palm-oil`, `tapioca-flakes`, `garri-ijebu`)                                                                        |
| `/cart`, `/order`, `/order/confirmation`                            | Cart and checkout preview                                                                                                              |
| `/delivery`                                                         | Nationwide: search, state and LGA selects, map pin, delivery options                                                                   |
| `/wholesale`, `/wholesale/quote`, `/wholesale/register`, `/account` | Wholesale and account                                                                                                                  |
| `/events`                                                           | Souvenirs and bulk gifts, with enquiry form                                                                                            |
| `/contact`                                                          | Enquiry form (preview only, sends nothing)                                                                                             |
| `/dashboard`                                                        | Staff: Overview. Also `/geography` (map), `/insights` (spatial statistics), `orders`, `customers`, `inventory`, `wholesale`, `reports` |

The light/dark switch is in the storefront header and the staff rail; the choice is remembered. Business contact details are configured in `src/content/business.ts` and appear only when filled in.

Review helpers: the black strip at the top of the storefront switches between guest, retail and wholesale (pending or approved) customers. In the dashboard, the Role control reveals order-level views. Append `?latency=3000` or `?fail=data` to dashboard URLs, and `?fail=catalogue` to `/shop`, to see loading and error states. Dashboard state lives in the URL, so views can be shared.

## Verify it

```bash
pnpm typecheck && pnpm lint
pnpm test                                  # 125 unit tests
pnpm build && pnpm start -p 3355 &
BASE=http://localhost:3355 pnpm test:e2e   # 22 browser checks (Chromium via playwright-core)
BASE=http://localhost:3355 node scripts/qa/a11y.mjs        # axe, add MOBILE=1 for phone width or DARK=1 for dark theme
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
- [Deploying to Cloudflare Workers](docs/DEPLOY_CLOUDFLARE.md)
- Screenshots: [`/screenshots`](screenshots)

## Data and licences

Boundaries: geoBoundaries gbOpen (upstream GRID3), CC BY 4.0, shipped in `public/geo` with source metadata. Basemap tiles (online only): OpenFreeMap, OpenMapTiles, © OpenStreetMap contributors. Starter code: MIT, see `LICENSE`.
