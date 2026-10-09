import type { Kobo } from "@/lib/formatters";

export interface LngLat {
  lng: number;
  lat: number;
}

export interface WeightBand {
  upToKg: number;
  feeKobo: Kobo;
}

export interface ZonePricing {
  kind: "weight-band";
  bands: WeightBand[];
}

/** One of Nigeria's six geopolitical zones. The `pricing` is SAMPLE configuration. */
export interface Region {
  id: string;
  name: string;
  stateIds: string[];
  pricing: ZonePricing;
}

/**
 * - in-nigeria: the point is inside a Nigerian state boundary. Laddex delivers nationwide; the
 *   fee shown is still a sample rate.
 * - outside-nigeria: not inside any state boundary (another country or open water). Not delivered.
 */
export type CoverageStatus = "in-nigeria" | "outside-nigeria";

export interface LocationResolution {
  position: LngLat;
  stateId: string | null;
  stateName: string | null;
  regionId: string | null;
  regionName: string | null;
  /** Null until the state's LGA file has been loaded, or when the point falls in no LGA. */
  lgaId: string | null;
  lgaName: string | null;
  coverage: CoverageStatus;
}

export interface GeocodeResult {
  id: string;
  label: string;
  secondary?: string;
  position: LngLat;
  /** Where the coordinate came from, so the UI can state its precision honestly. */
  precision: "address" | "locality-centroid";
  source: "nominatim" | "gazetteer";
}

export interface DeliveryLocation {
  position: LngLat;
  label: string;
  /** What the customer typed: house number, street, estate or a landmark ("opposite the market"). */
  addressLine?: string;
  source: "search" | "map-pin" | "gps";
  precision: GeocodeResult["precision"] | "map-pin" | "gps";
  confirmed: boolean;
}

export type DeliveryOptionKind = "home-delivery" | "freight-quote";

export interface DeliveryOption {
  id: string;
  kind: DeliveryOptionKind;
  label: string;
  detail: string;
  /** Null when no rule exists: the UI must say a quote is required, never guess. */
  feeKobo: Kobo | null;
  feeBasis: "sample-rule" | "quote-required";
  available: boolean;
  note?: string;
}

export interface DeliveryEstimateRequest {
  resolution: LocationResolution;
  weightKg: number;
}

export interface DeliveryEstimate {
  options: DeliveryOption[];
  /** Always true for the sample adapter: rules are configuration, not verified operations. */
  isSample: boolean;
}

export interface RouteResult {
  status: "ok" | "unavailable";
  distanceKm?: number;
  durationMin?: number;
}
