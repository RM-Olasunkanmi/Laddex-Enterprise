"use client";

import { useState } from "react";

import { packLabel } from "@/features/catalogue/selectors";
import { DEFAULT_FILTERS, PRESET_RANGES } from "@/features/spatial-intelligence/filters";
import { FILL_METRICS, useDashboard } from "@/features/spatial-intelligence/state";
import { SCALE_LABEL, type GeoScale, type OrderStatus } from "@/features/spatial-intelligence/types";
import { DATASET_END, DATASET_START } from "@/fixtures/orders/generate";
import { ALL_VARIANTS } from "@/fixtures/products/products";

const SCALES: GeoScale[] = ["state", "lga", "zone", "pickup"];
const STATUS_GROUPS: { id: string; label: string; statuses: OrderStatus[] }[] = [
  { id: "all", label: "Any status", statuses: [] },
  { id: "open", label: "Open (in progress)", statuses: ["placed", "processing", "out-for-delivery"] },
  { id: "delivered", label: "Delivered", statuses: ["delivered"] },
  { id: "cancelled", label: "Cancelled", statuses: ["cancelled"] },
  { id: "returned", label: "Returned", statuses: ["returned"] },
];

function Segmented<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex border border-line-strong rounded-md overflow-hidden bg-card">
      {options.map((o) => (
        <button key={o.value} role="radio" aria-checked={value === o.value} onClick={() => onChange(o.value)} className={`px-3 min-h-9 text-[0.8125rem] border-l first:border-l-0 border-line ${value === o.value ? "bg-ink text-paper" : "hover:bg-paper-2"}`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-1 min-w-0"><span className="eyebrow !text-[0.625rem]">{label}</span>{children}</div>
);

export function FilterBar() {
  const { state, dispatch, derived } = useDashboard();
  const [open, setOpen] = useState(false);
  const { filters: f, selection, role } = state;
  const cat = f.categories.length === 1 ? f.categories[0] : "all";
  const seg = f.segments.length === 1 ? f.segments[0] : "all";
  const preset = PRESET_RANGES.find((p) => p.from === f.from && p.to === f.to)?.id ?? "custom";
  const status = STATUS_GROUPS.find((g) => g.statuses.join() === f.statuses.join())?.id ?? "all";
  const packs = ALL_VARIANTS.filter((v) => cat === "all" || (cat === "palm-oil" ? v.productId === "palm-oil" : v.productId === "tapioca"));
  const filtersActive = JSON.stringify(f) !== JSON.stringify(DEFAULT_FILTERS) || !!selection.unitId;

  const body = (
    <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
      <Field label="Date range">
        <div className="flex items-center gap-1.5">
          <select aria-label="Date range preset" className="field !min-h-9 !py-1 !w-auto text-[0.8125rem]" value={preset} onChange={(e) => { const p = PRESET_RANGES.find((x) => x.id === e.target.value); if (p) dispatch({ type: "filters", patch: { from: p.from, to: p.to } }); }}>
            {PRESET_RANGES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            {preset === "custom" && <option value="custom">Custom</option>}
          </select>
          <input aria-label="From date" type="date" className="field !min-h-9 !py-1 !w-[8.5rem] text-[0.8125rem]" min={DATASET_START} max={f.to} value={f.from} onChange={(e) => e.target.value && dispatch({ type: "filters", patch: { from: e.target.value } })} />
          <span aria-hidden="true" className="text-ink-3">–</span>
          <input aria-label="To date" type="date" className="field !min-h-9 !py-1 !w-[8.5rem] text-[0.8125rem]" min={f.from} max={DATASET_END} value={f.to} onChange={(e) => e.target.value && dispatch({ type: "filters", patch: { to: e.target.value } })} />
        </div>
      </Field>
      <Field label="Product">
        <div className="flex items-center gap-1.5">
          <Segmented label="Product category" value={cat} options={[{ value: "all", label: "All" }, { value: "palm-oil", label: "Palm oil" }, { value: "tapioca", label: "Tapioca" }]} onChange={(v) => dispatch({ type: "filters", patch: { categories: v === "all" ? [] : [v], variantIds: [] } })} />
          <select aria-label="Pack size" className="field !min-h-9 !py-1 !w-auto text-[0.8125rem]" value={f.variantIds[0] ?? ""} onChange={(e) => dispatch({ type: "filters", patch: { variantIds: e.target.value ? [e.target.value] : [] } })}>
            <option value="">All packs</option>
            {packs.map((v) => <option key={v.id} value={v.id}>{v.productId === "palm-oil" ? "Palm oil" : "Tapioca"} {packLabel(v)}</option>)}
          </select>
        </div>
      </Field>
      <Field label="Buyer segment">
        <Segmented label="Buyer segment" value={seg} options={[{ value: "all", label: "All" }, { value: "retail", label: "Retail" }, { value: "wholesale", label: "Wholesale" }]} onChange={(v) => dispatch({ type: "filters", patch: { segments: v === "all" ? [] : [v] } })} />
      </Field>
      <Field label="Sales channel">
        <select aria-label="Sales channel" className="field !min-h-9 !py-1 text-[0.8125rem]" value={f.channels[0] ?? ""} onChange={(e) => dispatch({ type: "filters", patch: { channels: e.target.value ? [e.target.value as "online"] : [] } })}>
          <option value="">All channels</option><option value="online">Online store</option><option value="phone">Phone</option><option value="wholesale-desk">Wholesale desk</option>
        </select>
      </Field>
      <Field label="Delivery status">
        <select aria-label="Delivery status" className="field !min-h-9 !py-1 text-[0.8125rem]" value={status} onChange={(e) => dispatch({ type: "filters", patch: { statuses: STATUS_GROUPS.find((g) => g.id === e.target.value)!.statuses } })}>
          {STATUS_GROUPS.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}
        </select>
      </Field>
      <Field label="Map scale">
        <Segmented label="Aggregation scale" value={selection.scale} options={SCALES.map((s) => ({ value: s, label: s === "lga" ? "LGA" : s === "state" ? "State" : s === "zone" ? "Zone" : "Pickup" }))} onChange={(v) => dispatch({ type: "scale", scale: v })} />
      </Field>
      <Field label="Map shows">
        <select aria-label="Map statistic" className="field !min-h-9 !py-1 text-[0.8125rem]" value={state.fillMetric} onChange={(e) => dispatch({ type: "fill", metric: e.target.value as never })}>
          {FILL_METRICS.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
        </select>
      </Field>
      <Field label="Role (dev)">
        <Segmented label="Role" value={role} options={[{ value: "analyst", label: "Analyst" }, { value: "admin", label: "Admin" }]} onChange={(v) => dispatch({ type: "role", role: v })} />
      </Field>
      {filtersActive && <button className="btn btn-quiet btn-sm underline underline-offset-4 min-h-9" onClick={() => dispatch({ type: "resetAll" })}>Reset all</button>}
    </div>
  );

  return (
    <div className="border-b border-line bg-card">
      <div className="px-4 py-2 flex items-center gap-3">
        <nav aria-label="Active extent" className="flex items-center gap-1.5 text-sm min-w-0">
          <span className="eyebrow !text-[0.625rem]">Extent</span>
          <button className="underline underline-offset-4 truncate" onClick={() => dispatch({ type: "selectUnit", unitId: null })} disabled={!selection.unitId}>{selection.scale === "state" ? "Lagos and Ogun" : "Lagos State"}</button>
          {derived?.selectedUnit && <><span aria-hidden="true">›</span><strong className="truncate">{derived.selectedUnit.name}</strong></>}
          {derived?.order && <><span aria-hidden="true">›</span><strong className="mono truncate">{derived.order.id}</strong></>}
        </nav>
        <button className="lg:hidden btn btn-line btn-sm ml-auto min-h-10" aria-expanded={open} aria-controls="filters-body" onClick={() => setOpen((o) => !o)}>Filters {open ? "−" : "+"}</button>
      </div>
      <div id="filters-body" className={`${open ? "block" : "hidden"} lg:block px-4 pb-3 max-lg:max-h-[60dvh] max-lg:overflow-y-auto`}>{body}</div>
    </div>
  );
}
