/**
 * Builds the bounded boundary files the browser loads. Run with:
 *   pnpm exec tsx scripts/geo/build-boundaries.ts <dir-with-raw-geojson>
 * where the directory holds NGA-ADM1.geojson (simplified, national context), NGA-ADM1-full.geojson
 * and NGA-ADM2-full.geojson (full resolution, used to cut Lagos) from geoBoundaries gbOpen
 * (GRID3 source, CC BY 4.0), plus NGA-ADM1-meta.json and NGA-ADM2-meta.json.
 *
 * Output (public/geo): ng-states.json, lagos-lgas.json, sources.json.
 * ADM2 carries no parent attribute, so LGAs are assigned to Lagos by testing each LGA's
 * representative point against the Lagos ADM1 polygon (a spatial join).
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import {
  geometryBBox,
  geometryCentroid,
  geometryContains,
  type PolygonalGeometry,
} from "../../src/lib/geo/pip";

type Feature = {
  type: "Feature";
  properties: Record<string, string>;
  geometry: PolygonalGeometry;
};
type Collection = { type: "FeatureCollection"; features: Feature[] };

const dir = process.argv[2];
if (!dir) throw new Error("usage: build-boundaries.ts <raw-dir>");
const read = <T>(f: string) =>
  JSON.parse(readFileSync(join(dir, f), "utf8")) as T;
const out = join(process.cwd(), "public/geo");
mkdirSync(out, { recursive: true });

const quantize = (n: number, d: number) => Number(n.toFixed(d));
function round(g: PolygonalGeometry, d: number): PolygonalGeometry {
  const ring = (r: number[][]) => {
    const pts = r.map(
      ([x, y]) => [quantize(x, d), quantize(y, d)] as [number, number],
    );
    return pts.filter(
      (p, i) => i === 0 || p[0] !== pts[i - 1][0] || p[1] !== pts[i - 1][1],
    );
  };
  if (g.type === "Polygon")
    return { type: "Polygon", coordinates: g.coordinates.map(ring) };
  return {
    type: "MultiPolygon",
    coordinates: g.coordinates.map((p) => p.map(ring)),
  };
}
const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const adm1 = read<Collection>("NGA-ADM1.geojson");
const adm1Full = read<Collection>("NGA-ADM1-full.geojson");
const adm2 = read<Collection>("NGA-ADM2-full.geojson");
const meta1 = read<Record<string, string>>("NGA-ADM1-meta.json");
const meta2 = read<Record<string, string>>("NGA-ADM2-meta.json");

const states = adm1.features.map((f) => ({
  type: "Feature" as const,
  id: slug(f.properties.shapeName),
  properties: {
    id: slug(f.properties.shapeName),
    name: f.properties.shapeName,
    iso: f.properties.shapeISO,
    level: "state",
  },
  geometry: round(f.geometry, 3),
}));
const lagos = adm1Full.features.find((f) =>
  /^lagos$/i.test(f.properties.shapeName),
);
if (!lagos) throw new Error("Lagos not found in ADM1");

const lgas = adm2.features
  .filter((f) => {
    const [lng, lat] = geometryCentroid(f.geometry);
    return geometryContains(lagos.geometry, lng, lat);
  })
  .map((f) => {
    const g = round(f.geometry, 4);
    return {
      type: "Feature" as const,
      id: slug(f.properties.shapeName),
      properties: {
        id: slug(f.properties.shapeName),
        name: f.properties.shapeName,
        stateId: "lagos",
        level: "lga",
        bbox: geometryBBox(g),
      },
      geometry: g,
    };
  });

writeFileSync(
  join(out, "ng-states.json"),
  JSON.stringify({ type: "FeatureCollection", features: states }),
);
writeFileSync(
  join(out, "lagos-lgas.json"),
  JSON.stringify({ type: "FeatureCollection", features: lgas }),
);

const src = (m: Record<string, string>, extra: Record<string, unknown>) => ({
  provider: "geoBoundaries (William & Mary geoLab)",
  release: "gbOpen",
  boundaryId: m.boundaryID,
  upstreamSource: m.boundarySource,
  boundaryYear: m.boundaryYear,
  license: m.boundaryLicense,
  sourceUrl: String(m.boundarySourceURL).replace(/^https\/\//, "https://"),
  sourceDataUpdateDate: m.sourceDataUpdateDate,
  geometry: extra.geometry,
  crs: "WGS84 / EPSG:4326 (longitude, latitude in degrees)",
  ...extra,
});
writeFileSync(
  join(out, "sources.json"),
  JSON.stringify(
    {
      states: src(meta1, {
        geometry: "simplified release (national context only)",
        file: "ng-states.json",
        features: states.length,
        precisionDecimals: 3,
      }),
      lgas: src(meta2, {
        geometry:
          "full-resolution release, quantised to 1e-4 degrees (about 11 m)",
        file: "lagos-lgas.json",
        features: lgas.length,
        precisionDecimals: 4,
        filter: "LGA representative point inside the Lagos ADM1 polygon",
      }),
      attribution:
        "Boundaries: geoBoundaries gbOpen (GRID3 source), CC BY 4.0. Basemap: OpenFreeMap, OpenMapTiles, © OpenStreetMap contributors.",
    },
    null,
    2,
  ),
);
console.log(
  `states=${states.length} lagosLgas=${lgas.length}`,
  lgas
    .map((l) => l.properties.name)
    .sort()
    .join(", "),
);
