#!/usr/bin/env bash
# Builds a frontend-only copy of the Laddex app for Cloudflare Workers (OpenNext adapter) in ./.cf-build.
# Why a copy: the starter's Payload admin and legacy CMS routes need a database and a much larger
# Worker. The Laddex storefront and dashboard need neither, so they are deployed on their own.
# Usage: scripts/deploy/cloudflare-prepare.sh [worker-name]
set -euo pipefail
NAME="${1:-laddex-enterprise}"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
OUT="$ROOT/.cf-build"

rm -rf "$OUT"
mkdir -p "$OUT/src/app" "$OUT/src/components" "$OUT/src/lib" "$OUT/public"
cd "$ROOT"

cp -R "src/app/(laddex)" "$OUT/src/app/"
for d in navigation commerce product wholesale checkout delivery maps analytics charts lx; do cp -R "src/components/$d" "$OUT/src/components/"; done
cp -R src/features src/fixtures src/styles "$OUT/src/"
for d in design geo data formatters; do cp -R "src/lib/$d" "$OUT/src/lib/"; done
cp -R public/geo "$OUT/public/"
cp postcss.config.mjs "$OUT/"
# Tests and Node-only helpers are not part of the Worker bundle.
find "$OUT/src" \( -name "*.test.ts" -o -name "*.test.tsx" \) -delete

cat > "$OUT/package.json" <<JSON
{
  "name": "$NAME",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "next build",
    "cf:build": "opennextjs-cloudflare build",
    "cf:preview": "opennextjs-cloudflare build && opennextjs-cloudflare preview",
    "cf:deploy": "opennextjs-cloudflare build && opennextjs-cloudflare deploy"
  }
}
JSON
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
  images: { unoptimized: true },
};
export default nextConfig;
TS
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
const keep = ["next","react","react-dom","maplibre-gl","@fontsource-variable/fraunces","@fontsource-variable/hanken-grotesk","@fontsource-variable/jetbrains-mono"];
out.dependencies = Object.fromEntries(keep.map(k => [k, p.dependencies[k]]));
out.devDependencies = Object.fromEntries(["tailwindcss","@tailwindcss/postcss","postcss","typescript","@types/react","@types/react-dom","@types/node"].map(k => [k, p.devDependencies[k]]));
out.devDependencies["@opennextjs/cloudflare"] = "latest";
out.devDependencies["wrangler"] = "latest";
require("fs").writeFileSync(process.argv[2] + "/package.json", JSON.stringify(out, null, 2));
' "$ROOT" "$OUT"

cd "$OUT"
pnpm install --no-frozen-lockfile
echo "Prepared $OUT. Next: cd .cf-build && pnpm cf:preview   (local Workers runtime)   or   pnpm cf:deploy"
