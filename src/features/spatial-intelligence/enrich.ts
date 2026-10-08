import { SAMPLE_PICKUP_POINTS, zoneForLga } from "@/fixtures/geography/zones";
import { straightLineKm } from "@/lib/geo/distance";
import { unitAt, type AdminUnit } from "@/lib/geo/geography";

import type { EnrichedOrder, OrderRecord } from "./types";

/**
 * Spatial join: assigns each order to state, LGA and sample zone by point-in-polygon, and to
 * the nearest sample pickup point. Orders without coordinates stay unlocated and are counted
 * separately everywhere rather than silently dropped.
 */
export function enrichOrders(orders: OrderRecord[], lgas: AdminUnit[], states: AdminUnit[]): EnrichedOrder[] {
  return orders.map((o) => {
    const ts = Date.parse(o.placedAt);
    if (!o.location) {
      return { ...o, ts, stateId: null, lgaId: null, zoneId: null, geoStatus: "unlocated", nearestPickupId: null };
    }
    const { lng, lat } = o.location;
    const lga = unitAt(lgas, lng, lat);
    const state = lga ? "lagos" : (unitAt(states, lng, lat)?.id ?? null);
    let nearest: string | null = null;
    let best = Infinity;
    for (const p of SAMPLE_PICKUP_POINTS) {
      const d = straightLineKm([lng, lat], [p.position.lng, p.position.lat]);
      if (d < best) {
        best = d;
        nearest = p.id;
      }
    }
    return { ...o, ts, stateId: state, lgaId: lga?.id ?? null, zoneId: zoneForLga(lga?.id ?? null)?.id ?? null, geoStatus: "located", nearestPickupId: nearest };
  });
}

/** Reduces precision to about 1.1 km. Used for any view where exact locations must not be shown. */
export function generalise(p: { lng: number; lat: number }, decimals = 2) {
  const f = 10 ** decimals;
  return { lng: Math.round(p.lng * f) / f, lat: Math.round(p.lat * f) / f };
}
