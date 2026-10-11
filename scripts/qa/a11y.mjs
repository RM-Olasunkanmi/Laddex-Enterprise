// Automated WCAG 2.x A/AA scan with axe-core over key routes. Usage: BASE=http://localhost:3355 node scripts/qa/a11y.mjs
// Automated checks find only part of the issues; keyboard and screen-reader review are still needed.
import { chromium } from "playwright-core";

import { findChromium } from "./chromium.mjs";
import { readFileSync } from "node:fs";

const BASE = process.env.BASE ?? "http://localhost:3355";
const find = findChromium;
const axeSource = readFileSync("node_modules/axe-core/axe.min.js", "utf8");
const allRoutes = [
  "/",
  "/about",
  "/shop",
  "/shop/garri",
  "/products/garri-igbo?pack=gi-25kg",
  "/products/palm-oil?pack=po-5l",
  "/cart",
  "/delivery",
  "/contact",
  "/events",
  "/wholesale",
  "/wholesale/quote",
  "/wholesale/register",
  "/account",
  "/order",
  "/dashboard",
  "/dashboard/geography",
  "/dashboard/geography?scale=state&unit=kano",
  "/dashboard/insights",
  "/dashboard/reports",
  "/dashboard/inventory",
  "/dashboard/stock",
];
// The dashboard needs a signed-in staff user (Postgres); SKIP_DASHBOARD=1 scans the storefront only.
const routes = process.env.SKIP_DASHBOARD === "1" ? allRoutes.filter((r) => !r.startsWith("/dashboard")) : allRoutes;
const browser = await chromium.launch({
  executablePath: find(),
  args: [
    "--no-sandbox",
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
  ],
});
let total = 0;
for (const route of routes) {
  const page = await browser.newPage({
    viewport: process.env.MOBILE
      ? { width: 390, height: 844 }
      : { width: 1440, height: 900 },
  });
  if (process.env.DARK) await page.addInitScript(() => localStorage.setItem("laddex-theme", "dark"));
  await page.goto(BASE + route, { waitUntil: "networkidle", timeout: 90000 });
  await page.waitForTimeout(1500);
  // Scroll through so scroll-driven reveals have played before measuring contrast.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForTimeout(300);
  await page.addScriptTag({ content: axeSource });
  const res = await page.evaluate(() =>
    window.axe.run(document, {
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
      },
    }),
  );
  const v = res.violations;
  total += v.length;
  console.log(
    `${v.length === 0 ? "PASS" : "FAIL"} ${route} (${res.passes.length} rules passed)`,
  );
  for (const x of v)
    console.log(
      `   - ${x.id} [${x.impact}] ${x.help} :: ${x.nodes.length} node(s) e.g. ${x.nodes[0].target.join(" ")}`,
    );
  await page.close();
}
await browser.close();
console.log(`\n${total} violation type(s) across ${routes.length} routes`);
process.exit(total ? 1 : 0);
