import { describe, expect, it } from "vitest";

import {
  buildAdjacency,
  getisOrdGiStar,
  gini,
  globalMoran,
  localMoran,
  locationQuotients,
  lorenz,
  distanceBands,
  toSeries,
} from "./spatial-stats";

import type { AdminUnit } from "@/lib/geo/geography";

import { testStates } from "@/test/geo";

// A 1 x N strip of unit squares: neighbours are left and right.
const square = (i: number): AdminUnit => ({
  id: `u${i}`,
  name: `U${i}`,
  level: "state",
  geometry: {
    type: "Polygon",
    coordinates: [
      [
        [i, 0],
        [i + 1, 0],
        [i + 1, 1],
        [i, 1],
        [i, 0],
      ],
    ],
  },
  bbox: [i, 0, i + 1, 1],
});
const strip = (n: number) => Array.from({ length: n }, (_, i) => square(i));
const series = (units: AdminUnit[], f: (i: number) => number) => {
  const adj = buildAdjacency(units, 0.01);
  return { adj, s: toSeries(new Map(units.map((u, i) => [u.id, f(i)])), adj) };
};

describe("buildAdjacency", () => {
  it("links touching squares and not distant ones", () => {
    const a = buildAdjacency(strip(4), 0.01);
    expect(a.get("u0")).toEqual(["u1"]);
    expect([...a.get("u1")!].sort()).toEqual(["u0", "u2"]);
  });
  it("finds the real neighbours of the FCT and Lagos", () => {
    const states = testStates();
    const a = buildAdjacency(states);
    expect(states).toHaveLength(37);
    expect([...a.get("fct")!].sort()).toEqual(
      expect.arrayContaining(["niger", "kogi", "nasarawa", "kaduna"]),
    );
    expect(a.get("lagos")).toContain("ogun");
    for (const [id, n] of a) expect(n.length, id).toBeGreaterThan(0);
    // Symmetric
    for (const [id, n] of a) for (const m of n) expect(a.get(m)).toContain(id);
  });
});

describe("globalMoran", () => {
  it("is strongly positive for a smooth gradient and significant", () => {
    const { adj, s } = series(strip(30), (i) => i);
    const r = globalMoran(s, adj, 499);
    expect(r.i).toBeGreaterThan(0.8);
    expect(r.p).toBeLessThan(0.01);
  });
  it("is strongly negative for an alternating pattern", () => {
    const { adj, s } = series(strip(30), (i) => (i % 2 ? 10 : 0));
    expect(globalMoran(s, adj, 499).i).toBeLessThan(-0.8);
  });
  it("is reproducible with the same seed", () => {
    const { adj, s } = series(strip(20), (i) => Math.sin(i));
    expect(globalMoran(s, adj, 199, 3)).toEqual(globalMoran(s, adj, 199, 3));
  });
});

describe("localMoran and Gi*", () => {
  const { adj, s } = series(strip(30), (i) =>
    i < 8 ? 100 + i : i > 21 ? 1 : 10,
  );
  it("labels a high cluster High-High and a low cluster Low-Low", () => {
    const lisa = localMoran(s, adj, 499);
    expect(lisa.find((r) => r.id === "u3")!.quadrant).toBe("high-high");
    expect(lisa.find((r) => r.id === "u27")!.quadrant).toBe("low-low");
  });
  it("gives a positive Gi* z in the hot cluster", () => {
    const gi = getisOrdGiStar(s, adj);
    expect(gi.find((r) => r.id === "u3")!.z).toBeGreaterThan(1.5);
    expect(gi.find((r) => r.id === "u15")!.z).toBeLessThan(
      gi.find((r) => r.id === "u3")!.z,
    );
  });
});

describe("gini and lorenz", () => {
  it("is 0 for equal values and near 1 for one dominant unit", () => {
    expect(gini([5, 5, 5, 5])).toBeCloseTo(0, 6);
    expect(gini([0, 0, 0, 100])).toBeCloseTo(0.75, 6);
    expect(gini([1])).toBeNull();
  });
  it("lorenz ends at (1,1)", () => {
    const l = lorenz([1, 2, 3, 4]);
    expect(l[0]).toEqual({ x: 0, y: 0 });
    expect(l.at(-1)).toEqual({ x: 1, y: 1 });
  });
});

describe("locationQuotients", () => {
  it("is 1 when a unit has the national mix and above 1 when it over-indexes", () => {
    const t = new Map([
      ["a", { x: 50, y: 50 }],
      ["b", { x: 90, y: 10 }],
      ["c", { x: 10, y: 90 }],
    ]);
    const q = locationQuotients(t, ["x", "y"]);
    expect(
      q.find((r) => r.unitId === "a" && r.category === "x")!.lq,
    ).toBeCloseTo(1, 6);
    expect(
      q.find((r) => r.unitId === "b" && r.category === "x")!.lq,
    ).toBeGreaterThan(1.5);
    expect(
      q.find((r) => r.unitId === "c" && r.category === "x")!.lq,
    ).toBeLessThan(0.5);
  });
});

describe("distanceBands", () => {
  it("places points in the right band and shares sum to 1", () => {
    const origin = { lng: 3.4, lat: 6.5 };
    const b = distanceBands(
      [
        { lng: 3.4, lat: 6.6, grossKobo: 100 },
        { lng: 3.4, lat: 9.0, grossKobo: 300 },
      ],
      origin,
    );
    expect(b[0].orders).toBe(1); // ~11 km
    expect(b.find((x) => x.orders === 1 && x !== b[0])!.fromKm).toBe(250); // ~277 km
    expect(b.reduce((s, x) => s + (x.share ?? 0), 0)).toBeCloseTo(1, 6);
  });
});
