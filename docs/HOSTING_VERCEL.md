# Hosting the backend: Vercel + Postgres

Target: Payload CMS + storefront on Vercel, Postgres on Neon (or Supabase),
media on Vercel Blob, payments via Paystack. No new dependencies required.

> **Migrations:** `src/migrations` holds the initial schema and `bank_transfer`.
> Both were tested on a fresh Postgres 16 and are applied on the Supabase project.
> After any schema change run `pnpm payload migrate:create <name>` and commit it.

> The repo also has a Cloudflare Workers path (OpenNext, frontend-only). That
> path cannot run Payload or the `/api/*` routes that read the database, so
> the backend below targets Vercel (Node runtime). Server code never reads
> from disk — boundaries are bundled JSON imports — so the API routes also
> survive the Workers build if the DB calls are guarded.

## 0. Current state (Supabase)

The Supabase project `wwmlcreroanokrmekmpe` (eu-west-1) already holds the
`laddex` schema, the initial migration and the seeded catalogue (4 products, 16
variants, 6 inactive sample delivery zones). Only the `laddex` schema belongs to
this app; `public` belongs to other projects and is never touched. Remaining:
the Vercel project (section 2), env vars, and the RLS hardening below.

**Row Level Security.** The `laddex` tables have RLS off. Payload connects as
the `postgres` role (bypasses RLS), so enabling RLS with no policies locks out
the Supabase anon/authenticated API without affecting the app. Do this before
launch, and do not add `laddex` to the project's exposed API schemas.

**Connection string.** On Vercel use the *transaction pooler* URL (port 6543)
for `DATABASE_URL`; use the direct/session URL (5432) for `pnpm migrate` and
seeds. If TLS verification fails, append `?sslmode=no-verify`.

## 1. Database (Neon, or Supabase as above)

1. Create a project at https://neon.tech (free tier is enough to start).
2. Copy the pooled connection string, e.g.
   `postgres://user:pass@ep-xxx.neon.tech/db?sslmode=require`.
3. It becomes `DATABASE_URL` below. After the release-blocking migration has
   been generated and reviewed, apply it with
   `DATABASE_URL=<pooled-url> pnpm migrate`. Never use `migrate:fresh` here.
4. Seed editable drafts (idempotent, never wipes): `DATABASE_URL=<pooled-url>
   pnpm seed:laddex`. Sample delivery zones are inactive, catalogue records are
   drafts, and the approximate Epe pin is unverified. Staff must replace and
   approve those records before publishing them. Never run `pnpm seed` or
   `pnpm reset` against production: both recreate the database.

## 2. Vercel project

1. Push this repo to GitHub, then Import it in Vercel.
2. Framework preset: Next.js. Build command `pnpm build`, install `pnpm install`.
   Node version: 24 (matches `package.json` engines).
3. Add every variable from `.env.example`, with production values:
   - `NEXT_PUBLIC_BASE_URL` + `NEXT_PUBLIC_SERVER_URL`: your `https://…vercel.app`
     domain (later your custom domain).
   - `DATABASE_URL`, `PAYLOAD_SECRET` (generate: `openssl rand -base64 32`),
     `PREVIEW_SECRET` (another random string).
   - `LADDEX_CATALOGUE_SOURCE=payload`. Never deploy the fixture catalogue as a
     production storefront.
   - Storage: `STORAGE_PROVIDER=vercel`, `BLOB_TOKEN` (Vercel Dashboard >
     Storage > Blob > create store, copy the read-write token),
     `NEXT_PUBLIC_STORAGE_URL` left empty unless a custom media domain is set.
   - Email/WhatsApp: keep `SEND_EMAIL_WHATSAPP=false` until SMTP is ready.
   - Payments: keep `NEXT_PUBLIC_ENABLE_STRIPE=false` and
     `NEXT_PUBLIC_ENABLE_PAYSTACK=false` until launch (see section 4).
4. Deploy. Admin lives at `/admin`; the storefront is the same deployment.

## 2b. Bank-transfer payments (instead of Paystack)

Set `NEXT_PUBLIC_BANK_NAME`, `NEXT_PUBLIC_BANK_ACCOUNT_NAME` and
`NEXT_PUBLIC_BANK_ACCOUNT_NUMBER` (10 digits) in Vercel and redeploy (they are
baked in at build time). Keep Paystack disabled. Checkout then shows the account
details and the exact total, and asks for payer name, bank, amount, date and a
receipt (JPG/PNG/WebP/PDF, under 4 MB; Vercel rejects larger request bodies).

Staff routine, for every order:
1. `/admin` > Laddex > Checkout sessions, filter status `awaiting-verification`.
2. Open the receipt (Payment > Receipt) and match the amount and sender in your
   bank app/statement. A screenshot alone is not proof of payment.
3. Set status to **Paid** and save: the order is created and stock reduced.
   Saving fails, and nothing changes, if the customer reported less than the
   total or stock ran out. Set **Rejected** (add a note) if the money is not there.

Receipts are private: only signed-in admins can open them. Add Vercel Firewall
rate limiting on `/api/orders/bank-transfer` to curb junk uploads. Delivery
orders also need active, owner-approved delivery zones; with only the sample
(inactive) zones, checkout answers "needs a quote" and points customers to WhatsApp.

## 3. Custom domain (optional, later)

Vercel Dashboard > Domains > Add, then point DNS to Vercel. After the domain
is live, update `NEXT_PUBLIC_BASE_URL` / `NEXT_PUBLIC_SERVER_URL` to it and
redeploy so metadata, sitemap and CORS use the real origin.

## 4. Switching on Paystack (when ready to take money)

1. Paystack Dashboard > Settings > Developers: copy public + secret keys
   (start with `sk_test_` / `pk_test_`).
2. Settings > API Keys & Webhooks: set the webhook URL to
   `https://<your-domain>/api/paystack/webhook`. Webhook signatures are HMACs
   made with `PAYSTACK_SECRET_KEY`; do not configure a separate webhook secret.
3. In Vercel env: `NEXT_PUBLIC_ENABLE_PAYSTACK=true`,
   `PAYSTACK_SECRET_KEY` and `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`. Redeploy. This
   also lights up the Pay button
   on `/order` (server-priced lines, Paystack redirect, verified receipt).
   The Paystack callback URL is automatic: `/order/confirmation`.
4. Test successful, duplicate, invalid-signature, delayed-webhook and
   insufficient-stock/refund cases. Confirm exactly one order appears in
   `/admin`, then swap to live keys.

## 5. What is still code, not config

- Development may read fixtures. Production defaults to Payload and must use
  owner-approved published products, variants, stock and active delivery zones.
  Tiers stay restricted to approved wholesale accounts; online checkout prices
  at list until the accounts phase.
- After any collection change, run `pnpm generate:types` locally and commit
  the result.

## 6. Safety notes

- `pnpm seed` and `pnpm reset` refuse to run when `NODE_ENV=production`. The
  emergency override `ALLOW_DESTRUCTIVE_PRODUCTION=true` is intentionally
  explicit and must not be used without a verified target and restorable backup.
  `pnpm seed:laddex` is idempotent and does not recreate the database.
- Never commit `.env` (it is git-ignored). Rotate any secret that was ever
  pasted into chat or logs.
