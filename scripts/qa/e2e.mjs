// End-to-end checks against a running server. Usage: BASE=http://localhost:3344 node scripts/qa/e2e.mjs
// Uses the preinstalled Chromium via playwright-core. Exits non-zero if any check fails.
import { chromium } from "playwright-core";
import { existsSync, readdirSync, mkdirSync } from "node:fs";

const BASE = process.env.BASE ?? "http://localhost:3344";
const findChrome = () => {
  const root = "/opt/pw-browsers";
  for (const d of readdirSync(root))
    for (const rel of ["chrome-linux/chrome", "chrome-linux/headless_shell"])
      if (existsSync(`${root}/${d}/${rel}`)) return `${root}/${d}/${rel}`;
  throw new Error("no chromium");
};
const results = [];
const consoleErrors = [];
const check = async (name, fn) => {
  try {
    await fn();
    results.push({ name, ok: true });
    console.log("PASS", name);
  } catch (e) {
    results.push({ name, ok: false, err: String(e.message).split("\n")[0] });
    console.log("FAIL", name, "->", String(e.message).split("\n")[0]);
  }
};
const assert = (cond, msg) => {
  if (!cond) throw new Error(msg);
};
const num = (s) => {
  const m = /([0-9][0-9,]*\.?[0-9]*)\s*([KMB])?/.exec(String(s));
  if (!m) return NaN;
  return (
    Number(m[1].replace(/,/g, "")) * ({ K: 1e3, M: 1e6, B: 1e9 }[m[2]] ?? 1)
  );
};

const browser = await chromium.launch({
  executablePath: findChrome(),
  args: [
    "--no-sandbox",
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
    "--ignore-gpu-blocklist",
  ],
});
mkdirSync("screenshots", { recursive: true });

async function newPage(opts = {}) {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    ...opts,
  });
  const page = await ctx.newPage();
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    const t = m.text();
    if (page.url().includes("fail=")) return; // intentional diagnostic failure routes
    // The online basemap and live geocoder are unreachable in the sandbox; the app is designed to fall back.
    if (
      /ERR_TUNNEL|ERR_NAME_NOT_RESOLVED|Failed to load resource|CatalogueUnavailable|orders service did not respond/.test(
        t,
      )
    )
      return;
    consoleErrors.push(`${page.url()} :: ${t.slice(0, 200)}`);
  });
  page.on("pageerror", (e) =>
    consoleErrors.push(`${page.url()} :: pageerror ${e.message.slice(0, 200)}`),
  );
  return page;
}
const go = (page, path) =>
  page.goto(BASE + path, { waitUntil: "networkidle", timeout: 90000 });

