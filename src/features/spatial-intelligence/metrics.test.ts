import { beforeAll, describe, expect, it } from "vitest";

import { buildDataset, type DashboardDataset } from "./dataset";
import { assignLgas } from "./enrich";
import {
  addDays,
  applyGeoSelection,
  DEFAULT_FILTERS,
  filterOrders,
  previousPeriod,
  unitKeyFor,
} from "./filters";
import {
  aggregateByUnit,
  change,
  computeKpis,
  concentration,
  deliveryFeeHistogram,
  median,
  ratio,
  reach,
  timeSeries,
  variantStats,
} from "./metrics";
import { UNASSIGNED, type GeoScale } from "./types";

import { priceFor } from "@/features/catalogue/pricing";
import { REGIONS } from "@/fixtures/geography/regions";
import {
  DATASET_DAYS,
  DATASET_END,
  DATASET_START,
} from "@/fixtures/orders/generate";
import { ALL_VARIANTS } from "@/fixtures/products/products";
import { testLgas, testStates } from "@/test/geo";

let ds: DashboardDataset;
beforeAll(() => {
  ds = buildDataset(testStates());
});

const WHOLE = { ...DEFAULT_FILTERS, from: DATASET_START, to: DATASET_END };

describe("synthetic dataset", () => {
  it("is deterministic and substantial", () => {
    const again = buildDataset(testStates());
    expect(again.orders.length).toBe(ds.orders.length);
    expect(again.orders[100].id).toBe(ds.orders[100].id);
    expect(again.orders[100].goodsKobo).toBe(ds.orders[100].goodsKobo);
    expect(ds.orders.length).toBeGreaterThan(2000);
    expect(DATASET_DAYS).toBe(182);
  });
  it("marks every order synthetic", () =>
    expect(ds.orders.every((o) => o.synthetic)).toBe(true));
  it("order totals equal the sum of their lines, and lines use storefront pricing", () => {
    for (const o of ds.orders) {
      expect(o.goodsKobo).toBe(
        o.lines.reduce((s, l) => s + l.lineTotalKobo, 0),
      );
      for (const l of o.lines) {
        expect(l.lineTotalKobo).toBe(l.unitPriceKobo * l.qty);
        const v = ALL_VARIANTS.find((x) => x.id === l.variantId)!;
        expect(l.unitPriceKobo).toBe(
          priceFor(
            v,
            l.qty,
            o.segment === "retail" ? "retail" : "wholesale-approved",
          ).unitPriceKobo,
        );
      }
    }
  });
  it("covers all three segments, all three categories and edge cases", () => {
    for (const seg of ["retail", "wholesale", "events"] as const)
      expect(
        ds.orders.some((o) => o.segment === seg),
        seg,
      ).toBe(true);
    for (const cat of ["palm-oil", "tapioca", "garri"] as const)
      expect(
        ds.orders.some((o) => o.lines.some((l) => l.category === cat)),
        cat,
      ).toBe(true);
    expect(ds.orders.some((o) => o.geoStatus === "unlocated")).toBe(true);
    expect(ds.orders.some((o) => o.status === "cancelled")).toBe(true);
    expect(ds.orders.some((o) => o.returnedKobo > 0)).toBe(true);
  });
  it("reaches most states and every region, derived by spatial join", () => {
    const states = new Set(ds.orders.map((o) => o.stateId).filter(Boolean));
    expect(states.size).toBeGreaterThanOrEqual(30);
    for (const r of REGIONS)
      expect(
        ds.orders.some((o) => o.regionId === r.id),
        r.id,
      ).toBe(true);
    for (const o of ds.orders) {
      if (o.stateId)
        expect(REGIONS.find((r) => r.id === o.regionId)!.stateIds).toContain(
          o.stateId,
        );
      else expect(o.regionId).toBeNull();
    }
  });
  it("is not just Lagos: Lagos holds the largest share but well under half", () => {
    const lagos =
      ds.orders.filter((o) => o.stateId === "lagos").length / ds.orders.length;
    expect(lagos).toBeGreaterThan(0.1);
    expect(lagos).toBeLessThan(0.45);
  });
});

