import config from "@payload-config";
import { getPayload } from "payload";

import type {
  DeliveryEstimate,
  DeliveryEstimateRequest,
  LngLat,
  LocationResolution,
  Region,
} from "@/features/delivery/types";
import type { Kobo } from "@/lib/formatters";

import { feeForWeight } from "@/features/delivery/pricing";
import { resolveLocation } from "@/features/delivery/resolve";
import {
  REGIONS,
  SAMPLE_DISCLAIMER,
} from "@/fixtures/geography/regions";
import { getStatesSync } from "@/lib/geo/states-data";

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface VerifiedPoint {
  id: string;
  name: string;
  position: LngLat;
}

export interface DeliveryConfig {
  regions: Region[];
  points: VerifiedPoint[];
  /** False while fixtures stand in for operations-owned data. */
  isLive: boolean;
  disclaimer: string;
}

const toRegion = (z: Record<string, any>): Region | null => {
  if (!z?.regionId) return null;
  return {
    id: String(z.regionId),
    name: String(z.name ?? z.regionId),
    stateIds: Array.isArray(z.stateIds)
      ? z.stateIds.map((r: any) => String(r?.stateId ?? r))
      : [],
    pricing: {
      kind: "weight-band",
      bands: (Array.isArray(z.bands) ? z.bands : []).map((b: any) => ({
        upToKg: Number(b.upToKg),
        feeKobo: Number(b.feeKobo) as Kobo,
      })),
    },
  };
};

const toPoint = (p: Record<string, any>): VerifiedPoint | null => {
  if (p?.lng == null || p?.lat == null || !p?.name) return null;
  return {
    id: `dp-${p.id}`,
    name: String(p.name),
    position: { lng: Number(p.lng), lat: Number(p.lat) },
  };
};

/**
 * Operations-owned delivery configuration. Returns Payload regions and
 * verified distribution points when any active rows exist; otherwise the
 * sample fixtures, so the storefront keeps working before operations data
 * lands.
 */
export async function getDeliveryConfig(): Promise<DeliveryConfig> {
  try {
    const payload = await getPayload({ config });
    const [zonesRes, pointsRes] = await Promise.all([
      payload.find({
        collection: "delivery-zones",
        depth: 0,
        limit: 40,
        pagination: false,
        where: { active: { equals: true } },
      }),
      payload.find({
        collection: "distribution-points",
        depth: 0,
        limit: 100,
        pagination: false,
        where: { and: [{ active: { equals: true } }, { verified: { equals: true } }] },
      }),
    ]);
    const live = (zonesRes.docs as Record<string, any>[])
      .map(toRegion)
      .filter((z): z is Region => !!z && z.pricing.bands.length > 0);
    const points = (pointsRes.docs as Record<string, any>[])
      .map(toPoint)
      .filter((p): p is VerifiedPoint => Boolean(p));
    if (live.length > 0) {
      const merged = REGIONS.map((r) => live.find((l) => l.id === r.id) ?? r);
      return { regions: merged, points, isLive: true, disclaimer: "" };
    }
  } catch {
    // Database not configured yet (frontend phase): fall through to fixtures.
  }
  return { regions: REGIONS, points: [], isLive: false, disclaimer: SAMPLE_DISCLAIMER };
}

/** Same rules as the client adapter, but over operations-owned regions. */
export function estimateWithRegions(
  { resolution, weightKg }: DeliveryEstimateRequest,
  regions: Region[],
  isLive: boolean,
): DeliveryEstimate {
  const region = regions.find((r) => r.id === resolution.regionId) ?? null;
  const options: DeliveryEstimate["options"] = [];
  const fee = feeForWeight(region?.pricing ?? null, weightKg);
  const rate = (name: string) =>
    isLive
      ? `Rate for the ${name} region, order weight about ${Math.round(weightKg)} kg. No delivery time is promised.`
      : `Sample rate for the ${name} region, order weight about ${Math.round(weightKg)} kg. No delivery time is promised.`;

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
      detail: rate(region.name),
      feeKobo: fee,
      feeBasis: "sample-rule",
      available: true,
    });
  } else {
    options.push({
      id: "home",
      kind: "home-delivery",
      label: "Delivery to your address",
      detail: `This order (about ${Math.round(weightKg)} kg) is heavier than the largest rate band. Ask for a freight quote.`,
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
  return { options, isSample: !isLive };
}

/**
 * Shared by the estimate API and checkout: spatial join against the bundled
 * state boundaries plus pricing over live regions when operations owns them.
 */
export async function resolveAndEstimate(position: LngLat, weightKg: number) {
  if (
    typeof position.lng !== "number" ||
    typeof position.lat !== "number" ||
    !(weightKg > 0)
  ) {
    throw new Error("position { lng, lat } and a positive weightKg are required.");
  }
  const config = await getDeliveryConfig();
  const base = resolveLocation(position, getStatesSync());
  const live = config.regions.find((r) => r.id === base.regionId);
  const resolution: LocationResolution = {
    ...base,
    regionId: live?.id ?? base.regionId,
    regionName: live?.name ?? base.regionName,
  };
  return {
    resolution,
    estimate: estimateWithRegions(
      { resolution, weightKg },
      config.regions,
      config.isLive,
    ),
    isLive: config.isLive,
    disclaimer: config.disclaimer,
    points: config.points,
  };
}
