"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { CoverageBadge } from "./coverage-badge";

import type {
  DeliveryLocation,
  GeocodeResult,
  LngLat,
  LocationResolution,
} from "@/features/delivery/types";
import type { Marker } from "maplibre-gl";

import { useCart } from "@/components/commerce/use-customer-pricing";
import { Notice, Tag } from "@/components/lx/primitives";
import {
  addBoundaryLayers,
  bindHover,
  setFeatureStates,
  updateSource,
} from "@/components/maps/layers";
import { flyTo, useMapLibre } from "@/components/maps/use-maplibre";
import {
  searchWithFallback,
  searchWithin,
  type SearchBox,
} from "@/features/delivery/adapters/geocoders";
import { estimateDelivery } from "@/features/delivery/pricing";
import { resolveLocation } from "@/features/delivery/resolve";
import {
  deliveryStore,
  setDeliveryLocation,
  setDeliveryOption,
} from "@/features/delivery/store";
import { REGIONS, regionOfState } from "@/fixtures/geography/regions";
import { useTheme } from "@/lib/design/theme";
import { chartByTheme } from "@/lib/design/tokens";
import { formatNaira } from "@/lib/formatters";
import {
  loadStateLgas,
  loadStates,
  toFeatureCollection,
  type AdminUnit,
} from "@/lib/geo/geography";
import { geometryBBox, geometryCentroid, isValidLngLat } from "@/lib/geo/pip";

const EXAMPLE_WEIGHT_KG = 24;
const REGION_KEYS = [
  "palm",
  "tapioca",
  "garri",
  "retail",
  "wholesale",
  "events",
] as const;

function pinElement(label: string) {
  const el = document.createElement("div");
  el.setAttribute("role", "img");
  el.setAttribute("aria-label", label);
  el.className = "pin-marker";
  el.style.position = "relative";
  el.innerHTML = `<span class="pin-pulse"></span><svg class="pin-svg" width="32" height="42" viewBox="0 0 30 40" aria-hidden="true"><path d="M15 38C15 38 28 25 28 14.5A13 13 0 0 0 2 14.5C2 25 15 38 15 38Z" fill="#B3261E" stroke="#17140F" stroke-width="2"/><circle cx="15" cy="14.5" r="5" fill="#FFF8F0"/></svg>`;
  el.style.cursor = "grab";
  return el;
}

type Pin = {
  position: LngLat;
  label: string;
  precision: DeliveryLocation["precision"];
  source: DeliveryLocation["source"];
};

