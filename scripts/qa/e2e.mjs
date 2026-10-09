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
  await check("home: headline and shop entry points", async () => {
    await go(page, "/");
    assert(
      (await page.locator("h1").innerText()).includes("Palm oil by the litre"),
      "h1 text",
    );
    assert(
      await page.getByRole("link", { name: "Shop palm oil" }).isVisible(),
      "palm CTA",
    );
    assert(
      await page
        .getByRole("link", { name: /Buying for a business/ })
        .isVisible(),
      "wholesale CTA",
    );
  });
  await check(
    "category navigation: tabs, counts and format filter",
    async () => {
      await go(page, "/shop/palm-oil");
      assert((await page.locator("article").count()) === 5, "5 palm packs");
      await page
        .getByRole("link", { name: "Tapioca", exact: true })
        .first()
        .click();
      await page.waitForURL(/shop\/tapioca/);
      await page.waitForFunction(
        () => document.querySelectorAll("article").length === 4,
      );
      await page.getByLabel("Bulk (trade volumes)").click();
      await page.waitForFunction(
        () => document.querySelectorAll("article").length === 2,
      );
      assert(page.url().includes("format=bulk"), "format in URL");
    },
  );
  await check(
    "sort by price per litre orders cheapest unit price first",
    async () => {
      await go(page, "/shop/palm-oil?sort=unit-asc");
      const first = await page.locator("article").first().innerText();
      assert(first.includes("200 L"), "200 L drum first");
    },
  );
  await check(
    "empty state appears when filters exclude everything",
    async () => {
      await go(page, "/shop/palm-oil?format=bulk&size=1%20L");
      assert(
        await page.getByText("No packs match these filters").isVisible(),
        "empty message",
      );
    },
  );
  await check("error state: catalogue failure shows recovery UI", async () => {
    await go(page, "/shop?fail=catalogue");
    assert(
      await page.getByText("We could not load this page").isVisible(),
      "error boundary",
    );
    assert(
      await page.getByRole("button", { name: "Try again" }).isVisible(),
      "retry button",
    );
  });
  await check(
    "product page: variant selection, quantity and add to cart",
    async () => {
      await go(page, "/products/palm-oil?pack=po-5l");
      assert(
        (await page.locator("h1").innerText()).includes("5 L"),
        "h1 shows 5 L",
      );
      await page.getByRole("radio", { name: /25 L/ }).click();
      assert(
        (await page.locator("h1").innerText()).includes("25 L"),
        "h1 updates to 25 L",
      );
      assert(page.url().includes("pack=po-25l"), "URL pack param");
      await page
        .getByRole("button", { name: "Increase Quantity" })
        .first()
        .click();
      await page.getByRole("button", { name: "Add to cart" }).first().click();
      await page.getByRole("dialog", { name: "Cart" }).waitFor();
      const drawer = await page
        .getByRole("dialog", { name: "Cart" })
        .innerText();
      assert(
        drawer.includes("Palm Oil") && drawer.includes("25 L"),
        "drawer lists line",
      );
      assert(/₦142,000/.test(drawer), "2 x 71,000 subtotal");
    },
  );
  await check(
    "cart page: stepper changes total; persists after reload",
    async () => {
      await go(page, "/cart");
      assert(
        (await page.locator("main").innerText()).includes("₦142,000"),
        "subtotal from storage",
      );
      await page
        .getByRole("button", { name: /Increase Palm Oil 25 L quantity/ })
        .first()
        .click();
      await page.waitForFunction(() =>
        document.body.innerText.includes("₦213,000"),
      );
    },
  );
  await check(
    "customer type: indicative tiers for guests, account tier price for approved wholesale",
    async () => {
      await go(page, "/products/palm-oil?pack=po-25l");
      assert(
        await page.getByText("Indicative only").isVisible(),
        "indicative tag for guest",
      );
      await page.selectOption(
        'select[aria-label="Preview the storefront as a customer type"]',
        "wholesale-approved",
      );
      for (let i = 0; i < 11; i++)
        await page
          .getByRole("button", { name: "Increase Quantity" })
          .first()
          .click();
      await page.waitForFunction(() =>
        document.body.innerText.toLowerCase().includes("your account price"),
      );
      const text = await page.locator("main").innerText();
      // 12 packs at the 12+ tier: 71,000 * 0.93 rounded to 10 naira = 66,030
      assert(
        text.includes("₦792,360"),
        "12 x 66,030 = 792,360 shown as the account total",
      );
      await page.selectOption(
        'select[aria-label="Preview the storefront as a customer type"]',
        "retail",
      );
      await page.waitForFunction(() =>
        document.body.innerText.toLowerCase().includes("indicative only"),
      );
      assert(
        (await page.locator("main").innerText()).includes("₦852,000"),
        "retail pays list for 12 packs",
      );
    },
  );
  await check(
    "wholesale: tier explorer, quote builder validates minimum and records a quote",
    async () => {
      await go(page, "/wholesale");
      assert(
        await page
          .getByText("Minimum quantities and price breaks, by pack")
          .isVisible(),
        "MOQ table",
      );
      await go(page, "/wholesale/quote?pack=po-25l");
      await page.getByRole("button", { name: "Send quote request" }).click();
      assert(
        await page.getByText("Enter the business name.").isVisible(),
        "validation message",
      );
      await page.getByLabel("Business name").fill("Test Foods");
      await page.getByLabel("Contact person").fill("A Tester");
      await page.getByLabel("Mobile number").fill("08031234567");
      await page.getByRole("button", { name: "Send quote request" }).click();
      await page.getByText("Quote request recorded (preview)").waitFor();
    },
  );
  await check(
    "wholesale registration moves the account to awaiting approval",
    async () => {
      await go(page, "/wholesale/register");
      await page.getByLabel("Business name").fill("Sample Co");
      await page.getByLabel("Contact person").fill("B Tester");
      await page.getByLabel("Mobile number").fill("0803 123 4567");
      await page.getByLabel("Email").fill("b@example.com");
      await page.getByRole("button", { name: "Submit application" }).click();
      await page.waitForURL(/account/);
      assert(
        (await page.locator("main").innerText())
          .toLowerCase()
          .includes("wholesale, awaiting approval"),
        "pending status",
      );
    },
  );
  await check("account: reorder adds past order to cart", async () => {
    await go(page, "/account");
    await page
      .getByRole("button", { name: "Preview: staff approve this account" })
      .click();
    await page
      .getByRole("button", { name: "Reorder these items" })
      .first()
      .click();
    await page.getByRole("dialog", { name: "Cart" }).waitFor();
  });
  await page.context().close();
}

