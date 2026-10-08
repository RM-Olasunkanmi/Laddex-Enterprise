import { describe, expect, it } from "vitest";

import { GAZETTEER } from "@/fixtures/geography/gazetteer";
import { SAMPLE_PICKUP_POINTS, SAMPLE_ZONES } from "@/fixtures/geography/zones";
import { straightLineKm } from "@/lib/geo/distance";
import { testLgas, testStates } from "@/test/geo";

import { estimateDelivery, feeForWeight, nearestPickup } from "./pricing";
import { resolveLocation } from "./resolve";

const lgas = testLgas();

describe("boundary data", () => {
  it("contains exactly the 20 Lagos LGAs", () => {
    expect(lgas).toHaveLength(20);
    expect(new Set(lgas.map((l) => l.id)).size).toBe(20);
  });
  it("every sample zone references real LGA ids and no LGA is in two zones", () => {
    const ids = new Set(lgas.map((l) => l.id));
    const seen = new Set<string>();
    for (const z of SAMPLE_ZONES) for (const id of z.lgaIds) {
      expect(ids.has(id), id).toBe(true);
      expect(seen.has(id), `${id} duplicated`).toBe(false);
      seen.add(id);
    }
  });
  it("leaves some Lagos LGAs outside every sample zone", () => {
    const inZone = new Set(SAMPLE_ZONES.flatMap((z) => z.lgaIds));
    expect(lgas.filter((l) => !inZone.has(l.id)).length).toBeGreaterThan(0);
  });
});

describe("resolveLocation (spatial join)", () => {
  it("resolves gazetteer localities into Lagos LGAs", () => {
    for (const g of GAZETTEER) {
      const r = resolveLocation({ lng: g.lng, lat: g.lat }, lgas);
      expect(r.lgaId, g.name).not.toBeNull();
    }
  });
  it("places sample pickup points inside the LGA of their zone", () => {
    for (const p of SAMPLE_PICKUP_POINTS) {
      const r = resolveLocation(p.position, lgas);
      expect(r.zoneId, p.name).toBe(p.zoneId);
    }
  });
  it("labels Ikeja as inside a sample zone and Epe as outside the sample zones", () => {
    expect(resolveLocation({ lng: 3.3515, lat: 6.6018 }, lgas).coverage).toBe("sample-zone");
    expect(resolveLocation({ lng: 3.9783, lat: 6.5841 }, lgas).coverage).toBe("outside-sample-zones");
  });
  it("flags points outside Lagos and names the state when states are supplied", () => {
    const abeokuta = { lng: 3.35, lat: 7.15 };
    expect(resolveLocation(abeokuta, lgas).coverage).toBe("outside-lagos");
    expect(resolveLocation(abeokuta, lgas, testStates()).stateName).toBe("Ogun");
  });
  it("does not confuse latitude and longitude (swapped coordinates fall outside Lagos)", () => {
    expect(resolveLocation({ lng: 6.6018, lat: 3.3515 }, lgas).coverage).toBe("outside-lagos");
  });
});

describe("delivery estimate", () => {
  const ikeja = resolveLocation({ lng: 3.3515, lat: 6.6018 }, lgas);
  const west = resolveLocation({ lng: 3.2816, lat: 6.5886 }, lgas);
  it("uses weight bands and rejects weights beyond the top band", () => {
    const pricing = SAMPLE_ZONES[0].pricing;
    expect(feeForWeight(pricing, 5)).toBe(pricing!.bands[0].feeKobo);
    expect(feeForWeight(pricing, 10)).toBe(pricing!.bands[0].feeKobo);
    expect(feeForWeight(pricing, 10.01)).toBe(pricing!.bands[1].feeKobo);
    expect(feeForWeight(pricing, 301)).toBeNull();
    expect(feeForWeight(pricing, 0)).toBeNull();
    expect(feeForWeight(null, 5)).toBeNull();
  });
  it("offers a priced home delivery only where a rule exists", () => {
    const home = estimateDelivery({ resolution: ikeja, weightKg: 24 }).options.find((o) => o.id === "home")!;
    expect(home.available).toBe(true);
    expect(home.feeKobo).toBeGreaterThan(0);
    expect(home.feeBasis).toBe("sample-rule");
    const noRule = estimateDelivery({ resolution: west, weightKg: 24 }).options.find((o) => o.id === "home")!;
    expect(noRule.available).toBe(false);
    expect(noRule.feeKobo).toBeNull();
  });
  it("always labels the estimate as sample and describes pickup distance as straight-line", () => {
    const est = estimateDelivery({ resolution: ikeja, weightKg: 24 });
    expect(est.isSample).toBe(true);
    expect(est.options.find((o) => o.id === "pickup")!.note).toMatch(/straight line/i);
  });
  it("nearest pickup is the geometrically nearest sample point", () => {
    const n = nearestPickup({ lng: 3.47, lat: 6.45 })!;
    expect(n.point.id).toBe("pp-lekki");
    expect(n.km).toBeCloseTo(straightLineKm([3.47, 6.45], [3.4723, 6.4474]), 5);
  });
});
