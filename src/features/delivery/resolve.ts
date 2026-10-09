import type { LngLat, LocationResolution } from "./types";

import { REGIONS, regionOfState } from "@/fixtures/geography/regions";
import { unitAt, type AdminUnit } from "@/lib/geo/geography";

/**
 * Resolve a point to state, geopolitical region and (when that state's LGA file is supplied) LGA,
 * by spatial join against real boundaries. A point inside no state is outside Nigeria.
 */
export function resolveLocation(
  position: LngLat,
  states: AdminUnit[],
  lgas?: AdminUnit[] | null,
): LocationResolution {
  const state = unitAt(states, position.lng, position.lat);
  if (!state) {
    return {
      position,
      stateId: null,
      stateName: null,
      regionId: null,
      regionName: null,
      lgaId: null,
      lgaName: null,
      coverage: "outside-nigeria",
    };
  }
  const region = regionOfState(state.id);
  const lga = lgas ? unitAt(lgas, position.lng, position.lat) : null;
  return {
    position,
    stateId: state.id,
    stateName: state.name,
    regionId: region?.id ?? null,
    regionName: region?.name ?? null,
    lgaId: lga?.id ?? null,
    lgaName: lga?.name ?? null,
    coverage: "in-nigeria",
  };
}

export { REGIONS };
