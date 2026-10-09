import {
  REGION_PRODUCT_MIX,
  STATE_EVENTS_BIAS,
  STATE_GROWTH,
  STATE_WEIGHT,
  STATE_WHOLESALE_BIAS,
} from "./demand";

import type { PackVariant } from "@/features/catalogue/types";
import type { LngLat } from "@/features/delivery/types";
import type {
  Channel,
  OrderLine,
  OrderRecord,
  OrderStatus,
  Segment,
} from "@/features/spatial-intelligence/types";
import type { AdminUnit } from "@/lib/geo/geography";

import { priceFor } from "@/features/catalogue/pricing";
import { feeForWeight } from "@/features/delivery/pricing";
import { GAZETTEER } from "@/fixtures/geography/gazetteer";
import { regionOfState } from "@/fixtures/geography/regions";
import { ALL_VARIANTS, categoryOf } from "@/fixtures/products/products";
import {
  mulberry32,
  pick,
  poisson,
  weightedPick,
  type Rng,
} from "@/lib/data/random";
import { geometryContains } from "@/lib/geo/pip";

/**
 * SYNTHETIC ORDERS FOR INTERFACE DEVELOPMENT. Nothing here describes real Laddex sales,
 * customers or delivery capacity. Volumes, mixes and geography are invented so the dashboard
 * and its spatial statistics can be built and tested. Every record carries `synthetic: true`.
 *
 * Prices come from the same pricing function the storefront uses, so order totals reconcile with
 * the catalogue. Locations are random points inside real state polygons, concentrated around
 * the state capital and a few large towns.
 */

/** Dataset window is fixed so tests and screenshots are reproducible. */
export const DATASET_START = "2026-04-06";
export const DATASET_END = "2026-10-04";
const DAY_MS = 86_400_000;
/** Africa/Lagos is UTC+1 with no daylight saving. */
const startMs = Date.parse(`${DATASET_START}T00:00:00+01:00`);
const asOfMs = Date.parse(`${DATASET_END}T23:59:59+01:00`);
export const DATASET_DAYS =
  Math.round((Date.parse(`${DATASET_END}T00:00:00+01:00`) - startMs) / DAY_MS) +
  1;

interface Customer {
  id: string;
  segment: Segment;
  stateId: string;
  point: LngLat | null;
  weight: number;
}

function gaussian(rng: Rng): number {
  return Math.sqrt(-2 * Math.log(1 - rng())) * Math.cos(2 * Math.PI * rng());
}

/** A point inside the state: near one of its known towns most of the time, else anywhere inside it. */
function pointInState(rng: Rng, state: AdminUnit): LngLat {
  const towns = GAZETTEER.filter((g) => g.stateId === state.id);
  if (towns.length && rng() < 0.7) {
    const t = pick(rng, towns);
    for (let i = 0; i < 30; i++) {
      const lng = t.lng + gaussian(rng) * 0.12;
      const lat = t.lat + gaussian(rng) * 0.12;
      if (geometryContains(state.geometry, lng, lat))
        return { lng: Number(lng.toFixed(5)), lat: Number(lat.toFixed(5)) };
    }
  }
  const [x0, y0, x1, y1] = state.bbox;
  for (let i = 0; i < 400; i++) {
    const lng = x0 + rng() * (x1 - x0);
    const lat = y0 + rng() * (y1 - y0);
    if (geometryContains(state.geometry, lng, lat))
      return { lng: Number(lng.toFixed(5)), lat: Number(lat.toFixed(5)) };
  }
  return {
    lng: Number(((x0 + x1) / 2).toFixed(5)),
    lat: Number(((y0 + y1) / 2).toFixed(5)),
  };
}

export interface GenerateInput {
  states: AdminUnit[];
  seed?: number;
}

