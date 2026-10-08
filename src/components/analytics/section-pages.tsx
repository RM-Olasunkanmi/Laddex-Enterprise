"use client";

import { useEffect, useMemo, useState } from "react";

import { ChartFrame } from "@/components/charts/chart-frame";
import { HBarChart } from "@/components/charts/hbar-chart";
import { Notice, Tag } from "@/components/lx/primitives";
import { activeTier } from "@/features/catalogue/pricing";
import { packLabel } from "@/features/catalogue/selectors";
import { METRICS, SYNTHETIC_NOTICE } from "@/features/spatial-intelligence/definitions";
import { daysBetween } from "@/features/spatial-intelligence/filters";
import { aggregateByUnit, computeKpis, ratio, variantStats } from "@/features/spatial-intelligence/metrics";
import { useDashboard } from "@/features/spatial-intelligence/state";
import { UNASSIGNED } from "@/features/spatial-intelligence/types";
import { DATASET_DAYS, DATASET_END, DATASET_START } from "@/fixtures/orders/generate";
import { ALL_VARIANTS } from "@/fixtures/products/products";
import { chart } from "@/lib/design/tokens";
import { formatInt, formatNaira, formatNairaCompact, formatPercent } from "@/lib/formatters";
import { loadSourcesMeta, type GeoSourcesMeta } from "@/lib/geo/geography";

import { OrderTable } from "./order-table";

function Page({ title, lead, children }: { title: string; lead: string; children: React.ReactNode }) {
  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      <div className="p-4 md:p-6 max-w-6xl space-y-6">
        <header><p className="eyebrow">Staff dashboard</p><h1 className="!text-3xl mt-1">{title}</h1><p className="text-ink-2 mt-1 max-w-2xl">{lead}</p></header>
        {children}
        <p className="text-[0.6875rem] text-ink-3 border-t border-line pt-3">{SYNTHETIC_NOTICE}</p>
      </div>
    </div>
  );
}

function Loading() {
  return <div className="p-6 space-y-3" aria-busy="true"><div className="skel h-8 w-64" /><div className="skel h-40" /><div className="skel h-40" /></div>;
}

export function OrdersPage() {
  const { derived } = useDashboard();
  if (!derived) return <Loading />;
  return (
    <Page title="Orders" lead="Orders under the active filters and geographic selection. Choose a role to see order-level records.">
      <div className="panel"><OrderTable /></div>
    </Page>
  );
}

export function CustomersPage() {
  const { derived, state } = useDashboard();
  const data = useMemo(() => {
    if (!derived) return null;
    const orders = derived.inSelection.filter((o) => o.status !== "cancelled");
    const by = new Map<string, { id: string; segment: string; orders: number; gross: number; lga: string | null }>();
    for (const o of orders) {
      const e = by.get(o.customerId) ?? { id: o.customerId, segment: o.segment, orders: 0, gross: 0, lga: o.lgaId };
      e.orders++;
      e.gross += o.goodsKobo;
      by.set(o.customerId, e);
    }
    const list = [...by.values()].sort((a, b) => b.gross - a.gross);
    const seg = (s: string) => list.filter((c) => c.segment === s);
    const rep = (l: typeof list) => ratio(l.filter((c) => c.orders >= 2).length, l.length);
    return { list, retail: seg("retail"), wholesale: seg("wholesale"), repRetail: rep(seg("retail")), repWhole: rep(seg("wholesale")), total: list.reduce((s, c) => s + c.gross, 0) };
  }, [derived]);
  if (!derived || !data) return <Loading />;
  const admin = state.role === "admin";
  return (
    <Page title="Customers" lead="Buying customers in the selected period. Customer references are pseudonymous; names and addresses are not loaded here.">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[["Buying customers", formatInt(data.list.length)], ["Retail", formatInt(data.retail.length)], ["Wholesale", formatInt(data.wholesale.length)], ["Repeat rate, retail", formatPercent(data.repRetail, 0)]].map(([l, v]) => <div key={l} className="panel p-4"><p className="text-xs text-ink-3">{l}</p><p className="mono text-2xl mt-1">{v}</p></div>)}
      </div>
      <p className="hint">Repeat rate (two or more orders in the period): retail {formatPercent(data.repRetail, 0)}, wholesale {formatPercent(data.repWhole, 0)}. A short date range understates it.</p>
      <div className="panel overflow-x-auto">
        <table className="dtable min-w-[32rem]"><caption className="text-left px-4 py-3 border-b border-line font-display text-lg">Largest customers by gross sales {admin ? "" : "(references only)"}</caption>
          <thead><tr><th scope="col">Customer</th><th scope="col">Segment</th><th scope="col" className="!text-right">Orders</th><th scope="col" className="!text-right">Gross sales</th><th scope="col" className="!text-right">Share</th></tr></thead>
          <tbody>{data.list.slice(0, 12).map((c) => <tr key={c.id}><td className="mono">{c.id}</td><td>{c.segment}</td><td className="r">{c.orders}</td><td className="r">{formatNaira(c.gross)}</td><td className="r">{formatPercent(ratio(c.gross, data.total), 1)}</td></tr>)}</tbody></table>
      </div>
    </Page>
  );
}

