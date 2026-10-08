import type { Kobo } from "@/lib/formatters";

export interface LngLat {
  lng: number;
  lat: number;
}

/** SAMPLE configuration. A zone here is a grouping of real LGAs used to build the interface. */
export interface SampleZone {
  id: string;
  name: string;
  short: string;
  lgaIds: string[];
  pricing: ZonePricing | null;
}

export interface WeightBand {
  upToKg: number;
  feeKobo: Kobo;
}

export interface ZonePricing {
  kind: "weight-band";
  bands: WeightBand[];
}

export interface PickupPoint {
  id: string;
  name: string;
  position: LngLat;
  zoneId: string;
}

/**
 * - sample-zone: inside an LGA that the sample configuration groups into a zone.
 * - outside-sample-zones: inside Lagos but not part of any sample zone.
 * - outside-lagos: outside the Lagos LGAs loaded for this prototype.
 * None of these states means Laddex verifiably delivers there.
 */
export type CoverageStatus = "sample-zone" | "outside-sample-zones" | "outside-lagos";

export interface LocationResolution {
  position: LngLat;
  lgaId: string | null;
  lgaName: string | null;
  stateId: string | null;
  stateName: string | null;
  zoneId: string | null;
  zoneName: string | null;
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
  source: "search" | "map-pin";
  precision: GeocodeResult["precision"] | "map-pin";
  confirmed: boolean;
}

export type DeliveryOptionKind = "home-delivery" | "pickup" | "freight-quote";

export interface DeliveryOption {
  id: string;
  kind: DeliveryOptionKind;
  label: string;
  detail: string;
  /** Null when no rule exists: the UI must say a quote is required, never guess. */
  feeKobo: Kobo | null;
  feeBasis: "sample-rule" | "none" | "quote-required";
  available: boolean;
  /** Extra context such as a straight-line distance label. */
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
