import type { EnrichedOrder, OrderRecord } from "./types";

import { regionOfState } from "@/fixtures/geography/regions";
import { unitAt, type AdminUnit } from "@/lib/geo/geography";

/**
 * Spatial join: assigns each order to a state and geopolitical region by point-in-polygon against
 * the real state boundaries. Orders without coordinates stay unlocated and are counted separately
 * everywhere rather than silently dropped. LGAs are joined later, one state at a time.
 */
export function enrichOrders(
  orders: OrderRecord[],
  states: AdminUnit[],
): EnrichedOrder[] {
  return orders.map((o) => {
    const ts = Date.parse(o.placedAt);
    if (!o.location)
      return {
        ...o,
        ts,
        stateId: null,
        regionId: null,
        lgaId: null,
        geoStatus: "unlocated",
      };
    const state = unitAt(states, o.location.lng, o.location.lat);
    return {
      ...o,
      ts,
      stateId: state?.id ?? null,
      regionId: regionOfState(state?.id)?.id ?? null,
      lgaId: null,
      geoStatus: state ? "located" : "unlocated",
    };
  });
}

/** Joins the orders of one state to that state's LGAs. Other states' orders are returned untouched. */
export function assignLgas(
  orders: EnrichedOrder[],
  stateId: string,
  lgas: AdminUnit[],
): EnrichedOrder[] {
  return orders.map((o) => {
    if (o.stateId !== stateId || !o.location || o.lgaId) return o;
    return {
      ...o,
      lgaId: unitAt(lgas, o.location.lng, o.location.lat)?.id ?? null,
    };
  });
}

/** Reduces precision to about 1.1 km. Used for any view where exact locations must not be shown. */
export function generalise(p: { lng: number; lat: number }, decimals = 2) {
  const f = 10 ** decimals;
  return { lng: Math.round(p.lng * f) / f, lat: Math.round(p.lat * f) / f };
}
