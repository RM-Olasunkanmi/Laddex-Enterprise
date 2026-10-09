import { addDays, dayStartMs, daysBetween, unitKeyFor } from "./filters";
import {
  SEGMENTS,
  type EnrichedOrder,
  type GeoScale,
  type Segment,
} from "./types";

import type { CategoryId } from "@/features/catalogue/types";

import { ALL_VARIANTS } from "@/fixtures/products/products";

const CATEGORIES: CategoryId[] = ["palm-oil", "tapioca", "garri"];
const zeroCat = (): Record<CategoryId, number> => ({
  "palm-oil": 0,
  tapioca: 0,
  garri: 0,
});
const zeroSeg = (): Record<Segment, number> => ({
  retail: 0,
  wholesale: 0,
  events: 0,
});

/** Safe division. Returns null (shown as an em dash) instead of NaN or Infinity. */
export const ratio = (n: number, d: number): number | null =>
  d > 0 && Number.isFinite(n / d) ? n / d : null;

export interface Kpis {
  /** Every order placed in scope, including cancelled. */
  ordersPlaced: number;
  cancelled: number;
  /** Orders that are not cancelled: the base for sales. */
  ordersActive: number;
  /** Value of goods on non-cancelled orders. Excludes delivery fees. */
  grossKobo: number;
  returnedKobo: number;
  /** Gross less value of goods returned. */
  netKobo: number;
  deliveryFeesKobo: number;
  /** Gross goods divided by non-cancelled orders. */
  aovKobo: number | null;
  packs: number;
  litres: number;
  kilograms: number;
  shareByCategory: Record<CategoryId, number | null>;
  shareBySegment: Record<Segment, number | null>;
  grossByCategory: Record<CategoryId, number>;
  grossBySegment: Record<Segment, number>;
  /** Delivered divided by closed orders (delivered, cancelled, returned). Open orders are excluded. */
  fulfilmentRate: number | null;
  closedOrders: number;
  customers: number;
  /** Customers with two or more non-cancelled orders in the period, over customers with at least one. */
  repeatRate: number | null;
  unlocated: number;
}

const isCancelled = (o: EnrichedOrder) => o.status === "cancelled";

export function computeKpis(orders: EnrichedOrder[]): Kpis {
  let cancelled = 0;
  let grossKobo = 0;
  let returnedKobo = 0;
  let deliveryFeesKobo = 0;
  let packs = 0;
  let litres = 0;
  let kilograms = 0;
  let delivered = 0;
  let closed = 0;
  let unlocated = 0;
  const grossByCategory = zeroCat();
  const grossBySegment = zeroSeg();
  const perCustomer = new Map<string, number>();

  for (const o of orders) {
    if (o.geoStatus === "unlocated") unlocated++;
    if (isCancelled(o)) {
      cancelled++;
      closed++;
      continue;
    }
    grossKobo += o.goodsKobo;
    returnedKobo += o.returnedKobo;
    deliveryFeesKobo += o.deliveryFeeKobo;
    grossBySegment[o.segment] += o.goodsKobo;
    perCustomer.set(o.customerId, (perCustomer.get(o.customerId) ?? 0) + 1);
    for (const l of o.lines) {
      packs += l.qty;
      grossByCategory[l.category] += l.lineTotalKobo;
      if (l.category === "palm-oil") litres += l.baseUnits;
      else kilograms += l.baseUnits;
    }
    if (o.status === "delivered") {
      delivered++;
      closed++;
    } else if (o.status === "returned") closed++;
  }
  const ordersActive = orders.length - cancelled;
  let repeat = 0;
  for (const n of perCustomer.values()) if (n >= 2) repeat++;
  return {
    ordersPlaced: orders.length,
    cancelled,
    ordersActive,
    grossKobo,
    returnedKobo,
    netKobo: grossKobo - returnedKobo,
    deliveryFeesKobo,
    aovKobo:
      ratio(grossKobo, ordersActive) === null
        ? null
        : Math.round(grossKobo / ordersActive),
    packs,
    litres: Math.round(litres * 100) / 100,
    kilograms: Math.round(kilograms * 100) / 100,
    grossByCategory,
    grossBySegment,
    shareByCategory: Object.fromEntries(
      CATEGORIES.map((c) => [c, ratio(grossByCategory[c], grossKobo)]),
    ) as Record<CategoryId, number | null>,
    shareBySegment: Object.fromEntries(
      SEGMENTS.map((g) => [g, ratio(grossBySegment[g], grossKobo)]),
    ) as Record<Segment, number | null>,
    fulfilmentRate: ratio(delivered, closed),
    closedOrders: closed,
    customers: perCustomer.size,
    repeatRate: ratio(repeat, perCustomer.size),
    unlocated,
  };
}

