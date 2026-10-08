"use client";

import { useMemo } from "react";

import { ChartFrame, Legend } from "@/components/charts/chart-frame";
import { HBarChart } from "@/components/charts/hbar-chart";
import { Histogram } from "@/components/charts/histogram";
import { LineChart } from "@/components/charts/line-chart";
import { StackedBar } from "@/components/charts/stacked-bar";
import { Tag } from "@/components/lx/primitives";
import { packLabel } from "@/features/catalogue/selectors";
import { unitName } from "@/features/spatial-intelligence/geo-units";
import { addDays, daysBetween, previousPeriod } from "@/features/spatial-intelligence/filters";
import { bucketFor, concentration, coverageSplit, deliveryFeeHistogram, timeSeries, variantStats } from "@/features/spatial-intelligence/metrics";
import { SCALE_LABEL, UNASSIGNED } from "@/features/spatial-intelligence/types";
import { useDashboard, useKpis } from "@/features/spatial-intelligence/state";
import { SYNTHETIC_NOTICE } from "@/features/spatial-intelligence/definitions";
import { ALL_VARIANTS } from "@/fixtures/products/products";
import { chart } from "@/lib/design/tokens";
import { formatInt, formatNaira, formatNairaCompact, formatPercent } from "@/lib/formatters";

import { KpiTile } from "./kpi";
import { OrderInspector } from "./order-inspector";

export function unassignedLabel(scale: string) {
  return scale === "pickup" ? "Home delivery orders" : scale === "state" ? "No usable location" : scale === "zone" ? "No usable location" : "Outside Lagos or no location";
}

