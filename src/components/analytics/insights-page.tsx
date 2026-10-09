"use client";

import { useMemo, useState } from "react";

import { Loading, Page } from "./section-pages";

import type { AdminUnit } from "@/lib/geo/geography";

import { ChartFrame } from "@/components/charts/chart-frame";
import { HBarChart } from "@/components/charts/hbar-chart";
import { LorenzChart } from "@/components/charts/lorenz-chart";
import {
  StateChoropleth,
  type ChoroplethCell,
} from "@/components/charts/state-choropleth";
import { Notice, Tag } from "@/components/lx/primitives";
import { METRICS } from "@/features/spatial-intelligence/definitions";
import {
  filterOrders,
  previousPeriod,
} from "@/features/spatial-intelligence/filters";
import {
  aggregateByUnit,
  regionMonthMatrix,
  type UnitStat,
} from "@/features/spatial-intelligence/metrics";
import {
  buildAdjacency,
  distanceBands,
  getisOrdGiStar,
  gini,
  globalMoran,
  localMoran,
  locationQuotients,
  lorenz,
  opportunityCandidates,
  toSeries,
  type Adjacency,
  type LisaClass,
} from "@/features/spatial-intelligence/spatial-stats";
import { useDashboard } from "@/features/spatial-intelligence/state";
import { SEGMENT_LABEL, SEGMENTS } from "@/features/spatial-intelligence/types";
import { GAZETTEER } from "@/fixtures/geography/gazetteer";
import { REGIONS } from "@/fixtures/geography/regions";
import { DATASET_END, DATASET_START } from "@/fixtures/orders/generate";
import {
  formatInt,
  formatNaira,
  formatNairaCompact,
  formatPercent,
} from "@/lib/formatters";

type Measure = "sales" | "density" | "aov";
const MEASURES: { id: Measure; label: string; note: string }[] = [
  {
    id: "sales",
    label: "Gross sales (log scale)",
    note: "log10 of naira sales, so one very large state does not dominate",
  },
  {
    id: "density",
    label: "Orders per 1,000 km²",
    note: "order density, which adjusts for state size",
  },
  {
    id: "aov",
    label: "Average order value",
    note: "naira per order, a measure of basket size rather than volume",
  },
];

const adjCache = new WeakMap<AdminUnit[], Adjacency>();
const adjacencyFor = (states: AdminUnit[]) => {
  let a = adjCache.get(states);
  if (!a) adjCache.set(states, (a = buildAdjacency(states)));
  return a;
};

const LISA_STYLE: Record<
  LisaClass,
  { fill: string; label: string; mark: string }
> = {
  "high-high": {
    fill: "var(--chart-palm)",
    label: "High-High: strong state in a strong area",
    mark: "HH",
  },
  "low-low": {
    fill: "var(--chart-retail)",
    label: "Low-Low: weak state in a weak area",
    mark: "LL",
  },
  "high-low": {
    fill: "var(--chart-tapioca)",
    label: "High-Low: strong state among weak neighbours",
    mark: "HL",
  },
  "low-high": {
    fill: "var(--chart-garri)",
    label: "Low-High: weak state among strong neighbours",
    mark: "LH",
  },
  "not-significant": {
    fill: "var(--color-paper-2)",
    label: "No significant pattern",
    mark: "",
  },
};
const GI_STYLE = {
  hot: { fill: "var(--chart-palm)", label: "Hot spot (95%)", mark: "▲▲" },
  warm: {
    fill: "color-mix(in srgb, var(--chart-palm) 45%, var(--color-card))",
    label: "Warm (90%)",
    mark: "▲",
  },
  neutral: { fill: "var(--color-paper-2)", label: "Not significant", mark: "" },
  cool: {
    fill: "color-mix(in srgb, var(--chart-retail) 45%, var(--color-card))",
    label: "Cool (90%)",
    mark: "▼",
  },
  cold: { fill: "var(--chart-retail)", label: "Cold spot (95%)", mark: "▼▼" },
} as const;

const mix = (c: string, pct: number) =>
  `color-mix(in srgb, ${c} ${Math.round(pct)}%, var(--color-card))`;
const MIN_ORDERS = 15;

