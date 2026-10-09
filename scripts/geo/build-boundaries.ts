/**
 * Builds the boundary files the browser loads, nationwide but never all at once.
 *   pnpm exec tsx scripts/geo/build-boundaries.ts <dir-with-raw-geojson>
 * The directory holds, from geoBoundaries gbOpen (upstream GRID3, CC BY 4.0):
 *   NGA-ADM1.geojson (simplified states), NGA-ADM1-full.geojson, NGA-ADM2-full.geojson,
 *   NGA-ADM1-meta.json, NGA-ADM2-meta.json.
 *
 * Output:
 *   public/geo/ng-states.json            37 states, simplified (national map, state lookup)
 *   public/geo/lga/<state-id>.json       the LGAs of one state, full resolution, quantised
 *   public/geo/sources.json              provider, release, licence, CRS, counts
 *   src/lib/geo/ng-sketch.generated.ts   tiny SVG outline of Nigeria for the homepage
 *
 * ADM2 carries no parent attribute, so each LGA is assigned to a state by testing its
 * representative point against the full-resolution state polygons (a spatial join). LGAs whose
 * point falls just outside every polygon (coast) go to the nearest state centroid.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { STATE_NAME_OVERRIDE } from "../../src/fixtures/geography/regions";
import { geometryAreaKm2 } from "../../src/lib/geo/area";
import { geometryBBox, geometryCentroid, geometryContains, type PolygonalGeometry } from "../../src/lib/geo/pip";

type Feature = { type: "Feature"; properties: Record<string, string>; geometry: PolygonalGeometry };
type Collection = { type: "FeatureCollection"; features: Feature[] };

const dir = process.argv[2];
if (!dir) throw new Error("usage: build-boundaries.ts <raw-dir>");
const read = <T>(f: string) => JSON.parse(readFileSync(join(dir, f), "utf8")) as T;
const out = join(process.cwd(), "public/geo");
mkdirSync(join(out, "lga"), { recursive: true });

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const stateId = (name: string) => (/federal capital territory/i.test(name) ? "fct" : slug(name));

function round(g: PolygonalGeometry, d: number): PolygonalGeometry {
  const f = 10 ** d;
  const ring = (r: number[][]) => {
    const pts = r.map(([x, y]) => [Math.round(x * f) / f, Math.round(y * f) / f] as [number, number]);
    return pts.filter((p, i) => i === 0 || p[0] !== pts[i - 1][0] || p[1] !== pts[i - 1][1]);
  };
  return g.type === "Polygon"
    ? { type: "Polygon", coordinates: g.coordinates.map(ring) }
    : { type: "MultiPolygon", coordinates: g.coordinates.map((p) => p.map(ring)) };
}

const adm1 = read<Collection>("NGA-ADM1.geojson");
const adm1Full = read<Collection>("NGA-ADM1-full.geojson");
const adm2 = read<Collection>("NGA-ADM2-full.geojson");
const meta1 = read<Record<string, string>>("NGA-ADM1-meta.json");
const meta2 = read<Record<string, string>>("NGA-ADM2-meta.json");

// States (simplified) for the national map.
const states = adm1.features.map((f) => {
  const id = stateId(f.properties.shapeName);
  return {
    type: "Feature" as const,
    id,
    properties: { id, name: STATE_NAME_OVERRIDE[id] ?? f.properties.shapeName, iso: f.properties.shapeISO, level: "state" },
    geometry: round(f.geometry, 3),
  };
});
writeFileSync(join(out, "ng-states.json"), JSON.stringify({ type: "FeatureCollection", features: states }));

// LGAs grouped by state via spatial join against the full-resolution state polygons.
const fullStates = adm1Full.features.map((f) => ({ id: stateId(f.properties.shapeName), geometry: f.geometry, bbox: geometryBBox(f.geometry), c: geometryCentroid(f.geometry) }));
const byState = new Map<string, unknown[]>();
let nearestFallback = 0;
for (const f of adm2.features) {
  const [lng, lat] = geometryCentroid(f.geometry);
  let owner = fullStates.find((s) => lng >= s.bbox[0] && lng <= s.bbox[2] && lat >= s.bbox[1] && lat <= s.bbox[3] && geometryContains(s.geometry, lng, lat));
  if (!owner) {
    nearestFallback++;
    owner = [...fullStates].sort((a, b) => (a.c[0] - lng) ** 2 + (a.c[1] - lat) ** 2 - ((b.c[0] - lng) ** 2 + (b.c[1] - lat) ** 2))[0];
  }
  const g = round(f.geometry, 4);
  const id = `${owner.id}--${slug(f.properties.shapeName)}`;
  const list = byState.get(owner.id) ?? [];
  list.push({
    type: "Feature",
    id,
    properties: { id, name: f.properties.shapeName, level: "lga", stateId: owner.id, areaKm2: Math.round(geometryAreaKm2(g)) },
    geometry: g,
  });
  byState.set(owner.id, list);
}
let total = 0;
const sizes: Record<string, number> = {};
for (const [id, features] of byState) {
  const text = JSON.stringify({ type: "FeatureCollection", features });
  writeFileSync(join(out, "lga", `${id}.json`), text);
  total += features.length;
  sizes[id] = Math.round(text.length / 1024);
}

const src = (m: Record<string, string>, extra: Record<string, unknown>) => ({
  provider: "geoBoundaries (William & Mary geoLab)",
  release: "gbOpen",
  boundaryId: m.boundaryID,
  upstreamSource: m.boundarySource,
  boundaryYear: m.boundaryYear,
  license: m.boundaryLicense,
  sourceUrl: String(m.boundarySourceURL).replace(/^https\/\//, "https://"),
  sourceDataUpdateDate: m.sourceDataUpdateDate,
  crs: "WGS84 / EPSG:4326 (longitude, latitude in degrees)",
  ...extra,
});
writeFileSync(
  join(out, "sources.json"),
  JSON.stringify(
    {
      states: src(meta1, { geometry: "simplified release, 1e-3 degrees (about 110 m)", file: "ng-states.json", features: states.length }),
      lgas: src(meta2, {
        geometry: "full-resolution release, quantised to 1e-4 degrees (about 11 m), one file per state, loaded on demand",
        file: "lga/<state-id>.json",
        features: total,
        assignment: "LGA representative point inside the full-resolution state polygon (nearest centroid for coastal exceptions)",
      }),
      attribution: "Boundaries: geoBoundaries gbOpen (GRID3 source), CC BY 4.0. Basemap: OpenFreeMap, OpenMapTiles, © OpenStreetMap contributors.",
    },
    null,
    2,
  ),
);

// Homepage outline: Douglas-Peucker simplified, equirectangular, as ready-to-draw SVG paths.
type P = [number, number];
function dp(pts: P[], tol: number): P[] {
  if (pts.length < 3) return pts;
  const [a, b] = [pts[0], pts[pts.length - 1]];
  let idx = -1, max = 0;
  const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1e-9;
  for (let i = 1; i < pts.length - 1; i++) {
    const d = Math.abs(dy * pts[i][0] - dx * pts[i][1] + b[0] * a[1] - b[1] * a[0]) / len;
    if (d > max) { max = d; idx = i; }
  }
  if (max <= tol) return [a, b];
  return [...dp(pts.slice(0, idx + 1), tol).slice(0, -1), ...dp(pts.slice(idx), tol)];
}
const k = Math.cos((9 * Math.PI) / 180);
const [minX, maxX, minY, maxY] = [2.6, 14.8, 4.2, 13.95];
const W = 600;
const scale = W / ((maxX - minX) * k);
const H = Math.round((maxY - minY) * scale);
const px = (x: number) => ((x - minX) * k * scale).toFixed(1);
const py = (y: number) => ((maxY - y) * scale).toFixed(1);
const sketch = states.map((s) => {
  const polys = s.geometry.type === "Polygon" ? [s.geometry.coordinates] : s.geometry.coordinates;
  const d = polys
    .map((poly) => poly.map((ring) => {
      // Rings are closed (first point equals last), so split at the point farthest from the start first.
      const r = ring as P[];
      let m = 1, far = 0;
      for (let i = 1; i < r.length - 1; i++) {
        const dd = (r[i][0] - r[0][0]) ** 2 + (r[i][1] - r[0][1]) ** 2;
        if (dd > far) { far = dd; m = i; }
      }
      const simp = [...dp(r.slice(0, m + 1), 0.03).slice(0, -1), ...dp(r.slice(m), 0.03)];
      return simp.length < 4 ? "" : "M" + simp.map(([x, y]) => `${px(x)} ${py(y)}`).join("L") + "Z";
    }).join(""))
    .join("");
  return { id: s.id, d };
});
writeFileSync(
  join(process.cwd(), "src/lib/geo/ng-sketch.generated.ts"),
  `// Generated by scripts/geo/build-boundaries.ts. Do not edit.\nexport const NG_SKETCH = ${JSON.stringify({ width: W, height: H, states: sketch })} as const;\n`,
);

console.log(`states=${states.length} lgas=${total} fallbackAssigned=${nearestFallback}`);
console.log("largest LGA files (KB):", Object.entries(sizes).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => `${k}:${v}`).join(", "), "total KB:", Object.values(sizes).reduce((s, v) => s + v, 0));
