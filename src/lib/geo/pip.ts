/**
 * Point-in-polygon for GeoJSON Polygon / MultiPolygon in WGS84 (EPSG:4326).
 * Coordinates are [longitude, latitude] in decimal degrees. No projection is applied:
 * ray casting is topological, so it is valid in geographic coordinates.
 */
export type Position = [number, number];
export type Ring = Position[];
export type PolygonCoords = Ring[];
export type PolygonalGeometry =
  | { type: "Polygon"; coordinates: PolygonCoords }
  | { type: "MultiPolygon"; coordinates: PolygonCoords[] };

export type BBox = [
  minLng: number,
  minLat: number,
  maxLng: number,
  maxLat: number,
];

export function ringContains(ring: Ring, lng: number, lat: number): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi
    ) {
      inside = !inside;
    }
  }
  return inside;
}

/** First ring is the outer boundary, remaining rings are holes. */
export function polygonContains(
  poly: PolygonCoords,
  lng: number,
  lat: number,
): boolean {
  if (poly.length === 0 || !ringContains(poly[0], lng, lat)) return false;
  for (let k = 1; k < poly.length; k++) {
    if (ringContains(poly[k], lng, lat)) return false;
  }
  return true;
}

export function geometryContains(
  g: PolygonalGeometry,
  lng: number,
  lat: number,
): boolean {
  if (g.type === "Polygon") return polygonContains(g.coordinates, lng, lat);
  return g.coordinates.some((p) => polygonContains(p, lng, lat));
}

export function geometryBBox(g: PolygonalGeometry): BBox {
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;
  const polys = g.type === "Polygon" ? [g.coordinates] : g.coordinates;
  for (const poly of polys) {
    for (const [x, y] of poly[0]) {
      if (x < minLng) minLng = x;
      if (x > maxLng) maxLng = x;
      if (y < minLat) minLat = y;
      if (y > maxLat) maxLat = y;
    }
  }
  return [minLng, minLat, maxLng, maxLat];
}

export function bboxContains(b: BBox, lng: number, lat: number): boolean {
  return lng >= b[0] && lng <= b[2] && lat >= b[1] && lat <= b[3];
}

export function isValidLngLat(lng: unknown, lat: unknown): lng is number {
  return (
    typeof lng === "number" &&
    typeof lat === "number" &&
    Number.isFinite(lng) &&
    Number.isFinite(lat) &&
    lng >= -180 &&
    lng <= 180 &&
    lat >= -90 &&
    lat <= 90
  );
}

/** Ring-area centroid of the largest polygon: a representative point for labels. */
export function geometryCentroid(g: PolygonalGeometry): Position {
  const polys = g.type === "Polygon" ? [g.coordinates] : g.coordinates;
  let best: { area: number; c: Position } = { area: -1, c: [0, 0] };
  for (const poly of polys) {
    const ring = poly[0];
    let a = 0;
    let cx = 0;
    let cy = 0;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const f = ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
      a += f;
      cx += (ring[j][0] + ring[i][0]) * f;
      cy += (ring[j][1] + ring[i][1]) * f;
    }
    const area = Math.abs(a / 2);
    if (area > best.area && a !== 0)
      best = { area, c: [cx / (3 * a), cy / (3 * a)] };
  }
  return best.c;
}
