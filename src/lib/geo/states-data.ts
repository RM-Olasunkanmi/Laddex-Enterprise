import { toAdminUnits, type AdminUnit, type RawCollection } from "./geography";
import lagosRaw from "../../../public/geo/lga/lagos.json";
import statesRaw from "../../../public/geo/ng-states.json";


/**
 * Boundary data for server-side spatial joins (API routes). Imported as
 * bundled JSON so it works on Cloudflare Workers, where reading from disk
 * is not available. Client maps keep loading per-state files over HTTP.
 */
let statesCache: AdminUnit[] | null = null;
let lagosCache: AdminUnit[] | null = null;

export function getStatesSync(): AdminUnit[] {
  statesCache ??= toAdminUnits(statesRaw as unknown as RawCollection);
  return statesCache;
}

/** Lagos LGAs only: enough to place Epe orders and the verified store. */
export function getLagosLgasSync(): AdminUnit[] {
  lagosCache ??= toAdminUnits(lagosRaw as unknown as RawCollection);
  return lagosCache;
}
