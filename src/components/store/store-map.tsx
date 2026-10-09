"use client";

import { useEffect, useRef, useState } from "react";

import type { Marker } from "maplibre-gl";

import { flyTo, useMapLibre } from "@/components/maps/use-maplibre";
import { BUSINESS } from "@/content/business";
import {
  appleMapsDirectionsUrl,
  googleMapsDirectionsUrl,
  osmDirectionsUrl,
  STORE,
  STORE_CONTACT,
} from "@/lib/store";

function storeElement() {
  const el = document.createElement("div");
  el.setAttribute("role", "img");
  el.setAttribute("aria-label", `${STORE.name} store location`);
  el.innerHTML = `<svg width="34" height="44" viewBox="0 0 30 40" aria-hidden="true"><path d="M15 38C15 38 28 25 28 14.5A13 13 0 0 0 2 14.5C2 25 15 38 15 38Z" fill="#B23A0E" stroke="#1E1B17" stroke-width="2"/><circle cx="15" cy="14.5" r="5" fill="#FFF8F0"/></svg>`;
  return el;
}

export function DirectionButtons({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`flex flex-wrap gap-2 ${compact ? "" : "mt-4"}`}>
      <a
        className="btn btn-primary"
        href={googleMapsDirectionsUrl()}
        target="_blank"
        rel="noopener noreferrer"
      >
        Google Maps (opens in a new tab) &rarr;
      </a>
      <a
        className="btn btn-line"
        href={appleMapsDirectionsUrl()}
        target="_blank"
        rel="noopener noreferrer"
      >
        Apple Maps (opens in a new tab)
      </a>
      <a
        className="btn btn-line"
        href={osmDirectionsUrl()}
        target="_blank"
        rel="noopener noreferrer"
      >
        OpenStreetMap (opens in a new tab)
      </a>
    </div>
  );
}

export function CopyAddressButton() {
  const [copied, setCopied] = useState(false);
  if (!BUSINESS.address) return null;
  return (
    <button
      type="button"
      className="btn btn-quiet btn-sm"
      onClick={() => {
        void navigator.clipboard?.writeText(BUSINESS.address).then(() => {
          setCopied(true);
          window.setTimeout(() => setCopied(false), 2000);
        });
      }}
    >
      {copied ? "Copied!" : "Copy address"}
    </button>
  );
}

export function CallButtons({ primary = false }: { primary?: boolean }) {
  const btn = primary ? "btn btn-primary" : "btn btn-line";
  return (
    <>
      <a href={STORE_CONTACT.phoneHref} className={btn}>
        Call {BUSINESS.phone || "the store"}
      </a>
      <a
        href={STORE_CONTACT.whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-line"
      >
        WhatsApp us (opens in a new tab)
      </a>
    </>
  );
}

/**
 * Read-only map centred on an approximate Epe-area pin, with a marker and popup.
 * Uses the same MapLibre stack (and offline fallback) as the delivery and
 * dashboard maps, so no new dependency or tile contract.
 */
export function StoreMap({ height = "h-[22rem]" }: { height?: string }) {
  const { containerRef, map, ml, basemap } = useMapLibre({
    bounds: [
      [STORE.position.lng - 0.06, STORE.position.lat - 0.06],
      [STORE.position.lng + 0.06, STORE.position.lat + 0.06],
    ],
    interactive: true,
    ariaLabel: `Map showing an approximate Epe-area pin near ${BUSINESS.address}.`,
  });
  const markerRef = useRef<Marker | null>(null);

  useEffect(() => {
    if (!map || !ml) return;
    const m = new ml.Marker({ element: storeElement(), anchor: "bottom" })
      .setLngLat([STORE.position.lng, STORE.position.lat])
      .setPopup(
        new ml.Popup({ offset: 16, closeButton: false }).setHTML(
          `<strong>${STORE.name}</strong><br/>${BUSINESS.address}`,
        ),
      )
      .addTo(map);
    markerRef.current = m;
    flyTo(map, {
      bounds: [
        [STORE.position.lng - 0.02, STORE.position.lat - 0.02],
        [STORE.position.lng + 0.02, STORE.position.lat + 0.02],
      ],
      padding: 40,
      maxZoom: 14,
    });
    return () => {
      m.remove();
      markerRef.current = null;
    };
  }, [map, ml]);

  useEffect(
    () => () => {
      markerRef.current?.remove();
      markerRef.current = null;
    },
    [],
  );

  return (
    <div
      className={`relative border border-line-strong rounded-md overflow-hidden bg-paper-2 ${height}`}
    >
      <div className="absolute inset-0">
        <div ref={containerRef} className="h-full w-full" />
      </div>
      {!map && (
        <div className="absolute inset-0 grid place-items-center skel rounded-none">
          <span className="sr-only">Loading store map</span>
        </div>
      )}
      <div className="absolute left-3 top-3 bg-card/95 border border-line rounded-sm px-2.5 py-2 text-xs shadow-raised max-w-[15rem]">
        <p className="font-semibold">Approximate Epe-area pin</p>
        <p className="text-ink-2">Confirm the exact location before travelling.</p>
      </div>
      {basemap === "offline" && (
        <p className="absolute right-3 bottom-3 bg-card/90 text-[0.6875rem] px-2 py-1 border border-line rounded-sm">
          Street basemap unavailable: showing area only
        </p>
      )}
    </div>
  );
}
