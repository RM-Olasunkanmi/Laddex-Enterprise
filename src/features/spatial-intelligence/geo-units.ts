import { UNASSIGNED, type GeoScale } from "./types";

import type { DashboardDataset } from "./dataset";
import type { AdminUnit } from "@/lib/geo/geography";
import type { BBox } from "@/lib/geo/pip";

import { REGIONS } from "@/fixtures/geography/regions";
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
  /** Parent label such as the region or state, for context. */
  detail?: string;
}

const union = (boxes: BBox[]): BBox =>
  boxes.reduce<BBox>(
    (b, m) => [
      Math.min(b[0], m[0]),
      Math.min(b[1], m[1]),
      Math.max(b[2], m[2]),
      Math.max(b[3], m[3]),
    ],
    [Infinity, Infinity, -Infinity, -Infinity],
  );

/** Builds the selectable units at a scale. States and regions are always available; LGAs need the chosen state's file. */
export function unitsAt(
  scale: GeoScale,
  ds: DashboardDataset,
  lgas?: AdminUnit[] | null,
): GeoUnit[] {
  switch (scale) {
    case "state":
      return ds.states.map((s) => ({
        id: s.id,
        name: s.name,
        scale,
        centroid: geometryCentroid(s.geometry),
        bbox: s.bbox,
        areaKm2: ds.stateAreaKm2[s.id] ?? null,
        detail: REGIONS.find((r) => r.stateIds.includes(s.id))?.name,
      }));
    case "region":
      return REGIONS.map((r) => {
        const members = ds.states.filter((s) => r.stateIds.includes(s.id));
        const centroids = members.map((m) => geometryCentroid(m.geometry));
        return {
          id: r.id,
          name: r.name,
          scale,
          centroid: [
            centroids.reduce((a, c) => a + c[0], 0) / centroids.length,
            centroids.reduce((a, c) => a + c[1], 0) / centroids.length,
          ] as [number, number],
          bbox: union(members.map((m) => m.bbox)),
          areaKm2: members.reduce(
            (s, m) => s + (ds.stateAreaKm2[m.id] ?? 0),
            0,
          ),
          detail: `${members.length} states`,
        };
      });
    case "lga":
      return (lgas ?? []).map((l) => ({
        id: l.id,
        name: l.name,
        scale,
        centroid: geometryCentroid(l.geometry),
        bbox: l.bbox,
        areaKm2: l.areaKm2 ?? geometryAreaKm2(l.geometry),
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
    [x - 0.1, y - 0.1],
    [x + 0.1, y + 0.1],
  ];
}

export const NIGERIA_EXTENT: [[number, number], [number, number]] = [
  [2.6, 4.2],
  [14.8, 13.95],
];
export const extentFor = (): [[number, number], [number, number]] =>
  NIGERIA_EXTENT;
