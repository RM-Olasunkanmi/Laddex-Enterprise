"use client";

import Link from "next/link";
import { useMemo } from "react";

import { KpiTile } from "./kpi";
import { Loading, Page } from "./section-pages";

import { ChartFrame, Legend } from "@/components/charts/chart-frame";
import { HBarChart } from "@/components/charts/hbar-chart";
import { Histogram } from "@/components/charts/histogram";
import { LineChart } from "@/components/charts/line-chart";
import { StackedBar } from "@/components/charts/stacked-bar";
import {
  StateChoropleth,
  type ChoroplethCell,
} from "@/components/charts/state-choropleth";
import { classify, colorFor } from "@/features/spatial-intelligence/choropleth";
import {
  daysBetween,
  filterOrders,
  previousPeriod,
} from "@/features/spatial-intelligence/filters";
import {
  aggregateByUnit,
  bucketFor,
  computeKpis,
  deliveryFeeHistogram,
  reach,
  timeSeries,
} from "@/features/spatial-intelligence/metrics";
import { useDashboard } from "@/features/spatial-intelligence/state";
import {
  SEGMENT_LABEL,
  SEGMENTS,
  UNASSIGNED,
} from "@/features/spatial-intelligence/types";
import { useTheme } from "@/lib/design/theme";
import { chart, chartByTheme } from "@/lib/design/tokens";
import {
  formatInt,
  formatNaira,
  formatNairaCompact,
  formatPercent,
} from "@/lib/formatters";

const SEG_FILL = {
  retail: chart.retail,
  wholesale: chart.wholesale,
  events: chart.events,
} as const;
const CAT = [
  { id: "palm-oil", label: "Palm oil", fill: chart.palm },
  { id: "tapioca", label: "Tapioca flakes", fill: chart.tapioca },
  { id: "garri", label: "Garri", fill: chart.garri },
] as const;