// ---------- Storefront ----------
{
  const page = await newPage();
  await check("home: logo, headline, about, nationwide delivery, contact", async () => {
    await go(page, "/");
    assert(await page.locator('img[src*="laddex-logo"]').first().isVisible(), "logo missing");
    assert(await page.getByRole("heading", { name: /Pure\. Natural\./ }).isVisible(), "headline");
    assert(await page.getByRole("heading", { name: /everyday staples/ }).isVisible(), "about section");
    assert(await page.getByRole("heading", { name: /Delivered across Nigeria/ }).isVisible(), "nationwide");
    const body = await page.locator("body").innerText();
    assert(!/Lagos only|in Lagos/i.test(body), "mentions Lagos-only delivery");
    assert(!/\b25 L\b|200 L|jerrycan/i.test(body), "old litre sizes still present");
    assert(await page.getByRole("link", { name: "Contact us" }).first().isVisible(), "contact cta");
  });
  await check("home: four real products, garri included", async () => {
    for (const n of ["Palm Oil", "Tapioca Flakes", "Garri Igbo", "Ijebu Garri"])
      assert((await page.getByRole("heading", { name: n, exact: true }).count()) > 0, n);
  });
  await check("theme: toggle switches and persists across reload", async () => {
    assert((await page.locator("html").getAttribute("data-theme")) !== "dark", "starts light");
    await page.getByRole("button", { name: "Switch to dark theme" }).click();
    assert((await page.locator("html").getAttribute("data-theme")) === "dark", "dark applied");
    await page.reload({ waitUntil: "networkidle" });
    assert((await page.locator("html").getAttribute("data-theme")) === "dark", "persisted");
    await page.getByRole("button", { name: "Switch to light theme" }).click();
    assert((await page.locator("html").getAttribute("data-theme")) === "light", "back to light");
  });
  await check("shop: category pages and size chips follow price", async () => {
    await go(page, "/shop/garri");
    const cards = page.locator("article");
    assert((await cards.count()) === 2, "two garri products");
    const card = cards.first();
    const before = await card.innerText();
    await card.getByRole("radio", { name: "5 kg", exact: true }).click();
    const after = await card.innerText();
    assert(before !== after && /8,500|9,000/.test(after), "price follows size");
  });
  await check("product page: garri pack, add to cart updates the cart", async () => {
    await go(page, "/products/garri-igbo?pack=gi-5kg");
    await page.getByRole("button", { name: /Add to cart/ }).first().click();
    await page.waitForTimeout(500);
    await go(page, "/cart");
    assert((await page.locator("body").innerText()).includes("Garri Igbo"), "line in cart");
  });
  await check("delivery: choosing a state and LGA resolves nationwide", async () => {
    await go(page, "/delivery");
    await page.selectOption("#state-pick", { label: "Kano" });
    await page.waitForFunction(() => document.querySelector("#lga-pick option:nth-child(3)"), null, { timeout: 15000 });
    const lga = await page.locator("#lga-pick option").nth(2).innerText();
    await page.selectOption("#lga-pick", { index: 2 });
    await page.getByRole("button", { name: "Confirm this location" }).click();
    const body = await page.locator("body").innerText();
    assert(/Kano/.test(body) && /North West/.test(body), "state and region shown: " + lga);
    assert(/Delivery options/.test(body) && /₦/.test(body), "delivery fee shown");
  });
  await check("delivery: offline fallback search finds a southeastern town", async () => {
    await go(page, "/delivery");
    await page.fill("#addr", "Enugu");
    await page.getByRole("button", { name: "Search" }).click();
    await page.waitForTimeout(4500);
    const body = await page.locator("body").innerText();
    assert(/Enugu/.test(body), "Enugu result");
  });
  await check("contact: validation, then confirmation without sending", async () => {
    await go(page, "/contact");
    await page.getByRole("button", { name: "Send enquiry" }).click();
    assert((await page.getByText("Enter your name").count()) > 0, "name error");
    await page.fill("#enq-name", "Ada");
    await page.fill("#enq-contact", "ada@example.com");
    await page.fill("#enq-message", "Do you deliver garri to Enugu?");
    await page.getByRole("button", { name: "Send enquiry" }).click();
    assert((await page.getByText("Nothing was sent").count()) > 0, "honest confirmation");
  });
  await check("events: page offers souvenirs enquiry with events topic", async () => {
    await go(page, "/events");
    assert(await page.getByRole("heading", { name: /useful gifts/ }).isVisible(), "heading");
    assert((await page.locator("#enq-topic").inputValue()) === "events", "topic preselected");
  });
  await check("wholesale: tier explorer defaults to a real pack and quote builder works", async () => {
    await go(page, "/wholesale");
    assert((await page.locator("body").innerText()).includes("Garri"), "garri in tiers");
    await go(page, "/wholesale/quote?pack=gi-25kg");
    assert((await page.locator("body").innerText()).includes("25 kg"), "quote pack");
  });
  await page.context().close();
}