export function InsightsPage() {
  const { derived, dataset, state } = useDashboard();
  const [measure, setMeasure] = useState<Measure>("sales");
  const [originId, setOriginId] = useState("lagos");

  const data = useMemo(() => {
    if (!derived || !dataset) return null;
    const names = new Map(dataset.states.map((s) => [s.id, s.name]));
    const adj = adjacencyFor(dataset.states);
    const stats = aggregateByUnit(derived.scoped, "state");
    const prevStats = aggregateByUnit(
      filterOrders(
        dataset.orders,
        state.filters,
        previousPeriod(state.filters),
      ),
      "state",
    );
    const stat = (id: string): UnitStat | undefined => stats.get(id);

    const values = new Map<string, number | null>();
    for (const s of dataset.states) {
      const st = stat(s.id);
      const area = dataset.stateAreaKm2[s.id] ?? 0;
      values.set(
        s.id,
        measure === "sales"
          ? Math.log10(1 + (st?.grossKobo ?? 0) / 100)
          : measure === "density"
            ? area > 0
              ? ((st?.ordersActive ?? 0) / area) * 1000
              : null
            : st?.aovKobo != null
              ? st.aovKobo / 100
              : null,
      );
    }
    const series = toSeries(values, adj);
    const moran = series.values.length > 5 ? globalMoran(series, adj) : null;
    const lisa = series.values.length > 5 ? localMoran(series, adj) : [];
    const gi = series.values.length > 5 ? getisOrdGiStar(series, adj) : [];

    const grossAll = dataset.states.map((s) => stat(s.id)?.grossKobo ?? 0);
    const g = gini(grossAll);
    const lz = lorenz(grossAll);
    const totalGross = grossAll.reduce((a, b) => a + b, 0);
    const ranked = dataset.states
      .map((s) => ({
        id: s.id,
        name: s.name,
        gross: stat(s.id)?.grossKobo ?? 0,
        orders: stat(s.id)?.ordersActive ?? 0,
      }))
      .sort((a, b) => b.gross - a.gross);

    const growth = new Map<string, number | null>();
    const lowBase = new Set<string>();
    for (const s of dataset.states) {
      const cur = stat(s.id)?.grossKobo ?? 0;
      const prev = prevStats.get(s.id);
      if (!prev || prev.ordersActive < MIN_ORDERS) {
        growth.set(s.id, null);
        lowBase.add(s.id);
      } else growth.set(s.id, (cur - prev.grossKobo) / prev.grossKobo);
    }
    const growthRank = dataset.states
      .map((s) => ({ id: s.id, name: s.name, g: growth.get(s.id) ?? null }))
      .filter((r): r is { id: string; name: string; g: number } => r.g !== null)
      .sort((a, b) => b.g - a.g);

    const cats = ["palm-oil", "tapioca", "garri"];
    const catTable = new Map<string, Record<string, number>>();
    const segTable = new Map<string, Record<string, number>>();
    for (const s of dataset.states) {
      const st = stat(s.id);
      if (!st) continue;
      catTable.set(s.id, { ...st.byCategory });
      segTable.set(s.id, { ...st.bySegment });
    }
    const lqCat = locationQuotients(catTable, cats);
    const lqSeg = locationQuotients(segTable, [...SEGMENTS]);

    const origins = GAZETTEER.filter((e) => e.capital);
    const origin =
      origins.find((o) => o.stateId === originId) ??
      origins.find((o) => o.stateId === "lagos")!;
    const pts = derived.scoped
      .filter((o) => o.status !== "cancelled" && o.location)
      .map((o) => ({
        lng: o.location!.lng,
        lat: o.location!.lat,
        grossKobo: o.goodsKobo,
      }));
    const bands = distanceBands(pts, { lng: origin.lng, lat: origin.lat });

    const opp =
      series.values.length > 5
        ? opportunityCandidates(series, adj, growth, names).slice(0, 6)
        : [];

    const fullWindow = filterOrders(dataset.orders, {
      ...state.filters,
      from: DATASET_START,
      to: DATASET_END,
    });
    const matrix = regionMonthMatrix(fullWindow);

    return {
      names,
      adj,
      stats,
      values,
      series,
      moran,
      lisa,
      gi,
      g,
      lz,
      totalGross,
      ranked,
      growth,
      growthRank,
      lowBase,
      lqCat,
      lqSeg,
      origins,
      origin,
      bands,
      opp,
      matrix,
    };
  }, [derived, dataset, state.filters, measure, originId]);

  if (!derived || !dataset || !data) return <Loading />;
  const m = MEASURES.find((x) => x.id === measure)!;
  const { moran, lisa, gi, names } = data;
  const empty = derived.scoped.length === 0;

  // ---- plain-language findings, each computed from the numbers above ----
  const findings: string[] = [];
  if (!empty) {
    const top = data.ranked[0];
    const top3 = data.ranked.slice(0, 3).reduce((s, r) => s + r.gross, 0);
    findings.push(
      `${top.name} is the largest state with ${formatPercent(top.gross / (data.totalGross || 1), 0)} of gross sales; the top three states together hold ${formatPercent(top3 / (data.totalGross || 1), 0)}.`,
    );
    if (data.g !== null)
      findings.push(
        `Sales are ${data.g > 0.6 ? "highly" : data.g > 0.4 ? "moderately" : "fairly evenly"} concentrated across states (Gini ${data.g.toFixed(2)}).`,
      );
    if (moran)
      findings.push(
        moran.p < 0.05 && moran.i > 0
          ? `Strong states sit next to strong states more than chance explains (Moran's I ${moran.i.toFixed(2)}, p ${moran.p < 0.002 ? "< 0.002" : moran.p.toFixed(3)}): demand is regionally clustered, not scattered.`
          : `No reliable spatial clustering in ${m.label.toLowerCase()} at this sample size (Moran's I ${moran.i.toFixed(2)}, p ${moran.p.toFixed(2)}).`,
      );
    const hot = gi.filter((r) => r.cls === "hot").map((r) => names.get(r.id));
    if (hot.length)
      findings.push(
        `Hot spot${hot.length > 1 ? "s" : ""} (Gi*): ${hot.slice(0, 6).join(", ")}${hot.length > 6 ? "…" : ""}.`,
      );
    const fast = data.growthRank[0];
    if (fast)
      findings.push(
        `Fastest-growing state with enough orders to compare: ${fast.name} (${fast.g >= 0 ? "+" : ""}${Math.round(fast.g * 100)}% against the previous period).`,
      );
    if (data.opp[0])
      findings.push(
        `First expansion candidate to examine: ${names.get(data.opp[0].id)} (low own demand beside stronger neighbours).`,
      );
  }

  const lisaCells = new Map<string, ChoroplethCell>(
    lisa.map((r) => [
      r.id,
      {
        fill: LISA_STYLE[r.cls].fill,
        mark: LISA_STYLE[r.cls].mark,
        title: `${names.get(r.id)}: ${LISA_STYLE[r.cls].label} (p ${r.p.toFixed(3)})`,
      },
    ]),
  );
  const giCells = new Map<string, ChoroplethCell>(
    gi.map((r) => [
      r.id,
      {
        fill: GI_STYLE[r.cls].fill,
        mark: GI_STYLE[r.cls].mark,
        title: `${names.get(r.id)}: ${GI_STYLE[r.cls].label}, z ${r.z.toFixed(2)}`,
      },
    ]),
  );
  const growthCells = new Map<string, ChoroplethCell>(
    dataset.states.map((s) => {
      const gv = data.growth.get(s.id) ?? null;
      const fill =
        gv === null
          ? "var(--color-paper-2)"
          : gv <= -0.15
            ? "var(--div-1)"
            : gv < -0.03
              ? "var(--div-2)"
              : gv <= 0.03
                ? "var(--div-3)"
                : gv < 0.15
                  ? "var(--div-4)"
                  : "var(--div-5)";
      return [
        s.id,
        {
          fill,
          title: `${s.name}: ${gv === null ? "too few orders in the previous period" : `${gv >= 0 ? "+" : ""}${Math.round(gv * 100)}%`}`,
        },
      ];
    }),
  );

  const cellColor = (lq: number | null, reliable: boolean) =>
    !reliable || lq === null
      ? "transparent"
      : lq >= 1
        ? mix("var(--chart-garri)", Math.min(50, (lq - 1) * 60))
        : mix("var(--chart-retail)", Math.min(50, (1 - lq) * 70));
  const topStates = data.ranked
    .filter((r) => r.orders >= MIN_ORDERS)
    .slice(0, 12);
  const lqRow = (rows: typeof data.lqCat, id: string, c: string) =>
    rows.find((r) => r.unitId === id && r.category === c);
  const catLabel: Record<string, string> = {
    "palm-oil": "Palm oil",
    tapioca: "Tapioca",
    garri: "Garri",
  };

  const maxCell = Math.max(1, ...data.matrix.cells.map((c) => c.grossKobo));
  const monthLabel = (mo: string) =>
    new Date(`${mo}-15T12:00:00Z`).toLocaleString("en-GB", {
      month: "short",
      year: "2-digit",
      timeZone: "UTC",
    });

  return (
    <Page
      title="Spatial insights"
      lead="Statistical analysis of where demand is, how it clusters and where to look next. Every figure is computed from the filtered orders in your browser."
    >
      <Notice tone="sample" title="Computed on synthetic orders">
        The methods are standard and the code is tested, but the orders are
        generated, so the specific hot spots and candidates below are not real
        findings about Laddex. Connect real orders and the same page produces
        real ones.
      </Notice>

      {empty ? (
        <div className="panel p-6 text-center" role="status">
          <p className="font-display text-xl">No orders match these filters</p>
          <p className="text-sm text-ink-2 mt-1">
            Widen the date range or clear a filter to run the analysis.
          </p>
        </div>
      ) : (
        <>
          <section className="panel p-5" aria-labelledby="findings">
            <h2 id="findings" className="!text-xl">
              What the data says
            </h2>
            <ul
              className="mt-3 space-y-2 list-disc pl-5 text-ink-2"
              data-testid="findings"
            >
              {findings.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
              <label htmlFor="measure" className="eyebrow">
                Measure analysed
              </label>
              <select
                id="measure"
                className="field !w-auto !min-h-9 !py-1"
                value={measure}
                onChange={(e) => setMeasure(e.target.value as Measure)}
              >
                {MEASURES.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.label}
                  </option>
                ))}
              </select>
              <span className="text-ink-3">
                {m.note}. Clustering results below use this measure.
              </span>
            </div>
          </section>

          {/* Clustering */}
          <section
            className="grid gap-4 lg:grid-cols-2"
            aria-label="Spatial clustering"
          >
            <div className="panel p-4">
              <ChartFrame
                title="Do similar states sit together? (Global Moran's I)"
                metric="moran"
                unit={`${data.series.values.length} states · 999 permutations`}
              >
                {moran ? (
                  <dl
                    className="grid grid-cols-3 gap-2 text-center"
                    data-testid="moran"
                  >
                    {[
                      ["Moran's I", moran.i.toFixed(2)],
                      ["Expected if random", moran.expected.toFixed(2)],
                      [
                        "p-value",
                        moran.p < 0.002 ? "< 0.002" : moran.p.toFixed(3),
                      ],
                    ].map(([k, v]) => (
                      <div key={k} className="bg-paper-2 rounded-sm p-2">
                        <dt className="text-[0.6875rem] text-ink-3">{k}</dt>
                        <dd className="mono text-xl">{v}</dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <p className="text-sm text-ink-3">
                    Not enough states with data.
                  </p>
                )}
                {moran && (
                  <p className="mt-3 text-sm text-ink-2">
                    {moran.p < 0.05
                      ? moran.i > 0
                        ? "Clustered: neighbouring states have more similar values than chance would give."
                        : "Dispersed: neighbouring states differ more than chance would give."
                      : "No significant spatial pattern at the 5% level."}{" "}
                    z = {moran.z.toFixed(1)}.
                  </p>
                )}
              </ChartFrame>
            </div>

            <div className="panel p-4">
              <ChartFrame
                title="How concentrated are sales? (Gini and Lorenz)"
                metric="gini"
                unit="Cumulative share of sales against cumulative share of states"
              >
                <div className="grid sm:grid-cols-[1fr_auto] gap-3 items-center">
                  <LorenzChart points={data.lz} gini={data.g} />
                  <dl className="text-center space-y-2">
                    <div className="bg-paper-2 rounded-sm p-2">
                      <dt className="text-[0.6875rem] text-ink-3">Gini</dt>
                      <dd className="mono text-xl" data-testid="gini">
                        {data.g === null ? "—" : data.g.toFixed(2)}
                      </dd>
                    </div>
                    <div className="bg-paper-2 rounded-sm p-2">
                      <dt className="text-[0.6875rem] text-ink-3">
                        Top 5 states
                      </dt>
                      <dd className="mono text-xl">
                        {formatPercent(
                          data.ranked
                            .slice(0, 5)
                            .reduce((s, r) => s + r.gross, 0) /
                            (data.totalGross || 1),
                          0,
                        )}
                      </dd>
                    </div>
                  </dl>
                </div>
              </ChartFrame>
            </div>

            <div className="panel p-4">
              <ChartFrame
                title="Local clusters (LISA)"
                metric="lisa"
                unit={`Measure: ${m.label} · p < 0.05`}
                table={
                  <table className="dtable">
                    <thead>
                      <tr>
                        <th scope="col">State</th>
                        <th scope="col">Class</th>
                        <th scope="col" className="!text-right">
                          p
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {lisa
                        .filter((r) => r.cls !== "not-significant")
                        .map((r) => (
                          <tr key={r.id}>
                            <td>{names.get(r.id)}</td>
                            <td>{LISA_STYLE[r.cls].label}</td>
                            <td className="r">{r.p.toFixed(3)}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                }
              >
                <StateChoropleth
                  cells={lisaCells}
                  ariaLabel="Map of local spatial clusters by state"
                  className="w-full max-w-md mx-auto h-auto"
                />
                <ul className="mt-2 grid sm:grid-cols-2 gap-x-3 gap-y-1 text-xs list-none p-0">
                  {(Object.keys(LISA_STYLE) as LisaClass[]).map((c) => (
                    <li key={c} className="flex items-center gap-1.5">
                      <span
                        aria-hidden="true"
                        className="w-3 h-3 rounded-[2px] border border-ink/30 shrink-0"
                        style={{ background: LISA_STYLE[c].fill }}
                      />
                      {LISA_STYLE[c].mark && (
                        <span className="mono font-semibold">
                          {LISA_STYLE[c].mark}
                        </span>
                      )}
                      <span className="text-ink-2">
                        {LISA_STYLE[c].label} (
                        {lisa.filter((r) => r.cls === c).length})
                      </span>
                    </li>
                  ))}
                </ul>
              </ChartFrame>
            </div>

            <div className="panel p-4">
              <ChartFrame
                title="Hot and cold spots (Getis-Ord Gi*)"
                metric="gistar"
                unit={`Measure: ${m.label}`}
                table={
                  <table className="dtable">
                    <thead>
                      <tr>
                        <th scope="col">State</th>
                        <th scope="col">Class</th>
                        <th scope="col" className="!text-right">
                          z
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...gi]
                        .sort((a, b) => b.z - a.z)
                        .map((r) => (
                          <tr key={r.id}>
                            <td>{names.get(r.id)}</td>
                            <td>{GI_STYLE[r.cls].label}</td>
                            <td className="r">{r.z.toFixed(2)}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                }
              >
                <StateChoropleth
                  cells={giCells}
                  ariaLabel="Map of hot and cold spots by state"
                  className="w-full max-w-md mx-auto h-auto"
                />
                <ul className="mt-2 grid sm:grid-cols-2 gap-x-3 gap-y-1 text-xs list-none p-0">
                  {(Object.keys(GI_STYLE) as (keyof typeof GI_STYLE)[]).map(
                    (c) => (
                      <li key={c} className="flex items-center gap-1.5">
                        <span
                          aria-hidden="true"
                          className="w-3 h-3 rounded-[2px] border border-ink/30 shrink-0"
                          style={{ background: GI_STYLE[c].fill }}
                        />
                        {GI_STYLE[c].mark && (
                          <span className="mono">{GI_STYLE[c].mark}</span>
                        )}
                        <span className="text-ink-2">
                          {GI_STYLE[c].label} (
                          {gi.filter((r) => r.cls === c).length})
                        </span>
                      </li>
                    ),
                  )}
                </ul>
              </ChartFrame>
            </div>
          </section>

          {/* Product and segment mix */}
          <section className="panel p-4" aria-labelledby="lq-title">
            <h2 id="lq-title" className="!text-xl">
              What each state over-buys (location quotients)
            </h2>
            <p className="hint mt-1 max-w-3xl">
              {METRICS.lq.definition} Green = over-indexed, blue =
              under-indexed. States with fewer than {MIN_ORDERS} orders in the
              period are left blank.
            </p>
            <div
              className="mt-3 overflow-x-auto"
              tabIndex={0}
              role="region"
              aria-label="Location quotient table"
            >
              <table className="dtable min-w-[40rem]">
                <thead>
                  <tr>
                    <th scope="col">State (largest {topStates.length})</th>
                    {["palm-oil", "tapioca", "garri"].map((c) => (
                      <th key={c} scope="col" className="!text-right">
                        {catLabel[c]}
                      </th>
                    ))}
                    {SEGMENTS.map((g) => (
                      <th key={g} scope="col" className="!text-right">
                        {SEGMENT_LABEL[g].split(" ")[0]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {topStates.map((r) => (
                    <tr key={r.id}>
                      <td>{r.name}</td>
                      {["palm-oil", "tapioca", "garri"].map((c) => {
                        const q = lqRow(data.lqCat, r.id, c);
                        return (
                          <td
                            key={c}
                            className="r mono"
                            style={{
                              background: cellColor(
                                q?.lq ?? null,
                                r.orders >= MIN_ORDERS,
                              ),
                            }}
                          >
                            {q?.lq == null ? "—" : q.lq.toFixed(2)}
                          </td>
                        );
                      })}
                      {SEGMENTS.map((g) => {
                        const q = lqRow(data.lqSeg, r.id, g);
                        return (
                          <td
                            key={g}
                            className="r mono"
                            style={{
                              background: cellColor(
                                q?.lq ?? null,
                                r.orders >= MIN_ORDERS,
                              ),
                            }}
                          >
                            {q?.lq == null ? "—" : q.lq.toFixed(2)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Growth and opportunities */}
          <section
            className="grid gap-4 lg:grid-cols-2"
            aria-label="Growth and opportunity"
          >
            <div className="panel p-4">
              <ChartFrame
                title="Where sales are growing"
                metric="growth"
                unit="Change in gross sales against the previous period"
              >
                <StateChoropleth
                  cells={growthCells}
                  ariaLabel="Map of sales growth by state"
                  className="w-full max-w-md mx-auto h-auto"
                />
                <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs list-none p-0">
                  {[
                    ["var(--div-1)", "Fell 15%+"],
                    ["var(--div-2)", "Fell"],
                    ["var(--div-3)", "Flat"],
                    ["var(--div-4)", "Grew"],
                    ["var(--div-5)", "Grew 15%+"],
                    ["var(--color-paper-2)", "Too few orders"],
                  ].map(([c, l]) => (
                    <li key={l} className="flex items-center gap-1.5">
                      <span
                        aria-hidden="true"
                        className="w-3 h-3 rounded-[2px] border border-ink/30"
                        style={{ background: c }}
                      />
                      {l}
                    </li>
                  ))}
                </ul>
                <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="eyebrow mb-1">Fastest growing</p>
                    <ol className="list-none p-0 space-y-0.5">
                      {data.growthRank.slice(0, 5).map((r) => (
                        <li key={r.id} className="flex justify-between">
                          <span>{r.name}</span>
                          <span className="mono text-success">
                            +{Math.round(r.g * 100)}%
                          </span>
                        </li>
                      ))}
                    </ol>
                  </div>
                  <div>
                    <p className="eyebrow mb-1">Slowing</p>
                    <ol className="list-none p-0 space-y-0.5">
                      {[...data.growthRank]
                        .reverse()
                        .slice(0, 5)
                        .map((r) => (
                          <li key={r.id} className="flex justify-between">
                            <span>{r.name}</span>
                            <span
                              className={`mono ${r.g < 0 ? "text-danger" : ""}`}
                            >
                              {r.g >= 0 ? "+" : ""}
                              {Math.round(r.g * 100)}%
                            </span>
                          </li>
                        ))}
                    </ol>
                  </div>
                </div>
              </ChartFrame>
            </div>

            <div className="panel p-4">
              <ChartFrame
                title="Expansion candidates"
                metric="opportunity"
                unit="Gap between neighbours' demand and own demand"
              >
                {data.opp.length === 0 ? (
                  <p className="text-sm text-ink-3 py-4">
                    No state shows a large enough gap under these filters.
                  </p>
                ) : (
                  <ol
                    className="list-none p-0 space-y-3"
                    data-testid="opportunities"
                  >
                    {data.opp.map((o, i) => (
                      <li key={o.id} className="border-l-4 border-ember pl-3">
                        <p className="flex items-baseline justify-between gap-2">
                          <span className="font-semibold">
                            {i + 1}. {names.get(o.id)}
                          </span>
                          <span className="mono text-xs text-ink-3">
                            score {o.score.toFixed(2)}
                          </span>
                        </p>
                        <ul className="mt-1 text-xs text-ink-2 list-disc pl-4 space-y-0.5">
                          {o.reasons.map((r) => (
                            <li key={r}>{r}</li>
                          ))}
                        </ul>
                      </li>
                    ))}
                  </ol>
                )}
                <p className="hint mt-3">{METRICS.opportunity.caveat}</p>
              </ChartFrame>
            </div>
          </section>

          {/* Distance from base */}
          <section className="panel p-4" aria-labelledby="dist-title">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 id="dist-title" className="!text-xl">
                  How far do sales reach from a base?
                </h2>
                <p className="hint mt-1 max-w-2xl">
                  {METRICS.distanceBands.caveat}
                </p>
              </div>
              <div>
                <label htmlFor="origin" className="eyebrow block mb-1">
                  Base location
                </label>
                <select
                  id="origin"
                  className="field !w-auto !min-h-9 !py-1"
                  value={data.origin.stateId}
                  onChange={(e) => setOriginId(e.target.value)}
                >
                  {data.origins.map((o) => (
                    <option key={o.stateId} value={o.stateId}>
                      {o.name} ({names.get(o.stateId)})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4">
              <ChartFrame
                title={`Share of sales by straight-line distance from ${data.origin.name}`}
                metric="distanceBands"
                unit="Share of gross sales"
                table={
                  <table className="dtable">
                    <tbody>
                      {data.bands.map((b) => (
                        <tr key={b.label}>
                          <td>{b.label}</td>
                          <td className="r">{formatInt(b.orders)} orders</td>
                          <td className="r">{formatNaira(b.grossKobo)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                }
              >
                <HBarChart
                  ariaLabel="Share of sales by distance band"
                  data={data.bands.map((b) => ({
                    id: b.label,
                    label: b.label,
                    value: b.grossKobo,
                    display: `${formatPercent(b.share, 0)} · ${formatNairaCompact(b.grossKobo)}`,
                    fill: "var(--chart-palm)",
                  }))}
                />
              </ChartFrame>
            </div>
          </section>

          {/* Region x month */}
          <section className="panel p-4" aria-labelledby="mat-title">
            <h2 id="mat-title" className="!text-xl">
              Region by month
            </h2>
            <p className="hint mt-1">
              Gross sales for every month in the dataset, regardless of the date
              range above. Darker means more.
            </p>
            <div
              className="mt-3 overflow-x-auto"
              tabIndex={0}
              role="region"
              aria-label="Region by month sales table"
            >
              <table className="dtable min-w-[32rem]">
                <thead>
                  <tr>
                    <th scope="col">Region</th>
                    {data.matrix.months.map((mo) => (
                      <th key={mo} scope="col" className="!text-right">
                        {monthLabel(mo)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {REGIONS.map((r) => (
                    <tr key={r.id}>
                      <td>{r.name}</td>
                      {data.matrix.months.map((mo) => {
                        const v =
                          data.matrix.cells.find(
                            (c) => c.regionId === r.id && c.month === mo,
                          )?.grossKobo ?? 0;
                        return (
                          <td
                            key={mo}
                            className="r mono"
                            style={{
                              background: mix(
                                "var(--chart-palm)",
                                (v / maxCell) * 55,
                              ),
                            }}
                          >
                            {formatNairaCompact(v)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="hint mt-2">The first and last months are partial.</p>
          </section>

          <section
            className="panel p-4 text-sm text-ink-2 space-y-2"
            aria-labelledby="meth"
          >
            <h2 id="meth" className="!text-xl text-ink">
              Method notes
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Neighbours are states whose boundaries touch (queen contiguity,{" "}
                {formatInt(
                  [...data.adj.values()].reduce((s, n) => s + n.length, 0) / 2,
                )}{" "}
                borders). Weights are row-standardised.
              </li>
              <li>
                P-values come from seeded random permutations, so they are
                identical on every run. With 37 states, treat p between 0.01 and
                0.05 as suggestive.
              </li>
              <li>
                No population, income or competitor data is used, and none was
                supplied. Per-person measures are therefore not shown.
              </li>
              <li>
                Every statistic recomputes when you change the date range,
                product, segment or channel filters above.
              </li>
            </ul>
            <p>
              <Tag tone="sample">Synthetic orders</Tag>{" "}
              <span className="ml-2">
                Boundaries: geoBoundaries (GRID3), CC BY 4.0.
              </span>
            </p>
          </section>
        </>
      )}
    </Page>
  );
}