export function Inspector() {
  const { state, dispatch, derived } = useDashboard();
  const kpis = useKpis();
  const { selection, filters } = state;

  const data = useMemo(() => {
    if (!derived || !kpis) return null;
    const range = { from: filters.from, to: filters.to };
    const days = daysBetween(filters.from, filters.to);
    const bucket = bucketFor(days);
    const prevRange = previousPeriod(filters);
    const series = timeSeries(derived.inSelection, range, bucket);
    const prior = timeSeries(derived.previous, prevRange, bucket);
    const vs = variantStats(derived.inSelection, days).filter((v) => v.packs > 0).sort((a, b) => b.grossKobo - a.grossKobo);
    const stats = [...derived.unitStats.values()].sort((a, b) => b.grossKobo - a.grossKobo);
    const conc = concentration(stats.filter((s) => s.id !== UNASSIGNED));
    return { series, prior, bucket, vs, stats, conc, hist: deliveryFeeHistogram(derived.inSelection), cover: coverageSplit(derived.inSelection), days };
  }, [derived, kpis, filters]);

  if (!derived || !kpis || !data) return <InspectorSkeleton />;
  if (derived.order) return <OrderInspector order={derived.order} onBack={() => dispatch({ type: "selectOrder", orderId: null })} backLabel={derived.selectedUnit ? `Back to ${derived.selectedUnit.name}` : "Back to all orders"} />;

  const { current: k, previous: p } = kpis;
  const title = derived.selectedUnit?.name ?? "All of the active extent";
  const empty = k.ordersPlaced === 0;
  const maxStat = Math.max(1, ...data.stats.map((s) => s.grossKobo));

  return (
    <div className="p-4 space-y-6">
      <header>
        <p className="eyebrow">{selection.unitId ? SCALE_LABEL[selection.scale] : "Extent"}</p>
        <div className="flex items-start justify-between gap-2 mt-1">
          <h2 className="!text-2xl leading-tight" data-testid="inspector-title">{title}</h2>
          {selection.unitId && <button className="btn btn-quiet btn-sm shrink-0 underline underline-offset-4" onClick={() => dispatch({ type: "selectUnit", unitId: null })}>Clear</button>}
        </div>
        <p className="text-xs text-ink-3 mt-1">{formatInt(k.ordersPlaced)} orders from {filters.from} to {filters.to}. Filters kept.</p>
      </header>

      {empty ? (
        <div className="panel p-6 text-center" role="status">
          <p className="font-display text-xl">No orders match</p>
          <p className="text-sm text-ink-2 mt-1">Widen the date range or clear a filter. The selected area has no orders under the current filters.</p>
          <button className="btn btn-ink btn-sm mt-4" onClick={() => dispatch({ type: "resetAll" })}>Reset filters</button>
        </div>
      ) : (
        <>
          <section aria-label="Key figures" className="grid grid-cols-2 gap-2" data-testid="kpis">
            <KpiTile metric="gross" value={formatNairaCompact(k.grossKobo)} current={k.grossKobo} previous={p.grossKobo} spark={data.series.map((s) => s.grossKobo)} />
            <KpiTile metric="net" value={formatNairaCompact(k.netKobo)} current={k.netKobo} previous={p.netKobo} />
            <KpiTile metric="orders" value={formatInt(k.ordersPlaced)} current={k.ordersPlaced} previous={p.ordersPlaced} note={k.cancelled ? `${k.cancelled} cancelled` : undefined} />
            <KpiTile metric="aov" value={formatNairaCompact(k.aovKobo)} current={k.aovKobo} previous={p.aovKobo} />
            <KpiTile metric="fulfilment" value={formatPercent(k.fulfilmentRate)} current={k.fulfilmentRate} previous={p.fulfilmentRate} note={`${k.closedOrders} closed orders`} />
            <KpiTile metric="repeat" value={formatPercent(k.repeatRate, 0)} current={k.repeatRate} previous={p.repeatRate} note={`${k.customers} buying customers`} />
          </section>
          <p className="mono text-[0.6875rem] text-ink-3 -mt-3">{formatInt(k.packs)} packs · {formatInt(Math.round(k.litres))} L palm oil · {formatInt(Math.round(k.kilograms))} kg tapioca</p>

          <ChartFrame title={`Gross sales by ${data.bucket}`} metric="gross" unit="NGN" table={<TrendTable series={data.series} prior={data.prior} />}>
            <LineChart series={data.series.map((s) => ({ date: s.date, value: s.grossKobo }))} prior={data.prior.map((s) => ({ date: s.date, value: s.grossKobo }))} bucketLabel={data.bucket} />
            <Legend items={[{ label: "Selected period", color: chart.palmOil }, { label: "Previous period", color: chart.prior, dashed: true }]} />
          </ChartFrame>

          <ChartFrame title="Retail and wholesale" metric="gross" unit="Share of gross sales" table={<MiniTable rows={[["Retail", formatNaira(k.grossBySegment.retail)], ["Wholesale", formatNaira(k.grossBySegment.wholesale)]]} />}>
            <StackedBar ariaLabel="Gross sales by segment" segments={[
              { key: "r", label: "Retail", value: k.grossBySegment.retail, display: formatPercent(k.shareBySegment.retail, 0), fill: chart.retail },
              { key: "w", label: "Wholesale", value: k.grossBySegment.wholesale, display: formatPercent(k.shareBySegment.wholesale, 0), fill: chart.wholesale, hatch: true },
            ]} />
          </ChartFrame>

          <ChartFrame title="Palm oil and tapioca" metric="gross" unit="Share of gross sales" table={<MiniTable rows={[["Palm oil", formatNaira(k.grossByCategory["palm-oil"])], ["Tapioca", formatNaira(k.grossByCategory.tapioca)]]} />}>
            <StackedBar ariaLabel="Gross sales by product" segments={[
              { key: "p", label: "Palm oil", value: k.grossByCategory["palm-oil"], display: formatPercent(k.shareByCategory["palm-oil"], 0), fill: chart.palmOil },
              { key: "t", label: "Tapioca", value: k.grossByCategory.tapioca, display: formatPercent(k.shareByCategory.tapioca, 0), fill: chart.tapioca, hatch: true },
            ]} />
          </ChartFrame>

          <ChartFrame title="Demand by pack size" metric="velocity" unit="Packs sold, with packs per day" table={<MiniTable rows={data.vs.map((v) => [packName(v.variantId), `${v.packs} packs, ${v.velocity?.toFixed(1) ?? "—"}/day`])} />}>
            <HBarChart ariaLabel="Packs sold by pack size" data={data.vs.map((v) => ({ id: v.variantId, label: packName(v.variantId), value: v.packs, display: `${formatInt(v.packs)}`, fill: v.variantId.startsWith("po") ? chart.palmOil : chart.tapioca, hatch: v.variantId.startsWith("tp") }))} />
          </ChartFrame>

          <ChartFrame title={`Gross sales by ${SCALE_LABEL[selection.scale].toLowerCase()}`} metric="salesPerZone" unit="NGN, current filters, all areas" table={<MiniTable rows={data.stats.map((s) => [s.id === UNASSIGNED ? unassignedLabel(selection.scale) : unitName(derived.units, s.id), formatNaira(s.grossKobo)])} />}>
            <HBarChart ariaLabel={`Gross sales by ${SCALE_LABEL[selection.scale]}`} max={maxStat} onSelect={(id) => id !== UNASSIGNED && dispatch({ type: "selectUnit", unitId: selection.unitId === id ? null : id })} data={data.stats.slice(0, 9).map((s) => ({ id: s.id, label: s.id === UNASSIGNED ? unassignedLabel(selection.scale) : unitName(derived.units, s.id), value: s.grossKobo, display: formatNairaCompact(s.grossKobo), selected: s.id === selection.unitId, fill: s.id === UNASSIGNED ? chart.neutral : chart.palmOil }))} />
            {data.conc.top3Share !== null && <p className="text-xs text-ink-2 mt-2">Top three areas hold <strong className="mono">{formatPercent(data.conc.top3Share, 0)}</strong> of placed sales across {data.conc.units} areas. HHI <span className="mono">{data.conc.hhi!.toFixed(2)}</span> (even spread would be {(1 / data.conc.units).toFixed(2)}).</p>}
          </ChartFrame>

          <ChartFrame title="Delivery fee distribution" metric="deliveryCost" unit={`NGN per order, ${data.hist.n} orders`} table={<MiniTable rows={data.hist.bins.map((b) => [`${formatNaira(b.from)} to ${formatNaira(b.to)}`, `${b.count}`])} />}>
            <Histogram bins={data.hist.bins} median={data.hist.median} p90={data.hist.p90} n={data.hist.n} />
            {data.hist.n > 0 && <p className="text-xs text-ink-2 mt-1">Median <span className="mono">{formatNaira(data.hist.median)}</span> (solid line), 90th percentile <span className="mono">{formatNaira(data.hist.p90)}</span> (dashed).</p>}
          </ChartFrame>

          <ChartFrame title="Orders against sample coverage" metric="coverage" unit="Share of non-cancelled orders" table={<MiniTable rows={[["Inside sample zones", `${data.cover.inSampleZones}`], ["Lagos, outside zones", `${data.cover.outsideSampleZones}`], ["Outside Lagos", `${data.cover.outsideLagos}`], ["No usable location", `${data.cover.unlocated}`]]} />}>
            <StackedBar ariaLabel="Orders by sample coverage" segments={[
              { key: "in", label: "In sample zones", value: data.cover.inSampleZones, display: formatPercent(data.cover.inSampleZones / (data.cover.total || 1), 0), fill: chart.tapioca },
              { key: "out", label: "Lagos, no zone", value: data.cover.outsideSampleZones, display: formatPercent(data.cover.outsideSampleZones / (data.cover.total || 1), 0), fill: chart.wholesale, hatch: true },
              { key: "ol", label: "Outside Lagos", value: data.cover.outsideLagos, display: formatPercent(data.cover.outsideLagos / (data.cover.total || 1), 0), fill: chart.palmOil },
              { key: "nl", label: "No location", value: data.cover.unlocated, display: formatPercent(data.cover.unlocated / (data.cover.total || 1), 0), fill: chart.neutral, hatch: true },
            ]} />
          </ChartFrame>
        </>
      )}
      <p className="text-[0.6875rem] text-ink-3 border-t border-line pt-3">{SYNTHETIC_NOTICE}</p>
    </div>
  );
}

