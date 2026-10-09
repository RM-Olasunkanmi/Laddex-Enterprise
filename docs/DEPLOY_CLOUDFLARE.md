# Cloudflare frontend preview

Cloudflare Workers is a **frontend preview only**, built from a reduced copy in
`.cf-build` with the OpenNext adapter. It is not the production commerce host.
Payload, database APIs, payment UI, checkout/confirmation, customer accounts,
wholesale application and quote submission are deliberately absent.

The prep script also forces fixture catalogue data and sets
`NEXT_PUBLIC_ENABLE_PAYSTACK=false`, `NEXT_PUBLIC_ENABLE_STRIPE=false` and
`NEXT_PUBLIC_LIVE_ACCOUNTS=false`. Do not add payment secrets to this build.

## Prepare and preview

Node 24 and pnpm 10 or newer are required.

```bash
pnpm install
NEXT_PUBLIC_BASE_URL=https://your-preview.example pnpm cf:prepare
cd .cf-build
pnpm cf:preview
```

Set `NEXT_PUBLIC_BASE_URL` to the final HTTPS preview origin before building so
canonical sitemap and robots URLs are correct. The generated project pins
`@opennextjs/cloudflare` 1.20.10 and `wrangler` 4.149.0; version changes must be
reviewed and tested rather than silently following `latest`.

To deploy the preview after reviewing the generated `.cf-build` project:

```bash
pnpm cf:deploy
```

The worker name defaults to `laddex-enterprise`; pass another name with
`pnpm cf:prepare my-name`.

## Scope and safety

- Included: public catalogue, product, information and legal pages; fixture
  dashboard; cart; static product and geographic assets; sitemap and robots.
- Excluded: Payload Admin, database-backed APIs, legacy CMS routes, order and
  payment pages, account UI, wholesale application and quote forms.
- Cart and preview state remain in the visitor's browser and are not orders.
- Map tiles and address search are browser calls to OpenFreeMap and OpenStreetMap.
- Put the Worker behind Cloudflare Access unless public design review is intended.

The generated Cloudflare config leaves images unoptimized because this reduced
OpenNext preview has no configured image service. The production Vercel build
uses Next.js image optimization with `sharp`.

The Worker bundle has previously been near the Cloudflare free-plan size limit.
Run a fresh build and check the reported compressed size before deployment.
