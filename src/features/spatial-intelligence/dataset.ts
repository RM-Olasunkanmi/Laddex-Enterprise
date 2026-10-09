import { enrichOrders } from "./enrich";

import type { EnrichedOrder } from "./types";

import { generateSyntheticOrders } from "@/fixtures/orders/generate";
import { geometryAreaKm2 } from "@/lib/geo/area";
import { loadLagosLgas, loadStates, type AdminUnit } from "@/lib/geo/geography";

export interface DashboardDataset {
  orders: EnrichedOrder[];
  lgas: AdminUnit[];
  states: AdminUnit[];
  /** Area in km² by LGA id, for density measures. */
  lgaAreaKm2: Record<string, number>;
  /** "synthetic-fixtures" until a real authenticated orders API is connected. */
  source: "synthetic-fixtures" | "api";
}

/**
 * Replaceable boundary for dashboard data. A production adapter returns enriched orders from
 * an authenticated API (with the spatial join done in PostGIS) and the same shape here.
 */
export interface DashboardDataService {
  load(): Promise<DashboardDataset>;
}

export function buildDataset(
  lgas: AdminUnit[],
  states: AdminUnit[],
): DashboardDataset {
  const orders = enrichOrders(
    generateSyntheticOrders({ lgas, states }),
    lgas,
    states,
  );
  return {
    orders,
    lgas,
    states,
    lgaAreaKm2: Object.fromEntries(
      lgas.map((l) => [l.id, geometryAreaKm2(l.geometry)]),
    ),
    source: "synthetic-fixtures",
  };
}

let cached: Promise<DashboardDataset> | null = null;

export const fixtureDashboardData: DashboardDataService = {
  load() {
    cached ??= Promise.all([loadLagosLgas(), loadStates()])
      .then(([lgas, states]) => buildDataset(lgas, states))
      .catch((e) => {
        cached = null;
        throw e;
      });
    return cached;
  },
};
