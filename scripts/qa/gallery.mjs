// Captures the review gallery into screenshots/. Usage: BASE=http://localhost:3355 node scripts/qa/gallery.mjs
import { chromium } from "playwright-core";
import { existsSync, readdirSync, mkdirSync } from "node:fs";

const BASE = process.env.BASE ?? "http://localhost:3355";
const find = () => {
  const root = "/opt/pw-browsers";
  for (const d of readdirSync(root))
    for (const rel of ["chrome-linux/chrome", "chrome-linux/headless_shell"])
      if (existsSync(`${root}/${d}/${rel}`)) return `${root}/${d}/${rel}`;
  throw new Error("no chromium");
};
mkdirSync("screenshots", { recursive: true });
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

const approved = {
  access: "wholesale-approved",
  displayName: "Sample Trading Co.",
  business: {
    name: "Sample Trading Co.",
    kind: "distributor",
    status: "approved",
    submittedAt: "2026-09-12T09:00:00+01:00",
  },
};
const cart = [
  { variantId: "po-25l", qty: 12 },
  { variantId: "tp-25kg", qty: 8 },
  { variantId: "po-1l", qty: 2 },
];

async function shoot(
  name,
  path,
  {
    vp = { width: 1440, height: 900 },
    mobile = false,
    full = false,
    persona,
    withCart = false,
    wait = 800,
    act,
  } = {},
) {
  const ctx = await browser.newContext({
    viewport: vp,
    isMobile: mobile,
    hasTouch: mobile,
  });
  await ctx.addInitScript(
    ([p, c, wc]) => {
      if (p) localStorage.setItem("laddex:customer:v1", JSON.stringify(p));
      if (wc) localStorage.setItem("laddex:cart:v1", JSON.stringify(c));
    },
    [persona ?? null, cart, withCart],
  );
  const page = await ctx.newPage();
  await page.goto(BASE + path, { waitUntil: "networkidle", timeout: 90000 });
  await page.waitForTimeout(wait);
  if (act) await act(page);
  await page.screenshot({ path: `screenshots/${name}.png`, fullPage: full });
  console.log("shot", name);
  await ctx.close();
}
const M = { vp: { width: 390, height: 844 }, mobile: true };

await shoot("01-home-desktop", "/", { full: true });
await shoot("02-home-mobile", "/", { ...M, full: true });
await shoot("03-shop-palm-desktop", "/shop/palm-oil", { full: true });
await shoot("04-shop-mobile-filters", "/shop/palm-oil", {
  ...M,
  act: (p) => p.getByRole("button", { name: /Filters/ }).click(),
});
await shoot("05-product-desktop", "/products/palm-oil?pack=po-25l", {
  full: true,
});
await shoot("06-product-approved-wholesale", "/products/palm-oil?pack=po-25l", {
  persona: approved,
  act: async (p) => {
    for (let i = 0; i < 11; i++)
      await p
        .getByRole("button", { name: "Increase Quantity" })
        .first()
        .click();
  },
  wait: 500,
});
await shoot("07-product-mobile", "/products/tapioca?pack=tp-25kg", { ...M });
await shoot("08-cart-approved", "/cart", { persona: approved, withCart: true });
await shoot("09-cart-drawer", "/shop", {
  persona: approved,
  withCart: true,
  act: (p) => p.getByRole("button", { name: /^Cart/ }).click(),
});
await shoot("10-wholesale", "/wholesale", { full: true });
await shoot("11-quote", "/wholesale/quote?pack=po-25l");
await shoot("12-account-approved", "/account", {
  persona: approved,
  full: true,
});
await shoot("13-delivery-confirmed", "/delivery?q=Lekki", {
  act: async (p) => {
    await p.getByRole("button", { name: "Confirm this location" }).click();
    await p.waitForTimeout(800);
  },
  wait: 2500,
});
await shoot("14-delivery-mobile", "/delivery?q=Ikeja", {
  ...M,
  wait: 2500,
  full: true,
});
await shoot("15-dashboard-default", "/dashboard", { wait: 3500 });
await shoot("16-dashboard-zone", "/dashboard?scale=zone&unit=sz-ikeja", {
  wait: 3500,
});
await shoot(
  "17-dashboard-lga-wholesale",
  "/dashboard?cat=palm-oil&seg=wholesale&unit=eti-osa&fill=wholesaleShare",
  { wait: 3500 },
);
await shoot("18-dashboard-admin-order", "/dashboard?role=admin&unit=ikeja", {
  wait: 3500,
  act: async (p) => {
    await p.locator("tbody tr button.mono").first().click();
    await p.waitForTimeout(1500);
  },
});
await shoot("19-dashboard-pickup", "/dashboard?scale=pickup&role=admin", {
  wait: 3500,
});
await shoot("20-dashboard-state", "/dashboard?scale=state", { wait: 3500 });
await shoot(
  "21-dashboard-empty",
  "/dashboard?from=2026-09-30&to=2026-10-01&seg=retail&cat=tapioca&unit=epe",
  { wait: 3500 },
);
await shoot("22-dashboard-reports", "/dashboard/reports", {
  wait: 2500,
  full: true,
});
await shoot("23-dashboard-inventory", "/dashboard/inventory", {
  wait: 2500,
  full: true,
});
await shoot("24-dashboard-mobile-orders", "/dashboard?role=admin", {
  ...M,
  wait: 3000,
  act: (p) => p.getByRole("tab", { name: "Orders" }).click(),
});
await shoot("25-loading-dashboard", "/dashboard?latency=4000", { wait: 600 });
await browser.close();