/** Period-over-period change as a ratio (0.12 = +12%). Null when the prior value is zero or missing. */
export function change(
  current: number | null,
  previous: number | null,
): number | null {
  if (current === null || previous === null || previous === 0) return null;
  return (current - previous) / previous;
}

export interface UnitStat {
  id: string;
  ordersPlaced: number;
  ordersActive: number;
  grossKobo: number;
  netKobo: number;
  packs: number;
  bySegment: Record<Segment, number>;
  byCategory: Record<CategoryId, number>;
  aovKobo: number | null;
  fulfilmentRate: number | null;
  medianDeliveryFeeKobo: number | null;
  /** Gross sales of the previous equal-length period, filled by the dashboard for growth maps. */
  prevGrossKobo?: number;
}

/** Aggregates the same filtered orders by geographic unit. Unassigned orders get their own row so totals reconcile. */
export function aggregateByUnit(
  orders: EnrichedOrder[],
  scale: GeoScale,
): Map<string, UnitStat> {
  const groups = new Map<string, EnrichedOrder[]>();
  for (const o of orders) {
    const k = unitKeyFor(o, scale);
    const g = groups.get(k);
    if (g) g.push(o);
    else groups.set(k, [o]);
  }
  const out = new Map<string, UnitStat>();
  for (const [id, list] of groups) {
    const k = computeKpis(list);
    out.set(id, {
      id,
      ordersPlaced: k.ordersPlaced,
      ordersActive: k.ordersActive,
      grossKobo: k.grossKobo,
      netKobo: k.netKobo,
      packs: k.packs,
      bySegment: k.grossBySegment,
      byCategory: k.grossByCategory,
      aovKobo: k.aovKobo,
      fulfilmentRate: k.fulfilmentRate,
      medianDeliveryFeeKobo: median(
        list
          .filter((o) => o.status !== "cancelled")
          .map((o) => o.deliveryFeeKobo),
      ),
    });
  }
  return out;
}

export function median(values: number[]): number | null {
  if (!values.length) return null;
  const s = [...values].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
}

export function percentile(values: number[], p: number): number | null {
  if (!values.length) return null;
  const s = [...values].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.max(0, Math.ceil(p * s.length) - 1))];
}

/**
 * Geographic concentration of demand across units: share held by the largest three, and the
 * Herfindahl-Hirschman index (sum of squared shares, 1/n for even spread, 1 for a single unit).
 * Unassigned orders are excluded because they have no place.
 */
export function concentration(stats: UnitStat[]): {
  top3Share: number | null;
  hhi: number | null;
  units: number;
} {
  const placed = stats.filter((s) => s.grossKobo > 0);
  const total = placed.reduce((s, u) => s + u.grossKobo, 0);
  if (total <= 0) return { top3Share: null, hhi: null, units: 0 };
  const shares = placed.map((u) => u.grossKobo / total).sort((a, b) => b - a);
  return {
    top3Share: shares.slice(0, 3).reduce((s, v) => s + v, 0),
    hhi: shares.reduce((s, v) => s + v * v, 0),
    units: placed.length,
  };
}

export interface SeriesPoint {
  /** Start of the bucket, ISO date. */
  date: string;
  grossKobo: number;
  orders: number;
}

export type Bucket = "day" | "week";
export const bucketFor = (days: number): Bucket => (days > 45 ? "week" : "day");

/** Gross sales per bucket. Buckets are anchored to the range start so a prior period lines up index by index. */
export function timeSeries(
  orders: EnrichedOrder[],
  range: { from: string; to: string },
  bucket: Bucket,
): SeriesPoint[] {
  const step = bucket === "day" ? 1 : 7;
  const days = daysBetween(range.from, range.to);
  const n = Math.ceil(days / step);
  const points: SeriesPoint[] = Array.from({ length: n }, (_, i) => ({
    date: addDays(range.from, i * step),
    grossKobo: 0,
    orders: 0,
  }));
  const t0 = dayStartMs(range.from);
  for (const o of orders) {
    if (o.status === "cancelled") continue;
    const i = Math.floor((o.ts - t0) / (86_400_000 * step));
    if (i >= 0 && i < n) {
      points[i].grossKobo += o.goodsKobo;
      points[i].orders += 1;
    }
  }
  return points;
}