export function generateSyntheticOrders({
  states,
  seed = 20261004,
}: GenerateInput): OrderRecord[] {
  const rng = mulberry32(seed);
  const packaged = ALL_VARIANTS.filter((v) => v.format === "packaged");
  const bulk = ALL_VARIANTS.filter((v) => v.format === "bulk");
  const stateById = new Map(states.map((s) => [s.id, s]));
  const stateIds = states.map((s) => s.id).filter((id) => STATE_WEIGHT[id]);

  const makeCustomer = (segment: Segment, n: number): Customer => {
    const prefix = { retail: "R", wholesale: "W", events: "E" }[segment];
    const stateId = weightedPick(
      rng,
      stateIds,
      (id) =>
        STATE_WEIGHT[id] *
        (segment === "wholesale"
          ? (STATE_WHOLESALE_BIAS[id] ?? 1)
          : segment === "events"
            ? (STATE_EVENTS_BIAS[id] ?? 1)
            : 1),
    );
    let point: LngLat | null = pointInState(rng, stateById.get(stateId)!);
    // A small share of customers have no usable location on file.
    if (rng() < 0.03) point = null;
    return {
      id: `${prefix}-${String(n).padStart(4, "0")}`,
      segment,
      stateId,
      point,
      weight: 1 / (1 + rng() * 3) ** 2,
    };
  };
  const pools: Record<Segment, Customer[]> = {
    retail: Array.from({ length: 1100 }, (_, i) =>
      makeCustomer("retail", i + 1),
    ),
    wholesale: Array.from({ length: 110 }, (_, i) =>
      makeCustomer("wholesale", i + 1),
    ),
    events: Array.from({ length: 70 }, (_, i) => makeCustomer("events", i + 1)),
  };

  const orders: OrderRecord[] = [];
  let seq = 0;
  for (let d = 0; d < DATASET_DAYS; d++) {
    const dayStart = startMs + d * DAY_MS;
    const dow = new Date(dayStart).getUTCDay();
    const weekday = [0.6, 1.0, 1.05, 1.05, 1.1, 1.3, 1.4][dow];
    const progress = d / DATASET_DAYS;
    const lambda = 15 * weekday * (0.85 + 0.45 * progress);
    const n = poisson(rng, lambda);
    for (let k = 0; k < n; k++) {
      const r = rng();
      const segment: Segment =
        r < 0.14 ? "wholesale" : r < 0.2 ? "events" : "retail";
      // Each customer's state grows or shrinks over the window, so growth differs by place.
      const pool = pools[segment];
      const customer = weightedPick(
        rng,
        pool,
        (c) =>
          c.weight *
          Math.max(
            0.15,
            1 + (STATE_GROWTH[c.stateId] ?? 0.1) * (progress * 2 - 1),
          ),
      );
      seq++;
      const placedMs = dayStart + (6 + rng() * 13) * 3_600_000; // 07:00 to 20:00 Lagos
      const channel: Channel =
        segment === "retail"
          ? rng() < 0.82
            ? "online"
            : "phone"
          : rng() < 0.65
            ? "sales-desk"
            : rng() < 0.6
              ? "phone"
              : "online";
      const regionId = regionOfState(customer.stateId)?.id ?? "south-west";
      const lines = buildLines(rng, segment, regionId, packaged, bulk);
      const goods = lines.reduce((s, l) => s + l.lineTotalKobo, 0);
      const weightKg = lines.reduce(
        (s, l) =>
          s +
          ALL_VARIANTS.find((v) => v.id === l.variantId)!.shippingWeightKg *
            l.qty,
        0,
      );

      const region = regionOfState(customer.stateId);
      const ruleFee = feeForWeight(region?.pricing ?? null, weightKg);
      const deliveryFeeKobo =
        ruleFee ?? Math.round((3_500_000 + weightKg * 12_000) / 5000) * 5000;
      const deliveryFeeBasis: OrderRecord["deliveryFeeBasis"] =
        ruleFee !== null ? "region-rule" : "manual-quote";

      const status = drawStatus(rng, (asOfMs - placedMs) / DAY_MS);
      let returnedKobo = 0;
      if (status === "returned") returnedKobo = goods;
      else if (status === "delivered" && rng() < 0.015)
        returnedKobo = lines[0].lineTotalKobo;

      orders.push({
        id: `LX-${String(seq).padStart(5, "0")}`,
        customerId: customer.id,
        segment,
        channel,
        placedAt: new Date(placedMs).toISOString(),
        status,
        location: customer.point,
        lines,
        goodsKobo: goods,
        deliveryFeeKobo,
        deliveryFeeBasis,
        returnedKobo,
        synthetic: true,
      });
    }
  }
  return orders;
}

