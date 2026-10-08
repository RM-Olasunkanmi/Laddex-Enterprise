import { DATASET_END, DATASET_START } from "@/fixtures/orders/generate";

import { OPEN_STATUSES, OUTSIDE_ZONES, UNASSIGNED, type DashboardFilters, type EnrichedOrder, type GeoScale, type GeoSelection } from "./types";

const DAY_MS = 86_400_000;
/** Lagos is UTC+1 all year. Dates are interpreted as Lagos calendar days. */
export const dayStartMs = (isoDate: string) => Date.parse(`${isoDate}T00:00:00+01:00`);
export const dayEndMs = (isoDate: string) => dayStartMs(isoDate) + DAY_MS - 1;
export const addDays = (isoDate: string, n: number) => new Date(dayStartMs(isoDate) + n * DAY_MS + 3_600_000).toISOString().slice(0, 10);
export const daysBetween = (from: string, to: string) => Math.round((dayStartMs(to) - dayStartMs(from)) / DAY_MS) + 1;

export const DEFAULT_FILTERS: DashboardFilters = {
  from: addDays(DATASET_END, -29),
  to: DATASET_END,
  categories: [],
  variantIds: [],
  segments: [],
  channels: [],
  statuses: [],
};

export interface PresetRange {
  id: string;
  label: string;
  from: string;
  to: string;
}
export const PRESET_RANGES: PresetRange[] = [
  { id: "7d", label: "Last 7 days", from: addDays(DATASET_END, -6), to: DATASET_END },
  { id: "30d", label: "Last 30 days", from: addDays(DATASET_END, -29), to: DATASET_END },
  { id: "90d", label: "Last 90 days", from: addDays(DATASET_END, -89), to: DATASET_END },
  { id: "all", label: "Whole dataset", from: DATASET_START, to: DATASET_END },
];

/** The immediately preceding period of equal length, for period-over-period change. */
export function previousPeriod(f: Pick<DashboardFilters, "from" | "to">): { from: string; to: string } {
  const len = daysBetween(f.from, f.to);
  return { from: addDays(f.from, -len), to: addDays(f.from, -1) };
}

const inList = <T,>(list: T[], v: T) => list.length === 0 || list.includes(v);

/** Non-geographic filters. Geography is applied separately so charts can show siblings for context. */
export function matchesFilters(o: EnrichedOrder, f: DashboardFilters, range?: { from: string; to: string }): boolean {
  const r = range ?? f;
  if (o.ts < dayStartMs(r.from) || o.ts > dayEndMs(r.to)) return false;
  if (!inList(f.segments, o.segment)) return false;
  if (!inList(f.channels, o.channel)) return false;
  if (!inList(f.statuses, o.status)) return false;
  if (f.categories.length || f.variantIds.length) {
    const hit = o.lines.some((l) => inList(f.categories, l.category) && inList(f.variantIds, l.variantId));
    if (!hit) return false;
  }
  return true;
}

/**
 * When a product filter is active, only the matching lines of an order count toward sales,
 * units and mix. `scopeLines` returns an order view with just those lines so every KPI,
 * chart and map symbol is computed from the same filtered facts.
 */
export function scopeToProducts(o: EnrichedOrder, f: DashboardFilters): EnrichedOrder {
  if (!f.categories.length && !f.variantIds.length) return o;
  const lines = o.lines.filter((l) => inList(f.categories, l.category) && inList(f.variantIds, l.variantId));
  if (lines.length === o.lines.length) return o;
  const goodsKobo = lines.reduce((s, l) => s + l.lineTotalKobo, 0);
  const share = o.goodsKobo > 0 ? goodsKobo / o.goodsKobo : 0;
  return { ...o, lines, goodsKobo, returnedKobo: Math.round(o.returnedKobo * share), deliveryFeeKobo: Math.round(o.deliveryFeeKobo * share) };
}

export function filterOrders(all: EnrichedOrder[], f: DashboardFilters, range?: { from: string; to: string }): EnrichedOrder[] {
  const out: EnrichedOrder[] = [];
  for (const o of all) if (matchesFilters(o, f, range)) out.push(scopeToProducts(o, f));
  return out;
}

export function unitKeyFor(o: EnrichedOrder, scale: GeoScale): string {
  switch (scale) {
    case "state":
      return o.stateId ?? UNASSIGNED;
    case "lga":
      return o.lgaId ?? UNASSIGNED;
    case "zone":
      return o.zoneId ?? (o.lgaId ? OUTSIDE_ZONES : UNASSIGNED);
    case "pickup":
      return o.fulfilment === "pickup" && o.pickupPointId ? o.pickupPointId : UNASSIGNED;
  }
}

/** Orders inside the selected geography. With no selected unit the whole extent is returned. */
export function applyGeoSelection(orders: EnrichedOrder[], sel: Pick<GeoSelection, "scale" | "unitId">): EnrichedOrder[] {
  if (!sel.unitId) return orders;
  return orders.filter((o) => unitKeyFor(o, sel.scale) === sel.unitId);
}

export const isOpen = (o: EnrichedOrder) => OPEN_STATUSES.includes(o.status);
