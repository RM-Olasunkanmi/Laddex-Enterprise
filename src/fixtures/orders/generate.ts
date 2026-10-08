import { priceFor } from "@/features/catalogue/pricing";
import type { PackVariant } from "@/features/catalogue/types";
import { feeForWeight } from "@/features/delivery/pricing";
import type { LngLat } from "@/features/delivery/types";
import type { Channel, Fulfilment, OrderLine, OrderRecord, OrderStatus, Segment } from "@/features/spatial-intelligence/types";
import { mulberry32, pick, poisson, weightedPick, type Rng } from "@/lib/data/random";
import { unitAt, type AdminUnit } from "@/lib/geo/geography";
import { geometryContains, type PolygonalGeometry } from "@/lib/geo/pip";
import { ALL_VARIANTS } from "@/fixtures/products/products";
import { SAMPLE_PICKUP_POINTS, zoneForLga, SAMPLE_ZONES } from "@/fixtures/geography/zones";

/**
 * SYNTHETIC ORDERS FOR INTERFACE DEVELOPMENT. Nothing here describes real Laddex sales,
 * customers or delivery capacity. Volumes, mixes and geography are invented so the
 * dashboard can be built and tested. Every record carries `synthetic: true`.
 *
 * Prices come from the same pricing function the storefront uses, so order totals reconcile
 * with the catalogue. Locations are random points inside real LGA polygons.
 */

/** Dataset window is fixed so tests and screenshots are reproducible. */
export const DATASET_START = "2026-04-06";
export const DATASET_END = "2026-10-04";
const DAY_MS = 86_400_000;
/** Africa/Lagos is UTC+1 with no daylight saving. */
const startMs = Date.parse(`${DATASET_START}T00:00:00+01:00`);
const asOfMs = Date.parse(`${DATASET_END}T23:59:59+01:00`);
export const DATASET_DAYS = Math.round((Date.parse(`${DATASET_END}T00:00:00+01:00`) - startMs) / DAY_MS) + 1;

/** Relative demand by LGA. An invented weighting; it does not describe real demand. */
const LGA_WEIGHT: Record<string, number> = {
  alimosho: 12, ikeja: 10, "eti-osa": 10, "oshodi-isolo": 7, surulere: 7, kosofe: 6, ikorodu: 6, "lagos-mainland": 5,
  mushin: 5, agege: 5, "amuwo-odofin": 4, "lagos-island": 4, apapa: 3, "ajeromi-ifelodun": 3, shomolu: 3, "ifako-ijaye": 3,
  ojo: 3, "ibeju-lekki": 3, badagry: 2, epe: 2,
};
const WHOLESALE_BIAS: Record<string, number> = { ikeja: 2.2, "oshodi-isolo": 2.4, apapa: 2.6, "ajeromi-ifelodun": 1.8, ikorodu: 1.8, mushin: 1.6, "lagos-island": 1.8 };

interface Customer {
  id: string;
  segment: Segment;
  point: LngLat | null;
  weight: number;
}

function randomPointIn(rng: Rng, g: PolygonalGeometry, bbox: [number, number, number, number]): LngLat {
  for (let i = 0; i < 400; i++) {
    const lng = bbox[0] + rng() * (bbox[2] - bbox[0]);
    const lat = bbox[1] + rng() * (bbox[3] - bbox[1]);
    if (geometryContains(g, lng, lat)) return { lng: Number(lng.toFixed(5)), lat: Number(lat.toFixed(5)) };
  }
  const [x0, y0, x1, y1] = bbox;
  return { lng: (x0 + x1) / 2, lat: (y0 + y1) / 2 };
}

export interface GenerateInput {
  lgas: AdminUnit[];
  states: AdminUnit[];
  seed?: number;
}