export function InventoryPage() {
  const { derived, state } = useDashboard();
  const days = daysBetween(state.filters.from, state.filters.to);
  const rows = useMemo(() => (derived ? variantStats(derived.inSelection, days).map((v) => {
    const variant = ALL_VARIANTS.find((x) => x.id === v.variantId)!;
    const cover = v.velocity && v.velocity > 0 ? variant.stock.qtyAvailable / v.velocity : null;
    return { v, variant, cover };
  }) : []), [derived, days]);
  if (!derived) return <Loading />;
  return (
    <Page title="Inventory" lead="Stock on hand from the catalogue against sales velocity in the selected period. Days of cover is a simple projection, not a forecast.">
      <ChartFrame title="Days of cover by pack" metric="velocity" unit="Days at the current sales rate" source="Catalogue stock, synthetic orders" table={<table className="dtable"><tbody>{rows.map((r) => <tr key={r.variant.id}><td>{packLabel(r.variant)}</td><td className="r">{r.cover === null ? "—" : r.cover.toFixed(1)}</td></tr>)}</tbody></table>}>
        <HBarChart ariaLabel="Days of cover by pack" data={rows.filter((r) => r.cover !== null).sort((a, b) => a.cover! - b.cover!).map((r) => ({ id: r.variant.id, label: `${r.variant.productId === "palm-oil" ? "Palm oil" : "Tapioca"} ${packLabel(r.variant)}`, value: Math.min(r.cover!, 400), display: r.cover! > 400 ? "400+" : r.cover!.toFixed(0), fill: r.variant.productId === "palm-oil" ? chart.palmOil : chart.tapioca, hatch: r.variant.productId === "tapioca" }))} />
      </ChartFrame>
      <div className="panel overflow-x-auto">
        <table className="dtable min-w-[40rem]"><thead><tr><th scope="col">Pack</th><th scope="col" className="!text-right">On hand</th><th scope="col" className="!text-right">Sold in period</th><th scope="col" className="!text-right">Packs/day</th><th scope="col" className="!text-right">Days of cover</th><th scope="col">Flag</th></tr></thead>
          <tbody>{rows.map(({ v, variant, cover }) => <tr key={variant.id}><td>{variant.productId === "palm-oil" ? "Palm oil" : "Tapioca"} {packLabel(variant)}</td><td className="r">{variant.stock.qtyAvailable}</td><td className="r">{v.packs}</td><td className="r">{v.velocity?.toFixed(1) ?? "—"}</td><td className="r">{cover === null ? "—" : cover.toFixed(0)}</td><td>{variant.stock.status === "out-of-stock" ? <Tag tone="danger">Out of stock</Tag> : cover !== null && cover < 14 ? <Tag tone="warning">Under 14 days</Tag> : <Tag tone="success">Covered</Tag>}</td></tr>)}</tbody></table>
      </div>
      <Notice tone="sample">Stock quantities are catalogue fixtures. Production reads live stock per distribution point from the inventory system.</Notice>
    </Page>
  );
}

export function WholesalePage() {
  const { derived } = useDashboard();
  const data = useMemo(() => {
    if (!derived) return null;
    const orders = derived.inSelection.filter((o) => o.segment === "wholesale" && o.status !== "cancelled");
    let lines = 0, metMoq = 0;
    const tierHits = new Map<string, number>();
    for (const o of orders) for (const l of o.lines) {
      const v = ALL_VARIANTS.find((x) => x.id === l.variantId)!;
      lines++;
      if (l.qty >= v.wholesaleMinQty) metMoq++;
      const t = activeTier(v.wholesaleTiers, l.qty);
      const key = t ? `${t.minQty}+ packs` : "List price";
      tierHits.set(key, (tierHits.get(key) ?? 0) + 1);
    }
    return { k: computeKpis(orders), lines, metMoq, tierHits: [...tierHits.entries()].sort((a, b) => b[1] - a[1]), accounts: new Set(orders.map((o) => o.customerId)).size };
  }, [derived]);
  if (!derived || !data) return <Loading />;
  return (
    <Page title="Wholesale operations" lead="Wholesale buying in the selected period and geography, and how orders land against minimum quantities and price tiers.">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[["Wholesale gross", formatNairaCompact(data.k.grossKobo)], ["Wholesale orders", formatInt(data.k.ordersActive)], ["Active accounts", formatInt(data.accounts)], ["Lines meeting minimum", formatPercent(ratio(data.metMoq, data.lines), 0)]].map(([l, v]) => <div key={l} className="panel p-4"><p className="text-xs text-ink-3">{l}</p><p className="mono text-2xl mt-1">{v}</p></div>)}
      </div>
      <ChartFrame title="Order lines by tier reached" unit="Number of order lines" table={<table className="dtable"><tbody>{data.tierHits.map(([k, n]) => <tr key={k}><td>{k}</td><td className="r">{n}</td></tr>)}</tbody></table>}>
        <HBarChart ariaLabel="Order lines by tier reached" data={data.tierHits.map(([k, n]) => ({ id: k, label: k, value: n, display: String(n), fill: chart.wholesale, hatch: true }))} empty="No wholesale orders in this selection" />
      </ChartFrame>
      <div className="panel p-4">
        <h2 className="!text-xl mb-2">Account applications</h2>
        <table className="dtable"><thead><tr><th scope="col">Business</th><th scope="col">Type</th><th scope="col">Status</th></tr></thead>
          <tbody>{[["Sample Trading Co.", "Distributor", "in-review"], ["Example Foods Ltd.", "Processor", "submitted"], ["Demo Catering", "Caterer", "approved"]].map(([b, t, s]) => <tr key={b}><td>{b}</td><td>{t}</td><td><Tag tone={s === "approved" ? "success" : "info"}>{s}</Tag></td></tr>)}</tbody></table>
        <p className="hint mt-2">Sample applications. Approval actions are part of the backend phase.</p>
      </div>
    </Page>
  );
}

