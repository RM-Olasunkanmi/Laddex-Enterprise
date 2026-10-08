import type { Position } from "./pip";

const R_KM = 6371.0088;
const rad = (d: number) => (d * Math.PI) / 180;

/**
 * Great-circle (haversine) distance in km between two [lng, lat] points in degrees.
 * This is a STRAIGHT-LINE distance. It is not road distance and must never be shown as
 * travel distance; use a routing service for that.
 */
export function straightLineKm(a: Position, b: Position): number {
  const dLat = rad(b[1] - a[1]);
  const dLng = rad(b[0] - a[0]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[1])) * Math.cos(rad(b[1])) * Math.sin(dLng / 2) ** 2;
  return 2 * R_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}
