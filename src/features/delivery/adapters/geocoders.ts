import type { GeocodingService } from "../contracts";
import type { GeocodeResult } from "../types";

import { GAZETTEER } from "@/fixtures/geography/gazetteer";

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** Offline adapter over approximate locality centroids. Honest about precision. */
export const gazetteerGeocoder: GeocodingService = {
  async search(query, opts) {
    const q = norm(query);
    if (q.length < 2) return [];
    const hits = GAZETTEER.filter(
      (g) => norm(g.name).includes(q) || norm(g.area).includes(q),
    );
    return hits.slice(0, opts?.limit ?? 6).map<GeocodeResult>((g) => ({
      id: `gaz-${norm(g.name).replace(/ /g, "-")}`,
      label: g.name,
      secondary: `${g.area}, Lagos. Locality centre, not a street address.`,
      position: { lng: g.lng, lat: g.lat },
      precision: "locality-centroid",
      source: "gazetteer",
    }));
  },
};

interface NominatimItem {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  addresstype?: string;
}

/**
 * Live adapter over OpenStreetMap Nominatim. It is invoked only on an explicit search action
 * (never per keystroke), is limited to Nigeria, and sends no personal data. For production
 * traffic use a commercial or self-hosted geocoder: the public instance has a strict usage policy.
 */
export const nominatimGeocoder: GeocodingService = {
  async search(query, opts) {
    const q = query.trim();
    if (q.length < 3) return [];
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("q", q);
    url.searchParams.set("countrycodes", "ng");
    url.searchParams.set("limit", String(opts?.limit ?? 5));
    url.searchParams.set("viewbox", "2.69,6.71,4.38,6.37");
    const res = await fetch(url, {
      signal: opts?.signal,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`Geocoder responded ${res.status}`);
    const items = (await res.json()) as NominatimItem[];
    return items.map<GeocodeResult>((i) => {
      const [first, ...rest] = i.display_name.split(",");
      return {
        id: `osm-${i.place_id}`,
        label: first.trim(),
        secondary: rest.slice(0, 3).join(",").trim(),
        position: { lng: Number(i.lon), lat: Number(i.lat) },
        precision: ["house", "building", "road"].includes(i.addresstype ?? "")
          ? "address"
          : "locality-centroid",
        source: "nominatim",
      };
    });
  },
};

export interface SearchOutcome {
  results: GeocodeResult[];
  /** True when live search failed and the offline locality list was used instead. */
  degraded: boolean;
}

export async function searchWithFallback(
  query: string,
  signal?: AbortSignal,
): Promise<SearchOutcome> {
  try {
    const results = await nominatimGeocoder.search(query, { signal });
    if (results.length) return { results, degraded: false };
    return { results: await gazetteerGeocoder.search(query), degraded: false };
  } catch (e) {
    if ((e as Error)?.name === "AbortError") throw e;
    return { results: await gazetteerGeocoder.search(query), degraded: true };
  }
}
