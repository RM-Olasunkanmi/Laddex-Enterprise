"use client";

import type { GeoJSONSource, Map as MlMap, MapLayerMouseEvent } from "maplibre-gl";
import { useEffect, useMemo, useRef, useState } from "react";

import { addBoundaryLayers, bindHover, setFeatureStates } from "@/components/maps/layers";
import { flyTo, useMapLibre } from "@/components/maps/use-maplibre";
import { classify, colorFor, fillValue, formatFill, legendRows } from "@/features/spatial-intelligence/choropleth";
import { extentFor, unitBBox, unitName } from "@/features/spatial-intelligence/geo-units";
import { FILL_METRICS, useDashboard } from "@/features/spatial-intelligence/state";
import { SAMPLE_PICKUP_POINTS, SAMPLE_ZONES } from "@/fixtures/geography/zones";
import { chart, map as mapTokens } from "@/lib/design/tokens";
import { toFeatureCollection } from "@/lib/geo/geography";
import { formatNairaCompact } from "@/lib/formatters";

const SYMBOLS = "unit-symbols";
const ORDERS = "order-points";
const RING = "order-selected";
const POLY_SOURCE = "units";

type Pt = { type: "Feature"; id?: string | number; geometry: { type: "Point"; coordinates: [number, number] }; properties: Record<string, unknown> };
const fc = (features: Pt[]) => ({ type: "FeatureCollection" as const, features });

/**
 * The analytical map. All fills, symbols and points are driven by the same filtered datasets as
 * the charts: `derived.scoped` for sibling comparison, `derived.inSelection` for the inspector.
 * Camera moves happen only on deliberate actions (selecting, clearing, switching scale, reset).
 */
