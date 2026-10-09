import type {
  DeliveryEstimate,
  DeliveryEstimateRequest,
  DeliveryOption,
  LngLat,
  PickupPoint,
  ZonePricing,
} from "./types";
import type { Kobo } from "@/lib/formatters";

import { SAMPLE_PICKUP_POINTS, SAMPLE_ZONES } from "@/fixtures/geography/zones";
import { formatDistanceKm } from "@/lib/formatters";
import { straightLineKm } from "@/lib/geo/distance";

/** Fee for a weight under a band table. Null means no band covers it: a quote is required. */
export function feeForWeight(
  pricing: ZonePricing | null,
  weightKg: number,
): Kobo | null {
  if (!pricing || !(weightKg > 0)) return null;
  const band = [...pricing.bands]
    .sort((a, b) => a.upToKg - b.upToKg)
    .find((b) => weightKg <= b.upToKg);
  return band ? band.feeKobo : null;
}

export function nearestPickup(
  position: LngLat,
  points: PickupPoint[] = SAMPLE_PICKUP_POINTS,
): { point: PickupPoint; km: number } | null {
  let best: { point: PickupPoint; km: number } | null = null;
  for (const p of points) {
    const km = straightLineKm(
      [position.lng, position.lat],
      [p.position.lng, p.position.lat],
    );
    if (!best || km < best.km) best = { point: p, km };
  }
  return best;
}

/** Sample adapter for DeliveryPricingService. Rules live in fixtures/geography/zones.ts. */
export function estimateDelivery({
  resolution,
  weightKg,
}: DeliveryEstimateRequest): DeliveryEstimate {
  const zone = SAMPLE_ZONES.find((z) => z.id === resolution.zoneId) ?? null;
  const options: DeliveryOption[] = [];

  const fee = feeForWeight(zone?.pricing ?? null, weightKg);
  if (zone && zone.pricing && fee !== null) {
    options.push({
      id: "home",
      kind: "home-delivery",
      label: "Home or business delivery",
      detail: `Sample rule for ${zone.short}, order weight about ${Math.round(weightKg)} kg.`,
      feeKobo: fee,
      feeBasis: "sample-rule",
      available: true,
    });
  } else if (zone && zone.pricing) {
    options.push({
      id: "home",
      kind: "home-delivery",
      label: "Home or business delivery",
      detail: `This order is heavier than the largest sample weight band (${Math.round(weightKg)} kg). Ask for a freight quote.`,
      feeKobo: null,
      feeBasis: "quote-required",
      available: false,
    });
  } else {
    options.push({
      id: "home",
      kind: "home-delivery",
      label: "Home or business delivery",
      detail: zone
        ? `No delivery pricing rule is configured for ${zone.short} yet.`
        : "No sample service zone covers this address.",
      feeKobo: null,
      feeBasis: "quote-required",
      available: false,
    });
  }

  const near =
    resolution.coverage !== "outside-lagos"
      ? nearestPickup(resolution.position)
      : null;
  options.push(
    near
      ? {
          id: "pickup",
          kind: "pickup",
          label: `Collect from ${near.point.name.replace("Sample point: ", "")}`,
          detail:
            "Sample distribution point. Opening hours and stock held are not yet configured.",
          feeKobo: 0,
          feeBasis: "none",
          available: true,
          note: `${formatDistanceKm(near.km)} in a straight line from your pin. Road distance is not calculated.`,
        }
      : {
          id: "pickup",
          kind: "pickup",
          label: "Collect from a distribution point",
          detail:
            "No sample distribution point is configured near this address.",
          feeKobo: null,
          feeBasis: "none",
          available: false,
        },
  );

  options.push({
    id: "freight",
    kind: "freight-quote",
    label: "Freight quote",
    detail:
      "For drums, pallets and addresses without a pricing rule. A person confirms cost and timing in writing.",
    feeKobo: null,
    feeBasis: "quote-required",
    available: true,
  });

  return { options, isSample: true };
}
