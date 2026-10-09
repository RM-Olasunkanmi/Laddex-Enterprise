import { enrichOrders } from "./enrich";

import type { EnrichedOrder } from "./types";

import { generateSyntheticOrders } from "@/fixtures/orders/generate";
import { geometryAreaKm2 } from "@/lib/geo/area";
import { loadStates, type AdminUnit } from "@/lib/geo/geography";

export interface DashboardDataset {
  orders: EnrichedOrder[];
  states: AdminUnit[];
  /** Area in km² by state id, for density measures. */
  stateAreaKm2: Record<string, number>;
  /** "synthetic-fixtures" until a real authenticated orders API is connected. */
  source: "synthetic-fixtures" | "api";
}

/**
 * Replaceable boundary for dashboard data. A production adapter returns enriched orders from an
 * authenticated API (with the spatial join done in PostGIS) and the same shape here.
 */
export interface DashboardDataService {
  load(): Promise<DashboardDataset>;
}

export function buildDataset(states: AdminUnit[]): DashboardDataset {
  return {
    orders: enrichOrders(generateSyntheticOrders({ states }), states),
    states,
    stateAreaKm2: Object.fromEntries(
      states.map((s) => [s.id, geometryAreaKm2(s.geometry)]),
    ),
    source: "synthetic-fixtures",
  };
}

let cached: Promise<DashboardDataset> | null = null;

export const fixtureDashboardData: DashboardDataService = {
  load() {
    cached ??= loadStates()
      .then(buildDataset)
      .catch((e) => {
        cached = null;
        throw e;
      });
    return cached;
  },
};
