"use client";

import type { Marker } from "maplibre-gl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useCart } from "@/components/commerce/use-customer-pricing";
import { Notice, Tag } from "@/components/lx/primitives";
import { addBoundaryLayers, bindHover, setFeatureStates } from "@/components/maps/layers";
import { flyTo, useMapLibre } from "@/components/maps/use-maplibre";
import { searchWithFallback } from "@/features/delivery/adapters/geocoders";
import { estimateDelivery } from "@/features/delivery/pricing";
import { resolveLocation } from "@/features/delivery/resolve";
import { deliveryStore, setDeliveryLocation, setDeliveryOption } from "@/features/delivery/store";
import type { DeliveryLocation, GeocodeResult, LngLat, LocationResolution } from "@/features/delivery/types";
import { SAMPLE_DISCLAIMER, SAMPLE_PICKUP_POINTS, SAMPLE_ZONES } from "@/fixtures/geography/zones";
import { chart, map as mapTokens } from "@/lib/design/tokens";
import { formatNaira } from "@/lib/formatters";
import { loadLagosLgas, loadStates, toFeatureCollection, type AdminUnit } from "@/lib/geo/geography";
import { geometryBBox, geometryCentroid, isValidLngLat } from "@/lib/geo/pip";

import { CoverageBadge } from "./coverage-badge";

const EXAMPLE_WEIGHT_KG = 24;

function pinElement(label: string) {
  const el = document.createElement("div");
  el.setAttribute("role", "img");
  el.setAttribute("aria-label", label);
  el.innerHTML = `<svg width="30" height="40" viewBox="0 0 30 40" aria-hidden="true"><path d="M15 38C15 38 28 25 28 14.5A13 13 0 0 0 2 14.5C2 25 15 38 15 38Z" fill="#B23A0E" stroke="#1E1B17" stroke-width="2"/><circle cx="15" cy="14.5" r="5" fill="#FFF8F0"/></svg>`;
  el.style.cursor = "grab";
  return el;
}

function pickupElement(name: string) {
  const el = document.createElement("div");
  el.title = name;
  el.setAttribute("role", "img");
  el.setAttribute("aria-label", name);
  el.style.cssText = `width:14px;height:14px;background:${mapTokens.pickup};transform:rotate(45deg);border:2px solid #F6F2EA;box-shadow:0 1px 3px rgba(0,0,0,.4)`;
  return el;
}

