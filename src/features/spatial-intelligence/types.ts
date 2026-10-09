import type { CategoryId } from "@/features/catalogue/types";
import type { LngLat } from "@/features/delivery/types";
import type { Kobo } from "@/lib/formatters";

/** Who bought: households, shops and resellers, or event and souvenir buyers. */
export type Segment = "retail" | "wholesale" | "events";
export const SEGMENTS: Segment[] = ["retail", "wholesale", "events"];
export const SEGMENT_LABEL: Record<Segment, string> = {
  retail: "Retail",
  wholesale: "Wholesale and resale",
  events: "Events and souvenirs",
};
export type Channel = "online" | "phone" | "sales-desk";
export const CHANNEL_LABEL: Record<Channel, string> = {
  online: "Online store",
  phone: "Phone",
  "sales-desk": "Sales desk",
};
export type OrderStatus =
  | "placed"
  | "processing"
  | "out-for-delivery"
  | "delivered"
  | "cancelled"
  | "returned";

export const OPEN_STATUSES: OrderStatus[] = [
  "placed",
  "processing",
  "out-for-delivery",
];

export interface OrderLine {
  variantId: string;
  category: CategoryId;
  qty: number;
  unitPriceKobo: Kobo;
  lineTotalKobo: Kobo;
  /** Litres for palm oil, kilograms for tapioca and garri: qty times pack contents. Never summed across units. */
  baseUnits: number;
}

/**
 * One order as the backend would return it. The coordinates are exact and personal data: only
 * authorised roles may receive them. Everything geographic below is DERIVED from them by spatial
 * join (see enrich.ts), never stored by hand.
 */
export interface OrderRecord {
  id: string;
  customerId: string;
  segment: Segment;
  channel: Channel;
  placedAt: string;
  status: OrderStatus;
  location: LngLat | null;
  lines: OrderLine[];
  goodsKobo: Kobo;
  deliveryFeeKobo: Kobo;
  deliveryFeeBasis: "region-rule" | "manual-quote";
  /** Value of goods returned (full or partial). Zero for orders without a return. */
  returnedKobo: Kobo;
  /** Every generated order is synthetic. Real data must set this to false. */
  synthetic: boolean;
}

export type GeoStatus = "located" | "unlocated";

export interface EnrichedOrder extends OrderRecord {
  ts: number;
  stateId: string | null;
  regionId: string | null;
  /** Filled when the order's state LGA file has been loaded (LGAs are loaded one state at a time). */
  lgaId: string | null;
  geoStatus: GeoStatus;
}

export type GeoScale = "region" | "state" | "lga";

export const SCALE_LABEL: Record<GeoScale, string> = {
  region: "Region",
  state: "State",
  lga: "Local government area",
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
  /** Selected unit at the current scale, or null for the whole country. */
  unitId: string | null;
  /** The state whose LGAs are shown when scale is "lga". */
  stateId: string | null;
  /** A single selected order. Overrides the inspector without discarding unitId. */
  orderId: string | null;
}

export type Role = "analyst" | "admin";

export const UNASSIGNED = "__unassigned";