export function LocationPicker({
  compact = false,
  initialQuery = "",
}: {
  compact?: boolean;
  initialQuery?: string;
}) {
  const saved = deliveryStore.use();
  const savedHydrated = deliveryStore.useHydrated();
  const cart = useCart();
  const theme = useTheme();
  const weightKg = cart.weightKg > 0 ? cart.weightKg : EXAMPLE_WEIGHT_KG;

  const [states, setStates] = useState<AdminUnit[] | null>(null);
  const [lgas, setLgas] = useState<AdminUnit[] | null>(null);
  const [lgaState, setLgaState] = useState<string | null>(null);
  const [geoError, setGeoError] = useState(false);
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<GeocodeResult[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [degraded, setDegraded] = useState(false);
  const [pin, setPin] = useState<Pin | null>(null);
  const [addressLine, setAddressLine] = useState("");
  const [lmResults, setLmResults] = useState<GeocodeResult[] | null>(null);
  const [lmBusy, setLmBusy] = useState(false);
  const [lmMsg, setLmMsg] = useState<string | null>(null);
  const [gpsBusy, setGpsBusy] = useState(false);
  const [hover, setHover] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const statesRef = useRef<AdminUnit[] | null>(null);

  const { containerRef, map, ml, basemap } = useMapLibre({
    ariaLabel: "Delivery map of Nigeria. Click to place your delivery pin.",
  });

  useEffect(() => {
    loadStates()
      .then((s) => {
        setStates(s);
        statesRef.current = s;
      })
      .catch(() => setGeoError(true));
  }, []);

  const restored = useRef(false);
  useEffect(() => {
    if (restored.current || !savedHydrated || !saved.location) return;
    restored.current = true;
    const l = saved.location;
    setPin({
      position: l.position,
      label: l.label,
      precision: l.precision,
      source: l.source,
    });
    setAddressLine(l.addressLine ?? "");
  }, [saved.location, savedHydrated]);

  // The state under the pin (cheap: 37 outlines), then that state's LGAs on demand.
  const stateOfPin = useMemo(
    () =>
      pin && states ? resolveLocation(pin.position, states).stateId : null,
    [pin, states],
  );
  const activeState = stateOfPin ?? lgaState;
  useEffect(() => {
    if (!stateOfPin) return;
    let live = true;
    loadStateLgas(stateOfPin)
      .then((l) => {
        if (live) {
          setLgas(l);
          setLgaState(stateOfPin);
        }
      })
      .catch(() => live && setGeoError(true));
    return () => {
      live = false;
    };
  }, [stateOfPin]);

  const resolution: LocationResolution | null = useMemo(
    () =>
      pin && states
        ? resolveLocation(
            pin.position,
            states,
            lgaState === stateOfPin ? lgas : null,
          )
        : null,
    [pin, states, lgas, lgaState, stateOfPin],
  );

  // State layer shaded by delivery region; LGA layer for the active state (outline only).
  useEffect(() => {
    if (!map || !ml || !states) return;
    const c = chartByTheme[theme];
    addBoundaryLayers(map, "states", toFeatureCollection(states), {
      fillOpacity: 0.34,
    });
    setFeatureStates(
      map,
      "states",
      states.map((s) => s.id),
      (id) => {
        const i = REGIONS.findIndex((r) => r.stateIds.includes(id));
        return { fill: i >= 0 ? c[REGION_KEYS[i]] : c.neutral };
      },
    );
    return bindHover(map, "states", (id) => setHover(id));
  }, [map, ml, states, theme]);

  useEffect(() => {
    if (!map || !lgas || !lgaState) return;
    const fc = toFeatureCollection(lgas);
    if (map.getSource("lgas")) updateSource(map, "lgas", fc);
    else {
      addBoundaryLayers(map, "lgas", fc, { fillOpacity: 0 });
    }
  }, [map, lgas, lgaState]);

  const place = useCallback(
    (
      position: LngLat,
      label: string,
      precision: DeliveryLocation["precision"],
      source: DeliveryLocation["source"],
      fly = true,
    ) => {
      if (!isValidLngLat(position.lng, position.lat)) return;
      setPin({ position, label, precision, source });
      if (map && fly) {
        const d = precision === "address" || precision === "gps" ? 0.01 : 0.12;
        flyTo(map, {
          bounds: [
            [position.lng - d, position.lat - d],
            [position.lng + d, position.lat + d],
          ],
          padding: 60,
          maxZoom: precision === "address" || precision === "gps" ? 15 : 9.5,
        });
      }
    },
    [map],
  );

  useEffect(() => {
    if (!map) return;
    const onClick = (e: { lngLat: { lng: number; lat: number } }) => {
      const position = {
        lng: Number(e.lngLat.lng.toFixed(5)),
        lat: Number(e.lngLat.lat.toFixed(5)),
      };
      const r = statesRef.current
        ? resolveLocation(position, statesRef.current)
        : null;
      place(
        position,
        r?.stateName ? `Pin in ${r.stateName}` : "Pinned location",
        "map-pin",
        "map-pin",
        false,
      );
    };
    map.on("click", onClick);
    return () => void map.off("click", onClick);
  }, [map, place]);

  useEffect(() => {
    if (!map || !ml) return;
    if (!pin) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }
    if (!markerRef.current) {
      const m = new ml.Marker({
        element: pinElement("Delivery pin"),
        draggable: true,
        anchor: "bottom",
      })
        .setLngLat([pin.position.lng, pin.position.lat])
        .addTo(map);
      m.on("dragend", () => {
        const ll = m.getLngLat();
        const position = {
          lng: Number(ll.lng.toFixed(5)),
          lat: Number(ll.lat.toFixed(5)),
        };
        const r = statesRef.current
          ? resolveLocation(position, statesRef.current)
          : null;
        setPin({
          position,
          label: r?.stateName ? `Pin in ${r.stateName}` : "Pinned location",
          precision: "map-pin",
          source: "map-pin",
        });
      });
      markerRef.current = m;
    } else markerRef.current.setLngLat([pin.position.lng, pin.position.lat]);
  }, [map, ml, pin]);

  // The map is rebuilt on theme change: drop the old marker so it is recreated on the new instance.
  useEffect(() => {
    markerRef.current?.remove();
    markerRef.current = null;
  }, [map]);
  useEffect(
    () => () => {
      markerRef.current?.remove();
      markerRef.current = null;
    },
    [],
  );

  const runSearch = useCallback(
    async (q: string) => {
      if (q.trim().length < 2) return;
      abortRef.current?.abort();
      const ctl = new AbortController();
      abortRef.current = ctl;
      setSearching(true);
      try {
        const out = await searchWithFallback(q, ctl.signal);
        setResults(out.results);
        setDegraded(out.degraded);
        if (out.results.length === 1)
          place(
            out.results[0].position,
            out.results[0].label,
            out.results[0].precision,
            "search",
          );
      } catch (e) {
        if ((e as Error).name !== "AbortError") setResults([]);
      } finally {
        if (abortRef.current === ctl) setSearching(false);
      }
    },
    [place],
  );

  const autoRan = useRef(false);
  useEffect(() => {
    if (initialQuery && map && !autoRan.current) {
      autoRan.current = true;
      void runSearch(initialQuery);
    }
  }, [initialQuery, map, runSearch]);

  const pickState = (stateId: string) => {
    const u = states?.find((s) => s.id === stateId);
    if (!u) return;
    const [lng, lat] = geometryCentroid(u.geometry);
    place(
      { lng: Number(lng.toFixed(5)), lat: Number(lat.toFixed(5)) },
      `${u.name} State (centre)`,
      "locality-centroid",
      "search",
      false,
    );
    if (map) {
      const b = geometryBBox(u.geometry);
      flyTo(map, {
        bounds: [
          [b[0], b[1]],
          [b[2], b[3]],
        ],
        padding: 40,
        maxZoom: 9,
      });
    }
  };
  const pickLga = (lgaId: string) => {
    const u = lgas?.find((l) => l.id === lgaId);
    if (!u) return;
    const [lng, lat] = geometryCentroid(u.geometry);
    place(
      { lng: Number(lng.toFixed(5)), lat: Number(lat.toFixed(5)) },
      `${u.name} (area centre)`,
      "locality-centroid",
      "search",
      false,
    );
    if (map) {
      const b = geometryBBox(u.geometry);
      flyTo(map, {
        bounds: [
          [b[0], b[1]],
          [b[2], b[3]],
        ],
        padding: 40,
        maxZoom: 11,
      });
    }
  };

  const searchBox = (): SearchBox | null => {
    const u =
      lgas?.find((l) => l.id === resolution?.lgaId) ??
      states?.find((x) => x.id === resolution?.stateId);
    return u ? [u.bbox[0], u.bbox[1], u.bbox[2], u.bbox[3]] : null;
  };
  const areaName = resolution?.lgaName ?? resolution?.stateName ?? "your area";

  /** Landmark or street search inside the chosen local government area (or state, if no area is chosen). */
  const findLandmark = async (term: string) => {
    const box = searchBox();
    if (!box || term.trim().length < 3) {
      setLmMsg(
        "Type at least three letters, for example a street, market or church name.",
      );
      return;
    }
    setLmBusy(true);
    setLmMsg(null);
    try {
      const out = await searchWithin(term, box);
      setLmResults(out);
      if (out.length === 0)
        setLmMsg(
          `Nothing found for "${term}" in ${areaName}. Try another spelling, or click the map to drop a pin and describe the place in the box above.`,
        );
    } catch {
      setLmResults(null);
      setLmMsg(
        "Landmark search needs the live map service, which is not reachable right now. Describe the place in the box above and drop a pin on the map instead.",
      );
    } finally {
      setLmBusy(false);
    }
  };

  const locate = () => {
    if (!("geolocation" in navigator)) {
      setLmMsg(
        "This browser cannot share your location. Choose your state and area, then drop a pin.",
      );
      return;
    }
    setGpsBusy(true);
    setLmMsg(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsBusy(false);
        place(
          {
            lng: Number(pos.coords.longitude.toFixed(5)),
            lat: Number(pos.coords.latitude.toFixed(5)),
          },
          "My current location",
          "gps",
          "gps",
        );
      },
      (err) => {
        setGpsBusy(false);
        setLmMsg(
          err.code === err.PERMISSION_DENIED
            ? "Location permission was refused. You can still choose your state and area, or drop a pin."
            : "Your location could not be read. Try again outdoors, or drop a pin on the map.",
        );
      },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  };

  const addressOk = addressLine.trim().length >= 5;

  const estimate = resolution
    ? estimateDelivery({ resolution, weightKg })
    : null;
  const confirmed = !!(
    pin &&
    saved.location &&
    saved.location.position.lng === pin.position.lng &&
    saved.location.position.lat === pin.position.lat &&
    (saved.location.addressLine ?? "") === addressLine.trim()
  );
  const chosen = saved.optionId;
  const confirm = () => {
    if (!pin || !resolution || !addressOk) return;
    setDeliveryLocation(
      { ...pin, addressLine: addressLine.trim(), confirmed: true },
      resolution,
    );
  };

  const hoveredState = hover ? states?.find((s) => s.id === hover) : null;
  const hoveredRegion = hover ? regionOfState(hover) : null;
  const sortedStates = useMemo(
    () => states?.slice().sort((a, b) => a.name.localeCompare(b.name)),
    [states],
  );
  const sortedLgas = useMemo(
    () =>
      lgaState === activeState
        ? lgas?.slice().sort((a, b) => a.name.localeCompare(b.name))
        : undefined,
    [lgas, lgaState, activeState],
  );

  return (
    <div className={`grid gap-6 ${compact ? "" : "lg:grid-cols-[24rem_1fr]"}`}>
      <div className="space-y-5 order-2 lg:order-1">
        <fieldset className="grid gap-3">
          <legend className="label">No map? Choose your state and area</legend>
          <div>
            <label htmlFor="state-pick" className="sr-only">
              State
            </label>
            <select
              id="state-pick"
              className="field"
              value={stateOfPin ?? ""}
              disabled={!states}
              onChange={(e) => e.target.value && pickState(e.target.value)}
            >
              <option value="">Select a state</option>
              {sortedStates?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="lga-pick" className="sr-only">
              Local government area
            </label>
            <select
              id="lga-pick"
              className="field"
              value={resolution?.lgaId ?? ""}
              disabled={!sortedLgas}
              onChange={(e) => e.target.value && pickLga(e.target.value)}
            >
              <option value="">
                {sortedLgas
                  ? "Select a local government area"
                  : "Choose a state first"}
              </option>
              {sortedLgas?.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
        </fieldset>

        {geoError && (
          <Notice tone="warning">
            Boundary data could not be loaded, so the state cannot be checked
            right now. Try reloading the page.
          </Notice>
        )}

        <div role="search">
          <label htmlFor="addr" className="label">
            Or search for a town or city
          </label>
          <div className="flex gap-2">
            <input
              id="addr"
              className="field"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void runSearch(query);
                }
              }}
              placeholder="e.g. Ibadan, Enugu, Kano"
              autoComplete="off"
            />
            <button
              type="button"
              className="btn btn-ink"
              onClick={() => void runSearch(query)}
              disabled={searching || query.trim().length < 2}
            >
              {searching ? "Searching" : "Search"}
            </button>
          </div>
          <p className="hint mt-1.5">
            Or click the map to drop a pin, then drag it to adjust.
          </p>
        </div>

        {results && (
          <div aria-live="polite">
            {degraded && (
              <Notice tone="warning" className="mb-2">
                Live address search is unavailable. Showing state capitals and
                major towns instead.
              </Notice>
            )}
            {results.length === 0 ? (
              <p className="text-sm text-ink-2">
                No matches. Try a nearby town, choose a state below, or place a
                pin on the map.
              </p>
            ) : (
              <ul className="panel divide-y divide-line list-none p-0">
                {results.map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      className="w-full text-left px-3 py-3 min-h-11 hover:bg-paper-2"
                      onClick={() =>
                        place(r.position, r.label, r.precision, "search")
                      }
                    >
                      <span className="block font-medium">{r.label}</span>
                      <span className="block text-xs text-ink-3">
                        {r.secondary}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {pin && resolution && resolution.coverage === "in-nigeria" && (
          <section aria-labelledby="addr-step" className="panel p-4 space-y-3">
            <h2 id="addr-step" className="!text-xl">
              Your address in {areaName}
            </h2>
            <div>
              <label htmlFor="addr-line" className="label">
                House number, street, estate or nearest landmark
              </label>
              <textarea
                id="addr-line"
                className="field min-h-20"
                value={addressLine}
                onChange={(e) => setAddressLine(e.target.value)}
                placeholder="e.g. 12 Adeola Street, behind the Total filling station"
                autoComplete="street-address"
              />
              <p className="hint mt-1">
                Write it the way you would tell a rider. This is what the
                delivery person reads.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="btn btn-line btn-sm min-h-10"
                onClick={locate}
                disabled={gpsBusy}
              >
                {gpsBusy ? "Finding you" : "Use my current location"}
              </button>
              <button
                type="button"
                className="btn btn-ink btn-sm min-h-10"
                onClick={() => void findLandmark(addressLine)}
                disabled={lmBusy}
              >
                {lmBusy ? "Searching" : "Find it on the map"}
              </button>
            </div>
            <div>
              <p className="eyebrow mb-1.5">
                Search the map for a landmark in {areaName}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "Market",
                  "Church",
                  "Mosque",
                  "School",
                  "Filling station",
                  "Bank",
                  "Hospital",
                  "Hotel",
                ].map((t) => (
                  <button
                    key={t}
                    type="button"
                    className="rounded-full border border-line-strong px-3 min-h-9 text-sm hover:border-ink hover:bg-paper-2 transition-colors"
                    onClick={() => void findLandmark(t)}
                    disabled={lmBusy}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div aria-live="polite">
              {lmMsg && <p className="text-sm text-ink-2">{lmMsg}</p>}
              {lmResults && lmResults.length > 0 && (
                <ul className="mt-2 divide-y divide-line border border-line rounded-md list-none p-0 max-h-56 overflow-auto">
                  {lmResults.map((r) => (
                    <li key={r.id}>
                      <button
                        type="button"
                        className="w-full text-left px-3 py-2.5 min-h-11 hover:bg-paper-2"
                        onClick={() => {
                          place(r.position, r.label, "address", "search");
                          setAddressLine((cur) =>
                            cur.trim()
                              ? cur
                              : [r.label, r.secondary]
                                  .filter(Boolean)
                                  .join(", "),
                          );
                        }}
                      >
                        <span className="block font-medium">{r.label}</span>
                        <span className="block text-xs text-ink-3">
                          {r.secondary}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        )}

        {pin && resolution ? (
          <section aria-labelledby="pinres" className="panel p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 id="pinres" className="!text-xl">
                {pin.label}
              </h2>
              {confirmed ? (
                <Tag tone="success">Confirmed</Tag>
              ) : (
                <Tag>Not confirmed</Tag>
              )}
            </div>
            <dl className="grid grid-cols-[7rem_1fr] gap-y-1.5 text-sm">
              <dt className="text-ink-3">Position</dt>
              <dd className="mono">
                {pin.position.lat.toFixed(5)}, {pin.position.lng.toFixed(5)}
              </dd>
              <dt className="text-ink-3">Precision</dt>
              <dd>
                {pin.precision === "gps"
                  ? "Your device location"
                  : pin.precision === "address"
                    ? "Address-level"
                    : pin.precision === "locality-centroid"
                      ? "Area centre (several km)"
                      : "Where you placed the pin"}
              </dd>
              <dt className="text-ink-3">State</dt>
              <dd>{resolution.stateName ?? "Outside Nigeria"}</dd>
              <dt className="text-ink-3">Area (LGA)</dt>
              <dd>
                {resolution.lgaName ?? (resolution.stateName ? "Loading" : "—")}
              </dd>
              {resolution.regionName && (
                <>
                  <dt className="text-ink-3">Region</dt>
                  <dd>{resolution.regionName}</dd>
                </>
              )}
            </dl>
            <CoverageBadge resolution={resolution} />
            {!confirmed && resolution.coverage === "in-nigeria" && (
              <button
                type="button"
                className="btn btn-primary w-full"
                onClick={confirm}
                disabled={!addressOk}
              >
                Confirm this address
              </button>
            )}
            {!confirmed && !addressOk && (
              <p className="hint">
                Add your street or nearest landmark above to confirm.
              </p>
            )}
          </section>
        ) : (
          <Notice className="text-sm">
            Search, choose a state or place a pin to check delivery availability.
          </Notice>
        )}

        {confirmed && estimate && (
          <section aria-labelledby="opts" className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 id="opts" className="!text-xl">
                Illustrative delivery options
              </h2>
              <Tag tone="sample">Sample rates</Tag>
            </div>
            <p className="hint">
              For{" "}
              {cart.weightKg > 0
                ? `your cart, about ${Math.round(weightKg)} kg`
                : `an example order of about ${EXAMPLE_WEIGHT_KG} kg (add items for a real estimate)`}
              .
            </p>
            <div
              role="radiogroup"
              aria-label="Delivery option"
              className="space-y-2"
            >
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
                    <span className="mono text-sm">
                      {o.feeKobo === null
                        ? o.available
                          ? "Quote"
                          : "Unavailable"
                        : o.feeKobo === 0
                          ? "No charge"
                          : formatNaira(o.feeKobo)}
                    </span>
                  </span>
                  <span className="block text-xs text-ink-3 mt-1">
                    {o.detail}
                  </span>
                  {o.note && (
                    <span className="block text-xs text-ink-2 mt-1">
                      {o.note}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </section>
        )}
        <p className="hint">
          Delivery rates are sample values per region and order weight. They are
          not Laddex&rsquo;s confirmed prices or coverage. Confirm availability
          directly with Laddex; no delivery time is promised.
        </p>
      </div>

      <div className="order-1 lg:order-2">
        <div
          className={`relative border border-line-strong rounded-md overflow-hidden bg-paper-2 ${compact ? "h-[22rem]" : "h-[26rem] lg:h-[calc(100dvh-14rem)] lg:min-h-[32rem]"}`}
        >
          <div className="absolute inset-0">
            <div ref={containerRef} className="h-full w-full" />
          </div>
          {!map && (
            <div className="absolute inset-0 grid place-items-center skel rounded-none">
              <span className="sr-only">Loading map</span>
            </div>
          )}
          <div className="absolute left-3 top-3 bg-card/95 border border-line rounded-sm p-2.5 text-xs shadow-raised max-w-[14rem]">
            <p className="eyebrow mb-1.5">Delivery regions</p>
            <ul className="space-y-1 list-none p-0">
              {REGIONS.map((r, i) => (
                <li key={r.id} className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="w-3 h-3 border border-ink/40"
                    style={{ background: chartByTheme[theme][REGION_KEYS[i]] }}
                  />
                  {r.name}
                </li>
              ))}
            </ul>
          </div>
          {hoveredState && (
            <div className="absolute left-3 bottom-8 bg-ink text-paper text-xs px-2.5 py-1.5 rounded-sm pointer-events-none">
              {hoveredState.name}: {hoveredRegion?.name}
            </div>
          )}
          {basemap === "offline" && (
            <p className="absolute right-3 bottom-8 bg-card/90 text-[0.6875rem] px-2 py-1 border border-line rounded-sm">
              Street basemap unavailable: showing boundaries only
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