export interface VariantStat {
  variantId: string;
  segment: Segment | "all";
  packs: number;
  grossKobo: number;
  /** Packs per day over the period. */
  velocity: number | null;
}

export function variantStats(
  orders: EnrichedOrder[],
  days: number,
): VariantStat[] {
  const m = new Map<string, { packs: number; gross: number }>();
  for (const o of orders) {
    if (o.status === "cancelled") continue;
    for (const l of o.lines) {
      const e = m.get(l.variantId) ?? { packs: 0, gross: 0 };
      e.packs += l.qty;
      e.gross += l.lineTotalKobo;
      m.set(l.variantId, e);
    }
  }
  return ALL_VARIANTS.map((v) => {
    const e = m.get(v.id) ?? { packs: 0, gross: 0 };
    return {
      variantId: v.id,
      segment: "all" as const,
      packs: e.packs,
      grossKobo: e.gross,
      velocity: ratio(e.packs, days),
    };
  });
}

/** Gross by variant and buyer segment, for the mix chart. */
export function mixByVariant(
  orders: EnrichedOrder[],
): { variantId: string; bySegment: Record<Segment, number> }[] {
  const m = new Map<string, Record<Segment, number>>();
  for (const o of orders) {
    if (o.status === "cancelled") continue;
    for (const l of o.lines) {
      const e = m.get(l.variantId) ?? zeroSeg();
      e[o.segment] += l.lineTotalKobo;
      m.set(l.variantId, e);
    }
  }
  return ALL_VARIANTS.map((v) => ({
    variantId: v.id,
    bySegment: m.get(v.id) ?? zeroSeg(),
  }));
}

export interface Histogram {
  bins: { from: number; to: number; count: number }[];
  n: number;
  median: number | null;
  p90: number | null;
}

/** Delivery fee distribution for non-cancelled delivery orders, in fixed-width bins. */
export function deliveryFeeHistogram(
  orders: EnrichedOrder[],
  binKobo = 500_000,
  maxBins = 14,
): Histogram {
  const fees = orders
    .filter((o) => o.status !== "cancelled")
    .map((o) => o.deliveryFeeKobo);
  if (!fees.length) return { bins: [], n: 0, median: null, p90: null };
  const maxFee = Math.max(...fees);
  const nBins = Math.min(
    maxBins,
    Math.max(1, Math.ceil((maxFee + 1) / binKobo)),
  );
  const bins = Array.from({ length: nBins }, (_, i) => ({
    from: i * binKobo,
    to: (i + 1) * binKobo,
    count: 0,
  }));
  for (const f of fees)
    bins[Math.min(nBins - 1, Math.floor(f / binKobo))].count++;
  return {
    bins,
    n: fees.length,
    median: median(fees),
    p90: percentile(fees, 0.9),
  };
}

export interface Reach {
  statesReached: number;
  regionsReached: number;
  totalStates: number;
  unlocated: number;
  total: number;
}

/** How widely demand is spread: states and regions with at least one non-cancelled order. */
export function reach(orders: EnrichedOrder[], totalStates = 37): Reach {
  const states = new Set<string>();
  const regions = new Set<string>();
  let unlocated = 0;
  let total = 0;
  for (const o of orders) {
    if (o.status === "cancelled") continue;
    total++;
    if (o.geoStatus === "unlocated" || !o.stateId) unlocated++;
    else {
      states.add(o.stateId);
      if (o.regionId) regions.add(o.regionId);
    }
  }
  return {
    statesReached: states.size,
    regionsReached: regions.size,
    totalStates,
    unlocated,
    total,
  };
}

export interface MatrixCell {
  regionId: string;
  month: string;
  grossKobo: number;
}

/** Gross sales by region and calendar month (Africa/Lagos). Months are returned in order. */
export function regionMonthMatrix(orders: EnrichedOrder[]): {
  months: string[];
  cells: MatrixCell[];
} {
  const m = new Map<string, number>();
  const months = new Set<string>();
  for (const o of orders) {
    if (o.status === "cancelled" || !o.regionId) continue;
    const month = new Date(o.ts + 3_600_000).toISOString().slice(0, 7);
    months.add(month);
    const k = `${o.regionId}|${month}`;
    m.set(k, (m.get(k) ?? 0) + o.goodsKobo);
  }
  const sorted = [...months].sort();
  const cells: MatrixCell[] = [];
  for (const [k, v] of m) {
    const [regionId, month] = k.split("|");
    cells.push({ regionId, month, grossKobo: v });
  }
  return { months: sorted, cells };
}
