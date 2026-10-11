"use client";

import { useEffect, useRef } from "react";

import type { LngLat } from "@/features/delivery/types";
import type { Marker } from "maplibre-gl";

import { useMapLibre } from "@/components/maps/use-maplibre";

/**
 * Optional map for placing an exact delivery pin. It is only mounted when the customer asks for
 * it (MapLibre and the basemap tiles are a few hundred KB), and checkout never requires it.
 */
export default function PinMap({
  bounds,
  position,
  onPin,
}: {
  bounds: [[number, number], [number, number]];
  position: LngLat | null;
  onPin: (p: LngLat) => void;
}) {
  const { containerRef, map, ml, basemap } = useMapLibre({
    bounds,
    ariaLabel: "Map of your area. Tap to place your delivery pin, then drag it to adjust.",
  });
  const markerRef = useRef<Marker | null>(null);
  const onPinRef = useRef(onPin);
  useEffect(() => {
    onPinRef.current = onPin;
  }, [onPin]);

  useEffect(() => {
    if (!map) return;
    const click = (e: { lngLat: { lng: number; lat: number } }) =>
      onPinRef.current({
        lng: Number(e.lngLat.lng.toFixed(5)),
        lat: Number(e.lngLat.lat.toFixed(5)),
      });
    map.on("click", click);
    return () => void map.off("click", click);
  }, [map]);

  // The map is rebuilt on theme change: drop the old marker so it is recreated on the new instance.
  useEffect(() => {
    markerRef.current?.remove();
    markerRef.current = null;
  }, [map]);

  useEffect(() => {
    if (!map || !ml) return;
    if (!position) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }
    if (!markerRef.current) {
      const el = document.createElement("div");
      el.className = "pin-marker";
      el.setAttribute("role", "img");
      el.setAttribute("aria-label", "Your delivery pin");
      el.innerHTML = `<svg class="pin-svg" width="30" height="40" viewBox="0 0 30 40" aria-hidden="true"><path d="M15 38C15 38 28 25 28 14.5A13 13 0 0 0 2 14.5C2 25 15 38 15 38Z" fill="#1F4A33" stroke="#FFFDF8" stroke-width="2"/><circle cx="15" cy="14.5" r="5" fill="#FFFDF8"/></svg>`;
      const m = new ml.Marker({ element: el, draggable: true, anchor: "bottom" })
        .setLngLat([position.lng, position.lat])
        .addTo(map);
      m.on("dragend", () => {
        const ll = m.getLngLat();
        onPinRef.current({
          lng: Number(ll.lng.toFixed(5)),
          lat: Number(ll.lat.toFixed(5)),
        });
      });
      markerRef.current = m;
    } else markerRef.current.setLngLat([position.lng, position.lat]);
  }, [map, ml, position]);

  useEffect(
    () => () => {
      markerRef.current?.remove();
      markerRef.current = null;
    },
    [],
  );

  return (
    <div className="relative h-72 overflow-hidden rounded-md border border-line-strong bg-paper-2 sm:h-80">
      <div ref={containerRef} className="absolute inset-0" />
      {!map && (
        <div className="skel absolute inset-0 rounded-none" aria-hidden="true" />
      )}
      {basemap === "offline" && (
        <p className="absolute bottom-2 left-2 rounded-sm border border-line bg-card/95 px-2 py-1 text-xs">
          Street map unavailable. Describe the place in the address box instead.
        </p>
      )}
    </div>
  );
}