// ---------- Delivery location ----------
{
  const page = await newPage();
  await check(
    "delivery: search, pick result, see coverage, confirm and get options",
    async () => {
      await go(page, "/delivery");
      await page.getByLabel("Delivery address or area").fill("Ikeja");
      await page.getByRole("button", { name: "Search" }).click();
      await page.getByText("Inside sample zone").waitFor({ timeout: 15000 });
      assert(
        await page.getByText("Sample zone 2: Ikeja axis").first().isVisible(),
        "zone name",
      );
      await page.getByRole("button", { name: "Confirm this location" }).click();
      await page.getByText("Delivery options").waitFor();
      assert(
        await page
          .getByRole("radio", { name: /Home or business delivery/ })
          .isEnabled(),
        "home delivery available in zone 2",
      );
      await page.screenshot({ path: "screenshots/delivery-confirmed.png" });
    },
  );
  await check(
    "delivery: map renders a canvas and click places a pin resolving to an LGA",
    async () => {
      const canvas = page.locator("canvas.maplibregl-canvas").first();
      await canvas.waitFor();
      const box = await canvas.boundingBox();
      assert(
        box && box.width > 300 && box.height > 300,
        "canvas has real size",
      );
      await page.waitForTimeout(1200);
      await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.5);
      await page.waitForTimeout(500);
      const text = await page.locator("main").innerText();
      assert(/Pin in|Pinned location/.test(text), "pin label");
    },
  );
  await check(
    "delivery: zone 4 shows quote-required because no price rule is configured",
    async () => {
      await go(page, "/delivery");
      await page.selectOption("#lga-pick", "alimosho");
      await page.getByText("Inside sample zone").waitFor();
      await page.getByRole("button", { name: "Confirm this location" }).click();
      const home = page.getByRole("radio", {
        name: /Home or business delivery/,
      });
      assert(await home.isDisabled(), "home delivery disabled without a rule");
      assert(
        (await page.locator("main").innerText()).includes(
          "No delivery pricing rule is configured",
        ),
        "explains why",
      );
    },
  );
  await check(
    "delivery: point outside Lagos is labelled, not covered",
    async () => {
      await go(page, "/delivery");
      await page.getByLabel("Delivery address or area").fill("Epe");
      await page.getByRole("button", { name: "Search" }).click();
      await page
        .getByText("Outside sample zones")
        .first()
        .waitFor({ timeout: 15000 });
    },
  );
  await page.context().close();
}

