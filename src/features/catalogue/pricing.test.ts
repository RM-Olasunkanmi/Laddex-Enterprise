import { describe, expect, it } from "vitest";

import {
  activeTier,
  cheapestPerUnit,
  lineTotal,
  priceFor,
  pricePerBaseUnit,
  tierSaving,
} from "./pricing";
import {
  applyQuery,
  DEFAULT_QUERY,
  normaliseQuery,
  sortOptions,
  toListings,
} from "./selectors";

import { ALL_VARIANTS, PRODUCTS } from "@/fixtures/products/products";

const v = (id: string) => ALL_VARIANTS.find((x) => x.id === id)!;

describe("tier selection", () => {
  const tiers = [
    { minQty: 12, unitPriceKobo: 70000 },
    { minQty: 4, unitPriceKobo: 80000 },
    { minQty: 40, unitPriceKobo: 60000 },
  ];
  it("returns null below the first break", () =>
    expect(activeTier(tiers, 3)).toBeNull());
  it("picks the highest applicable break regardless of order", () => {
    expect(activeTier(tiers, 4)?.unitPriceKobo).toBe(80000);
    expect(activeTier(tiers, 39)?.unitPriceKobo).toBe(70000);
    expect(activeTier(tiers, 40)?.unitPriceKobo).toBe(60000);
  });
});

describe("priceFor: who may see which price", () => {
  const can25 = v("po-25l");
  it("charges list price to guests, retail and pending wholesale even at tier quantities", () => {
    for (const access of ["guest", "retail", "wholesale-pending"] as const) {
      const r = priceFor(can25, 50, access);
      expect(r.unitPriceKobo).toBe(can25.retailPriceKobo);
      expect(r.basis).toBe("list");
      expect(r.tier).toBeNull();
    }
  });
  it("applies tiers only for approved wholesale accounts at or above the minimum", () => {
    expect(priceFor(can25, 50, "wholesale-approved").basis).toBe(
      "account-tier",
    );
    expect(
      priceFor(can25, 50, "wholesale-approved").unitPriceKobo,
    ).toBeLessThan(can25.retailPriceKobo);
    expect(priceFor(can25, 3, "wholesale-approved").basis).toBe("list");
  });
  it("totals are integer kobo and equal unit price times quantity", () => {
    const t = lineTotal(can25, 12, "wholesale-approved");
    expect(Number.isInteger(t)).toBe(true);
    expect(t).toBe(
      priceFor(can25, 12, "wholesale-approved").unitPriceKobo * 12,
    );
    expect(lineTotal(can25, 0, "retail")).toBe(0);
  });
});

describe("fixture integrity", () => {
  it("has strictly decreasing tier prices below list as quantity rises", () => {
    for (const variant of ALL_VARIANTS) {
      const sorted = [...variant.wholesaleTiers].sort(
        (a, b) => a.minQty - b.minQty,
      );
      let prev = variant.retailPriceKobo;
      for (const t of sorted) {
        expect(t.unitPriceKobo).toBeLessThan(prev);
        expect(tierSaving(variant, t)).toBeGreaterThan(0);
        prev = t.unitPriceKobo;
      }
    }
  });
  it("uses litres for palm oil and kilograms for tapioca", () => {
    for (const p of PRODUCTS) {
      for (const variant of p.variants) {
        expect(variant.size.unit === "kg" || variant.size.unit === "g").toBe(
          p.unitKind === "mass",
        );
        expect(variant.size.unit === "l" || variant.size.unit === "ml").toBe(
          p.unitKind === "volume",
        );
      }
    }
  });
  it("converts contents consistently with the printed size", () => {
    expect(v("po-500ml").contentBase).toBe(0.5);
    expect(v("tp-50kg").contentBase).toBe(50);
  });
  it("guards per-unit price against zero content", () => {
    expect(pricePerBaseUnit({ ...v("po-1l"), contentBase: 0 })).toBeNull();
    expect(pricePerBaseUnit(v("po-5l"))).toBe(
      Math.round(v("po-5l").retailPriceKobo / 5),
    );
  });
  it("finds bulk sizes cheaper per unit than the smallest pack", () => {
    for (const p of PRODUCTS) {
      const smallest = [...p.variants].sort(
        (a, b) => a.contentBase - b.contentBase,
      )[0];
      const best = cheapestPerUnit(p)!;
      expect(best.perUnitKobo).toBeLessThan(pricePerBaseUnit(smallest)!);
    }
  });
});

describe("catalogue query", () => {
  const listings = toListings(PRODUCTS);
  it("lists every pack when unfiltered", () =>
    expect(applyQuery(listings, DEFAULT_QUERY, PRODUCTS)).toHaveLength(
      ALL_VARIANTS.length,
    ));
  it("filters by category and format", () => {
    const r = applyQuery(
      listings,
      { ...DEFAULT_QUERY, category: "tapioca", format: "bulk" },
      PRODUCTS,
    );
    expect(r.map((l) => l.variant.id)).toEqual(["tp-25kg", "tp-50kg"]);
  });
  it("hides out-of-stock packs on request", () => {
    const r = applyQuery(
      listings,
      { ...DEFAULT_QUERY, inStockOnly: true },
      PRODUCTS,
    );
    expect(r.some((l) => l.variant.stock.status === "out-of-stock")).toBe(
      false,
    );
  });
  it("sorts by price per litre inside a category", () => {
    const r = applyQuery(
      listings,
      { ...DEFAULT_QUERY, category: "palm-oil", sort: "unit-asc" },
      PRODUCTS,
    );
    const per = r.map((l) => pricePerBaseUnit(l.variant)!);
    expect([...per].sort((a, b) => a - b)).toEqual(per);
  });
  it("drops per-unit sort and stale size filters when category is All", () => {
    const q = normaliseQuery(
      { ...DEFAULT_QUERY, category: "all", sort: "unit-asc", sizes: ["5 L"] },
      PRODUCTS,
    );
    expect(q.sort).toBe("featured");
    expect(q.sizes).toEqual([]);
    expect(sortOptions("all").some((o) => o.key === "unit-asc")).toBe(false);
  });
  it("filters by pack size within a category", () => {
    const r = applyQuery(
      listings,
      { ...DEFAULT_QUERY, category: "palm-oil", sizes: ["5 L", "25 L"] },
      PRODUCTS,
    );
    expect(r.map((l) => l.variant.id).sort()).toEqual(["po-25l", "po-5l"]);
  });
});