describe("KPI definitions", () => {
  const all = () => filterOrders(ds.orders, WHOLE);
  it("gross excludes cancelled orders and net subtracts returns", () => {
    const orders = all();
    const k = computeKpis(orders);
    expect(k.grossKobo).toBe(
      orders
        .filter((o) => o.status !== "cancelled")
        .reduce((s, o) => s + o.goodsKobo, 0),
    );
    expect(k.netKobo).toBe(k.grossKobo - k.returnedKobo);
    expect(k.ordersPlaced).toBe(orders.length);
    expect(k.ordersActive).toBe(orders.length - k.cancelled);
  });
  it("AOV equals gross over non-cancelled orders", () => {
    const k = computeKpis(all());
    expect(k.aovKobo).toBe(Math.round(k.grossKobo / k.ordersActive));
  });
  it("category and segment shares each sum to one", () => {
    const k = computeKpis(all());
    expect(
      Object.values(k.shareByCategory).reduce<number>(
        (s, v) => s + (v ?? 0),
        0,
      ),
    ).toBeCloseTo(1, 10);
    expect(
      Object.values(k.shareBySegment).reduce<number>((s, v) => s + (v ?? 0), 0),
    ).toBeCloseTo(1, 10);
    expect(Object.values(k.grossByCategory).reduce((s, v) => s + v, 0)).toBe(
      k.grossKobo,
    );
    expect(Object.values(k.grossBySegment).reduce((s, v) => s + v, 0)).toBe(
      k.grossKobo,
    );
  });
  it("keeps litres and kilograms separate", () => {
    const k = computeKpis(all());
    expect(k.litres).toBeGreaterThan(0);
    expect(k.kilograms).toBeGreaterThan(0);
  });
  it("fulfilment rate ignores open orders", () => {
    const orders = all();
    const k = computeKpis(orders);
    const delivered = orders.filter((o) => o.status === "delivered").length;
    const closed = orders.filter((o) =>
      ["delivered", "cancelled", "returned"].includes(o.status),
    ).length;
    expect(k.fulfilmentRate).toBeCloseTo(delivered / closed, 10);
  });
  it("handles empty input without NaN or Infinity", () => {
    const k = computeKpis([]);
    expect(k.aovKobo).toBeNull();
    expect(k.fulfilmentRate).toBeNull();
    expect(k.repeatRate).toBeNull();
    expect(k.shareByCategory["palm-oil"]).toBeNull();
    expect(k.grossKobo).toBe(0);
    expect(ratio(1, 0)).toBeNull();
    expect(change(5, 0)).toBeNull();
    expect(change(null, 5)).toBeNull();
    expect(change(110, 100)).toBeCloseTo(0.1, 10);
    expect(median([])).toBeNull();
    expect(concentration([]).hhi).toBeNull();
  });
});

describe("aggregation reconciles with totals", () => {
  const scales: GeoScale[] = ["region", "state"];
  it.each(scales)(
    "units at %s scale sum to the overall totals (including the unassigned bucket)",
    (scale) => {
      const orders = filterOrders(ds.orders, WHOLE);
      const total = computeKpis(orders);
      const units = [...aggregateByUnit(orders, scale).values()];
      expect(units.reduce((s, u) => s + u.ordersPlaced, 0)).toBe(
        total.ordersPlaced,
      );
      expect(units.reduce((s, u) => s + u.grossKobo, 0)).toBe(total.grossKobo);
      expect(units.reduce((s, u) => s + u.netKobo, 0)).toBe(total.netKobo);
      expect(units.reduce((s, u) => s + u.packs, 0)).toBe(total.packs);
    },
  );
  it("LGA aggregation within one state reconciles with that state", () => {
    const lagosOrders = filterOrders(
      assignLgas(ds.orders, "lagos", testLgas("lagos")),
      WHOLE,
    ).filter((o) => o.stateId === "lagos");
    const byLga = [...aggregateByUnit(lagosOrders, "lga").values()];
    expect(byLga.reduce((s, u) => s + u.grossKobo, 0)).toBe(
      computeKpis(lagosOrders).grossKobo,
    );
    expect(byLga.filter((u) => u.id !== UNASSIGNED).length).toBeGreaterThan(10);
  });
  it("product sales reconcile with the orders that include them", () => {
    const orders = filterOrders(ds.orders, WHOLE);
    const vs = variantStats(orders, DATASET_DAYS);
    expect(vs.reduce((s, v) => s + v.grossKobo, 0)).toBe(
      computeKpis(orders).grossKobo,
    );
    expect(vs.reduce((s, v) => s + v.packs, 0)).toBe(computeKpis(orders).packs);
  });
  it("events revenue derives only from events orders", () => {
    const orders = filterOrders(ds.orders, WHOLE);
    const direct = orders
      .filter((o) => o.segment === "events" && o.status !== "cancelled")
      .reduce((s, o) => s + o.goodsKobo, 0);
    expect(computeKpis(orders).grossBySegment.events).toBe(direct);
  });
  it("the time series sums to the period's gross sales", () => {
    const orders = filterOrders(ds.orders, DEFAULT_FILTERS);
    const series = timeSeries(orders, DEFAULT_FILTERS, "day");
    expect(series).toHaveLength(30);
    expect(series.reduce((s, p) => s + p.grossKobo, 0)).toBe(
      computeKpis(orders).grossKobo,
    );
  });
  it("reach counts distinct states and regions with orders", () => {
    const r = reach(filterOrders(ds.orders, WHOLE));
    expect(r.statesReached).toBeLessThanOrEqual(37);
    expect(r.regionsReached).toBe(6);
    expect(r.total).toBe(
      computeKpis(filterOrders(ds.orders, WHOLE)).ordersActive,
    );
  });
});