export function LocationPicker({ compact = false, initialQuery = "" }: { compact?: boolean; initialQuery?: string }) {
  const saved = deliveryStore.use();
  const savedHydrated = deliveryStore.useHydrated();
  const cart = useCart();
  const weightKg = cart.weightKg > 0 ? cart.weightKg : EXAMPLE_WEIGHT_KG;

  const [lgas, setLgas] = useState<AdminUnit[] | null>(null);
  const [states, setStates] = useState<AdminUnit[] | null>(null);
  const [geoError, setGeoError] = useState(false);
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<GeocodeResult[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [degraded, setDegraded] = useState(false);
  const [pin, setPin] = useState<{ position: LngLat; label: string; precision: DeliveryLocation["precision"]; source: DeliveryLocation["source"] } | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const lgasRef = useRef<AdminUnit[] | null>(null);

  const { containerRef, map, ml, basemap } = useMapLibre({ ariaLabel: "Delivery map of Lagos. Click to place your delivery pin." });

  useEffect(() => {
    loadLagosLgas().then((l) => { setLgas(l); lgasRef.current = l; }).catch(() => setGeoError(true));
  }, []);

  // Restore a previously confirmed location once.
  const restored = useRef(false);
  useEffect(() => {
    if (restored.current || !savedHydrated || !saved.location) return;
    restored.current = true;
    setPin({ position: saved.location.position, label: saved.location.label, precision: saved.location.precision, source: saved.location.source });
  }, [saved.location, savedHydrated]);

  const resolution: LocationResolution | null = useMemo(() => (pin && lgas ? resolveLocation(pin.position, lgas, states) : null), [pin, lgas, states]);

  // The national state file is only requested when a pin lands outside Lagos.
  useEffect(() => {
    if (resolution?.coverage === "outside-lagos" && !states) loadStates().then(setStates).catch(() => undefined);
  }, [resolution?.coverage, states]);

  // Layers: LGAs shaded by SAMPLE zone, sample pickup points.
  useEffect(() => {
    if (!map || !ml || !lgas) return;
    addBoundaryLayers(map, "lgas", toFeatureCollection(lgas), { fillOpacity: 0.36 });
    setFeatureStates(map, "lgas", lgas.map((l) => l.id), (id) => {
      const zi = SAMPLE_ZONES.findIndex((z) => z.lgaIds.includes(id));
      return { fill: zi >= 0 ? chart.zones[zi] : mapTokens.outsideFill };
    });
    const markers = SAMPLE_PICKUP_POINTS.map((p) => new ml.Marker({ element: pickupElement(p.name) }).setLngLat([p.position.lng, p.position.lat]).setPopup(new ml.Popup({ offset: 12, closeButton: false }).setText(`${p.name} (sample)`)).addTo(map));
    const unbind = bindHover(map, "lgas", (id) => setHover(id));
    return () => {
      unbind();
      markers.forEach((m) => m.remove());
    };
  }, [map, ml, lgas]);

  const place = useCallback((position: LngLat, label: string, precision: DeliveryLocation["precision"], source: DeliveryLocation["source"], fly = true) => {
    if (!isValidLngLat(position.lng, position.lat)) return;
    setPin({ position, label, precision, source });
    if (map && fly) {
      const d = precision === "address" ? 0.004 : 0.02;
      flyTo(map, { bounds: [[position.lng - d, position.lat - d], [position.lng + d, position.lat + d]], padding: 60, maxZoom: precision === "address" ? 15 : 12.5 });
    }
  }, [map]);

  // Click to drop or move the pin.
  useEffect(() => {
    if (!map) return;
    const onClick = (e: { lngLat: { lng: number; lat: number } }) => {
      const position = { lng: Number(e.lngLat.lng.toFixed(5)), lat: Number(e.lngLat.lat.toFixed(5)) };
      const unit = lgasRef.current ? resolveLocation(position, lgasRef.current) : null;
      place(position, unit?.lgaName ? `Pin in ${unit.lgaName}` : "Pinned location", "map-pin", "map-pin", false);
    };
    map.on("click", onClick);
    return () => void map.off("click", onClick);
  }, [map, place]);

  // Keep the draggable marker in sync with the pin.
  useEffect(() => {
    if (!map || !ml) return;
    if (!pin) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }
    if (!markerRef.current) {
      const m = new ml.Marker({ element: pinElement("Delivery pin"), draggable: true, anchor: "bottom" }).setLngLat([pin.position.lng, pin.position.lat]).addTo(map);
      m.on("dragend", () => {
        const ll = m.getLngLat();
        const position = { lng: Number(ll.lng.toFixed(5)), lat: Number(ll.lat.toFixed(5)) };
        const unit = lgasRef.current ? resolveLocation(position, lgasRef.current) : null;
        setPin({ position, label: unit?.lgaName ? `Pin in ${unit.lgaName}` : "Pinned location", precision: "map-pin", source: "map-pin" });
      });
      markerRef.current = m;
    } else markerRef.current.setLngLat([pin.position.lng, pin.position.lat]);
  }, [map, ml, pin]);

  useEffect(() => () => { markerRef.current?.remove(); markerRef.current = null; }, []);

  const runSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) return;
    abortRef.current?.abort();
    const ctl = new AbortController();
    abortRef.current = ctl;
    setSearching(true);
    try {
      const out = await searchWithFallback(q, ctl.signal);
      setResults(out.results);
      setDegraded(out.degraded);
      if (out.results.length === 1) place(out.results[0].position, out.results[0].label, out.results[0].precision, "search");
    } catch (e) {
      if ((e as Error).name !== "AbortError") setResults([]);
    } finally {
      if (abortRef.current === ctl) setSearching(false);
    }
  }, [place]);

  const autoRan = useRef(false);
  useEffect(() => {
    if (initialQuery && map && !autoRan.current) {
      autoRan.current = true;
      void runSearch(initialQuery);
    }
  }, [initialQuery, map, runSearch]);

  const estimate = resolution ? estimateDelivery({ resolution, weightKg }) : null;
  const confirmed = !!(pin && saved.location && saved.location.position.lng === pin.position.lng && saved.location.position.lat === pin.position.lat);
  const chosen = saved.optionId;

  const confirm = () => {
    if (!pin || !resolution) return;
    setDeliveryLocation({ ...pin, confirmed: true }, resolution);
  };

  const hoveredUnit = hover && lgas?.find((l) => l.id === hover);
  const hoveredZone = hover ? SAMPLE_ZONES.find((z) => z.lgaIds.includes(hover)) : null;

  return (
    <div className={`grid gap-6 ${compact ? "" : "lg:grid-cols-[24rem_1fr]"}`}>
      <div className="space-y-5 order-2 lg:order-1">
        {/* A div, not a form: the picker is embedded in the checkout form and forms cannot nest. */}
        <div role="search">
          <label htmlFor="addr" className="label">Delivery address or area</label>
          <div className="flex gap-2">
            <input id="addr" className="field" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void runSearch(query); } }} placeholder="e.g. Ikeja, Lekki Phase 1, Ikorodu" autoComplete="off" />
            <button type="button" className="btn btn-ink" onClick={() => void runSearch(query)} disabled={searching || query.trim().length < 2}>{searching ? "Searching" : "Search"}</button>
          </div>
          <p className="hint mt-1.5">Or click the map to drop a pin, then drag it to adjust.</p>
        </div>

        {results && (
          <div aria-live="polite">
            {degraded && <Notice tone="warning" className="mb-2">Live address search is unavailable. Showing known Lagos localities instead.</Notice>}
            {results.length === 0 ? (
              <p className="text-sm text-ink-2">No matches. Try a nearby area name, or place a pin on the map.</p>
            ) : (
              <ul className="panel divide-y divide-line list-none p-0">
                {results.map((r) => (
                  <li key={r.id}>
                    <button type="button" className="w-full text-left px-3 py-3 min-h-11 hover:bg-paper-2" onClick={() => place(r.position, r.label, r.precision, "search")}>
                      <span className="block font-medium">{r.label}</span>
                      <span className="block text-xs text-ink-3">{r.secondary}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div>
          <label htmlFor="lga-pick" className="label">No map? Choose your local government area</label>
          <select id="lga-pick" className="field" value="" disabled={!lgas} onChange={(e) => {
            const u = lgas?.find((l) => l.id === e.target.value);
            if (!u) return;
            const [lng, lat] = geometryCentroid(u.geometry);
            place({ lng: Number(lng.toFixed(5)), lat: Number(lat.toFixed(5)) }, `${u.name} (area centre)`, "locality-centroid", "search", false);
            if (map) flyTo(map, { bounds: [[geometryBBox(u.geometry)[0], geometryBBox(u.geometry)[1]], [geometryBBox(u.geometry)[2], geometryBBox(u.geometry)[3]]], padding: 40 });
          }}>
            <option value="">Select an LGA</option>
            {lgas?.slice().sort((a, b) => a.name.localeCompare(b.name)).map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>

        {geoError && <Notice tone="warning">The boundary data could not be loaded, so coverage cannot be checked right now. Try reloading the page.</Notice>}

        {pin && resolution ? (
          <section aria-labelledby="pinres" className="panel p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 id="pinres" className="!text-xl">{pin.label}</h2>
              {confirmed ? <Tag tone="success">Confirmed</Tag> : <Tag>Not confirmed</Tag>}
            </div>
            <dl className="grid grid-cols-[7rem_1fr] gap-y-1.5 text-sm">
              <dt className="text-ink-3">Position</dt>
              <dd className="mono">{pin.position.lat.toFixed(5)}, {pin.position.lng.toFixed(5)}</dd>
              <dt className="text-ink-3">Precision</dt>
              <dd>{pin.precision === "address" ? "Address-level" : pin.precision === "locality-centroid" ? "Locality centre (about 1 km)" : "Where you placed the pin"}</dd>
              <dt className="text-ink-3">LGA</dt>
              <dd>{resolution.lgaName ?? "Outside the Lagos LGAs loaded here"}</dd>
              {resolution.stateName && (<><dt className="text-ink-3">State</dt><dd>{resolution.stateName}</dd></>)}
            </dl>
            <CoverageBadge resolution={resolution} />
            {!confirmed && (
              <button type="button" className="btn btn-primary w-full" onClick={confirm}>Confirm this location</button>
            )}
          </section>
        ) : (
          <Notice className="text-sm">Search or place a pin to see coverage and delivery options.</Notice>
        )}

        {confirmed && estimate && (
          <section aria-labelledby="opts" className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 id="opts" className="!text-xl">Delivery options</h2>
              <Tag tone="sample">Sample rules</Tag>
            </div>
            <p className="hint">For {cart.weightKg > 0 ? `your cart, about ${Math.round(weightKg)} kg` : `an example order of about ${EXAMPLE_WEIGHT_KG} kg (add items for a real estimate)`}.</p>
            <div role="radiogroup" aria-label="Delivery option" className="space-y-2">
              {estimate.options.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  role="radio"
                  aria-checked={chosen === o.id}
                  disabled={!o.available}
                  onClick={() => setDeliveryOption(o.id)}
                  className={`w-full text-left p-3 rounded-md border min-h-[4rem] ${chosen === o.id ? "border-ember border-2 bg-ember-tint/50" : "border-line-strong bg-card hover:border-ink"} disabled:opacity-60 disabled:hover:border-line-strong`}
                >
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="font-medium">{o.label}</span>
                    <span className="mono text-sm">{o.feeKobo === null ? (o.available ? "Quote" : "Unavailable") : o.feeKobo === 0 ? "No charge" : formatNaira(o.feeKobo)}</span>
                  </span>
                  <span className="block text-xs text-ink-3 mt-1">{o.detail}</span>
                  {o.note && <span className="block text-xs text-ink-2 mt-1">{o.note}</span>}
                </button>
              ))}
            </div>
          </section>
        )}
        <p className="hint">{SAMPLE_DISCLAIMER}</p>
      </div>

      <div className="order-1 lg:order-2">
        <div className={`relative border border-line-strong rounded-md overflow-hidden bg-paper-2 ${compact ? "h-[22rem]" : "h-[26rem] lg:h-[calc(100dvh-14rem)] lg:min-h-[32rem]"}`}>
          <div className="absolute inset-0"><div ref={containerRef} className="h-full w-full" /></div>
          {!map && <div className="absolute inset-0 grid place-items-center skel rounded-none"><span className="sr-only">Loading map</span></div>}
          <div className="absolute left-3 top-3 bg-card/95 border border-line rounded-sm p-2.5 text-xs shadow-raised max-w-[14rem]">
            <p className="eyebrow mb-1.5">Sample zones</p>
            <ul className="space-y-1 list-none p-0">
              {SAMPLE_ZONES.map((z, i) => (
                <li key={z.id} className="flex items-center gap-2"><span aria-hidden="true" className="w-3 h-3 border border-ink/40" style={{ background: chart.zones[i] }} />{z.short}{z.pricing ? "" : " (no price rule)"}</li>
              ))}
              <li className="flex items-center gap-2"><span aria-hidden="true" className="w-3 h-3 border border-ink/40 bg-paper-2" />Outside sample zones</li>
              <li className="flex items-center gap-2"><span aria-hidden="true" className="w-2.5 h-2.5 rotate-45 bg-ink" />Sample pickup point</li>
            </ul>
          </div>
          {hoveredUnit && (
            <div className="absolute left-3 bottom-8 bg-ink text-paper text-xs px-2.5 py-1.5 rounded-sm pointer-events-none">
              {hoveredUnit.name}: {hoveredZone ? hoveredZone.short : "outside sample zones"}
            </div>
          )}
          {basemap === "offline" && <p className="absolute right-3 bottom-8 bg-card/90 text-[0.6875rem] px-2 py-1 border border-line rounded-sm">Street basemap unavailable: showing boundaries only</p>}
        </div>
      </div>
    </div>
  );
}