// ---------- Checkout preview ----------
{
  const page = await newPage();
  await check(
    "checkout preview: validation, totals with delivery, confirmation page",
    async () => {
      await go(page, "/products/tapioca?pack=tp-5kg");
      await page.getByRole("button", { name: "Add to cart" }).first().click();
      await page.getByRole("dialog", { name: "Cart" }).waitFor();
      await go(page, "/order");
      await page.getByRole("button", { name: "Place preview order" }).click();
      assert(
        await page.getByText("Enter your full name.").isVisible(),
        "name error",
      );
      await page.getByLabel("Full name").fill("Ada Test");
      await page.getByLabel("Mobile number").fill("0803 123 4567");
      await page
        .getByLabel("House or plot number and street")
        .fill("12 Example Street");
      await page.getByLabel("Delivery address or area").fill("Ikeja");
      await page.getByRole("button", { name: "Search" }).click();
      await page.getByRole("button", { name: "Confirm this location" }).click();
      await page
        .getByRole("radio", { name: /Home or business delivery/ })
        .click();
      const summary = await page
        .getByRole("complementary", { name: "Order summary" })
        .innerText();
      assert(summary.includes("₦10,800"), "subtotal");
      assert(
        /Total/.test(summary) && /₦12,\d{3}|₦13,\d{3}/.test(summary),
        "total includes sample delivery fee",
      );
      await page.getByRole("button", { name: "Place preview order" }).click();
      await page.waitForURL(/confirmation/);
      assert(
        (await page.locator("h1").innerText()).startsWith("PREVIEW-"),
        "reference",
      );
      assert(
        await page
          .getByText("No order was placed and nothing was charged.")
          .isVisible(),
        "preview disclaimer",
      );
    },
  );
  await page.context().close();
}

