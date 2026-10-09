// Automated WCAG 2.x A/AA scan with axe-core over key routes. Usage: BASE=http://localhost:3355 node scripts/qa/a11y.mjs
// Automated checks find only part of the issues; keyboard and screen-reader review are still needed.
import { chromium } from "playwright-core";
import { existsSync, readdirSync, readFileSync } from "node:fs";

const BASE = process.env.BASE ?? "http://localhost:3355";
const find = () => {
  const root = "/opt/pw-browsers";
  for (const d of readdirSync(root))
    for (const rel of ["chrome-linux/chrome", "chrome-linux/headless_shell"])
      if (existsSync(`${root}/${d}/${rel}`)) return `${root}/${d}/${rel}`;
  throw new Error("no chromium");
};
const axeSource = readFileSync("node_modules/axe-core/axe.min.js", "utf8");
const routes = [
  "/",
  "/shop/palm-oil",
  "/products/palm-oil?pack=po-25l",
  "/cart",
  "/delivery",
  "/wholesale",
  "/wholesale/quote",
  "/wholesale/register",
  "/account",
  "/order",
  "/dashboard",
  "/dashboard?role=admin&unit=ikeja",
  "/dashboard/reports",
  "/dashboard/inventory",
  "/products/palm-oil?pack=po-500ml",
];
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
  await page.goto(BASE + route, { waitUntil: "networkidle", timeout: 90000 });
  await page.waitForTimeout(1500);
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
