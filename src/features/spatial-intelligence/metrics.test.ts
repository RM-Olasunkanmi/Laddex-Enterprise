import { beforeAll, describe, expect, it } from "vitest";

import { priceFor } from "@/features/catalogue/pricing";
import { ALL_VARIANTS } from "@/fixtures/products/products";
import { DATASET_DAYS, DATASET_END, DATASET_START } from "@/fixtures/orders/generate";
import { SAMPLE_ZONES } from "@/fixtures/geography/zones";
import { testLgas, testStates } from "@/test/geo";

import { buildDataset, type DashboardDataset } from "./dataset";
import { addDays, applyGeoSelection, DEFAULT_FILTERS, filterOrders, previousPeriod, unitKeyFor } from "./filters";
import { aggregateByUnit, change, computeKpis, concentration, coverageSplit, deliveryFeeHistogram, median, ratio, timeSeries, variantStats } from "./metrics";
import { OUTSIDE_ZONES, UNASSIGNED, type EnrichedOrder, type GeoScale } from "./types";

let ds: DashboardDataset;
beforeAll(() => {
  ds = buildDataset(testLgas(), testStates());
});

const WHOLE = { ...DEFAULT_FILTERS, from: DATASET_START, to: DATASET_END };

describe("synthetic dataset", () => {
  it("is deterministic and substantial", () => {
    const again = buildDataset(testLgas(), testStates());
    expect(again.orders.length).toBe(ds.orders.length);
    expect(again.orders[100].id).toBe(ds.orders[100].id);
    expect(again.orders[100].goodsKobo).toBe(ds.orders[100].goodsKobo);
    expect(ds.orders.length).toBeGreaterThan(900);
    expect(DATASET_DAYS).toBe(182);
  });
  it("marks every order synthetic", () => expect(ds.orders.every((o) => o.synthetic)).toBe(true));
  it("order totals equal the sum of their lines, and lines use storefront pricing", () => {
    for (const o of ds.orders) {
      expect(o.goodsKobo).toBe(o.lines.reduce((s, l) => s + l.lineTotalKobo, 0));
      for (const l of o.lines) {
        expect(l.lineTotalKobo).toBe(l.unitPriceKobo * l.qty);
        const v = ALL_VARIANTS.find((x) => x.id === l.variantId)!;
        const expected = priceFor(v, l.qty, o.segment === "wholesale" ? "wholesale-approved" : "retail").unitPriceKobo;
        expect(l.unitPriceKobo).toBe(expected);
      }
    }
  });
  it("contains located, unlocated and out-of-Lagos orders so edge cases are exercised", () => {
    expect(ds.orders.some((o) => o.geoStatus === "unlocated")).toBe(true);
    expect(ds.orders.some((o) => o.geoStatus === "located" && o.lgaId === null)).toBe(true);
    expect(ds.orders.some((o) => o.status === "cancelled")).toBe(true);
    expect(ds.orders.some((o) => o.returnedKobo > 0)).toBe(true);
  });
  it("derives LGA by spatial join: located orders in Lagos always have an LGA and state", () => {
    for (const o of ds.orders) {
      if (o.lgaId) expect(o.stateId).toBe("lagos");
      if (o.zoneId) expect(SAMPLE_ZONES.some((z) => z.id === o.zoneId && o.lgaId && z.lgaIds.includes(o.lgaId))).toBe(true);
    }
  });
  it("does not keep a pickup point on delivery orders and always sets a fee basis", () => {
    for (const o of ds.orders) {
      if (o.fulfilment === "delivery") expect(o.pickupPointId).toBeNull();
      else expect(o.deliveryFeeKobo).toBe(0);
    }
  });
});