// ---------- Dashboard ----------
{
  const page = await newPage();
  const kpi = async (label) => {
    const key = { "Gross sales": "gross", Orders: "orders" }[label];
    const tile = page.locator(`[data-testid="kpis"] > [data-metric="${key}"]`);
    return num(await tile.getByTestId("kpi-value").innerText());
  };
  await check(
    "dashboard: loads data, map canvas and KPIs; loading state shown first",
    async () => {
      const p = await newPage();
      await go(p, "/dashboard?latency=1500");
      await p.waitForTimeout(300);
      assert(
        (await p.getByLabel("Loading statistics").count()) > 0,
        "skeleton while loading",
      );
      await p.getByTestId("kpis").waitFor({ timeout: 20000 });
      await p.context().close();
      await go(page, "/dashboard");
      await page.getByTestId("kpis").waitFor({ timeout: 20000 });
      await page.locator("canvas.maplibregl-canvas").waitFor();
      assert(
        (await page.getByTestId("inspector-title").innerText()).includes(
          "All of the active extent",
        ),
        "extent title",
      );
    },
  );
  await check("dashboard: error state with retry", async () => {
    const p = await newPage();
    await go(p, "/dashboard?fail=data");
    await p
      .getByText("The dashboard could not load its data")
      .waitFor({ timeout: 20000 });
    await p.getByRole("button", { name: "Try again" }).click();
    await p.getByTestId("kpis").waitFor({ timeout: 20000 });
    await p.context().close();
  });
  await check(
    "dashboard: selecting a zone updates title, orders and keeps filters",
    async () => {
      await go(page, "/dashboard?scale=zone&seg=wholesale");
      await page.getByTestId("kpis").waitFor();
      const allOrders = await kpi("Orders");
      await page.getByText("Areas as a list").click();
      await page
        .locator("details")
        .filter({ hasText: "Areas as a list" })
        .getByRole("button", { name: "Zone 2: Ikeja axis" })
        .click();
      await page.waitForFunction(() =>
        document
          .querySelector('[data-testid="inspector-title"]')
          ?.textContent?.includes("Zone 2"),
      );
      const zoneOrders = await kpi("Orders");
      assert(
        zoneOrders < allOrders && zoneOrders > 0,
        `zone orders ${zoneOrders} < all ${allOrders}`,
      );
      assert(
        page.url().includes("unit=sz-ikeja") &&
          page.url().includes("seg=wholesale"),
        "URL keeps unit and segment",
      );
      const rowOrders = num(
        await page
          .locator("details")
          .filter({ hasText: "Areas as a list" })
          .locator("tr", { hasText: "Zone 2: Ikeja axis" })
          .locator("td")
          .nth(1)
          .innerText(),
      );
      assert(
        rowOrders === zoneOrders,
        `area list ${rowOrders} equals inspector ${zoneOrders}`,
      );
    },
  );
  await check(
    "dashboard: map and statistics agree (area list orders = inspector orders for selected LGA)",
    async () => {
      await go(page, "/dashboard");
      await page.getByTestId("kpis").waitFor();
      await page.getByText("Areas as a list").click();
      const list = page
        .locator("details")
        .filter({ hasText: "Areas as a list" });
      const row = list.locator("tr", {
        has: page.getByRole("button", { name: "Eti Osa", exact: true }),
      });
      const listOrders = num(await row.locator("td").nth(1).innerText());
      await list.getByRole("button", { name: "Eti Osa", exact: true }).click();
      await page.waitForFunction(
        () =>
          document.querySelector('[data-testid="inspector-title"]')
            ?.textContent === "Eti Osa",
      );
      assert(
        (await kpi("Orders")) === listOrders,
        "orders KPI equals aggregated row",
      );
    },
  );
  await check(
    "dashboard: product filter and date range recompute together",
    async () => {
      await go(page, "/dashboard");
      await page.getByTestId("kpis").waitFor();
      const before = await kpi("Gross sales");
      await page.getByRole("radio", { name: "Tapioca" }).click();
      await page.waitForTimeout(400);
      const tapioca = await kpi("Gross sales");
      assert(tapioca < before, "tapioca-only gross is lower");
      await page.selectOption('select[aria-label="Date range preset"]', "7d");
      await page.waitForTimeout(400);
      const week = await kpi("Gross sales");
      assert(week < tapioca, "7 days is lower than 30 days");
      assert(page.url().includes("cat=tapioca"), "filter in URL");
    },
  );
  await check(
    "dashboard: individual order selection shows only that order and restores context",
    async () => {
      await go(page, "/dashboard?role=admin&unit=ikeja");
      await page.getByTestId("kpis").waitFor();
      assert(
        (await page.getByTestId("inspector-title").innerText()) === "Ikeja",
        "unit selected from URL",
      );
      const first = page.locator("tbody tr button.mono").first();
      const id = (await first.innerText()).trim();
      await first.click();
      await page.getByTestId("order-inspector").waitFor();
      assert(
        (await page.getByTestId("inspector-title").innerText()) === id,
        "inspector shows the order id",
      );
      assert(
        (await page
          .getByTestId("order-inspector")
          .getByText("Gross sales")
          .count()) === 0,
        "no company KPIs in order view",
      );
      await page.getByRole("button", { name: /Back to Ikeja/ }).click();
      await page.waitForFunction(
        () =>
          document.querySelector('[data-testid="inspector-title"]')
            ?.textContent === "Ikeja",
      );
      assert(!page.url().includes("order="), "order removed from URL");
    },
  );
  await check(
    "dashboard: analyst role cannot see order-level records",
    async () => {
      await go(page, "/dashboard");
      await page.getByTestId("kpis").waitFor();
      assert(
        await page.getByText("Analyst view: aggregates only").isVisible(),
        "aggregates only",
      );
      assert(
        (await page.locator("tbody tr button.mono").count()) === 0,
        "no order buttons",
      );
      assert(
        await page.getByLabel("Order points").isDisabled(),
        "order points disabled",
      );
    },
  );
  await check("dashboard: other sections load", async () => {
    for (const [path, text] of [
      ["/dashboard/orders", "Orders"],
      ["/dashboard/customers", "Buying customers"],
      ["/dashboard/inventory", "Days of cover by pack"],
      ["/dashboard/wholesale", "Wholesale gross"],
      ["/dashboard/reports", "Metric definitions"],
    ]) {
      await go(page, path);
      await page
        .getByText(text, { exact: false })
        .first()
        .waitFor({ timeout: 20000 });
    }
  });
  await page.screenshot({ path: "screenshots/dash-reports.png" });
  await page.context().close();
}

