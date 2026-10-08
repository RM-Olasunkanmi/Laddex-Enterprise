import { SAMPLE_ZONES, zoneForLga } from "@/fixtures/geography/zones";
import { unitAt, type AdminUnit } from "@/lib/geo/geography";

import type { LngLat, LocationResolution } from "./types";

/**
 * Resolve a point to LGA, (optionally) state, sample zone and coverage status using a spatial
 * join. `states` is only needed to name a state for points outside Lagos.
 */
export function resolveLocation(position: LngLat, lgas: AdminUnit[], states?: AdminUnit[] | null): LocationResolution {
  const lga = unitAt(lgas, position.lng, position.lat);
  if (lga) {
    const zone = zoneForLga(lga.id);
    return {
      position,
      lgaId: lga.id,
      lgaName: lga.name,
      stateId: "lagos",
      stateName: "Lagos",
      zoneId: zone?.id ?? null,
      zoneName: zone?.name ?? null,
      coverage: zone ? "sample-zone" : "outside-sample-zones",
    };
  }
  const state = states ? unitAt(states, position.lng, position.lat) : null;
  return {
    position,
    lgaId: null,
    lgaName: null,
    stateId: state?.id ?? null,
    stateName: state?.name ?? null,
    zoneId: null,
    zoneName: null,
    coverage: "outside-lagos",
  };
}

export { SAMPLE_ZONES };
