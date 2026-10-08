"use client";

import { useState } from "react";

import { useDashboard } from "@/features/spatial-intelligence/state";

import { AreaList } from "./area-list";
import { DashboardMap } from "./dashboard-map";
import { Inspector } from "./inspector";
import { MapToolbar } from "./map-toolbar";
import { OrderTable } from "./order-table";

type Tab = "map" | "insights" | "orders";

/** Desktop: map and orders in the centre, inspector on the right. Mobile: one panel at a time behind tabs. */
export function GeoWorkspace() {
  const [tab, setTab] = useState<Tab>("map");
  const { error } = useDashboard();
  if (error) return null;
  const tabs: { id: Tab; label: string }[] = [{ id: "map", label: "Map" }, { id: "insights", label: "Insights" }, { id: "orders", label: "Orders" }];
  return (
    <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
      <div role="tablist" aria-label="Dashboard panels" className="lg:hidden flex border-b border-line bg-card">
        {tabs.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} aria-controls={`panel-${t.id}`} id={`tab-${t.id}`} onClick={() => setTab(t.id)} className={`flex-1 min-h-11 text-sm border-b-2 ${tab === t.id ? "border-ember font-semibold" : "border-transparent text-ink-2"}`}>{t.label}</button>
        ))}
      </div>

      <div className="flex-1 min-w-0 lg:overflow-y-auto lg:border-r border-line">
        <section id="panel-map" role="tabpanel" aria-labelledby="tab-map" className={`${tab === "map" ? "block" : "hidden"} lg:block`}>
          <MapToolbar />
          <div className="h-[62dvh] min-h-[22rem] lg:h-[calc(100dvh-17rem)] lg:min-h-[24rem] lg:max-h-[46rem] border-b border-line"><DashboardMap /></div>
          <AreaList />
        </section>
        <section id="panel-orders" role="tabpanel" aria-labelledby="tab-orders" className={`${tab === "orders" ? "block" : "hidden"} lg:block border-t border-line`}>
          <OrderTable />
        </section>
      </div>

      <aside id="panel-insights" role="tabpanel" aria-labelledby="tab-insights" aria-label="Selection statistics" className={`${tab === "insights" ? "block" : "hidden"} lg:block lg:w-[24rem] xl:w-[26rem] shrink-0 lg:overflow-y-auto bg-paper`}>
        <Inspector />
      </aside>
    </div>
  );
}
