import { describe, expect, it } from "vitest";

import { ALL_VARIANTS, PRODUCTS } from "@/fixtures/products/products";

import {
  activeTier,
  cheapestPerUnit,
  fromPrice,
  lineTotal,
  priceFor,
  pricePerBaseUnit,
  tierSaving,
} from "./pricing";
import { applyQuery, DEFAULT_QUERY, normaliseQuery, relatedProducts, sortOptions } from "./selectors";

const v = (id: string) => ALL_VARIANTS.find((x) => x.id === id)!;

describe("tier selection", () => {
  const tiers = [
    { minQty: 12, unitPriceKobo: 70000 },
    { minQty: 4, unitPriceKobo: 80000 },
    { minQty: 40, unitPriceKobo: 60000 },
  ];
  it("returns null below the first break", () => expect(activeTier(tiers, 3)).toBeNull());
  it("picks the highest applicable break regardless of order", () => {
    expect(activeTier(tiers, 4)?.unitPriceKobo).toBe(80000);
    expect(activeTier(tiers, 39)?.unitPriceKobo).toBe(70000);
    expect(activeTier(tiers, 40)?.unitPriceKobo).toBe(60000);
  });
});

describe("priceFor: who may see which price", () => {
  const sack = v("gi-25kg");
  it("charges list price to guests, retail and pending wholesale even at tier quantities", () => {
    for (const access of ["guest", "retail", "wholesale-pending"] as const) {
      const r = priceFor(sack, 50, access);
      expect(r.unitPriceKobo).toBe(sack.retailPriceKobo);
      expect(r.basis).toBe("list");
      expect(r.tier).toBeNull();
    }
  });
  it("applies tiers only for approved wholesale accounts at or above the minimum", () => {
    expect(priceFor(sack, 50, "wholesale-approved").basis).toBe("account-tier");
    expect(priceFor(sack, 50, "wholesale-approved").unitPriceKobo).toBeLessThan(sack.retailPriceKobo);
    expect(priceFor(sack, 3, "wholesale-approved").basis).toBe("list");
  });
  it("totals are integer kobo and equal unit price times quantity", () => {
    const t = lineTotal(sack, 20, "wholesale-approved");
    expect(Number.isInteger(t)).toBe(true);
    expect(t).toBe(priceFor(sack, 20, "wholesale-approved").unitPriceKobo * 20);
    expect(lineTotal(sack, 0, "retail")).toBe(0);
  });
});

describe("fixture integrity", () => {
  it("has the four Laddex products in three categories", () => {
    expect(PRODUCTS.map((p) => p.slug)).toEqual(["palm-oil", "tapioca-flakes", "garri-igbo", "garri-ijebu"]);
    expect(new Set(PRODUCTS.map((p) => p.category))).toEqual(new Set(["palm-oil", "tapioca", "garri"]));
  });
  it("gives every product at least one photograph that exists under /public", async () => {
    const { existsSync } = await import("node:fs");
    for (const p of PRODUCTS) {
      expect(p.photographs.length, p.id).toBeGreaterThan(0);
      for (const img of p.photographs) expect(existsSync(`public${img.src}`), img.src).toBe(true);
    }
  });
  it("has strictly decreasing tier prices below list as quantity rises", () => {
    for (const variant of ALL_VARIANTS) {
      const sorted = [...variant.wholesaleTiers].sort((a, b) => a.minQty - b.minQty);
      let prev = variant.retailPriceKobo;
      for (const t of sorted) {
        expect(t.unitPriceKobo).toBeLessThan(prev);
        expect(tierSaving(variant, t)).toBeGreaterThan(0);
        prev = t.unitPriceKobo;
      }
    }
  });
  it("uses litres for palm oil and kilograms for tapioca flakes and garri", () => {
    for (const p of PRODUCTS) {
      for (const variant of p.variants) {
        const mass = variant.size.unit === "kg" || variant.size.unit === "g";
        expect(mass).toBe(p.unitKind === "mass");
      }
    }
  });
  it("converts contents consistently with the printed size", () => {
    expect(v("tf-500g").contentBase).toBe(0.5);
    expect(v("gj-50kg").contentBase).toBe(50);
    expect(v("po-3l").contentBase).toBe(3);
  });
  it("guards per-unit price against zero content", () => {
    expect(pricePerBaseUnit({ ...v("po-1l"), contentBase: 0 })).toBeNull();
    expect(pricePerBaseUnit(v("po-5l"))).toBe(Math.round(v("po-5l").retailPriceKobo / 5));
  });
  it("makes larger packs cheaper per unit than the smallest pack of the same product", () => {
    for (const p of PRODUCTS) {
      const smallest = [...p.variants].sort((a, b) => a.contentBase - b.contentBase)[0];
      const best = cheapestPerUnit(p)!;
      expect(best.perUnitKobo).toBeLessThan(pricePerBaseUnit(smallest)!);
      expect(fromPrice(p)).toBe(Math.min(...p.variants.map((x) => x.retailPriceKobo)));
    }
  });
});

describe("catalogue query", () => {
  it("lists every product when unfiltered", () => expect(applyQuery(PRODUCTS, DEFAULT_QUERY)).toHaveLength(4));
  it("filters by category: garri has two products", () => {
    expect(applyQuery(PRODUCTS, { ...DEFAULT_QUERY, category: "garri" }).map((p) => p.slug)).toEqual(["garri-igbo", "garri-ijebu"]);
    expect(applyQuery(PRODUCTS, { ...DEFAULT_QUERY, category: "tapioca" })).toHaveLength(1);
  });
  it("hides a product only when every size is out of stock", () => {
    const allOut = PRODUCTS.map((p) =>
      p.id === "garri-ijebu" ? { ...p, variants: p.variants.map((x) => ({ ...x, stock: { status: "out-of-stock" as const, qtyAvailable: 0 } })) } : p,
    );
    const r = applyQuery(allOut, { ...DEFAULT_QUERY, inStockOnly: true });
    expect(r.map((p) => p.id)).not.toContain("garri-ijebu");
    expect(r).toHaveLength(3);
    // A product with only some sizes out of stock stays listed.
    expect(applyQuery(PRODUCTS, { ...DEFAULT_QUERY, inStockOnly: true })).toHaveLength(4);
  });
  it("sorts garri by price per kilo inside the category", () => {
    const r = applyQuery(PRODUCTS, { ...DEFAULT_QUERY, category: "garri", sort: "unit-asc" });
    const per = r.map((p) => cheapestPerUnit(p)!.perUnitKobo);
    expect([...per].sort((a, b) => a - b)).toEqual(per);
  });
  it("sorts by from-price", () => {
    const asc = applyQuery(PRODUCTS, { ...DEFAULT_QUERY, sort: "price-asc" }).map(fromPrice);
    expect([...asc].sort((a, b) => a - b)).toEqual(asc);
  });
  it("drops the per-unit sort when category is All, because litres and kilograms do not compare", () => {
    expect(normaliseQuery({ ...DEFAULT_QUERY, category: "all", sort: "unit-asc" }).sort).toBe("featured");
    expect(sortOptions("all").some((o) => o.key === "unit-asc")).toBe(false);
    expect(sortOptions("garri").some((o) => o.key === "unit-asc")).toBe(true);
  });
  it("suggests the same category first as related products", () => {
    const igbo = PRODUCTS.find((p) => p.id === "garri-igbo")!;
    expect(relatedProducts(igbo, PRODUCTS)[0].id).toBe("garri-ijebu");
    expect(relatedProducts(igbo, PRODUCTS)).toHaveLength(3);
  });
});