const packName = (variantId: string) => {
  const v = ALL_VARIANTS.find((x) => x.id === variantId)!;
  return `${v.productId === "palm-oil" ? "Palm oil" : "Tapioca"} ${packLabel(v)}`;
};

function MiniTable({ rows }: { rows: string[][] }) {
  return (
    <table className="dtable"><tbody>{rows.map((r, i) => <tr key={i}><td>{r[0]}</td><td className="r">{r[1]}</td></tr>)}</tbody></table>
  );
}

function TrendTable({ series, prior }: { series: { date: string; grossKobo: number }[]; prior: { date: string; grossKobo: number }[] }) {
  return (
    <table className="dtable"><thead><tr><th scope="col">From</th><th scope="col" className="!text-right">Sales</th><th scope="col" className="!text-right">Previous</th></tr></thead>
      <tbody>{series.map((s, i) => <tr key={s.date}><td>{s.date}</td><td className="r">{formatNaira(s.grossKobo)}</td><td className="r">{prior[i] ? formatNaira(prior[i].grossKobo) : "—"}</td></tr>)}</tbody></table>
  );
}

function InspectorSkeleton() {
  return (
    <div className="p-4 space-y-4" aria-busy="true" aria-label="Loading statistics">
      <div className="skel h-4 w-24" /><div className="skel h-8 w-48" />
      <div className="grid grid-cols-2 gap-2">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="skel h-20" />)}</div>
      <div className="skel h-36" /><div className="skel h-24" />
    </div>
  );
}

export { addDays };