function buildLines(
  rng: Rng,
  segment: Segment,
  regionId: string,
  packaged: PackVariant[],
  bulk: PackVariant[],
): OrderLine[] {
  const mix = REGION_PRODUCT_MIX[regionId] ?? [1, 1, 1, 1];
  const productIdx = (v: PackVariant) =>
    ["palm-oil", "tapioca-flakes", "garri-igbo", "garri-ijebu"].indexOf(
      v.productId,
    );
  const inStock = (v: PackVariant) => v.stock.status !== "out-of-stock";
  const lines: OrderLine[] = [];
  const nLines =
    segment === "retail" ? (rng() < 0.3 ? 2 : 1) : rng() < 0.3 ? 2 : 1;
  const used = new Set<string>();
  for (let i = 0; i < nLines; i++) {
    let variant: PackVariant;
    let qty: number;
    if (segment === "wholesale") {
      variant = weightedPick(
        rng,
        [...bulk.filter(inStock), ...packaged.filter(inStock)],
        (v) => mix[productIdx(v)] * (v.format === "bulk" ? 3 : 1),
      );
      qty = variant.wholesaleMinQty * pick(rng, [1, 1, 1, 1, 2, 2, 3]);
    } else if (segment === "events") {
      // Souvenir buying: smallest packs in numbers.
      variant = weightedPick(
        rng,
        packaged.filter((v) => inStock(v) && v.contentBase <= 1),
        (v) => mix[productIdx(v)],
      );
      qty = pick(rng, [24, 48, 48, 96, 120, 200]);
    } else {
      variant = weightedPick(
        rng,
        [
          ...packaged.filter(inStock),
          ...bulk.filter((b) => inStock(b) && b.size.amount <= 25),
        ],
        (v) => mix[productIdx(v)] * (v.format === "packaged" ? 4 : 1),
      );
      qty = pick(rng, [1, 1, 1, 2, 2, 3]);
    }
    if (used.has(variant.id)) continue;
    used.add(variant.id);
    const price = priceFor(
      variant,
      qty,
      segment === "retail" ? "retail" : "wholesale-approved",
    );
    lines.push({
      variantId: variant.id,
      category: categoryOf(variant.id),
      qty,
      unitPriceKobo: price.unitPriceKobo,
      lineTotalKobo: price.unitPriceKobo * qty,
      baseUnits: Math.round(qty * variant.contentBase * 100) / 100,
    });
  }
  return lines;
}

function drawStatus(rng: Rng, ageDays: number): OrderStatus {
  const r = rng();
  if (ageDays < 0.5)
    return r < 0.7 ? "placed" : r < 0.97 ? "processing" : "cancelled";
  if (ageDays < 3)
    return r < 0.2
      ? "processing"
      : r < 0.55
        ? "out-for-delivery"
        : r < 0.93
          ? "delivered"
          : "cancelled";
  if (ageDays < 6)
    return r < 0.1
      ? "out-for-delivery"
      : r < 0.9
        ? "delivered"
        : r < 0.99
          ? "cancelled"
          : "returned";
  return r < 0.94 ? "delivered" : r < 0.985 ? "cancelled" : "returned";
}
