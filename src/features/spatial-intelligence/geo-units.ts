import { OUTSIDE_ZONES, UNASSIGNED, type GeoScale } from "./types";

import type { DashboardDataset } from "./dataset";
import type { BBox } from "@/lib/geo/pip";

import { SAMPLE_PICKUP_POINTS, SAMPLE_ZONES } from "@/fixtures/geography/zones";
import { geometryAreaKm2 } from "@/lib/geo/area";
import { geometryCentroid } from "@/lib/geo/pip";

export interface GeoUnit {
  id: string;
  name: string;
  scale: GeoScale;
  /** Representative point [lng, lat] for symbols and focus. */
  centroid: [number, number];
  bbox: BBox | null;
  areaKm2: number | null;
  /** Parent label such as the zone or state, for context. */
  detail?: string;
}

const LAGOS_ONLY_STATES = new Set(["lagos", "ogun"]);

/** Builds the selectable units at a scale from the loaded boundaries. Pure and cheap (20 LGAs). */
export function unitsAt(scale: GeoScale, ds: DashboardDataset): GeoUnit[] {
  switch (scale) {
    case "lga":
      return ds.lgas.map((l) => ({
        id: l.id,
        name: l.name,
        scale,
        centroid: geometryCentroid(l.geometry),
        bbox: l.bbox,
        areaKm2: ds.lgaAreaKm2[l.id] ?? null,
        detail: SAMPLE_ZONES.find((z) => z.lgaIds.includes(l.id))?.short,
      }));
    case "state":
      return ds.states
        .filter((s) => LAGOS_ONLY_STATES.has(s.id))
        .map((s) => ({
          id: s.id,
          name: s.name,
          scale,
          centroid: geometryCentroid(s.geometry),
          bbox: s.bbox,
          areaKm2: geometryAreaKm2(s.geometry),
        }));
    case "zone":
      return [
        ...SAMPLE_ZONES.map((z) => {
          const members = ds.lgas.filter((l) => z.lgaIds.includes(l.id));
          const bb = members.reduce<BBox>(
            (b, m) => [
              Math.min(b[0], m.bbox[0]),
              Math.min(b[1], m.bbox[1]),
              Math.max(b[2], m.bbox[2]),
              Math.max(b[3], m.bbox[3]),
            ],
            [Infinity, Infinity, -Infinity, -Infinity],
          );
          const biggest = members
            .slice()
            .sort(
              (a, b) => (ds.lgaAreaKm2[b.id] ?? 0) - (ds.lgaAreaKm2[a.id] ?? 0),
            )[0];
          return {
            id: z.id,
            name: z.name.replace("Sample zone ", "Zone "),
            scale,
            centroid: geometryCentroid(biggest.geometry),
            bbox: bb,
            areaKm2: members.reduce(
              (s, m) => s + (ds.lgaAreaKm2[m.id] ?? 0),
              0,
            ),
            detail: `${members.length} LGAs`,
          } satisfies GeoUnit;
        }),
        (() => {
          const members = ds.lgas.filter(
            (l) => !SAMPLE_ZONES.some((z) => z.lgaIds.includes(l.id)),
          );
          const bb = members.reduce<BBox>(
            (b, m) => [
              Math.min(b[0], m.bbox[0]),
              Math.min(b[1], m.bbox[1]),
              Math.max(b[2], m.bbox[2]),
              Math.max(b[3], m.bbox[3]),
            ],
            [Infinity, Infinity, -Infinity, -Infinity],
          );
          return {
            id: OUTSIDE_ZONES,
            name: "Lagos, outside sample zones",
            scale,
            centroid: [3.62, 6.52] as [number, number],
            bbox: bb,
            areaKm2: members.reduce(
              (s, m) => s + (ds.lgaAreaKm2[m.id] ?? 0),
              0,
            ),
            detail: `${members.length} LGAs`,
          } satisfies GeoUnit;
        })(),
      ];
    case "pickup":
      return SAMPLE_PICKUP_POINTS.map((p) => ({
        id: p.id,
        name: p.name.replace("Sample point: ", "Pickup: "),
        scale,
        centroid: [p.position.lng, p.position.lat],
        bbox: null,
        areaKm2: null,
      }));
  }
}

export const UNASSIGNED_LABEL = "No usable location";

export function unitName(units: GeoUnit[], id: string): string {
  if (id === UNASSIGNED) return UNASSIGNED_LABEL;
  return units.find((u) => u.id === id)?.name ?? id;
}

export function unitBBox(
  units: GeoUnit[],
  id: string | null,
): [[number, number], [number, number]] | null {
  const u = id ? units.find((x) => x.id === id) : null;
  if (!u) return null;
  if (u.bbox)
    return [
      [u.bbox[0], u.bbox[1]],
      [u.bbox[2], u.bbox[3]],
    ];
  const [x, y] = u.centroid;
  return [
    [x - 0.04, y - 0.04],
    [x + 0.04, y + 0.04],
  ];
}

const FULL_LAGOS: [[number, number], [number, number]] = [
  [2.69, 6.37],
  [4.38, 6.71],
];
/** Densest part of the state (Ojo to Ikorodu and Eti-Osa). Used when the map is too narrow for the full strip. */
const METRO_LAGOS: [[number, number], [number, number]] = [
  [3.0, 6.36],
  [3.64, 6.72],
];

/** Default extent for a scale. Lagos is a wide, thin strip, so narrow containers get the metro view. */
export function extentFor(
  scale: GeoScale,
  aspect = 3,
): [[number, number], [number, number]] {
  if (scale === "state")
    return [
      [2.6, 6.1],
      [4.7, 7.9],
    ];
  return aspect < 2 ? METRO_LAGOS : FULL_LAGOS;
}
