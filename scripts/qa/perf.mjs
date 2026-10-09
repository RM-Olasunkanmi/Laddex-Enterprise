// Measures transfer size and web vitals per route against a running (preferably production) server.
// Usage: BASE=http://localhost:3355 node scripts/qa/perf.mjs
import { chromium } from "playwright-core";
import { existsSync, readdirSync } from "node:fs";

const BASE = process.env.BASE ?? "http://localhost:3355";
const find = () => {
  const root = "/opt/pw-browsers";
  for (const d of readdirSync(root))
    for (const rel of ["chrome-linux/chrome", "chrome-linux/headless_shell"])
      if (existsSync(`${root}/${d}/${rel}`)) return `${root}/${d}/${rel}`;
  throw new Error("no chromium");
};
const routes = [
  "/",
  "/shop",
  "/products/garri-igbo?pack=gi-25kg",
  "/cart",
  "/delivery",
  "/contact",
  "/wholesale",
  "/dashboard",
  "/dashboard/insights",
];
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
const rows = [];
for (const [label, vp, mobile] of [
  ["desktop", { width: 1440, height: 900 }, false],
  ["mobile", { width: 390, height: 844 }, true],
]) {
  for (const route of routes) {
    const ctx = await browser.newContext({
      viewport: vp,
      isMobile: mobile,
      hasTouch: mobile,
    });
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    await cdp.send("Network.enable");
    const reqs = new Map();
    cdp.on("Network.responseReceived", (e) =>
      reqs.set(e.requestId, { type: e.type, url: e.response.url }),
    );
    const sizes = {
      js: 0,
      css: 0,
      font: 0,
      img: 0,
      doc: 0,
      other: 0,
      n: 0,
      maplibre: false,
    };
    cdp.on("Network.loadingFinished", (e) => {
      const r = reqs.get(e.requestId);
      if (!r || !r.url.startsWith(BASE)) return;
      sizes.n++;
      const k =
        r.type === "Script"
          ? "js"
          : r.type === "Stylesheet"
            ? "css"
            : r.type === "Font"
              ? "font"
              : r.type === "Image"
                ? "img"
                : r.type === "Document"
                  ? "doc"
                  : "other";
      sizes[k] += e.encodedDataLength;
    });
    await page.addInitScript(() => {
      window.__v = { lcp: 0, cls: 0 };
      new PerformanceObserver((l) => {
        for (const e of l.getEntries()) window.__v.lcp = e.startTime;
      }).observe({ type: "largest-contentful-paint", buffered: true });
      new PerformanceObserver((l) => {
        for (const e of l.getEntries())
          if (!e.hadRecentInput) window.__v.cls += e.value;
      }).observe({ type: "layout-shift", buffered: true });
    });
    const t0 = Date.now();
    await page.goto(BASE + route, { waitUntil: "networkidle", timeout: 90000 });
    await page.waitForTimeout(1500);
    const v = await page.evaluate(() => ({
      ...window.__v,
      ttfb: performance.getEntriesByType("navigation")[0].responseStart,
      dcl: performance.getEntriesByType("navigation")[0]
        .domContentLoadedEventEnd,
      load: performance.getEntriesByType("navigation")[0].loadEventEnd,
    }));
    const hasMap = await page.evaluate(
      () => !!document.querySelector("canvas.maplibregl-canvas"),
    );
    rows.push({
      vp: label,
      route,
      jsKB: Math.round(sizes.js / 1024),
      cssKB: Math.round(sizes.css / 1024),
      fontKB: Math.round(sizes.font / 1024),
      imgKB: Math.round(sizes.img / 1024),
      reqs: sizes.n,
      lcpMs: Math.round(v.lcp),
      cls: Number(v.cls.toFixed(3)),
      ttfbMs: Math.round(v.ttfb),
      loadMs: Math.round(v.load),
      map: hasMap,
      wallMs: Date.now() - t0,
    });
    await ctx.close();
  }
}
await browser.close();
console.table(rows);
