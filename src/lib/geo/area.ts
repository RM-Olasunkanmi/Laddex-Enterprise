import type { PolygonalGeometry, Ring } from "./pip";

const KM_PER_DEG_LAT = 111.32;

/** Planar shoelace area of a ring after a local equirectangular projection (km²). Accurate to well under 1% at LGA scale. */
function ringAreaKm2(ring: Ring): number {
  if (ring.length < 4) return 0;
  const lat0 = ring.reduce((s, p) => s + p[1], 0) / ring.length;
  const kx = KM_PER_DEG_LAT * Math.cos((lat0 * Math.PI) / 180);
  let a = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    a += ring[j][0] * kx * (ring[i][1] * KM_PER_DEG_LAT) - ring[i][0] * kx * (ring[j][1] * KM_PER_DEG_LAT);
  }
  return Math.abs(a) / 2;
}

export function geometryAreaKm2(g: PolygonalGeometry): number {
  const polys = g.type === "Polygon" ? [g.coordinates] : g.coordinates;
  return polys.reduce((sum, poly) => sum + poly.reduce((s, ring, i) => s + (i === 0 ? ringAreaKm2(ring) : -ringAreaKm2(ring)), 0), 0);
}