export function generateSyntheticOrders({ lgas, states, seed = 20260404 }: GenerateInput): OrderRecord[] {
  const rng = mulberry32(seed);
  const ogun = states.find((s) => s.id === "ogun");
  const packaged = ALL_VARIANTS.filter((v) => v.format === "packaged");
  const bulk = ALL_VARIANTS.filter((v) => v.format === "bulk");

  const makeCustomer = (segment: Segment, n: number): Customer => {
    const id = `${segment === "retail" ? "R" : "W"}-${String(n).padStart(4, "0")}`;
    const r = rng();
    let point: LngLat | null;
    if (ogun && r < 0.035) {
      point = randomPointIn(rng, ogun.geometry, [2.85, 6.55, 3.95, 7.1]);
    } else {
      const lga = weightedPick(rng, lgas, (l) => (LGA_WEIGHT[l.id] ?? 1) * (segment === "wholesale" ? (WHOLESALE_BIAS[l.id] ?? 1) : 1));
      point = randomPointIn(rng, lga.geometry, lga.bbox);
    }
    // A small share of customers have no usable location on file.
    if (rng() < 0.03) point = null;
    return { id, segment, point, weight: 1 / (1 + rng() * 3) ** 2 };
  };
  const retail = Array.from({ length: 340 }, (_, i) => makeCustomer("retail", i + 1));
  const wholesale = Array.from({ length: 36 }, (_, i) => makeCustomer("wholesale", i + 1));

  const orders: OrderRecord[] = [];
  let seq = 0;
  for (let d = 0; d < DATASET_DAYS; d++) {
    const dayStart = startMs + d * DAY_MS;
    const dow = new Date(dayStart).getUTCDay();
    const weekday = [0.55, 1.05, 1.1, 1.1, 1.1, 1.25, 1.35][dow];
    const trend = 0.85 + 0.55 * (d / DATASET_DAYS);
    const lambda = 6.2 * weekday * trend;
    const n = poisson(rng, lambda);
    for (let k = 0; k < n; k++) {
      seq++;
      const isWholesale = rng() < 0.15;
      const segment: Segment = isWholesale ? "wholesale" : "retail";
      const customer = weightedPick(rng, isWholesale ? wholesale : retail, (c) => c.weight);
      const placedMs = dayStart + (6 + rng() * 13) * 3_600_000; // 07:00 to 20:00 Lagos
      const channel: Channel = isWholesale ? (rng() < 0.7 ? "wholesale-desk" : "online") : rng() < 0.86 ? "online" : "phone";

      const lines = buildLines(rng, segment, packaged, bulk);
      const goods = lines.reduce((s, l) => s + l.lineTotalKobo, 0);
      const weightKg = lines.reduce((s, l) => s + (ALL_VARIANTS.find((v) => v.id === l.variantId)!.shippingWeightKg * l.qty), 0);

      const fulfilment: Fulfilment = rng() < (isWholesale ? 0.08 : 0.14) && customer.point ? "pickup" : "delivery";
      const lga = customer.point ? unitAt(lgas, customer.point.lng, customer.point.lat) : null;
      const zone = zoneForLga(lga?.id ?? null);
      const pickupPointId = fulfilment === "pickup" ? nearestPickupId(customer.point!) : null;

      let deliveryFeeKobo = 0;
      let deliveryFeeBasis: OrderRecord["deliveryFeeBasis"] = "none";
      if (fulfilment === "delivery") {
        const ruleFee = feeForWeight(zone?.pricing ?? null, weightKg);
        if (ruleFee !== null) {
          deliveryFeeKobo = ruleFee;
          deliveryFeeBasis = "zone-rule";
        } else {
          deliveryFeeKobo = Math.round((1_500_000 + weightKg * 4_000) / 5000) * 5000;
          deliveryFeeBasis = "manual-quote";
        }
      }

      const ageDays = (asOfMs - placedMs) / DAY_MS;
      const status = drawStatus(rng, ageDays);
      let returnedKobo = 0;
      if (status === "returned") returnedKobo = goods;
      else if (status === "delivered" && rng() < 0.015) returnedKobo = lines[0].lineTotalKobo;

      orders.push({
        id: `LX-${String(seq).padStart(5, "0")}`,
        customerId: customer.id,
        segment,
        channel,
        placedAt: new Date(placedMs).toISOString(),
        status,
        fulfilment,
        location: customer.point,
        pickupPointId,
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

function buildLines(rng: Rng, segment: Segment, packaged: PackVariant[], bulk: PackVariant[]): OrderLine[] {
  const lines: OrderLine[] = [];
  const nLines = segment === "wholesale" ? (rng() < 0.25 ? 2 : 1) : rng() < 0.3 ? 2 : 1;
  const used = new Set<string>();
  for (let i = 0; i < nLines; i++) {
    let variant: PackVariant;
    let qty: number;
    if (segment === "wholesale") {
      variant = weightedPick(rng, [...bulk, ...packaged.filter((p) => p.stock.status !== "out-of-stock")], (v) => (v.format === "bulk" ? 3 : 1));
      qty = variant.wholesaleMinQty * pick(rng, [1, 1, 1, 1, 2, 2, 3]);
    } else {
      variant = weightedPick(rng, [...packaged.filter((p) => p.stock.status !== "out-of-stock"), ...bulk.filter((b) => b.size.amount <= 25)], (v) => (v.format === "packaged" ? 4 : 1));
      qty = pick(rng, [1, 1, 1, 2, 2, 3]);
    }
    if (used.has(variant.id)) continue;
    used.add(variant.id);
    const price = priceFor(variant, qty, segment === "wholesale" ? "wholesale-approved" : "retail");
    lines.push({
      variantId: variant.id,
      category: variant.productId === "palm-oil" ? "palm-oil" : "tapioca",
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
  if (ageDays < 0.5) return r < 0.7 ? "placed" : r < 0.97 ? "processing" : "cancelled";
  if (ageDays < 2) return r < 0.2 ? "processing" : r < 0.55 ? "out-for-delivery" : r < 0.93 ? "delivered" : "cancelled";
  if (ageDays < 4) return r < 0.1 ? "out-for-delivery" : r < 0.9 ? "delivered" : r < 0.99 ? "cancelled" : "returned";
  return r < 0.945 ? "delivered" : r < 0.985 ? "cancelled" : "returned";
}

function nearestPickupId(p: LngLat): string {
  let best = SAMPLE_PICKUP_POINTS[0];
  let bd = Infinity;
  for (const pp of SAMPLE_PICKUP_POINTS) {
    const d = (pp.position.lng - p.lng) ** 2 + (pp.position.lat - p.lat) ** 2;
    if (d < bd) {
      bd = d;
      best = pp;
    }
  }
  return best.id;
}

export { SAMPLE_ZONES };
