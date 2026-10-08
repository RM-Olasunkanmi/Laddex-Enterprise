"use client";

import "maplibre-gl/dist/maplibre-gl.css";

import type { Map as MlMap, StyleSpecification } from "maplibre-gl";
import { useEffect, useRef, useState } from "react";

import { map as mapTokens } from "@/lib/design/tokens";
import { LAGOS_BOUNDS } from "@/lib/geo/geography";

export type MaplibreModule = typeof import("maplibre-gl");
export type BasemapState = "loading" | "online" | "offline";

const ONLINE_STYLE = "https://tiles.openfreemap.org/styles/positron";

/** Plain background with no remote dependencies. Boundaries are drawn on top of it as layers. */
const OFFLINE_STYLE: StyleSpecification = {
  version: 8,
  sources: {},
  layers: [{ id: "background", type: "background", paint: { "background-color": mapTokens.background } }],
};

export const prefersReducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Camera moves are deliberate and short. They are skipped entirely under reduced motion. */
export function flyTo(map: MlMap, opts: Parameters<MlMap["fitBounds"]>[1] & { bounds: [[number, number], [number, number]] }) {
  const { bounds, ...rest } = opts;
  map.fitBounds(bounds, { duration: prefersReducedMotion() ? 0 : 650, maxZoom: 14, ...rest });
}

interface Options {
  bounds?: [[number, number], [number, number]];
  /** Keep the map still for a read-only preview. */
  interactive?: boolean;
  ariaLabel: string;
}

/**
 * Creates and owns one MapLibre instance. maplibre-gl is imported on demand so it stays out of
 * every other page's bundle. The online basemap is probed first; if it cannot be reached
 * (offline, blocked, rate-limited) the map falls back to a plain background and keeps working.
 * The instance and all listeners are removed on unmount.
 */
export function useMapLibre({ bounds = LAGOS_BOUNDS, interactive = true, ariaLabel }: Options) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState<{ map: MlMap; ml: MaplibreModule } | null>(null);
  const [basemap, setBasemap] = useState<BasemapState>("loading");

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let cancelled = false;
    let instance: MlMap | null = null;
    const ctl = new AbortController();

    (async () => {
      const [ml, online] = await Promise.all([
        import("maplibre-gl").then((m) => (m.default ?? m) as MaplibreModule),
        (async () => {
          const timer = window.setTimeout(() => ctl.abort(), 3500);
          try {
            const res = await fetch(ONLINE_STYLE, { signal: ctl.signal });
            return res.ok;
          } catch {
            return false;
          } finally {
            window.clearTimeout(timer);
          }
        })(),
      ]);
      if (cancelled) return;
      instance = new ml.Map({
        container: el,
        style: online ? ONLINE_STYLE : OFFLINE_STYLE,
        bounds,
        fitBoundsOptions: { padding: 24 },
        interactive,
        attributionControl: false,
        dragRotate: false,
        pitchWithRotate: false,
        touchPitch: false,
        cooperativeGestures: false,
      });
      instance.addControl(new ml.AttributionControl({ compact: true, customAttribution: "Boundaries: geoBoundaries (GRID3), CC BY 4.0" }), "bottom-right");
      if (interactive) instance.addControl(new ml.NavigationControl({ showCompass: false }), "top-right");
      instance.getCanvas().setAttribute("aria-label", ariaLabel);
      instance.touchZoomRotate.disableRotation();
      instance.once("load", () => {
        if (cancelled || !instance) return;
        setBasemap(online ? "online" : "offline");
        setReady({ map: instance, ml });
      });
    })();

    return () => {
      cancelled = true;
      ctl.abort();
      instance?.remove();
      setReady(null);
    };
    // The map is created once per mount; bounds and label are initial values.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { containerRef, map: ready?.map ?? null, ml: ready?.ml ?? null, basemap };
}