/** Nationwide overview: the whole country under the active filters, ignoring any map selection. */
export function OverviewPage() {
  const { derived, dataset, state } = useDashboard();
  const theme = useTheme();
  const data = useMemo(() => {
    if (!derived || !dataset) return null;
    const { filters } = state;
    const prevOrders = filterOrders(
      dataset.orders,
      filters,
      previousPeriod(filters),
    );
    const days = daysBetween(filters.from, filters.to);
    const bucket = bucketFor(days);
    const stats = [...aggregateByUnit(derived.scoped, "state").values()].sort(
      (a, b) => b.grossKobo - a.grossKobo,
    );
    return {
      k: computeKpis(derived.scoped),
      p: computeKpis(prevOrders),
      series: timeSeries(derived.scoped, filters, bucket),
      prior: timeSeries(prevOrders, previousPeriod(filters), bucket),
      bucket,
      stats,
      hist: deliveryFeeHistogram(derived.scoped),
      reach: reach(derived.scoped),
      regions: aggregateByUnit(derived.scoped, "region"),
    };
  }, [derived, dataset, state]);
  if (!derived || !dataset || !data) return <Loading />;
  const { k, p } = data;
  const names = new Map(dataset.states.map((s) => [s.id, s.name]));
  const nameOf = (id: string) =>
    id === UNASSIGNED ? "No usable location" : (names.get(id) ?? id);

  const seq = chartByTheme[theme].sequential;
  const classes = classify(
    data.stats.filter((s) => s.id !== UNASSIGNED).map((s) => s.grossKobo),
    chart.sequential,
  );
  const cells = new Map<string, ChoroplethCell>(
    dataset.states.map((s) => {
      const st = data.stats.find((x) => x.id === s.id);
      return [
        s.id,
        {
          fill: st
            ? (colorFor(classes, st.grossKobo) ?? "var(--color-paper-2)")
            : "var(--color-paper-2)",
          title: `${s.name}: ${st ? formatNairaCompact(st.grossKobo) : "no orders"}`,
        },
      ];
    }),
  );
  void seq;

  return (
    <Page
      title="Overview"
      lead="Sales, products and buyers across Nigeria under the active filters. Open Geographic explorer for the map and Spatial insights for the statistics."
    >
      {k.ordersPlaced === 0 ? (
        <div className="panel p-6 text-center" role="status">
          <p className="font-display text-xl">No orders match</p>
          <p className="text-sm text-ink-2 mt-1">
            Widen the date range or clear a filter.
          </p>
        </div>
      ) : (
        <>
          <section
            aria-label="Key figures"
            className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2"
            data-testid="kpis"
          >
            <KpiTile
              metric="gross"
              value={formatNairaCompact(k.grossKobo)}
              current={k.grossKobo}
              previous={p.grossKobo}
              spark={data.series.map((s) => s.grossKobo)}
            />
            <KpiTile
              metric="net"
              value={formatNairaCompact(k.netKobo)}
              current={k.netKobo}
              previous={p.netKobo}
            />
            <KpiTile
              metric="orders"
              value={formatInt(k.ordersPlaced)}
              current={k.ordersPlaced}
              previous={p.ordersPlaced}
              note={k.cancelled ? `${k.cancelled} cancelled` : undefined}
            />
            <KpiTile
              metric="aov"
              value={formatNairaCompact(k.aovKobo)}
              current={k.aovKobo}
              previous={p.aovKobo}
            />
            <KpiTile
              metric="fulfilment"
              value={formatPercent(k.fulfilmentRate)}
              current={k.fulfilmentRate}
              previous={p.fulfilmentRate}
              note={`${k.closedOrders} closed orders`}
            />
            <KpiTile
              metric="repeat"
              value={formatPercent(k.repeatRate, 0)}
              current={k.repeatRate}
              previous={p.repeatRate}
              note={`${k.customers} buying customers`}
            />
          </section>
          <p className="mono text-[0.6875rem] text-ink-3 -mt-3">
            {formatInt(k.packs)} packs · {formatInt(Math.round(k.litres))} L
            palm oil · {formatInt(Math.round(k.kilograms))} kg tapioca and garri
            · {data.reach.statesReached} of {data.reach.totalStates} states
            reached
          </p>

          <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
            <div className="panel p-4">
              <ChartFrame
                title={`Gross sales by ${data.bucket}`}
                metric="gross"
                unit="NGN"
              >
                <LineChart
                  series={data.series.map((s) => ({
                    date: s.date,
                    value: s.grossKobo,
                  }))}
                  prior={data.prior.map((s) => ({
                    date: s.date,
                    value: s.grossKobo,
                  }))}
                  bucketLabel={data.bucket}
                  height={190}
                />
                <Legend
                  items={[
                    { label: "Selected period", color: chart.palm },
                    {
                      label: "Previous period",
                      color: chart.prior,
                      dashed: true,
                    },
                  ]}
                />
              </ChartFrame>
            </div>
            <div className="panel p-4">
              <ChartFrame
                title="Gross sales by state"
                metric="salesPerZone"
                unit="Darker = more sales"
                table={
                  <table className="dtable">
                    <tbody>
                      {data.stats.slice(0, 40).map((s) => (
                        <tr key={s.id}>
                          <td>{nameOf(s.id)}</td>
                          <td className="r">{formatNaira(s.grossKobo)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                }
              >
                <StateChoropleth
                  cells={cells}
                  ariaLabel="Map of gross sales by state"
                  className="w-full max-w-sm mx-auto h-auto"
                />
                <p className="text-xs text-ink-3 mt-1 text-center">
                  <Link
                    href="/dashboard/geography"
                    className="underline underline-offset-4"
                  >
                    Open the full map
                  </Link>
                </p>
              </ChartFrame>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="panel p-4">
              <ChartFrame
                title="Top states"
                metric="gross"
                unit="NGN, current filters"
                table={
                  <table className="dtable">
                    <tbody>
                      {data.stats.map((s) => (
                        <tr key={s.id}>
                          <td>{nameOf(s.id)}</td>
                          <td className="r">{formatNaira(s.grossKobo)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                }
              >
                <HBarChart
                  ariaLabel="Gross sales by state"
                  data={data.stats.slice(0, 10).map((s) => ({
                    id: s.id,
                    label: nameOf(s.id),
                    value: s.grossKobo,
                    display: formatNairaCompact(s.grossKobo),
                    fill: s.id === UNASSIGNED ? chart.neutral : chart.palm,
                  }))}
                />
              </ChartFrame>
            </div>
            <div className="panel p-4 space-y-5">
              <ChartFrame
                title="Buyer segments"
                metric="gross"
                unit="Share of gross sales"
              >
                <StackedBar
                  ariaLabel="Gross sales by buyer segment"
                  segments={SEGMENTS.map((g, i) => ({
                    key: g,
                    label: SEGMENT_LABEL[g],
                    value: k.grossBySegment[g],
                    display: formatPercent(k.shareBySegment[g], 0),
                    fill: SEG_FILL[g],
                    hatch: i === 1,
                  }))}
                />
              </ChartFrame>
              <ChartFrame
                title="Products"
                metric="gross"
                unit="Share of gross sales"
              >
                <StackedBar
                  ariaLabel="Gross sales by product"
                  segments={CAT.map((c, i) => ({
                    key: c.id,
                    label: c.label,
                    value: k.grossByCategory[c.id],
                    display: formatPercent(k.shareByCategory[c.id], 0),
                    fill: c.fill,
                    hatch: i === 1,
                  }))}
                />
              </ChartFrame>
            </div>
            <div className="panel p-4">
              <ChartFrame
                title="Delivery fee distribution"
                metric="deliveryCost"
                unit={`NGN per order, ${data.hist.n} orders`}
              >
                <Histogram
                  bins={data.hist.bins}
                  median={data.hist.median}
                  p90={data.hist.p90}
                  n={data.hist.n}
                />
                {data.hist.n > 0 && (
                  <p className="text-xs text-ink-2 mt-1">
                    Median{" "}
                    <span className="mono">
                      {formatNaira(data.hist.median)}
                    </span>
                    , 90th percentile{" "}
                    <span className="mono">{formatNaira(data.hist.p90)}</span>.
                    Sample regional rates.
                  </p>
                )}
              </ChartFrame>
            </div>
          </div>
        </>
      )}
    </Page>
  );
}
