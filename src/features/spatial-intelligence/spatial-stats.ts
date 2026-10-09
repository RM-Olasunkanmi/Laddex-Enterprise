import type { AdminUnit } from "@/lib/geo/geography";

import { mulberry32 } from "@/lib/data/random";
import { straightLineKm } from "@/lib/geo/distance";
import {
  bboxContains,
  type PolygonalGeometry,
  type Position,
} from "@/lib/geo/pip";

/**
 * Spatial statistics over administrative units. Everything here is a standard, documented
 * method computed from the data in the browser: no model is trained and nothing is fitted to
 * look good. With 37 units and synthetic data the results demonstrate the method; on real
 * orders the same code produces real findings. Caveats live in definitions.ts and on the page.
 */

export type Adjacency = Map<string, string[]>;

const vertices = (g: PolygonalGeometry): Position[] => {
  const polys = g.type === "Polygon" ? [g.coordinates] : g.coordinates;
  const out: Position[] = [];
  for (const poly of polys)
    for (const ring of poly) for (const p of ring) out.push(p);
  return out;
};

/**
 * Queen contiguity: two units are neighbours when their boundaries touch at any point. Because
 * boundaries are simplified independently, "touch" means some vertex of one lies within `tol`
 * degrees (about 3 km at 0.03) of a vertex of the other.
 */
export function buildAdjacency(units: AdminUnit[], tol = 0.03): Adjacency {
  const adj: Adjacency = new Map(units.map((u) => [u.id, []]));
  const verts = new Map(units.map((u) => [u.id, vertices(u.geometry)]));
  for (let i = 0; i < units.length; i++) {
    for (let j = i + 1; j < units.length; j++) {
      const a = units[i];
      const b = units[j];
      if (
        a.bbox[0] > b.bbox[2] + tol ||
        b.bbox[0] > a.bbox[2] + tol ||
        a.bbox[1] > b.bbox[3] + tol ||
        b.bbox[1] > a.bbox[3] + tol
      )
        continue;
      const va = verts.get(a.id)!;
      const vb = verts.get(b.id)!;
      let touch = false;
      outer: for (const p of va) {
        if (
          !bboxContains(
            [
              b.bbox[0] - tol,
              b.bbox[1] - tol,
              b.bbox[2] + tol,
              b.bbox[3] + tol,
            ],
            p[0],
            p[1],
          )
        )
          continue;
        for (const q of vb) {
          if (Math.abs(p[0] - q[0]) < tol && Math.abs(p[1] - q[1]) < tol) {
            touch = true;
            break outer;
          }
        }
      }
      if (touch) {
        adj.get(a.id)!.push(b.id);
        adj.get(b.id)!.push(a.id);
      }
    }
  }
  return adj;
}

const mean = (v: number[]) => v.reduce((s, x) => s + x, 0) / v.length;
const sd = (v: number[]) => {
  const m = mean(v);
  return Math.sqrt(v.reduce((s, x) => s + (x - m) ** 2, 0) / v.length);
};

/** Fisher-Yates shuffle in place with a seeded generator, so p-values are reproducible. */
function shuffle<T>(a: T[], rng: () => number) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
}

export interface Series {
  ids: string[];
  values: number[];
}

/** Aligns a value map to the ids that have neighbours and a finite value. */
export function toSeries(
  values: Map<string, number | null>,
  adj: Adjacency,
): Series {
  const ids = [...adj.keys()].filter((id) => {
    const v = values.get(id);
    return v !== null && v !== undefined && Number.isFinite(v);
  });
  return { ids, values: ids.map((id) => values.get(id) as number) };
}

/** Row-standardised neighbour indexes restricted to ids in the series. */
function neighbourIndex(s: Series, adj: Adjacency): number[][] {
  const idx = new Map(s.ids.map((id, i) => [id, i]));
  return s.ids.map((id) =>
    (adj.get(id) ?? [])
      .map((n) => idx.get(n))
      .filter((i): i is number => i !== undefined),
  );
}

function moranI(z: number[], nb: number[][]): number {
  let num = 0;
  let w0 = 0;
  for (let i = 0; i < z.length; i++) {
    const k = nb[i].length;
    if (!k) continue;
    for (const j of nb[i]) {
      num += (z[i] * z[j]) / k;
    }
    w0 += 1;
  }
  const den = z.reduce((s, x) => s + x * x, 0);
  return den > 0 && w0 > 0 ? (z.length / w0) * (num / den) : 0;
}

export interface GlobalMoran {
  i: number;
  expected: number;
  /** Standard score of the observed I against the permutation distribution. */
  z: number;
  /** Two-sided pseudo p-value from the permutations. */
  p: number;
  n: number;
  permutations: number;
}

