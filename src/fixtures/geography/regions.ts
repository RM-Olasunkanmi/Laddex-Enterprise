import type { Region, WeightBand } from "@/features/delivery/types";

/**
 * The six geopolitical zones of Nigeria and the states in each. This grouping is the standard
 * national classification, not Laddex configuration. The delivery rates attached to each region
 * are SAMPLE rates for building the interface; they are not Laddex's real prices.
 */
const baseBands = [
  { upToKg: 5, feeKobo: 250000 },
  { upToKg: 15, feeKobo: 450000 },
  { upToKg: 30, feeKobo: 750000 },
  { upToKg: 100, feeKobo: 1500000 },
  { upToKg: 300, feeKobo: 3200000 },
];
/** Scale the base bands and round to the nearest 500 naira. */
const bands = (scale: number): WeightBand[] =>
  baseBands.map((b) => ({ ...b, feeKobo: Math.round((b.feeKobo * scale) / 50000) * 50000 }));

export const REGIONS: Region[] = [
  {
    id: "south-west",
    name: "South West",
    stateIds: ["lagos", "ogun", "oyo", "osun", "ondo", "ekiti"],
    pricing: { kind: "weight-band", bands: bands(1) },
  },
  {
    id: "south-east",
    name: "South East",
    stateIds: ["abia", "anambra", "ebonyi", "enugu", "imo"],
    pricing: { kind: "weight-band", bands: bands(1.25) },
  },
  {
    id: "south-south",
    name: "South South",
    stateIds: ["akwa-ibom", "bayelsa", "cross-river", "delta", "edo", "rivers"],
    pricing: { kind: "weight-band", bands: bands(1.3) },
  },
  {
    id: "north-central",
    name: "North Central",
    stateIds: ["benue", "kogi", "kwara", "nasarawa", "niger", "plateau", "fct"],
    pricing: { kind: "weight-band", bands: bands(1.3) },
  },
  {
    id: "north-west",
    name: "North West",
    stateIds: ["jigawa", "kaduna", "kano", "katsina", "kebbi", "sokoto", "zamfara"],
    pricing: { kind: "weight-band", bands: bands(1.6) },
  },
  {
    id: "north-east",
    name: "North East",
    stateIds: ["adamawa", "bauchi", "borno", "gombe", "taraba", "yobe"],
    pricing: { kind: "weight-band", bands: bands(1.8) },
  },
];

export const regionOfState = (stateId: string | null | undefined): Region | null =>
  stateId ? (REGIONS.find((r) => r.stateIds.includes(stateId)) ?? null) : null;

export const STATE_REGION: Record<string, string> = Object.fromEntries(
  REGIONS.flatMap((r) => r.stateIds.map((s) => [s, r.id])),
);

/** Display names where the boundary file's name is not what people say. */
export const STATE_NAME_OVERRIDE: Record<string, string> = { fct: "FCT (Abuja)" };

export const SAMPLE_DISCLAIMER =
  "Delivery regions are the six geopolitical zones. The rates shown are sample rates for building the interface, not Laddex's confirmed prices, and no delivery time is promised.";