export function DashboardMap() {
  const { state, dispatch, dataset, derived } = useDashboard();
  const { selection, fillMetric, layers, role } = state;
  const { containerRef, map, ml, basemap } = useMapLibre({ ariaLabel: "Spatial intelligence map of Lagos. Use the area list below the map for a keyboard alternative.", bounds: extentFor("lga") });
  const [hover, setHover] = useState<{ id: string; x: number; y: number } | null>(null);
  const [popup, setPopup] = useState<string | null>(null);
  const layerScale = useRef<string | null>(null);

  const units = derived?.units ?? [];
  const stats = derived?.unitStats;
  const classes = useMemo(() => (derived && stats ? classify(units.map((u) => fillValue(fillMetric, stats.get(u.id), u)).filter((v): v is number => v !== null)) : null), [derived, stats, units, fillMetric]);

  // Polygon source for the current scale (LGA polygons double for zone scale, coloured by zone).
  useEffect(() => {
    if (!map || !dataset) return;
    const scale = selection.scale;
    const key = scale;
    if (layerScale.current === key) return;
    layerScale.current = key;
    for (const l of [`${POLY_SOURCE}-selected`, `${POLY_SOURCE}-line`, `${POLY_SOURCE}-fill`]) if (map.getLayer(l)) map.removeLayer(l);
    if (map.getSource(POLY_SOURCE)) map.removeSource(POLY_SOURCE);
    if (scale === "state") {
      const states = dataset.states.map((s) => ({ ...s, level: "state" as const }));
      addBoundaryLayers(map, POLY_SOURCE, toFeatureCollection(states), { beforeId: map.getLayer(SYMBOLS) ? SYMBOLS : undefined, fillOpacity: 0.75 });
    } else {
      addBoundaryLayers(map, POLY_SOURCE, toFeatureCollection(dataset.lgas), { beforeId: map.getLayer(SYMBOLS) ? SYMBOLS : undefined, fillOpacity: scale === "pickup" ? 0.35 : 0.8 });
    }
  }, [map, dataset, selection.scale]);

  // Hover and click on polygons.
  useEffect(() => {
    if (!map || !dataset) return;
    const unbind = bindHover(map, POLY_SOURCE, (id, pt) => setHover(id && pt ? { id, ...pt } : null));
    const click = (e: MapLayerMouseEvent) => {
      const id = e.features?.[0]?.id;
      if (id === undefined) return;
      const lga = String(id);
      const sc = state.selection.scale;
      // At zone scale an LGA click selects the zone that contains it.
      const target = sc === "zone" ? (SAMPLE_ZONES.find((z) => z.lgaIds.includes(lga))?.id ?? "__outside-zones") : lga;
      dispatch({ type: "selectUnit", unitId: state.selection.unitId === target ? null : target });
    };
    map.on("click", `${POLY_SOURCE}-fill`, click);
    return () => {
      unbind();
      map.off("click", `${POLY_SOURCE}-fill`, click);
    };
  }, [map, dataset, selection.scale, state.selection.unitId, dispatch, state.selection.scale]);

  // Fill colours and selected outline from the shared statistics.
  useEffect(() => {
    if (!map || !derived || !dataset || !map.getSource(POLY_SOURCE)) return;
    const scale = selection.scale;
    const ids = scale === "state" ? dataset.states.map((s) => s.id) : dataset.lgas.map((l) => l.id);
    const unitOfFeature = (id: string) => {
      if (scale === "zone") return SAMPLE_ZONES.find((z) => z.lgaIds.includes(id))?.id ?? "__outside-zones";
      if (scale === "lga" || scale === "state") return id;
      return null;
    };
    setFeatureStates(map, POLY_SOURCE, ids, (id) => {
      const uid = unitOfFeature(id);
      const unit = uid ? units.find((u) => u.id === uid) : null;
      let fill: string = mapTokens.outsideFill;
      if (scale === "zone") {
        const zi = SAMPLE_ZONES.findIndex((z) => z.id === uid);
        fill = zi >= 0 ? chart.zones[zi] : mapTokens.outsideFill;
        if (fillMetric && layers.zones === false) fill = colorFor(classes, unit ? fillValue(fillMetric, stats?.get(unit.id), unit) : null) ?? mapTokens.outsideFill;
      } else if (scale !== "pickup" && unit) {
        fill = colorFor(classes, fillValue(fillMetric, stats?.get(unit.id), unit)) ?? mapTokens.outsideFill;
      }
      if (layers.zones && scale !== "zone" && scale !== "state") {
        const zi = SAMPLE_ZONES.findIndex((z) => z.lgaIds.includes(id));
        if (zi >= 0) fill = chart.zones[zi];
      }
      return { fill, selected: !!selection.unitId && uid === selection.unitId };
    });
  }, [map, derived, dataset, selection.scale, selection.unitId, fillMetric, layers.zones, classes, stats, units]);

  // Proportional symbols for sales volume at unit centroids.
  useEffect(() => {
    if (!map || !derived) return;
    const features: Pt[] = units.map((u) => {
      const s = stats?.get(u.id);
      return { type: "Feature", id: u.id, geometry: { type: "Point", coordinates: u.centroid }, properties: { id: u.id, sales: s?.grossKobo ?? 0, name: u.name } };
    });
    const maxSales = Math.max(1, ...features.map((f) => Number(f.properties.sales)));
    if (!map.getSource(SYMBOLS)) {
      map.addSource(SYMBOLS, { type: "geojson", data: fc(features) });
      map.addLayer({
        id: SYMBOLS,
        type: "circle",
        source: SYMBOLS,
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["sqrt", ["/", ["get", "sales"], maxSales]], 0, 0, 1, 26] as unknown as number,
          "circle-color": color_ink,
          "circle-opacity": 0.78,
          "circle-stroke-color": "#FFFDF8",
          "circle-stroke-width": 1.5,
        },
      });
      map.on("click", SYMBOLS, (e) => {
        const id = e.features?.[0]?.properties?.id;
        if (id) dispatch({ type: "selectUnit", unitId: String(id) });
      });
      map.on("mouseenter", SYMBOLS, () => (map.getCanvas().style.cursor = "pointer"));
      map.on("mouseleave", SYMBOLS, () => (map.getCanvas().style.cursor = ""));
    } else {
      (map.getSource(SYMBOLS) as GeoJSONSource).setData(fc(features));
      map.setPaintProperty(SYMBOLS, "circle-radius", ["interpolate", ["linear"], ["sqrt", ["/", ["get", "sales"], maxSales]], 0, 0, 1, 26]);
    }
    map.setLayoutProperty(SYMBOLS, "visibility", layers.symbols ? "visible" : "none");
  }, [map, derived, units, stats, layers.symbols, dispatch]);

  // Individual order points: admin only, drawn for the selected geography and filters.
  useEffect(() => {
    if (!map || !derived) return;
    const show = role === "admin" && layers.orderPoints;
    const pts: Pt[] = show
      ? derived.inSelection.filter((o) => o.location).slice(0, 1500).map((o) => ({ type: "Feature", id: o.id, geometry: { type: "Point", coordinates: [o.location!.lng, o.location!.lat] }, properties: { id: o.id, seg: o.segment } }))
      : [];
    if (!map.getSource(ORDERS)) {
      map.addSource(ORDERS, { type: "geojson", data: fc(pts) });
      map.addLayer({ id: ORDERS, type: "circle", source: ORDERS, paint: { "circle-radius": 4, "circle-color": ["match", ["get", "seg"], "wholesale", chart.wholesale, chart.retail] as unknown as string, "circle-stroke-color": "#FFFDF8", "circle-stroke-width": 1 } });
      map.on("click", ORDERS, (e) => {
        const id = e.features?.[0]?.properties?.id;
        if (id) dispatch({ type: "selectOrder", orderId: String(id) });
      });
      map.on("mouseenter", ORDERS, () => (map.getCanvas().style.cursor = "pointer"));
      map.on("mouseleave", ORDERS, () => (map.getCanvas().style.cursor = ""));
    } else (map.getSource(ORDERS) as GeoJSONSource).setData(fc(pts));
  }, [map, derived, role, layers.orderPoints, dispatch]);

  // Highlight ring for the selected order.
  useEffect(() => {
    if (!map) return;
    const o = derived?.order;
    const data = fc(o?.location ? [{ type: "Feature", geometry: { type: "Point", coordinates: [o.location.lng, o.location.lat] }, properties: {} }] : []);
    if (!map.getSource(RING)) {
      map.addSource(RING, { type: "geojson", data });
      map.addLayer({ id: RING, type: "circle", source: RING, paint: { "circle-radius": 11, "circle-color": "rgba(0,0,0,0)", "circle-stroke-color": mapTokens.selectLine, "circle-stroke-width": 3 } });
    } else (map.getSource(RING) as GeoJSONSource).setData(data);
  }, [map, derived?.order]);

  // Camera: only when the user selects, clears, changes scale, or resets.
  const lastFocus = useRef<string>("");
  useEffect(() => {
    if (!map || !derived) return;
    const o = derived.order;
    const key = `${selection.scale}|${selection.unitId}|${selection.orderId}|${state.resetToken}`;
    if (key === lastFocus.current) return;
    const first = lastFocus.current === "";
    lastFocus.current = key;
    if (o?.location) {
      map.easeTo({ center: [o.location.lng, o.location.lat], zoom: Math.max(map.getZoom(), 12.5), duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 650 });
      return;
    }
    const target = unitBBox(units, selection.unitId) ?? extentFor(selection.scale);
    if (first && !selection.unitId) return;
    flyTo(map as MlMap, { bounds: target, padding: { top: 40, bottom: 40, left: 40, right: 40 }, maxZoom: selection.scale === "pickup" ? 13 : 12 });
  }, [map, derived, selection.scale, selection.unitId, selection.orderId, state.resetToken, units]);

  // Pickup markers for distribution-point scale.
  useEffect(() => {
    if (!map || !ml || selection.scale !== "pickup") return;
    const markers = SAMPLE_PICKUP_POINTS.map((p) => {
      const el = document.createElement("button");
      el.type = "button";
      el.setAttribute("aria-label", `${p.name}, select`);
      el.style.cssText = `width:16px;height:16px;background:${mapTokens.pickup};transform:rotate(45deg);border:2px solid #FFFDF8;box-shadow:0 1px 3px rgba(0,0,0,.5)`;
      el.onclick = (ev) => {
        ev.stopPropagation();
        dispatch({ type: "selectUnit", unitId: p.id });
      };
      return new ml.Marker({ element: el }).setLngLat([p.position.lng, p.position.lat]).addTo(map);
    });
    return () => markers.forEach((m) => m.remove());
  }, [map, ml, selection.scale, dispatch]);

  // Tooltip content for a hovered polygon.
  const hoverInfo = (() => {
    if (!hover || !derived) return null;
    const sc = selection.scale;
    const uid = sc === "zone" ? (SAMPLE_ZONES.find((z) => z.lgaIds.includes(hover.id))?.id ?? "__outside-zones") : hover.id;
    const unit = units.find((u) => u.id === uid);
    const s = stats?.get(uid);
    return { name: unit ? unit.name : unitName(units, uid), sales: s ? formatNairaCompact(s.grossKobo) : "—", orders: s?.ordersPlaced ?? 0, fill: unit ? formatFill(fillMetric, fillValue(fillMetric, s, unit)) : "—" };
  })();

  const rows = legendRows(classes, fillMetric);
  const fillDef = FILL_METRICS.find((m) => m.key === fillMetric)!;

  return (
    <div className="relative h-full min-h-[22rem] bg-paper-2">
      <div className="absolute inset-0"><div ref={containerRef} className="h-full w-full" /></div>
      {!map && <div className="absolute inset-0 grid place-items-center skel rounded-none" aria-busy="true"><span className="sr-only">Loading map</span></div>}
      {hoverInfo && (
        <div className="pointer-events-none absolute z-10 bg-ink text-paper text-xs px-2.5 py-2 rounded-sm shadow-pop" style={{ left: Math.min(hover!.x + 14, 260), top: hover!.y + 14 }} role="status">
          <p className="font-semibold">{hoverInfo.name}</p>
          <p className="mono">{hoverInfo.sales} · {hoverInfo.orders} orders</p>
          <p className="text-rail-text/80">{fillDef.label}: {hoverInfo.fill}</p>
        </div>
      )}
      <div className="absolute left-3 bottom-8 max-w-[15rem] bg-card/95 border border-line rounded-sm p-2.5 text-xs shadow-raised">
        <p className="eyebrow mb-1.5">{selection.scale === "zone" && !layers.zones ? fillDef.label : selection.scale === "pickup" ? "Distribution points" : fillDef.label}</p>
        {selection.scale === "pickup" ? (
          <p className="text-ink-2">Symbols sized by sales of orders collected at each sample point.</p>
        ) : rows.length === 0 ? (
          <p className="text-ink-3">No areas have data for these filters.</p>
        ) : (
          <ul className="space-y-0.5 list-none p-0">
            {rows.map((r) => (
              <li key={r.label} className="flex items-center gap-2"><span aria-hidden="true" className="w-4 h-3 border border-ink/30" style={{ background: r.color }} />{r.label}</li>
            ))}
            <li className="flex items-center gap-2 text-ink-3"><span aria-hidden="true" className="w-4 h-3 border border-ink/30 bg-paper-2" />No data</li>
          </ul>
        )}
        {layers.symbols && <p className="mt-1.5 flex items-center gap-2 text-ink-2"><span aria-hidden="true" className="w-3 h-3 rounded-full bg-ink/80 border border-white" />Circle area = gross sales</p>}
        {layers.zones && selection.scale === "lga" && <p className="mt-1 text-ink-3">Fill shows sample zones instead.</p>}
      </div>
      {basemap === "offline" && <p className="absolute right-3 bottom-8 bg-card/90 text-[0.6875rem] px-2 py-1 border border-line rounded-sm">Street basemap unavailable: boundaries only</p>}
      {popup && <p className="sr-only" role="status">{popup}</p>}
    </div>
  );
}

const color_ink = "#1E1B17";