/** Global Moran's I with row-standardised queen weights and a seeded permutation test. */
export function globalMoran(
  s: Series,
  adj: Adjacency,
  permutations = 999,
  seed = 7,
): GlobalMoran {
  const n = s.values.length;
  const m = mean(s.values);
  const z = s.values.map((v) => v - m);
  const nb = neighbourIndex(s, adj);
  const obs = moranI(z, nb);
  const expected = -1 / (n - 1);
  const rng = mulberry32(seed);
  const work = [...z];
  const sims: number[] = [];
  let extreme = 0;
  for (let p = 0; p < permutations; p++) {
    shuffle(work, rng);
    const v = moranI(work, nb);
    sims.push(v);
    if (Math.abs(v - expected) >= Math.abs(obs - expected)) extreme++;
  }
  const sm = mean(sims);
  const ss = sd(sims);
  return {
    i: obs,
    expected,
    z: ss > 0 ? (obs - sm) / ss : 0,
    p: (extreme + 1) / (permutations + 1),
    n,
    permutations,
  };
}

export type LisaClass =
  "high-high" | "low-low" | "high-low" | "low-high" | "not-significant";

export interface LisaResult {
  id: string;
  value: number;
  /** Mean of the neighbours' values (spatial lag). */
  lag: number;
  localI: number;
  p: number;
  cls: LisaClass;
  /** Quadrant by sign alone, whether or not significant. */
  quadrant: Exclude<LisaClass, "not-significant">;
}

/** Local Moran (LISA) with a conditional permutation test per unit. Use p < 0.05 as a screening flag, not proof. */
export function localMoran(
  s: Series,
  adj: Adjacency,
  permutations = 999,
  seed = 11,
  alpha = 0.05,
): LisaResult[] {
  const n = s.values.length;
  const m = mean(s.values);
  const sdv = sd(s.values) || 1;
  const z = s.values.map((v) => (v - m) / sdv);
  const nb = neighbourIndex(s, adj);
  const rng = mulberry32(seed);
  const out: LisaResult[] = [];
  for (let i = 0; i < n; i++) {
    const k = nb[i].length;
    const lagZ = k ? nb[i].reduce((a, j) => a + z[j], 0) / k : 0;
    const localI = z[i] * lagZ;
    // Conditional permutation: keep z[i] fixed, draw k other values at random.
    const others = z.filter((_, j) => j !== i);
    let extreme = 0;
    if (k) {
      for (let p = 0; p < permutations; p++) {
        let acc = 0;
        for (let t = 0; t < k; t++)
          acc += others[Math.floor(rng() * others.length)];
        if (Math.abs(z[i] * (acc / k)) >= Math.abs(localI)) extreme++;
      }
    }
    const pv = k ? (extreme + 1) / (permutations + 1) : 1;
    const quadrant: LisaResult["quadrant"] =
      z[i] >= 0
        ? lagZ >= 0
          ? "high-high"
          : "high-low"
        : lagZ >= 0
          ? "low-high"
          : "low-low";
    out.push({
      id: s.ids[i],
      value: s.values[i],
      lag: k ? nb[i].reduce((a, j) => a + s.values[j], 0) / k : 0,
      localI,
      p: pv,
      quadrant,
      cls: pv < alpha ? quadrant : "not-significant",
    });
  }
  return out;
}

export interface GiResult {
  id: string;
  z: number;
  /** "hot" and "cold" at |z| >= 1.96 (about 95%), "warm" and "cool" at |z| >= 1.645 (about 90%). */
  cls: "hot" | "warm" | "neutral" | "cool" | "cold";
}

/** Getis-Ord Gi*: includes the unit itself with binary weights, so a high z means a cluster of high values around it. */
export function getisOrdGiStar(s: Series, adj: Adjacency): GiResult[] {
  const n = s.values.length;
  const xbar = mean(s.values);
  const sdv = sd(s.values) || 1;
  const nb = neighbourIndex(s, adj);
  return s.ids.map((id, i) => {
    const members = [i, ...nb[i]];
    const w = members.length;
    const sumX = members.reduce((a, j) => a + s.values[j], 0);
    const denom = sdv * Math.sqrt((n * w - w * w) / (n - 1));
    const z = denom > 0 ? (sumX - xbar * w) / denom : 0;
    return {
      id,
      z,
      cls:
        z >= 1.96
          ? "hot"
          : z >= 1.645
            ? "warm"
            : z <= -1.96
              ? "cold"
              : z <= -1.645
                ? "cool"
                : "neutral",
    };
  });
}

/** Gini coefficient: 0 is perfectly even, values near 1 mean almost everything sits in one unit. */
export function gini(values: number[]): number | null {
  const v = values
    .filter((x) => x >= 0 && Number.isFinite(x))
    .sort((a, b) => a - b);
  const n = v.length;
  const total = v.reduce((s, x) => s + x, 0);
  if (n < 2 || total <= 0) return null;
  let cum = 0;
  for (let i = 0; i < n; i++) cum += (i + 1) * v[i];
  return (2 * cum) / (n * total) - (n + 1) / n;
}

/** Lorenz curve points: cumulative share of units (poorest first) against cumulative share of sales. */
export function lorenz(values: number[]): { x: number; y: number }[] {
  const v = values
    .filter((x) => x >= 0 && Number.isFinite(x))
    .sort((a, b) => a - b);
  const total = v.reduce((s, x) => s + x, 0);
  const pts = [{ x: 0, y: 0 }];
  if (!v.length || total <= 0) return pts;
  let cum = 0;
  v.forEach((x, i) => {
    cum += x;
    pts.push({ x: (i + 1) / v.length, y: cum / total });
  });
  return pts;
}

