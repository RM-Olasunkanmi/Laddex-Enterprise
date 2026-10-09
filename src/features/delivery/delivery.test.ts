import { describe, expect, it } from "vitest";

import { estimateDelivery, feeForWeight } from "./pricing";
import { resolveLocation } from "./resolve";

import { GAZETTEER } from "@/fixtures/geography/gazetteer";
import {
  REGIONS,
  STATE_REGION,
  regionOfState,
} from "@/fixtures/geography/regions";
import { testLgas, testStates } from "@/test/geo";

const states = testStates();

describe("boundary data", () => {
  it("has the 36 states and the FCT with unique ids", () => {
    expect(states).toHaveLength(37);
    expect(new Set(states.map((s) => s.id)).size).toBe(37);
  });
  it("assigns every state to exactly one geopolitical region", () => {
    const seen = new Map<string, string>();
    for (const r of REGIONS)
      for (const id of r.stateIds) {
        expect(seen.has(id), `${id} duplicated`).toBe(false);
        seen.set(id, r.id);
      }
    for (const s of states)
      expect(seen.has(s.id), `${s.id} has no region`).toBe(true);
    expect(Object.keys(STATE_REGION)).toHaveLength(37);
    expect(REGIONS.map((r) => r.stateIds.length).sort()).toEqual([
      5, 6, 6, 6, 7, 7,
    ]);
  });
  it("has 774 LGAs spread over per-state files, none of them empty", () => {
    let n = 0;
    for (const s of states) {
      const lgas = testLgas(s.id);
      expect(lgas.length, s.id).toBeGreaterThan(0);
      for (const l of lgas) expect(l.stateId).toBe(s.id);
      n += lgas.length;
    }
    expect(n).toBe(774);
  });
  it("Lagos has its 20 LGAs", () => expect(testLgas("lagos")).toHaveLength(20));
});

describe("resolveLocation (spatial join)", () => {
  it("places every gazetteer locality in the state it names", () => {
    for (const g of GAZETTEER) {
      const r = resolveLocation({ lng: g.lng, lat: g.lat }, states);
      expect(r.stateId, g.name).toBe(g.stateId);
      expect(r.regionId, g.name).toBe(regionOfState(g.stateId)?.id);
    }
  });
  it("adds the LGA when the state's LGA file is supplied", () => {
    const r = resolveLocation(
      { lng: 3.3515, lat: 6.6018 },
      states,
      testLgas("lagos"),
    );
    expect(r.lgaName).toBe("Ikeja");
    expect(r.stateName).toBe("Lagos");
    expect(r.regionName).toBe("South West");
  });
  it("leaves the LGA empty without it, but still resolves the state and region", () => {
    const r = resolveLocation({ lng: 8.592, lat: 12.0022 }, states);
    expect(r.stateId).toBe("kano");
    expect(r.regionName).toBe("North West");
    expect(r.lgaId).toBeNull();
  });
  it("flags points outside Nigeria", () => {
    expect(resolveLocation({ lng: 2.35, lat: 6.37 }, states).coverage).toBe(
      "outside-nigeria",
    ); // Cotonou, Benin
    expect(resolveLocation({ lng: 3.0, lat: 3.0 }, states).coverage).toBe(
      "outside-nigeria",
    ); // Gulf of Guinea
  });
  it("does not confuse latitude and longitude (swapped coordinates fall outside Nigeria)", () => {
    expect(resolveLocation({ lng: 6.6018, lat: 3.3515 }, states).coverage).toBe(
      "outside-nigeria",
    );
  });
});

describe("delivery estimate", () => {
  const lagos = resolveLocation({ lng: 3.3515, lat: 6.6018 }, states);
  const kano = resolveLocation({ lng: 8.592, lat: 12.0022 }, states);
  it("uses weight bands and returns a quote when no band covers the weight", () => {
    const pricing = REGIONS[0].pricing;
    expect(feeForWeight(pricing, 3)).toBe(pricing.bands[0].feeKobo);
    expect(feeForWeight(pricing, 5)).toBe(pricing.bands[0].feeKobo);
    expect(feeForWeight(pricing, 5.01)).toBe(pricing.bands[1].feeKobo);
    expect(feeForWeight(pricing, 301)).toBeNull();
    expect(feeForWeight(pricing, 0)).toBeNull();
    expect(feeForWeight(null, 5)).toBeNull();
  });
  it("prices every region and charges more for the farther regions", () => {
    const fee = (id: string) =>
      REGIONS.find((r) => r.id === id)!.pricing.bands[1].feeKobo;
    expect(fee("south-west")).toBeLessThan(fee("north-central"));
    expect(fee("north-central")).toBeLessThan(fee("north-west"));
    expect(fee("north-west")).toBeLessThan(fee("north-east"));
  });
  it("offers home delivery with a sample fee anywhere in Nigeria", () => {
    for (const res of [lagos, kano]) {
      const home = estimateDelivery({
        resolution: res,
        weightKg: 24,
      }).options.find((o) => o.id === "home")!;
      expect(home.available).toBe(true);
      expect(home.feeKobo).toBeGreaterThan(0);
      expect(home.feeBasis).toBe("sample-rule");
    }
    const kanoFee = estimateDelivery({ resolution: kano, weightKg: 24 })
      .options[0].feeKobo!;
    const lagosFee = estimateDelivery({ resolution: lagos, weightKg: 24 })
      .options[0].feeKobo!;
    expect(kanoFee).toBeGreaterThan(lagosFee);
  });
  it("requires a quote above the heaviest band, and refuses points outside Nigeria", () => {
    const heavy = estimateDelivery({
      resolution: lagos,
      weightKg: 900,
    }).options;
    expect(heavy.find((o) => o.id === "home")!.available).toBe(false);
    expect(heavy.find((o) => o.id === "freight")!.available).toBe(true);
    const out = resolveLocation({ lng: 2.35, lat: 6.37 }, states);
    const est = estimateDelivery({ resolution: out, weightKg: 10 });
    expect(est.options.every((o) => !o.available)).toBe(true);
  });
  it("always labels the estimate as sample", () => {
    expect(estimateDelivery({ resolution: lagos, weightKg: 24 }).isSample).toBe(
      true,
    );
  });
});