describe("filters and linked selection", () => {
  it("changing the date range recomputes from the same dataset", () => {
    const a = computeKpis(
      filterOrders(ds.orders, {
        ...DEFAULT_FILTERS,
        from: addDays(DATASET_END, -6),
      }),
    );
    const b = computeKpis(filterOrders(ds.orders, DEFAULT_FILTERS));
    expect(a.ordersPlaced).toBeLessThan(b.ordersPlaced);
    expect(a.grossKobo).toBeLessThan(b.grossKobo);
  });
  it("previous period has equal length and ends the day before", () => {
    const p = previousPeriod(DEFAULT_FILTERS);
    expect(p.to).toBe(addDays(DEFAULT_FILTERS.from, -1));
    expect(filterOrders(ds.orders, DEFAULT_FILTERS, p).length).toBeGreaterThan(
      0,
    );
  });
  it("a product filter scopes sales to the matching lines only", () => {
    const garri = computeKpis(
      filterOrders(ds.orders, { ...WHOLE, categories: ["garri"] }),
    );
    expect(garri.grossByCategory["palm-oil"]).toBe(0);
    expect(garri.litres).toBe(0);
    expect(garri.grossKobo).toBe(
      computeKpis(filterOrders(ds.orders, WHOLE)).grossByCategory.garri,
    );
  });
  it("selecting a state restricts every figure to it and keeps other filters", () => {
    const base = filterOrders(ds.orders, { ...WHOLE, segments: ["wholesale"] });
    const inKano = applyGeoSelection(base, {
      scale: "state",
      unitId: "kano",
      stateId: null,
    });
    expect(inKano.length).toBeGreaterThan(0);
    expect(
      inKano.every((o) => o.stateId === "kano" && o.segment === "wholesale"),
    ).toBe(true);
    const fromUnit = aggregateByUnit(base, "state").get("kano")!;
    expect(computeKpis(inKano).grossKobo).toBe(fromUnit.grossKobo);
  });
  it("selecting a region selects every state in it", () => {
    const orders = filterOrders(ds.orders, WHOLE);
    const sw = applyGeoSelection(orders, {
      scale: "region",
      unitId: "south-west",
      stateId: null,
    });
    expect(sw.length).toBeGreaterThan(0);
    expect(
      sw.every((o) =>
        REGIONS.find((r) => r.id === "south-west")!.stateIds.includes(
          o.stateId!,
        ),
      ),
    ).toBe(true);
  });
  it("the unassigned bucket holds only orders without a usable state", () => {
    const orders = filterOrders(ds.orders, WHOLE);
    const u = applyGeoSelection(orders, {
      scale: "state",
      unitId: UNASSIGNED,
      stateId: null,
    });
    expect(u.length).toBeGreaterThan(0);
    expect(u.every((o) => o.stateId === null)).toBe(true);
  });
  it("an individual order resolves only to itself and its own figures", () => {
    const order = ds.orders.find((o) => o.status === "delivered" && o.stateId)!;
    expect(computeKpis([order]).ordersPlaced).toBe(1);
    expect(computeKpis([order]).grossKobo).toBe(order.goodsKobo);
    expect(unitKeyFor(order, "state")).toBe(order.stateId);
  });
  it("delivery cost histogram counts every non-cancelled order", () => {
    const orders = filterOrders(ds.orders, WHOLE);
    const h = deliveryFeeHistogram(orders);
    expect(h.bins.reduce((s, b) => s + b.count, 0)).toBe(h.n);
    expect(h.n).toBe(orders.filter((o) => o.status !== "cancelled").length);
    expect(h.median).not.toBeNull();
  });
  it("concentration is bounded and HHI is at least 1/n", () => {
    const stats = [
      ...aggregateByUnit(filterOrders(ds.orders, WHOLE), "state").values(),
    ].filter((s) => s.id !== UNASSIGNED);
    const c = concentration(stats);
    expect(c.top3Share!).toBeGreaterThan(0);
    expect(c.top3Share!).toBeLessThanOrEqual(1);
    expect(c.hhi!).toBeGreaterThanOrEqual(1 / c.units - 1e-9);
  });
});

describe("geography areas", () => {
  it("computes plausible state areas for density", () => {
    expect(ds.stateAreaKm2["niger"]).toBeGreaterThan(ds.stateAreaKm2["lagos"]);
    const total = Object.values(ds.stateAreaKm2).reduce((s, a) => s + a, 0);
    expect(total).toBeGreaterThan(850_000);
    expect(total).toBeLessThan(1_000_000);
  });
});