function csv(rows: (string | number)[][]) {
  return rows.map((r) => r.map((c) => (typeof c === "string" && /[",\n]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c)).join(",")).join("\n");
}

export function ReportsPage() {
  const { derived, dataset, state } = useDashboard();
  const [meta, setMeta] = useState<GeoSourcesMeta | null>(null);
  useEffect(() => void loadSourcesMeta().then(setMeta).catch(() => setMeta(null)), []);
  if (!derived || !dataset) return <Loading />;
  const download = () => {
    const stats = [...aggregateByUnit(derived.scoped, "lga").values()];
    const rows: (string | number)[][] = [["lga_id", "lga_name", "orders_placed", "orders_active", "gross_ngn", "net_ngn", "packs", "aov_ngn", "fulfilment_rate"]];
    for (const s of stats) rows.push([s.id, dataset.lgas.find((l) => l.id === s.id)?.name ?? (s.id === UNASSIGNED ? "Outside Lagos or no location" : s.id), s.ordersPlaced, s.ordersActive, s.grossKobo / 100, s.netKobo / 100, s.packs, s.aovKobo === null ? "" : s.aovKobo / 100, s.fulfilmentRate === null ? "" : s.fulfilmentRate.toFixed(4)]);
    const blob = new Blob([`# Synthetic development data. Period ${state.filters.from} to ${state.filters.to}.\n${csv(rows)}`], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `laddex-lga-summary-${state.filters.from}-${state.filters.to}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  return (
    <Page title="Reports and methods" lead="What every figure means, where the geography comes from, and what the data is.">
      <section className="panel p-4 space-y-2">
        <h2 className="!text-xl">Data in use</h2>
        <dl className="grid grid-cols-[10rem_1fr] gap-y-1.5 text-sm">
          <dt className="text-ink-3">Orders</dt><dd><Tag tone="sample">Synthetic</Tag> {formatInt(dataset.orders.length)} generated orders, {DATASET_START} to {DATASET_END} ({DATASET_DAYS} days), deterministic seed.</dd>
          <dt className="text-ink-3">Prices</dt><dd>Computed with the storefront pricing function from illustrative catalogue prices.</dd>
          <dt className="text-ink-3">Zones</dt><dd>Sample service zones grouping real LGAs. Not verified coverage.</dd>
          <dt className="text-ink-3">Spatial join</dt><dd>Point-in-polygon of order coordinates against LGA and state polygons (WGS84, longitude/latitude).</dd>
          <dt className="text-ink-3">Distances</dt><dd>Great-circle (straight line). No road routing.</dd>
        </dl>
      </section>
      <section className="panel p-4 space-y-2">
        <h2 className="!text-xl">Boundary sources</h2>
        {meta ? (["states", "lgas"] as const).map((k) => (
          <p key={k} className="text-sm"><strong>{k === "states" ? "States (ADM1)" : "Local government areas (ADM2)"}</strong>: {String(meta[k].provider)}, {String(meta[k].release)}, upstream {String(meta[k].upstreamSource)} {String(meta[k].boundaryYear)}. {String(meta[k].license)}. {String(meta[k].geometry)}; {String(meta[k].features)} features; {String(meta[k].crs)}.</p>
        )) : <p className="text-sm text-ink-3">Loading source metadata</p>}
        {meta && <p className="hint">{meta.attribution}</p>}
      </section>
      <section>
        <div className="flex items-center justify-between mb-3"><h2 className="text-2xl">Metric definitions</h2><button className="btn btn-line btn-sm min-h-10" onClick={download}>Download LGA summary (CSV)</button></div>
        <dl className="grid gap-3 md:grid-cols-2">
          {Object.values(METRICS).map((m) => (
            <div key={m.id} className="panel p-4">
              <dt className="font-display text-lg">{m.label} <span className="mono text-[0.6875rem] text-ink-3 uppercase tracking-wider ml-1">{m.unit}</span></dt>
              <dd className="text-sm text-ink-2 mt-1">{m.definition}</dd>
              <dd className="mono text-xs text-ink-3 mt-2">{m.formula}</dd>
              {m.caveat && <dd className="text-xs text-warning mt-2">{m.caveat}</dd>}
            </div>
          ))}
        </dl>
      </section>
    </Page>
  );
}