export interface LocationQuotient {
  unitId: string;
  category: string;
  lq: number | null;
  /** Value of the unit in this category. */
  amount: number;
  /** False when the unit has too little total volume for the ratio to mean much. */
  reliable: boolean;
}

/**
 * Location quotient: a unit's share of one category divided by the country's share of it.
 * 1 is the national mix, 1.5 means the category is half again as important here as elsewhere.
 */
export function locationQuotients(
  table: Map<string, Record<string, number>>,
  categories: string[],
  minUnitTotal = 0,
): LocationQuotient[] {
  const unitTotal = new Map<string, number>();
  const catTotal: Record<string, number> = Object.fromEntries(
    categories.map((c) => [c, 0]),
  );
  let grand = 0;
  for (const [id, row] of table) {
    const t = categories.reduce((s, c) => s + (row[c] ?? 0), 0);
    unitTotal.set(id, t);
    grand += t;
    for (const c of categories) catTotal[c] += row[c] ?? 0;
  }
  const out: LocationQuotient[] = [];
  for (const [id, row] of table) {
    const t = unitTotal.get(id) ?? 0;
    for (const c of categories) {
      const nat = grand > 0 ? catTotal[c] / grand : 0;
      out.push({
        unitId: id,
        category: c,
        amount: row[c] ?? 0,
        lq: t > 0 && nat > 0 ? (row[c] ?? 0) / t / nat : null,
        reliable: t >= minUnitTotal,
      });
    }
  }
  return out;
}

export interface DistanceBand {
  label: string;
  fromKm: number;
  toKm: number;
  orders: number;
  grossKobo: number;
  share: number | null;
}

export const DEFAULT_BAND_EDGES = [0, 100, 250, 500, 800, Infinity];

/** Sales by straight-line distance from an origin. This is not road distance and not delivery time. */
export function distanceBands(
  points: { lng: number; lat: number; grossKobo: number }[],
  origin: { lng: number; lat: number },
  edges: number[] = DEFAULT_BAND_EDGES,
): DistanceBand[] {
  const bands: DistanceBand[] = edges.slice(0, -1).map((from, i) => ({
    label: Number.isFinite(edges[i + 1])
      ? `${from}–${edges[i + 1]} km`
      : `${from} km and over`,
    fromKm: from,
    toKm: edges[i + 1],
    orders: 0,
    grossKobo: 0,
    share: null,
  }));
  let total = 0;
  for (const p of points) {
    const d = straightLineKm([origin.lng, origin.lat], [p.lng, p.lat]);
    const b = bands.find((x) => d >= x.fromKm && d < x.toKm);
    if (b) {
      b.orders++;
      b.grossKobo += p.grossKobo;
      total += p.grossKobo;
    }
  }
  for (const b of bands) b.share = total > 0 ? b.grossKobo / total : null;
  return bands;
}

export interface Opportunity {
  id: string;
  score: number;
  ownZ: number;
  neighbourZ: number;
  growth: number | null;
  reasons: string[];
}

/**
 * Expansion candidates: units whose own demand is low relative to what their neighbours' demand
 * would suggest (a low-high pattern), with growth as a tie-breaker. It ranks where to look first;
 * it does not estimate potential sales and ignores population, competition and logistics.
 */
export function opportunityCandidates(
  s: Series,
  adj: Adjacency,
  growth: Map<string, number | null>,
  names: Map<string, string>,
): Opportunity[] {
  const m = mean(s.values);
  const sdv = sd(s.values) || 1;
  const z = s.values.map((v) => (v - m) / sdv);
  const nb = neighbourIndex(s, adj);
  const out: Opportunity[] = [];
  s.ids.forEach((id, i) => {
    const k = nb[i].length;
    if (!k) return;
    const nz = nb[i].reduce((a, j) => a + z[j], 0) / k;
    const g = growth.get(id) ?? null;
    const gap = nz - z[i];
    if (gap <= 0.4) return;
    const score = gap + (g !== null ? Math.max(-0.5, Math.min(1, g)) * 0.5 : 0);
    const reasons = [
      `Own demand is ${z[i] < 0 ? "below" : "near"} the national average (z = ${z[i].toFixed(2)}).`,
      `Neighbouring states average z = ${nz.toFixed(2)}: ${nb[i]
        .map((j) => names.get(s.ids[j]) ?? s.ids[j])
        .slice(0, 4)
        .join(", ")}${nb[i].length > 4 ? "…" : ""}.`,
    ];
    if (g !== null)
      reasons.push(
        `Sales ${g >= 0 ? "grew" : "fell"} ${Math.abs(Math.round(g * 100))}% against the previous period.`,
      );
    out.push({ id, score, ownZ: z[i], neighbourZ: nz, growth: g, reasons });
  });
  return out.sort((a, b) => b.score - a.score);
}
