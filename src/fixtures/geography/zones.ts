import type {
  PickupPoint,
  SampleZone,
  WeightBand,
} from "@/features/delivery/types";

/**
 * SAMPLE SERVICE ZONES. Illustrative groupings of real LGAs used to build and review the
 * interface. They are NOT verified operational coverage and say nothing about where
 * Laddex delivers. LGAs absent from every zone are deliberately left outside.
 */
const bands = (scale: number): WeightBand[] =>
  [
    { upToKg: 10, feeKobo: 150000 },
    { upToKg: 30, feeKobo: 250000 },
    { upToKg: 100, feeKobo: 500000 },
    { upToKg: 300, feeKobo: 950000 },
  ].map((b) => ({
    ...b,
    feeKobo: Math.round((b.feeKobo * scale) / 5000) * 5000,
  }));

export const SAMPLE_ZONES: SampleZone[] = [
  {
    id: "sz-central",
    name: "Sample zone 1: Central Lagos",
    short: "Zone 1",
    lgaIds: [
      "lagos-island",
      "lagos-mainland",
      "apapa",
      "surulere",
      "mushin",
      "shomolu",
      "ajeromi-ifelodun",
    ],
    pricing: { kind: "weight-band", bands: bands(1) },
  },
  {
    id: "sz-ikeja",
    name: "Sample zone 2: Ikeja axis",
    short: "Zone 2",
    lgaIds: ["ikeja", "agege", "ifako-ijaye", "oshodi-isolo", "kosofe"],
    pricing: { kind: "weight-band", bands: bands(1.1) },
  },
  {
    id: "sz-lekki",
    name: "Sample zone 3: Eti-Osa",
    short: "Zone 3",
    lgaIds: ["eti-osa"],
    pricing: { kind: "weight-band", bands: bands(1.3) },
  },
  {
    id: "sz-west",
    name: "Sample zone 4: Alimosho and Amuwo-Odofin",
    short: "Zone 4",
    lgaIds: ["alimosho", "amuwo-odofin"],
    // Deliberately no pricing rule: shows the "quote required" state.
    pricing: null,
  },
];

export const zoneForLga = (lgaId: string | null): SampleZone | null =>
  lgaId ? (SAMPLE_ZONES.find((z) => z.lgaIds.includes(lgaId)) ?? null) : null;

/** SAMPLE distribution points. Positions are approximate localities, not real Laddex premises. */
export const SAMPLE_PICKUP_POINTS: PickupPoint[] = [
  {
    id: "pp-apapa",
    name: "Sample point: Apapa",
    position: { lng: 3.3594, lat: 6.4489 },
    zoneId: "sz-central",
  },
  {
    id: "pp-ikeja",
    name: "Sample point: Ikeja",
    position: { lng: 3.3515, lat: 6.6018 },
    zoneId: "sz-ikeja",
  },
  {
    id: "pp-lekki",
    name: "Sample point: Lekki Phase 1",
    position: { lng: 3.4723, lat: 6.4474 },
    zoneId: "sz-lekki",
  },
];

export const SAMPLE_DISCLAIMER =
  "Sample service zones and delivery fees are configuration for this prototype. They are not verified coverage and not a delivery promise.";