describe("KPI definitions", () => {
  const all = () => filterOrders(ds.orders, WHOLE);
  it("gross excludes cancelled orders and net subtracts returns", () => {
    const orders = all();
    const k = computeKpis(orders);
    const expectedGross = orders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + o.goodsKobo, 0);
    expect(k.grossKobo).toBe(expectedGross);
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
    expect(k.shareByCategory["palm-oil"]! + k.shareByCategory.tapioca!).toBeCloseTo(1, 10);
    expect(k.shareBySegment.retail! + k.shareBySegment.wholesale!).toBeCloseTo(1, 10);
    expect(k.grossByCategory["palm-oil"] + k.grossByCategory.tapioca).toBe(k.grossKobo);
    expect(k.grossBySegment.retail + k.grossBySegment.wholesale).toBe(k.grossKobo);
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
    const closed = orders.filter((o) => ["delivered", "cancelled", "returned"].includes(o.status)).length;
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
  const scales: GeoScale[] = ["state", "lga", "zone", "pickup"];
  it.each(scales)("units at %s scale sum to the overall totals (including the unassigned bucket)", (scale) => {
    const orders = filterOrders(ds.orders, WHOLE);
    const total = computeKpis(orders);
    const units = [...aggregateByUnit(orders, scale).values()];
    expect(units.reduce((s, u) => s + u.ordersPlaced, 0)).toBe(total.ordersPlaced);
    expect(units.reduce((s, u) => s + u.grossKobo, 0)).toBe(total.grossKobo);
    expect(units.reduce((s, u) => s + u.netKobo, 0)).toBe(total.netKobo);
    expect(units.reduce((s, u) => s + u.packs, 0)).toBe(total.packs);
  });
  it("product sales reconcile with the orders that include them", () => {
    const orders = filterOrders(ds.orders, WHOLE);
    const vs = variantStats(orders, DATASET_DAYS);
    expect(vs.reduce((s, v) => s + v.grossKobo, 0)).toBe(computeKpis(orders).grossKobo);
    expect(vs.reduce((s, v) => s + v.packs, 0)).toBe(computeKpis(orders).packs);
  });
  it("wholesale revenue derives only from wholesale orders", () => {
    const orders = filterOrders(ds.orders, WHOLE);
    const k = computeKpis(orders);
    const direct = orders.filter((o) => o.segment === "wholesale" && o.status !== "cancelled").reduce((s, o) => s + o.goodsKobo, 0);
    expect(k.grossBySegment.wholesale).toBe(direct);
  });
  it("the time series sums to the period's gross sales", () => {
    const f = { ...DEFAULT_FILTERS };
    const orders = filterOrders(ds.orders, f);
    const series = timeSeries(orders, f, "day");
    expect(series).toHaveLength(30);
    expect(series.reduce((s, p) => s + p.grossKobo, 0)).toBe(computeKpis(orders).grossKobo);
    const weekly = timeSeries(filterOrders(ds.orders, WHOLE), WHOLE, "week");
    expect(weekly.reduce((s, p) => s + p.grossKobo, 0)).toBe(computeKpis(filterOrders(ds.orders, WHOLE)).grossKobo);
  });
  it("coverage split covers every non-cancelled order exactly once", () => {
    const orders = filterOrders(ds.orders, WHOLE);
    const c = coverageSplit(orders);
    expect(c.inSampleZones + c.outsideSampleZones + c.outsideLagos + c.unlocated).toBe(c.total);
    expect(c.total).toBe(computeKpis(orders).ordersActive);
  });
});

describe("filters and linked selection", () => {
  it("changing the date range recomputes from the same dataset", () => {
    const a = computeKpis(filterOrders(ds.orders, { ...DEFAULT_FILTERS, from: addDays(DATASET_END, -6) }));
    const b = computeKpis(filterOrders(ds.orders, DEFAULT_FILTERS));
    expect(a.ordersPlaced).toBeLessThan(b.ordersPlaced);
    expect(a.grossKobo).toBeLessThan(b.grossKobo);
  });
  it("previous period has equal length and ends the day before", () => {
    const p = previousPeriod(DEFAULT_FILTERS);
    expect(p.to).toBe(addDays(DEFAULT_FILTERS.from, -1));
    expect(filterOrders(ds.orders, DEFAULT_FILTERS, p).length).toBeGreaterThan(0);
  });
  it("a product filter scopes sales to the matching lines only", () => {
    const palm = filterOrders(ds.orders, { ...WHOLE, categories: ["palm-oil"] });
    const k = computeKpis(palm);
    expect(k.grossByCategory.tapioca).toBe(0);
    expect(k.kilograms).toBe(0);
    const everything = computeKpis(filterOrders(ds.orders, WHOLE));
    expect(k.grossKobo).toBe(everything.grossByCategory["palm-oil"]);
  });
  it("selecting a zone restricts every figure to orders in that zone and keeps other filters", () => {
    const base = filterOrders(ds.orders, { ...WHOLE, segments: ["wholesale"] });
    const inZone = applyGeoSelection(base, { scale: "zone", unitId: "sz-ikeja" });
    expect(inZone.length).toBeGreaterThan(0);
    expect(inZone.every((o) => o.zoneId === "sz-ikeja" && o.segment === "wholesale")).toBe(true);
    const k = computeKpis(inZone);
    const fromUnit = aggregateByUnit(base, "zone").get("sz-ikeja")!;
    expect(k.grossKobo).toBe(fromUnit.grossKobo);
    expect(k.ordersPlaced).toBe(fromUnit.ordersPlaced);
  });
  it("the outside-zones bucket holds Lagos orders without a sample zone, distinct from unlocated", () => {
    const orders = filterOrders(ds.orders, WHOLE);
    const outside = applyGeoSelection(orders, { scale: "zone", unitId: OUTSIDE_ZONES });
    expect(outside.every((o) => o.lgaId !== null && o.zoneId === null)).toBe(true);
    expect(applyGeoSelection(orders, { scale: "zone", unitId: UNASSIGNED }).every((o) => o.lgaId === null)).toBe(true);
  });
  it("an individual order resolves only to itself and its own figures", () => {
    const order = ds.orders.find((o) => o.status === "delivered" && o.lgaId)!;
    const k = computeKpis([order]);
    expect(k.ordersPlaced).toBe(1);
    expect(k.grossKobo).toBe(order.goodsKobo);
    expect(unitKeyFor(order, "lga")).toBe(order.lgaId);
  });
  it("delivery cost histogram counts every non-cancelled delivery order", () => {
    const orders = filterOrders(ds.orders, WHOLE);
    const h = deliveryFeeHistogram(orders);
    expect(h.bins.reduce((s, b) => s + b.count, 0)).toBe(h.n);
    expect(h.n).toBe(orders.filter((o) => o.fulfilment === "delivery" && o.status !== "cancelled").length);
    expect(h.median).not.toBeNull();
  });
  it("concentration is bounded and HHI is at least 1/n", () => {
    const stats = [...aggregateByUnit(filterOrders(ds.orders, WHOLE), "lga").values()].filter((s) => s.id !== UNASSIGNED);
    const c = concentration(stats);
    expect(c.top3Share!).toBeGreaterThan(0);
    expect(c.top3Share!).toBeLessThanOrEqual(1);
    expect(c.hhi!).toBeGreaterThanOrEqual(1 / c.units - 1e-9);
  });
});

describe("geography areas", () => {
  it("computes plausible LGA areas for density", () => {
    expect(ds.lgaAreaKm2["epe"]).toBeGreaterThan(ds.lgaAreaKm2["lagos-island"]);
    for (const a of Object.values(ds.lgaAreaKm2)) expect(a).toBeGreaterThan(1);
    const total = Object.values(ds.lgaAreaKm2).reduce((s, a) => s + a, 0);
    expect(total).toBeGreaterThan(2500);
    expect(total).toBeLessThan(4500);
  });
});

export type _Keep = EnrichedOrder;
