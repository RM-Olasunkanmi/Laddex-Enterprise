"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type {
  GeoJSONSource,
  Map as MlMap,
  MapLayerMouseEvent,
} from "maplibre-gl";

import {
  addBoundaryLayers,
  bindHover,
  setFeatureStates,
} from "@/components/maps/layers";
import { flyTo, useMapLibre } from "@/components/maps/use-maplibre";
import {
  classify,
  classifyGrowth,
  colorFor,
  fillValue,
  formatFill,
  legendRows,
} from "@/features/spatial-intelligence/choropleth";
import {
  extentFor,
  unitBBox,
  unitName,
} from "@/features/spatial-intelligence/geo-units";
import {
  FILL_METRICS,
  useDashboard,
} from "@/features/spatial-intelligence/state";
import { regionOfState } from "@/fixtures/geography/regions";
import { useTheme } from "@/lib/design/theme";
import { chartByTheme, mapByTheme } from "@/lib/design/tokens";
import { formatNairaCompact } from "@/lib/formatters";
import { toFeatureCollection } from "@/lib/geo/geography";

const SYMBOLS = "unit-symbols";
const ORDERS = "order-points";
const RING = "order-selected";
const POLY_SOURCE = "units";

type Pt = {
  type: "Feature";
  id?: string | number;
  geometry: { type: "Point"; coordinates: [number, number] };
  properties: Record<string, unknown>;
};
const fc = (features: Pt[]) => ({
  type: "FeatureCollection" as const,
  features,
});

/**
 * The analytical map. All fills, symbols and points are driven by the same filtered datasets as
 * the charts. Region scale shades each state by its region; state scale shades states; LGA scale
 * shades the local government areas of one chosen state (its boundary file is loaded on demand).
 * Camera moves happen only on deliberate actions (selecting, clearing, switching scale, reset).
 * The map is rebuilt by useMapLibre when the theme changes, so every layer effect depends on `map`.
 */
