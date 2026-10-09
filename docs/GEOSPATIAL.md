# Geospatial data, methods and limits

## Boundaries

| Layer                   | File                                 | Source                                                   | Notes                                                                                                             |
| ----------------------- | ------------------------------------ | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| States (36 + FCT)       | `public/geo/ng-states.json`          | geoBoundaries gbOpen NGA ADM1, upstream GRID3, CC BY 4.0 | Simplified, loaded by the delivery picker and dashboard                                                           |
| LGAs (774)              | `public/geo/lga/<state>.json`        | geoBoundaries gbOpen NGA ADM2, GRID3, CC BY 4.0          | Full resolution, **one file per state**, loaded only when that state is opened. All 774 are never loaded together |
| Outline for static maps | `src/lib/geo/ng-sketch.generated.ts` | derived from the states file                             | Server-rendered SVG used on the home page and the statistics maps                                                 |
| Source metadata         | `public/geo/sources.json`            | generated                                                | Shown on the Reports page                                                                                         |

Rebuild with `pnpm geo:build <dir>`. CRS is WGS84 (EPSG:4326). Point-in-polygon runs on degrees; areas use a local equirectangular projection; distances are haversine (straight line).

## Delivery regions

Delivery is nationwide. The six geopolitical zones are the regions (`src/fixtures/geography/regions.ts`). The weight-band **rates per region are sample values**, not Laddex prices. Orders heavier than the largest band, and any freight, are "quote required".

## Spatial statistics (`/dashboard/insights`)

Implemented in `src/features/spatial-intelligence/spatial-stats.ts` and unit-tested (`spatial-stats.test.ts`):

- Queen-contiguity adjacency from the state polygons (boundaries are simplified independently, so "touching" allows a 3 km vertex tolerance). Checked against known borders such as FCT with Niger, Kogi, Nasarawa and Kaduna.
- Global Moran's I with row-standardised weights and a seeded 999-permutation test.
- Local Moran (LISA) with conditional permutations, classes HH, LL, HL, LH at p < 0.05.
- Getis-Ord Gi* hot and cold spots (95% and 90%).
- Gini coefficient and Lorenz curve of sales across states.
- Location quotients by product category and buyer segment.
- Sales by straight-line distance bands from a selectable base location.
- Growth against the previous equal-length period, with a minimum-orders guard.
- Expansion candidates: states with low own demand beside high-demand neighbours, growth as a tie-breaker.
- Region by month matrix.

Measures: log gross sales, orders per 1,000 km², or average order value. Everything recomputes from the active filters.

### Limits

- 37 units give modest statistical power. With many local tests, some flags occur by chance.
- No population, income, competitor or road-network data was supplied, so there are no per-capita measures, no market-potential estimates and no travel times.
- The orders are **synthetic**. The methods are real; the findings are not findings about Laddex.

## Privacy

- The storefront keeps only the visitor's own pin, in their browser.
- Dashboard analysts see aggregates. Order rows, order points and the order inspector need the admin role; coordinates there are rounded.
- The role switch is a development control; enforce roles on the server before real orders are used.

## Online services

The basemap (OpenFreeMap, light and dark styles) and live search (Nominatim) are used when reachable and fall back to a plain background and an offline list of state capitals and major towns. They were not reachable from the build sandbox, so only the fallbacks were exercised. Use a commercial or self-hosted geocoder in production.
