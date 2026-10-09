import type {
  DeliveryEstimate,
  DeliveryEstimateRequest,
  GeocodeResult,
  LngLat,
  RouteResult,
} from "./types";

/** Address search and reverse geocoding. Production: a Nigeria-aware provider with proper terms of use. */
export interface GeocodingService {
  search(
    query: string,
    opts?: { signal?: AbortSignal; limit?: number },
  ): Promise<GeocodeResult[]>;
  reverse?(
    position: LngLat,
    opts?: { signal?: AbortSignal },
  ): Promise<GeocodeResult | null>;
}

/** Delivery pricing. Production: server-side rules owned by operations, returned per cart. */
export interface DeliveryPricingService {
  estimate(req: DeliveryEstimateRequest): Promise<DeliveryEstimate>;
}

/** Road routing. Not implemented in the prototype; straight-line distance is never a substitute. */
export interface RoutingService {
  route(from: LngLat, to: LngLat): Promise<RouteResult>;
}