// ---------- Accessibility basics ----------
{
  const page = await newPage();
  await check(
    "keyboard: skip link is first tab stop and focus rings are visible",
    async () => {
      await go(page, "/");
      await page.keyboard.press("Tab");
      assert(
        (await page.evaluate(() => document.activeElement?.textContent)) ===
          "Skip to content",
        "skip link focused",
      );
      await page.keyboard.press("Tab");
      await page.keyboard.press("Tab");
      const outline = await page.evaluate(
        () => getComputedStyle(document.activeElement).outlineStyle,
      );
      assert(outline !== "none", "visible focus outline");
    },
  );
  await check(
    "keyboard: filter checkbox and cart drawer are operable without a mouse",
    async () => {
      await go(page, "/shop/palm-oil");
      await page.getByLabel("Hide out of stock").focus();
      await page.keyboard.press("Space");
      await page.waitForFunction(
        () => document.querySelectorAll("article").length === 4,
      );
      await page.getByRole("button", { name: /Open cart/ }).focus();
      await page.keyboard.press("Enter");
      await page.getByRole("dialog", { name: "Cart" }).waitFor();
      await page.keyboard.press("Escape");
      await page.waitForFunction(() => !document.querySelector("dialog[open]"));
    },
  );
  await page.context().close();
}

// ---------- Mobile ----------
{
  const page = await newPage({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const paths = [
    "/",
    "/shop",
    "/shop/tapioca",
    "/products/palm-oil",
    "/products/tapioca?pack=tp-25kg",
    "/cart",
    "/delivery",
    "/wholesale",
    "/wholesale/quote",
    "/account",
    "/order",
  ];
  for (const p of paths) {
    await check(`mobile 390px: no horizontal overflow on ${p}`, async () => {
      await go(page, p);
      await page.waitForTimeout(400);
      const o = await page.evaluate(() => ({
        sw: document.documentElement.scrollWidth,
        cw: document.documentElement.clientWidth,
      }));
      assert(o.sw <= o.cw + 1, `scrollWidth ${o.sw} > ${o.cw}`);
    });
  }
  await check("mobile: drawer navigation and sticky buy bar", async () => {
    await go(page, "/products/palm-oil");
    assert(
      await page.getByRole("region", { name: "Quick buy" }).isVisible(),
      "sticky buy bar",
    );
    await page.getByRole("button", { name: "Open menu" }).click();
    await page.getByRole("dialog", { name: "Menu" }).waitFor();
    assert(
      await page
        .getByRole("link", { name: /Wholesale/ })
        .first()
        .isVisible(),
      "menu links",
    );
  });
  await check(
    "mobile dashboard: tabbed panels, no overflow, map usable",
    async () => {
      await go(page, "/dashboard");
      await page.getByRole("tab", { name: "Map" }).waitFor();
      await page.locator("canvas.maplibregl-canvas").waitFor();
      const o = await page.evaluate(() => ({
        sw: document.documentElement.scrollWidth,
        cw: document.documentElement.clientWidth,
      }));
      assert(o.sw <= o.cw + 1, `overflow ${o.sw} > ${o.cw}`);
      await page.screenshot({ path: "screenshots/m-dash-map.png" });
      await page.getByRole("tab", { name: "Insights" }).click();
      await page.getByTestId("kpis").waitFor();
      await page.screenshot({ path: "screenshots/m-dash-insights.png" });
      const o2 = await page.evaluate(() => ({
        sw: document.documentElement.scrollWidth,
        cw: document.documentElement.clientWidth,
      }));
      assert(o2.sw <= o2.cw + 1, `overflow insights ${o2.sw} > ${o2.cw}`);
    },
  );
  await page.context().close();
}

await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(
  `\n${results.length - failed.length}/${results.length} checks passed`,
);
if (consoleErrors.length)
  console.log("Console errors:\n" + consoleErrors.join("\n"));
else
  console.log(
    "Console errors: none (excluding unreachable external basemap/geocoder requests)",
  );
process.exit(failed.length || consoleErrors.length ? 1 : 0);
