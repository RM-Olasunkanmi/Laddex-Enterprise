# Geospatial data, methods and limits

## Boundaries

| Layer | File | Source | Notes |
|---|---|---|---|
| Nigerian states (37 incl. FCT) | `public/geo/ng-states.json` (285 KB) | geoBoundaries gbOpen NGA ADM1, upstream GRID3 2022, CC BY 4.0 | Simplified release, national context only. Loaded only for the dashboard State scale and for pins outside Lagos |
| Lagos LGAs (20) | `public/geo/lagos-lgas.json` (87 KB) | geoBoundaries gbOpen NGA ADM2, upstream GRID3 2022, CC BY 4.0 | Full-resolution release, quantised to 1e-4 degrees (about 11 m). Cut from the national file by a spatial join of each LGA's representative point against the Lagos polygon |
| Source metadata | `public/geo/sources.json` | generated | Provider, release id, year, licence, URL, CRS, vertex precision. Shown on the Reports page |

Rebuild with `pnpm geo:build <dir>` (see header of `scripts/geo/build-boundaries.ts` for the four input files). The browser never loads the national LGA file (774 areas); Lagos needs 87 KB.

CRS: everything is WGS84 longitude/latitude in degrees (EPSG:4326). Point-in-polygon runs on those degrees (valid for ray casting); areas use a local equirectangular projection; distances use the haversine formula. A unit test confirms that swapped latitude/longitude falls outside Lagos.

## Sample service zones

`src/fixtures/geography/zones.ts` groups real LGAs into four sample zones, leaves five Lagos LGAs in none, and gives Zone 4 no price rule so the "quote required" path is exercised. Nothing here is claimed to be real coverage; the UI says so wherever a zone, fee or coverage result appears.

## Distances

Pickup distances are great-circle (straight line) and are always labelled so. There is no road routing. `RoutingService` in `src/features/delivery/contracts.ts` is the integration point.

## Methods in the dashboard

Point-in-polygon spatial join, aggregation by state / LGA / zone / pickup point, normalised choropleth (quantile classes, per km² or ratio), proportional symbols, nearest-point catchment proxy. Metric definitions with formulas and caveats are in `src/features/spatial-intelligence/definitions.ts` and displayed in the app.

Not built, by design: clustering, density surfaces, interpolation and heatmaps. The data is synthetic, so any such surface would present invented patterns as findings. Grid binning and clustering can be added as pure functions beside `metrics.ts` once real orders exist.

## Privacy

- Storefront shows only the visitor's own pin.
- Dashboard analysts see aggregates by area. Order-level rows, order points and the order inspector require the admin role, and coordinates there are rounded (about 100 m for admin, 1 km otherwise).
- The role switch is a development control. Enforce roles on the server before real orders are used (see `BACKEND_INTEGRATION.md`).

## Online services

The basemap (OpenFreeMap vector tiles) and live address search (OpenStreetMap Nominatim) are used when reachable and fall back to a plain background and an offline locality list otherwise. They were **not reachable from the build sandbox**, so only the fallback paths were exercised in tests. Nominatim's public instance has a strict usage policy; use a commercial or self-hosted geocoder for production.
