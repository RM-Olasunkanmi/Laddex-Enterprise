#!/usr/bin/env bash
# Builds a non-transactional frontend preview for Cloudflare Workers in ./.cf-build.
# Why a copy: the starter's Payload admin and legacy CMS routes need a database and a much larger
# Worker. The Laddex storefront and dashboard need neither, so they are deployed on their own.
# Usage: scripts/deploy/cloudflare-prepare.sh [worker-name]
set -euo pipefail
NAME="${1:-laddex-enterprise}"
BASE_URL="${NEXT_PUBLIC_BASE_URL:?Set NEXT_PUBLIC_BASE_URL to the HTTPS preview origin}"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
OUT="$ROOT/.cf-build"

rm -rf "$OUT"
mkdir -p "$OUT/src/app" "$OUT/src/components" "$OUT/src/lib" "$OUT/public"
cd "$ROOT"

cp -R "src/app/(laddex)" "$OUT/src/app/"
cp src/app/sitemap.ts src/app/robots.ts "$OUT/src/app/"
# Preview builds must not expose payment, account, or lead-submission screens.
rm -rf "$OUT/src/app/(laddex)/(store)/account" \
  "$OUT/src/app/(laddex)/(store)/order" \
  "$OUT/src/app/(laddex)/(store)/wholesale/register" \
  "$OUT/src/app/(laddex)/(store)/wholesale/quote" \
  "$OUT/src/app/(laddex)/dashboard"
for d in navigation commerce product wholesale checkout delivery maps analytics charts lx store; do cp -R "src/components/$d" "$OUT/src/components/"; done
cp -R src/features src/fixtures src/styles "$OUT/src/"
for d in design geo data formatters store.ts; do cp -R "src/lib/$d" "$OUT/src/lib/"; done
cp -R public/geo public/brand public/products "$OUT/public/"
cp public/site.webmanifest public/android-chrome-192x192.png public/android-chrome-512x512.png "$OUT/public/"
mkdir -p "$OUT/src/content" && cp -R src/content/. "$OUT/src/content/"
cp postcss.config.mjs "$OUT/"
# The preview is deliberately fixture-only and must not compile the Payload adapter.
rm -f "$OUT/src/features/catalogue/adapters/payload.ts"
cat > "$OUT/src/features/catalogue/index.ts" <<'TS'
import { createFixtureCatalogue, type FixtureOptions } from "./adapters/fixture";
import type { CatalogueService } from "./contracts";

export function getCatalogue(opts?: FixtureOptions): CatalogueService {
  return createFixtureCatalogue(opts);
}

export * from "./types";
TS
# Tests and Node-only helpers are not part of the Worker bundle.
find "$OUT/src" \( -name "*.test.ts" -o -name "*.test.tsx" \) -delete

cat > "$OUT/package.json" <<JSON
{
  "name": "$NAME",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "next build --webpack",
    "cf:build": "opennextjs-cloudflare build",
    "cf:preview": "opennextjs-cloudflare build && opennextjs-cloudflare preview",
    "cf:deploy": "opennextjs-cloudflare build && opennextjs-cloudflare deploy"
  }
}
JSON
cat > "$OUT/pnpm-workspace.yaml" <<'YAML'
packages:
  - "."
allowBuilds:
  esbuild: true
  workerd: true
YAML
cat > "$OUT/tsconfig.json" <<'JSON'
{
  "compilerOptions": {
    "strict": true, "target": "ES2022", "lib": ["DOM", "DOM.Iterable", "ES2022"], "module": "ESNext",
    "moduleResolution": "bundler", "jsx": "react-jsx", "esModuleInterop": true, "resolveJsonModule": true,
    "isolatedModules": true, "noEmit": true, "skipLibCheck": true, "incremental": true,
    "plugins": [{ "name": "next" }], "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "src/**/*.ts", "src/**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
JSON
cat > "$OUT/next.config.ts" <<'TS'
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // OpenNext preview assets do not use Next's image optimizer. Production Vercel builds do.
  images: { unoptimized: true },
  headers: async () => [{
    source: "/:path*",
    headers: [
      { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https://nominatim.openstreetmap.org https://tiles.openfreemap.org; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'; upgrade-insecure-requests" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self), payment=()" },
      { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }
    ]
  }],
};
export default nextConfig;
TS
cat > "$OUT/.env.production" <<ENV
LADDEX_CATALOGUE_SOURCE=fixture
NEXT_PUBLIC_ENABLE_PAYSTACK=false
NEXT_PUBLIC_ENABLE_STRIPE=false
NEXT_PUBLIC_LIVE_ACCOUNTS=false
NEXT_PUBLIC_CLOUDFLARE_PREVIEW=true
NEXT_PUBLIC_BASE_URL=$BASE_URL
ENV
cat > "$OUT/open-next.config.ts" <<'TS'
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig();
TS
cat > "$OUT/wrangler.jsonc" <<JSON
{
  "\$schema": "./node_modules/wrangler/config-schema.json",
  "name": "$NAME",
  "main": ".open-next/worker.js",
  "compatibility_date": "2026-10-01",
  "compatibility_flags": ["nodejs_compat", "global_fetch_strictly_public"],
  "assets": { "directory": ".open-next/assets", "binding": "ASSETS" },
  "observability": { "enabled": true }
}
JSON

# Dependencies come from the main package.json so versions stay identical.
node -e '
const p = require(process.argv[1] + "/package.json");
const out = require(process.argv[2] + "/package.json");
const keep = ["next","react","react-dom","maplibre-gl","@fontsource-variable/bricolage-grotesque","@fontsource-variable/plus-jakarta-sans","@fontsource/instrument-serif","@fontsource-variable/jetbrains-mono"];
out.dependencies = Object.fromEntries(keep.map(k => [k, p.dependencies[k]]));
out.devDependencies = Object.fromEntries(["tailwindcss","@tailwindcss/postcss","postcss","typescript","@types/react","@types/react-dom","@types/node"].map(k => [k, p.devDependencies[k]]));
out.devDependencies["@opennextjs/cloudflare"] = "1.20.10";
out.devDependencies["wrangler"] = "4.149.0";
require("fs").writeFileSync(process.argv[2] + "/package.json", JSON.stringify(out, null, 2));
' "$ROOT" "$OUT"

cd "$OUT"
pnpm install --no-frozen-lockfile
echo "Prepared $OUT. Next: cd .cf-build && pnpm cf:preview   (local Workers runtime)   or   pnpm cf:deploy"
