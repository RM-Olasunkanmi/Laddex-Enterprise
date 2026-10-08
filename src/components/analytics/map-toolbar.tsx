"use client";

import { useDashboard } from "@/features/spatial-intelligence/state";

const Toggle = ({ label, on, onChange, disabled, title }: { label: string; on: boolean; onChange: (v: boolean) => void; disabled?: boolean; title?: string }) => (
  <label title={title} className={`inline-flex items-center gap-2 min-h-9 text-[0.8125rem] ${disabled ? "opacity-50" : "cursor-pointer"}`}>
    <input type="checkbox" className="accent-ember w-4 h-4" checked={on} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
    {label}
  </label>
);

export function MapToolbar() {
  const { state, dispatch } = useDashboard();
  const admin = state.role === "admin";
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 px-4 py-2 border-b border-line bg-card" role="group" aria-label="Map layers">
      <span className="eyebrow !text-[0.625rem]">Layers</span>
      <Toggle label="Sales symbols" on={state.layers.symbols} onChange={(on) => dispatch({ type: "layer", key: "symbols", on })} />
      <Toggle label="Sample zones" on={state.layers.zones} onChange={(on) => dispatch({ type: "layer", key: "zones", on })} disabled={state.selection.scale === "zone" || state.selection.scale === "state"} title={state.selection.scale === "zone" ? "Zones are already the active scale" : undefined} />
      <Toggle label="Order points" on={state.layers.orderPoints && admin} onChange={(on) => dispatch({ type: "layer", key: "orderPoints", on })} disabled={!admin} title={admin ? undefined : "Order locations are restricted to the admin role"} />
      <button className="btn btn-line btn-sm min-h-9 ml-auto" onClick={() => dispatch({ type: "resetExtent" })}>Reset extent</button>
    </div>
  );
}
