import type {
  DeliveryEstimate,
  DeliveryEstimateRequest,
  DeliveryOption,
  ZonePricing,
} from "./types";
import type { Kobo } from "@/lib/formatters";

import { REGIONS } from "@/fixtures/geography/regions";

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

/** Sample adapter for DeliveryPricingService. Rates live in fixtures/geography/regions.ts. */
export function estimateDelivery({
  resolution,
  weightKg,
}: DeliveryEstimateRequest): DeliveryEstimate {
  const region = REGIONS.find((r) => r.id === resolution.regionId) ?? null;
  const options: DeliveryOption[] = [];
  const fee = feeForWeight(region?.pricing ?? null, weightKg);

  if (resolution.coverage === "outside-nigeria") {
    options.push({
      id: "home",
      kind: "home-delivery",
      label: "Delivery to your address",
      detail:
        "This point is outside Nigeria's state boundaries, so it cannot be delivered to. Check the pin.",
      feeKobo: null,
      feeBasis: "quote-required",
      available: false,
    });
  } else if (region && fee !== null) {
    options.push({
      id: "home",
      kind: "home-delivery",
      label: "Delivery to your address",
      detail: `Sample rate for the ${region.name} region, order weight about ${Math.round(weightKg)} kg. No delivery time is promised.`,
      feeKobo: fee,
      feeBasis: "sample-rule",
      available: true,
    });
  } else {
    options.push({
      id: "home",
      kind: "home-delivery",
      label: "Delivery to your address",
      detail: `This order (about ${Math.round(weightKg)} kg) is heavier than the largest sample rate band. Ask for a freight quote.`,
      feeKobo: null,
      feeBasis: "quote-required",
      available: false,
    });
  }

  if (resolution.coverage === "in-nigeria") {
    options.push({
      id: "freight",
      kind: "freight-quote",
      label: "Freight quote",
      detail:
        "For large or heavy orders and event supply. A person confirms cost and timing in writing.",
      feeKobo: null,
      feeBasis: "quote-required",
      available: true,
    });
  }
  return { options, isSample: true };
}