export function DashboardMap() {
  const { state, dispatch, dataset, derived } = useDashboard();
  const theme = useTheme();
  const palette = chartByTheme[theme];
  const mt = mapByTheme[theme];
  const { selection, fillMetric, layers, role } = state;
  const { containerRef, map, basemap } = useMapLibre({
    ariaLabel:
      "Spatial intelligence map of Nigeria. Use the area list below the map for a keyboard alternative.",
    bounds: extentFor(),
  });
  const [hover, setHover] = useState<{
    id: string;
    x: number;
    y: number;
  } | null>(null);
  const [legendOpen, setLegendOpen] = useState(true);
  useEffect(() => setLegendOpen(window.innerWidth >= 1024), []);
  const built = useRef<{ map: MlMap; key: string } | null>(null);

  const units = derived?.units ?? [];
  const stats = derived?.unitStats;
  const lgaMode = selection.scale === "lga";
  const lgaReady = lgaMode && !!derived?.lgas;

  const classes = useMemo(() => {
    if (!derived || !stats) return null;
    if (fillMetric === "growth") return classifyGrowth(palette.diverging);
    return classify(
      units
        .map((u) => fillValue(fillMetric, stats.get(u.id), u))
        .filter((v): v is number => v !== null),
      palette.sequential,
    );
  }, [derived, stats, units, fillMetric, palette]);

  // Polygon source: states (region and state scale) or the chosen state's LGAs.
  const polyKey = lgaReady ? `lga:${selection.stateId}` : "states";
  useEffect(() => {
    if (!map || !dataset) return;
    if (built.current?.map === map && built.current.key === polyKey) return;
    built.current = { map, key: polyKey };
    for (const l of [
      `${POLY_SOURCE}-selected`,
      `${POLY_SOURCE}-line`,
      `${POLY_SOURCE}-fill`,
    ])
      if (map.getLayer(l)) map.removeLayer(l);
    if (map.getSource(POLY_SOURCE)) map.removeSource(POLY_SOURCE);
    const polys = lgaReady ? derived!.lgas! : dataset.states;
    addBoundaryLayers(map, POLY_SOURCE, toFeatureCollection(polys), {
      beforeId: map.getLayer(SYMBOLS) ? SYMBOLS : undefined,
      fillOpacity: lgaMode && !lgaReady ? 0.25 : 0.8,
    });
  }, [map, dataset, polyKey, lgaReady, lgaMode, derived]);

  // Hover and click on polygons.
  useEffect(() => {
    if (!map || !dataset) return;
    const unbind = bindHover(map, POLY_SOURCE, (id, pt) =>
      setHover(id && pt ? { id, ...pt } : null),
    );
    const click = (e: MapLayerMouseEvent) => {
      const id = e.features?.[0]?.id;
      if (id === undefined) return;
      const fid = String(id);
      if (selection.scale === "lga" && !lgaReady) {
        dispatch({ type: "drill", stateId: fid });
        return;
      }
      const target =
        selection.scale === "region" ? (regionOfState(fid)?.id ?? fid) : fid;
      dispatch({
        type: "selectUnit",
        unitId: selection.unitId === target ? null : target,
      });
    };
    map.on("click", `${POLY_SOURCE}-fill`, click);
    return () => {
      unbind();
      map.off("click", `${POLY_SOURCE}-fill`, click);
    };
  }, [
    map,
    dataset,
    selection.scale,
    selection.unitId,
    lgaReady,
    dispatch,
    polyKey,
  ]);

  // Fill colours and selected outline from the shared statistics.
  useEffect(() => {
    if (!map || !derived || !dataset || !map.getSource(POLY_SOURCE)) return;
    const featureIds = lgaReady
      ? derived.lgas!.map((l) => l.id)
      : dataset.states.map((s) => s.id);
    const unitOfFeature = (id: string) =>
      selection.scale === "region" ? (regionOfState(id)?.id ?? null) : id;
    setFeatureStates(map, POLY_SOURCE, featureIds, (id) => {
      const uid = unitOfFeature(id);
      const unit = uid ? units.find((u) => u.id === uid) : null;
      const fill =
        lgaMode && !lgaReady
          ? mt.outsideFill
          : (colorFor(
              classes,
              unit ? fillValue(fillMetric, stats?.get(unit.id), unit) : null,
            ) ?? mt.noData);
      return { fill, selected: !!selection.unitId && uid === selection.unitId };
    });
  }, [
    map,
    derived,
    dataset,
    selection.scale,
    selection.unitId,
    fillMetric,
    classes,
    stats,
    units,
    lgaReady,
    lgaMode,
    mt,
    polyKey,
  ]);

  // Proportional symbols for sales volume at unit centroids.
  useEffect(() => {
    if (!map || !derived) return;
    const features: Pt[] =
      lgaMode && !lgaReady
        ? []
        : units.map((u) => ({
            type: "Feature",
            id: u.id,
            geometry: { type: "Point", coordinates: u.centroid },
            properties: {
              id: u.id,
              sales: stats?.get(u.id)?.grossKobo ?? 0,
              name: u.name,
            },
          }));
    const maxSales = Math.max(
      1,
      ...features.map((f) => Number(f.properties.sales)),
    );
    const radius = [
      "interpolate",
      ["linear"],
      ["sqrt", ["/", ["get", "sales"], maxSales]],
      0,
      0,
      1,
      selection.scale === "lga" ? 22 : 30,
    ] as unknown as number;
    if (!map.getSource(SYMBOLS)) {
      map.addSource(SYMBOLS, { type: "geojson", data: fc(features) });
      map.addLayer({
        id: SYMBOLS,
        type: "circle",
        source: SYMBOLS,
        paint: {
          "circle-radius": radius,
          "circle-color": mt.symbol,
          "circle-opacity": 0.72,
          "circle-stroke-color": mt.symbolStroke,
          "circle-stroke-width": 1.5,
        },
      });
      map.on("click", SYMBOLS, (e) => {
        const id = e.features?.[0]?.properties?.id;
        if (id) dispatch({ type: "selectUnit", unitId: String(id) });
      });
      map.on(
        "mouseenter",
        SYMBOLS,
        () => (map.getCanvas().style.cursor = "pointer"),
      );
      map.on("mouseleave", SYMBOLS, () => (map.getCanvas().style.cursor = ""));
    } else {
      (map.getSource(SYMBOLS) as GeoJSONSource).setData(fc(features));
      map.setPaintProperty(SYMBOLS, "circle-radius", radius);
    }
    map.setLayoutProperty(
      SYMBOLS,
      "visibility",
      layers.symbols ? "visible" : "none",
    );
  }, [
    map,
    derived,
    units,
    stats,
    layers.symbols,
    dispatch,
    mt,
    selection.scale,
    lgaMode,
    lgaReady,
  ]);

  // Individual order points: admin only, drawn for the selected geography and filters.
  useEffect(() => {
    if (!map || !derived) return;
    const show = role === "admin" && layers.orderPoints;
    const pts: Pt[] = show
      ? derived.inSelection
          .filter((o) => o.location)
          .slice(0, 1500)
          .map((o) => ({
            type: "Feature",
            id: o.id,
            geometry: {
              type: "Point",
              coordinates: [o.location!.lng, o.location!.lat],
            },
            properties: { id: o.id, seg: o.segment },
          }))
      : [];
    if (!map.getSource(ORDERS)) {
      map.addSource(ORDERS, { type: "geojson", data: fc(pts) });
      map.addLayer({
        id: ORDERS,
        type: "circle",
        source: ORDERS,
        paint: {
          "circle-radius": 4,
          "circle-color": [
            "match",
            ["get", "seg"],
            "wholesale",
            palette.wholesale,
            "events",
            palette.events,
            palette.retail,
          ] as unknown as string,
          "circle-stroke-color": mt.symbolStroke,
          "circle-stroke-width": 1,
        },
      });
      map.on("click", ORDERS, (e) => {
        const id = e.features?.[0]?.properties?.id;
        if (id) dispatch({ type: "selectOrder", orderId: String(id) });
      });
      map.on(
        "mouseenter",
        ORDERS,
        () => (map.getCanvas().style.cursor = "pointer"),
      );
      map.on("mouseleave", ORDERS, () => (map.getCanvas().style.cursor = ""));
    } else (map.getSource(ORDERS) as GeoJSONSource).setData(fc(pts));
  }, [map, derived, role, layers.orderPoints, dispatch, palette, mt]);

  // Highlight ring for the selected order.
  useEffect(() => {
    if (!map) return;
    const o = derived?.order;
    const data = fc(
      o?.location
        ? [
            {
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: [o.location.lng, o.location.lat],
              },
              properties: {},
            },
          ]
        : [],
    );
    if (!map.getSource(RING)) {
      map.addSource(RING, { type: "geojson", data });
      map.addLayer({
        id: RING,
        type: "circle",
        source: RING,
        paint: {
          "circle-radius": 11,
          "circle-color": "rgba(0,0,0,0)",
          "circle-stroke-color": mt.selectLine,
          "circle-stroke-width": 3,
        },
      });
    } else (map.getSource(RING) as GeoJSONSource).setData(data);
  }, [map, derived?.order, mt]);

  // Camera: only when the user selects, clears, changes scale, or resets.
  const lastFocus = useRef<{ map: MlMap; key: string } | null>(null);
  useEffect(() => {
    if (!map || !derived) return;
    if (lgaMode && !lgaReady) return;
    const key = `${selection.scale}|${selection.unitId}|${selection.stateId}|${selection.orderId}|${state.resetToken}|${lgaReady}`;
    if (lastFocus.current?.map === map && lastFocus.current.key === key) return;
    const first = lastFocus.current?.map !== map;
    lastFocus.current = { map, key };
    const o = derived.order;
    if (o?.location) {
      map.easeTo({
        center: [o.location.lng, o.location.lat],
        zoom: Math.max(map.getZoom(), 9),
        duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? 0
          : 650,
      });
      return;
    }
    let target = unitBBox(units, selection.unitId);
    if (!target && lgaReady && derived.lgas) {
      const bs = derived.lgas.map((l) => l.bbox);
      target = [
        [Math.min(...bs.map((b) => b[0])), Math.min(...bs.map((b) => b[1]))],
        [Math.max(...bs.map((b) => b[2])), Math.max(...bs.map((b) => b[3]))],
      ];
    }
    target ??= extentFor();
    if (first) {
      map.fitBounds(target, { padding: 24, duration: 0, maxZoom: 11 });
      return;
    }
    flyTo(map, {
      bounds: target,
      padding: { top: 40, bottom: 40, left: 40, right: 40 },
      maxZoom: 11,
    });
  }, [
    map,
    derived,
    selection.scale,
    selection.unitId,
    selection.stateId,
    selection.orderId,
    state.resetToken,
    units,
    lgaMode,
    lgaReady,
  ]);

  const hoverInfo = (() => {
    if (!hover || !derived) return null;
    const uid =
      selection.scale === "region"
        ? (regionOfState(hover.id)?.id ?? hover.id)
        : hover.id;
    const unit = units.find((u) => u.id === uid) ?? null;
    const s = stats?.get(uid);
    if (lgaMode && !lgaReady)
      return {
        name: dataset?.states.find((x) => x.id === hover.id)?.name ?? hover.id,
        sales: "",
        orders: -1,
        fill: "Click to open its local government areas",
      };
    return {
      name: unit ? unit.name : unitName(units, uid),
      sales: s ? formatNairaCompact(s.grossKobo) : "—",
      orders: s?.ordersPlaced ?? 0,
      fill: unit ? formatFill(fillMetric, fillValue(fillMetric, s, unit)) : "—",
    };
  })();

  const rows = legendRows(classes, fillMetric);
  const fillDef = FILL_METRICS.find((m) => m.key === fillMetric)!;

  return (
    <div className="relative h-full min-h-[22rem] bg-paper-2">
      <div className="absolute inset-0">
        <div ref={containerRef} className="h-full w-full" />
      </div>
      {!map && (
        <div
          className="absolute inset-0 grid place-items-center skel rounded-none"
          aria-busy="true"
        >
          <span className="sr-only">Loading map</span>
        </div>
      )}
      {lgaMode && !lgaReady && (
        <div
          className="absolute inset-x-0 top-3 mx-auto w-fit max-w-[90%] bg-card/95 border border-line rounded-sm px-3 py-2 text-sm shadow-raised"
          role="status"
        >
          {derived?.lgaLoading
            ? "Loading local government boundaries"
            : "Choose a state on the map or in the Extent bar to see its local government areas"}
        </div>
      )}
      {hoverInfo && (
        <div
          className="pointer-events-none absolute z-10 bg-ink text-paper text-xs px-2.5 py-2 rounded-sm shadow-pop"
          style={{ left: Math.min(hover!.x + 14, 260), top: hover!.y + 14 }}
          role="status"
        >
          <p className="font-semibold">{hoverInfo.name}</p>
          {hoverInfo.orders >= 0 && (
            <p className="mono">
              {hoverInfo.sales} · {hoverInfo.orders} orders
            </p>
          )}
          <p className="text-rail-text/80">
            {hoverInfo.orders >= 0 ? `${fillDef.label}: ` : ""}
            {hoverInfo.fill}
          </p>
        </div>
      )}
      <details
        open={legendOpen}
        onToggle={(e) => setLegendOpen((e.target as HTMLDetailsElement).open)}
        className="absolute left-3 bottom-8 max-w-[15rem] bg-card/95 border border-line rounded-sm text-xs shadow-raised"
      >
        <summary className="px-2.5 py-2 cursor-pointer min-h-9 flex items-center eyebrow list-none">
          {fillDef.label}{" "}
          <span aria-hidden="true" className="ml-2">
            {legendOpen ? "−" : "+"}
          </span>
        </summary>
        <div className="px-2.5 pb-2.5">
          {rows.length === 0 ? (
            <p className="text-ink-3">No areas have data for these filters.</p>
          ) : (
            <ul className="space-y-0.5 list-none p-0">
              {rows.map((r) => (
                <li key={r.label} className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="w-4 h-3 border border-ink/30"
                    style={{ background: r.color }}
                  />
                  {r.label}
                </li>
              ))}
              <li className="flex items-center gap-2 text-ink-3">
                <span
                  aria-hidden="true"
                  className="w-4 h-3 border border-ink/30"
                  style={{ background: mt.noData }}
                />
                No data
              </li>
            </ul>
          )}
          {layers.symbols && (
            <p className="mt-1.5 flex items-center gap-2 text-ink-2">
              <span
                aria-hidden="true"
                className="w-3 h-3 rounded-full border border-white"
                style={{ background: mt.symbol, opacity: 0.8 }}
              />
              Circle area = gross sales
            </p>
          )}
        </div>
      </details>
      {basemap === "offline" && (
        <p className="absolute left-3 top-3 bg-card/90 text-[0.6875rem] px-2 py-1 border border-line rounded-sm max-w-[60%]">
          Street basemap unavailable: boundaries only
        </p>
      )}
    </div>
  );
}
