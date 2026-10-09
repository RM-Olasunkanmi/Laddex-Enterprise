import { bboxContains, geometryBBox, geometryContains, type BBox, type PolygonalGeometry } from "./pip";

export type AdminLevel = "state" | "lga";

export interface AdminUnit {
  id: string;
  name: string;
  level: AdminLevel;
  stateId?: string;
  geometry: PolygonalGeometry;
  bbox: BBox;
  /** Land area in km², when the source file carries it (LGAs). */
  areaKm2?: number;
}

interface RawFeature {
  id?: string | number;
  properties: { id: string; name: string; level: AdminLevel; stateId?: string; areaKm2?: number };
  geometry: PolygonalGeometry;
}
export interface RawCollection {
  type: "FeatureCollection";
  features: RawFeature[];
}

export function toAdminUnits(fc: RawCollection): AdminUnit[] {
  return fc.features.map((f) => ({
    id: f.properties.id,
    name: f.properties.name,
    level: f.properties.level,
    stateId: f.properties.stateId,
    geometry: f.geometry,
    bbox: geometryBBox(f.geometry),
    areaKm2: f.properties.areaKm2,
  }));
}

/** Spatial join of a point to the administrative unit that contains it (bbox pre-filter, then PIP). */
export function unitAt(units: AdminUnit[], lng: number, lat: number): AdminUnit | null {
  for (const u of units) {
    if (bboxContains(u.bbox, lng, lat) && geometryContains(u.geometry, lng, lat)) return u;
  }
  return null;
}

export function toFeatureCollection(units: AdminUnit[], extra?: (u: AdminUnit) => Record<string, unknown>) {
  return {
    type: "FeatureCollection" as const,
    features: units.map((u) => ({
      type: "Feature" as const,
      id: u.id,
      properties: { id: u.id, name: u.name, level: u.level, ...(extra ? extra(u) : {}) },
      geometry: u.geometry,
    })),
  };
}

export const NIGERIA_BOUNDS: [[number, number], [number, number]] = [[2.6, 4.2], [14.8, 13.95]];

async function loadJson<T>(path: string): Promise<T> {
  const res = await fetch(path, { cache: "force-cache" });
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  return (await res.json()) as T;
}

let statePromise: Promise<AdminUnit[]> | null = null;
const lgaPromises = new Map<string, Promise<AdminUnit[]>>();

/** About 285 KB: the 37 state outlines. Loaded once and cached. */
export function loadStates(): Promise<AdminUnit[]> {
  statePromise ??= loadJson<RawCollection>("/geo/ng-states.json")
    .then(toAdminUnits)
    .catch((e) => {
      statePromise = null;
      throw e;
    });
  return statePromise;
}

/**
 * The LGAs of ONE state (20 to 260 KB each). The 774 national LGAs are never loaded together:
 * a state's file is requested only when that state is selected or a pin lands in it.
 */
export function loadStateLgas(stateId: string): Promise<AdminUnit[]> {
  let p = lgaPromises.get(stateId);
  if (!p) {
    p = loadJson<RawCollection>(`/geo/lga/${stateId}.json`)
      .then(toAdminUnits)
      .catch((e) => {
        lgaPromises.delete(stateId);
        throw e;
      });
    lgaPromises.set(stateId, p);
  }
  return p;
}

export interface GeoSourcesMeta {
  states: Record<string, string | number>;
  lgas: Record<string, string | number>;
  attribution: string;
}
export const loadSourcesMeta = () => loadJson<GeoSourcesMeta>("/geo/sources.json");
