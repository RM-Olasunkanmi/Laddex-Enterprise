# Deploying to Cloudflare Workers

The storefront and dashboard deploy as a **frontend-only Worker** using the OpenNext Cloudflare adapter. The starter's Payload admin and legacy CMS routes are left out on purpose: they need a database and would make the Worker far larger.

## What was verified, and what was not

| | |
|---|---|
| Worker bundle builds (`opennextjs-cloudflare build`) | Yes |
| Runs in the Workers runtime (workerd, via `wrangler dev --local`) | Yes: 13 routes return 200 with no runtime errors |
| Full browser suite against that Worker | Yes: 39 of 39 checks pass |
| Actual deployment to a Cloudflare account | **No.** The build sandbox had no API token and could not reach `api.cloudflare.com`. Run the steps below from your machine |

## Deploy from your machine

Needs Node 22+, pnpm and a Cloudflare account.

```bash
git clone https://github.com/RM-Olasunkanmi/Laddex-Enterprise.git && cd Laddex-Enterprise
git checkout claude/sleepy-tesla-c7o1be
pnpm install
pnpm cf:prepare              # copies the frontend into .cf-build and installs its dependencies
cd .cf-build
pnpm cf:preview              # optional: run it locally in the Workers runtime
npx wrangler login           # opens a browser to authorise
pnpm cf:deploy               # builds and deploys; prints your *.workers.dev URL
```

The Worker name is `laddex-enterprise`; pass another name with `pnpm cf:prepare my-name`.

### Plan and size

The Worker's code is about 23 MB raw and roughly **5 MB gzipped**. Cloudflare's limit is 10 MB gzipped on the Workers Paid plan and 3 MB on the Free plan, so **a Free-plan account will likely reject the upload**. If that happens, either use the Paid plan, or use another host for this Next.js server (for example Vercel, which suits the starter) and keep Cloudflare for DNS and caching.

### Deploying from Git instead (Workers Builds)

Connect the repository in the Cloudflare dashboard (Workers and Pages, Create, Import a repository) with:

- Build command: `pnpm install && pnpm cf:prepare && cd .cf-build && pnpm cf:build`
- Deploy command: `cd .cf-build && npx wrangler deploy`

## What the deployed site does and does not include

- Included: storefront, cart, checkout preview, wholesale, account, delivery, dashboard, all fixtures, boundary files (served as static assets).
- Not included: the Payload admin (`/admin`), the legacy CMS routes, the sitemap and robots routes. Add `robots.txt` and a sitemap for the Laddex routes before launch if you want search indexing.
- State (cart, customer type, delivery location) lives in each visitor's browser. Nothing is stored on Cloudflare.
- The online basemap and address search call OpenFreeMap and OpenStreetMap from the visitor's browser; they work from a deployed site with internet access.
- This is a prototype with illustrative data and a customer-type switcher visible to everyone. Do not share it as a live shop, and consider putting it behind Cloudflare Access while it is a preview.
