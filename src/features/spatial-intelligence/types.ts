import type { CategoryId } from "@/features/catalogue/types";
import type { LngLat } from "@/features/delivery/types";
import type { Kobo } from "@/lib/formatters";

export type Segment = "retail" | "wholesale";
export type Channel = "online" | "phone" | "wholesale-desk";
export type OrderStatus = "placed" | "processing" | "out-for-delivery" | "delivered" | "cancelled" | "returned";
export type Fulfilment = "delivery" | "pickup";

export const OPEN_STATUSES: OrderStatus[] = ["placed", "processing", "out-for-delivery"];

export interface OrderLine {
  variantId: string;
  category: CategoryId;
  qty: number;
  unitPriceKobo: Kobo;
  lineTotalKobo: Kobo;
  /** Litres for palm oil, kilograms for tapioca: qty times pack contents. Never summed across categories. */
  baseUnits: number;
}

/**
 * One order as the backend would return it. The coordinates are exact and personal data:
 * only authorised roles may receive them. Everything geographic below is DERIVED from them
 * by spatial join (see enrich.ts), never stored by hand.
 */
export interface OrderRecord {
  id: string;
  customerId: string;
  segment: Segment;
  channel: Channel;
  placedAt: string;
  status: OrderStatus;
  fulfilment: Fulfilment;
  location: LngLat | null;
  pickupPointId: string | null;
  lines: OrderLine[];
  goodsKobo: Kobo;
  deliveryFeeKobo: Kobo;
  deliveryFeeBasis: "zone-rule" | "manual-quote" | "none";
  /** Value of goods returned (full or partial). Zero for orders without a return. */
  returnedKobo: Kobo;
  /** Every generated order is synthetic. Real data must set this to false. */
  synthetic: boolean;
}

export type GeoStatus = "located" | "unlocated";

export interface EnrichedOrder extends OrderRecord {
  ts: number;
  stateId: string | null;
  lgaId: string | null;
  zoneId: string | null;
  geoStatus: GeoStatus;
  /** Nearest sample pickup point by straight-line distance (a catchment proxy, not road access). */
  nearestPickupId: string | null;
}

export type GeoScale = "state" | "lga" | "zone" | "pickup";

export const SCALE_LABEL: Record<GeoScale, string> = {
  state: "State",
  lga: "Local government area",
  zone: "Delivery zone",
  pickup: "Distribution point",
};

export interface DashboardFilters {
  /** Inclusive ISO dates (YYYY-MM-DD) in Africa/Lagos. */
  from: string;
  to: string;
  categories: CategoryId[];
  variantIds: string[];
  segments: Segment[];
  channels: Channel[];
  statuses: OrderStatus[];
}

export interface GeoSelection {
  scale: GeoScale;
  /** Selected unit at the current scale, or null for the whole extent. */
  unitId: string | null;
  /** A single selected order. Overrides the inspector without discarding unitId. */
  orderId: string | null;
}

export type Role = "analyst" | "admin";

export const UNASSIGNED = "__unassigned";
export const OUTSIDE_ZONES = "__outside-zones";
