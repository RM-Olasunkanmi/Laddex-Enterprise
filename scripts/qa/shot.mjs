// Usage: node scripts/qa/shot.mjs <url> <out.png> [width] [height] [--full] [--wait=ms] [--click=selector]
// Takes a screenshot with the preinstalled Chromium and reports console errors and horizontal overflow.
import { chromium } from "playwright-core";

import { findChromium } from "./chromium.mjs";
import { existsSync, readdirSync } from "node:fs";

const [url, out, w = "1440", h = "900", ...flags] = process.argv.slice(2);
const find = findChromium;
const browser = await chromium.launch({
  executablePath: find(),
  args: [
    "--no-sandbox",
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
    "--ignore-gpu-blocklist",
  ],
});
const page = await browser.newPage({
  viewport: { width: +w, height: +h },
  deviceScaleFactor: 1,
});
const errors = [];
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
await page
  .goto(url, { waitUntil: "networkidle", timeout: 90000 })
  .catch((e) => errors.push("goto: " + e.message));
const wait = flags.find((f) => f.startsWith("--wait="));
if (wait) await page.waitForTimeout(+wait.split("=")[1]);
for (const f of flags.filter((f) => f.startsWith("--click="))) {
  await page.click(f.slice(8));
  await page.waitForTimeout(600);
}
const overflow = await page.evaluate(() => ({
  sw: document.documentElement.scrollWidth,
  cw: document.documentElement.clientWidth,
}));
await page.screenshot({ path: out, fullPage: flags.includes("--full") });
console.log(
  JSON.stringify({
    out,
    overflowX: overflow.sw > overflow.cw + 1,
    scrollWidth: overflow.sw,
    clientWidth: overflow.cw,
    errors: errors.slice(0, 8),
  }),
);
await browser.close();