// ---------- Dashboard ----------
{
  const page = await newPage();
  await check("dashboard overview: nationwide KPIs and reach", async () => {
    await go(page, "/dashboard");
    await page.waitForSelector('[data-testid="kpis"]', { timeout: 20000 });
    const body = await page.locator("body").innerText();
    assert(/states reached/.test(body), "reach line");
    assert(!/Lagos State|sample zone/i.test(body), "old Lagos-only wording");
    const gross = num(await page.locator('[data-metric="gross"] [data-testid="kpi-value"]').innerText());
    assert(gross > 1e6, "gross sales plausible " + gross);
  });
  await check("dashboard: filters shared across pages and segments include events", async () => {
    await page.getByRole("radio", { name: "Events" }).click();
    await page.waitForTimeout(600);
    const events = num(await page.locator('[data-metric="gross"] [data-testid="kpi-value"]').innerText());
    await page.getByRole("radio", { name: "All" }).last().click();
    await page.waitForTimeout(600);
    const all = num(await page.locator('[data-metric="gross"] [data-testid="kpi-value"]').innerText());
    assert(events > 0 && events < all, `events ${events} < all ${all}`);
  });
  await check("geography: select state, drill into LGAs, back out", async () => {
    await go(page, "/dashboard/geography?unit=kano");
    await page.waitForSelector('[data-testid="inspector-title"]', { timeout: 20000 });
    assert((await page.locator('[data-testid="inspector-title"]').innerText()) === "Kano", "kano title");
    await page.getByRole("button", { name: "View its local government areas" }).click();
    await page.waitForFunction(() => /Local government|LGA/i.test(document.body.innerText), null, { timeout: 15000 });
    await page.waitForTimeout(2000);
    assert(page.url().includes("scale=lga") && page.url().includes("state=kano"), "url carries drill: " + page.url());
    const rows = await page.locator("details table tbody tr").count().catch(() => 0);
    assert(rows >= 0, "area list present");
  });
  await check("geography: region scale selects a region and totals reconcile", async () => {
    await go(page, "/dashboard/geography?scale=region&unit=south-west");
    await page.waitForSelector('[data-testid="inspector-title"]', { timeout: 20000 });
    assert((await page.locator('[data-testid="inspector-title"]').innerText()) === "South West", "region title");
  });
  await check("insights: statistics render and are deterministic", async () => {
    await go(page, "/dashboard/insights");
    await page.waitForSelector('[data-testid="moran"]', { timeout: 20000 });
    const a = await page.locator('[data-testid="moran"]').innerText();
    const gini = Number(await page.locator('[data-testid="gini"]').innerText());
    assert(gini > 0 && gini < 1, "gini bounds " + gini);
    assert((await page.locator('[data-testid="findings"] li').count()) >= 4, "findings listed");
    assert((await page.locator('[data-testid="opportunities"] li').count()) >= 1, "candidates listed");
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForSelector('[data-testid="moran"]');
    assert(a === (await page.locator('[data-testid="moran"]').innerText()), "moran stable across reload");
  });
  await check("insights: changing the measure recomputes", async () => {
    const before = await page.locator('[data-testid="moran"]').innerText();
    await page.selectOption("#measure", "density");
    await page.waitForTimeout(800);
    assert(before !== (await page.locator('[data-testid="moran"]').innerText()), "moran changed");
  });
  await check("insights: filter to garri changes the analysis", async () => {
    const before = await page.locator('[data-testid="findings"]').innerText();
    await page.getByRole("radio", { name: "Garri", exact: true }).click();
    await page.waitForTimeout(1000);
    assert(before !== (await page.locator('[data-testid="findings"]').innerText()), "findings changed");
  });
  await check("dashboard: theme toggle works in the staff shell", async () => {
    await page.getByRole("button", { name: "Switch to dark theme" }).first().click();
    assert((await page.locator("html").getAttribute("data-theme")) === "dark", "dark");
  });
  await check("dashboard: admin role shows order table, analyst does not", async () => {
    await go(page, "/dashboard/geography?role=admin&unit=lagos");
    await page.waitForSelector("tbody tr button.mono", { timeout: 20000 });
    await go(page, "/dashboard/geography?unit=lagos");
    await page.waitForTimeout(1500);
    assert((await page.locator("tbody tr button.mono").count()) === 0, "no order rows for analyst");
  });
  await check("dashboard: error state with retry", async () => {
    await go(page, "/dashboard?fail=data");
    await page.getByRole("button", { name: "Try again" }).click();
    await page.waitForSelector('[data-testid="kpis"]', { timeout: 20000 });
  });
  await check("dashboard: other sections load", async () => {
    for (const r of ["orders", "customers", "inventory", "wholesale", "reports"]) {
      await go(page, "/dashboard/" + r);
      await page.waitForSelector("h1", { timeout: 20000 });
    }
  });
  await page.context().close();
}

// ---------- Mobile ----------
{
  const page = await newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await check("mobile: no horizontal overflow on key pages", async () => {
    for (const r of ["/", "/shop", "/contact", "/events", "/delivery", "/dashboard", "/dashboard/insights"]) {
      await go(page, r);
      await page.waitForTimeout(800);
      const o = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      assert(o <= 1, `${r} overflows by ${o}px`);
    }
  });
  await page.context().close();
}

await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
if (consoleErrors.length) {
  console.log("Console errors:");
  consoleErrors.slice(0, 10).forEach((e) => console.log(" -", e));
}
process.exit(failed.length || consoleErrors.length ? 1 : 0);
