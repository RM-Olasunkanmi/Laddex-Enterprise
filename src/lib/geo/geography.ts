import {
  bboxContains,
  geometryBBox,
  geometryContains,
  type BBox,
  type PolygonalGeometry,
} from "./pip";

export type AdminLevel = "state" | "lga";

export interface AdminUnit {
  id: string;
  name: string;
  level: AdminLevel;
  stateId?: string;
  geometry: PolygonalGeometry;
  bbox: BBox;
}

interface RawFeature {
  id?: string | number;
  properties: { id: string; name: string; level: AdminLevel; stateId?: string };
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
  }));
}

/** Spatial join of a point to the administrative unit that contains it (bbox pre-filter, then PIP). */
export function unitAt(
  units: AdminUnit[],
  lng: number,
  lat: number,
): AdminUnit | null {
  for (const u of units) {
    if (
      bboxContains(u.bbox, lng, lat) &&
      geometryContains(u.geometry, lng, lat)
    )
      return u;
  }
  return null;
}

export interface GeographySource {
  lgas: AdminUnit[];
  /** Loaded on demand: the national state file is only needed for state-level views. */
  states: AdminUnit[] | null;
}

export function toFeatureCollection(
  units: AdminUnit[],
  extra?: (u: AdminUnit) => Record<string, unknown>,
) {
  return {
    type: "FeatureCollection" as const,
    features: units.map((u) => ({
      type: "Feature" as const,
      id: u.id,
      properties: {
        id: u.id,
        name: u.name,
        level: u.level,
        ...(extra ? extra(u) : {}),
      },
      geometry: u.geometry,
    })),
  };
}

export const LAGOS_VIEW = {
  center: [3.4, 6.53] as [number, number],
  zoom: 9.2,
};
export const LAGOS_BOUNDS: [[number, number], [number, number]] = [
  [2.69, 6.37],
  [4.38, 6.71],
];

async function loadJson<T>(path: string, base?: string): Promise<T> {
  const url = base ? new URL(path, base).toString() : path;
  const res = await fetch(url, { cache: "force-cache" });
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  return (await res.json()) as T;
}

let lgaPromise: Promise<AdminUnit[]> | null = null;
let statePromise: Promise<AdminUnit[]> | null = null;

/** About 87 KB. Lagos only: the whole country is never loaded for a Lagos view. */
export function loadLagosLgas(): Promise<AdminUnit[]> {
  lgaPromise ??= loadJson<RawCollection>("/geo/lagos-lgas.json")
    .then(toAdminUnits)
    .catch((e) => {
      lgaPromise = null;
      throw e;
    });
  return lgaPromise;
}

/** About 285 KB. Requested only when a state-level view or an out-of-Lagos pin needs it. */
export function loadStates(): Promise<AdminUnit[]> {
  statePromise ??= loadJson<RawCollection>("/geo/ng-states.json")
    .then(toAdminUnits)
    .catch((e) => {
      statePromise = null;
      throw e;
    });
  return statePromise;
}

export interface GeoSourcesMeta {
  states: Record<string, string | number>;
  lgas: Record<string, string | number>;
  attribution: string;
}
export const loadSourcesMeta = () =>
  loadJson<GeoSourcesMeta>("/geo/sources.json");
