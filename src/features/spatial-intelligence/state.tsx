"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from "react";

import { fixtureDashboardData, type DashboardDataset } from "./dataset";
import { assignLgas } from "./enrich";
import {
  addDays,
  applyGeoSelection,
  DEFAULT_FILTERS,
  filterOrders,
  previousPeriod,
} from "./filters";
import { unitsAt, type GeoUnit } from "./geo-units";
import { aggregateByUnit, computeKpis, type UnitStat } from "./metrics";
import {
  SEGMENTS,
  type DashboardFilters,
  type EnrichedOrder,
  type GeoScale,
  type GeoSelection,
  type Role,
} from "./types";

import { DATASET_END, DATASET_START } from "@/fixtures/orders/generate";
import { ALL_VARIANTS } from "@/fixtures/products/products";
import { loadStateLgas, type AdminUnit } from "@/lib/geo/geography";

export interface State {
  filters: DashboardFilters;
  selection: GeoSelection;
  role: Role;
  /** Normalised statistic shown as the choropleth fill. */
  fillMetric: FillMetric;
  layers: { symbols: boolean; orderPoints: boolean };
  /** Bumped by the reset-extent button so the map refits even if nothing else changed. */
  resetToken: number;
}

export type FillMetric =
  | "sales"
  | "salesPerKm2"
  | "ordersPerKm2"
  | "aov"
  | "fulfilment"
  | "wholesaleShare"
  | "eventsShare"
  | "growth";

export const FILL_METRICS: {
  key: FillMetric;
  label: string;
  unit: string;
  metric: string;
}[] = [
  { key: "sales", label: "Gross sales", unit: "NGN", metric: "gross" },
  {
    key: "salesPerKm2",
    label: "Sales per km²",
    unit: "NGN/km²",
    metric: "density",
  },
  {
    key: "ordersPerKm2",
    label: "Orders per km²",
    unit: "orders/km²",
    metric: "density",
  },
  { key: "aov", label: "Average order value", unit: "NGN", metric: "aov" },
  {
    key: "growth",
    label: "Sales growth vs previous period",
    unit: "%",
    metric: "change",
  },
  {
    key: "wholesaleShare",
    label: "Wholesale share of sales",
    unit: "%",
    metric: "gross",
  },
  {
    key: "eventsShare",
    label: "Events share of sales",
    unit: "%",
    metric: "gross",
  },
  {
    key: "fulfilment",
    label: "Fulfilment rate",
    unit: "%",
    metric: "fulfilment",
  },
];

type Action =
  | { type: "hydrate"; patch: Partial<State> }
  | { type: "filters"; patch: Partial<DashboardFilters> }
  | { type: "scale"; scale: GeoScale }
  | { type: "drill"; stateId: string }
  | { type: "stateFocus"; stateId: string | null }
  | { type: "selectUnit"; unitId: string | null }
  | { type: "selectOrder"; orderId: string | null }
  | { type: "role"; role: Role }
  | { type: "fill"; metric: FillMetric }
  | { type: "layer"; key: keyof State["layers"]; on: boolean }
  | { type: "resetExtent" }
  | { type: "resetAll" };

export const initial: State = {
  filters: DEFAULT_FILTERS,
  selection: { scale: "state", unitId: null, stateId: null, orderId: null },
  role: "analyst",
  fillMetric: "sales",
  layers: { symbols: true, orderPoints: false },
  resetToken: 0,
};

export function reducer(s: State, a: Action): State {
  switch (a.type) {
    case "hydrate":
      return { ...s, ...a.patch };
    case "filters":
      // Filters never clear the geographic selection: "retain the active filters" works both ways.
      return { ...s, filters: { ...s.filters, ...a.patch } };
    case "scale":
      // A unit id from another scale is meaningless, so selection resets with the scale.
      return {
        ...s,
        selection: {
          scale: a.scale,
          unitId: null,
          // LGAs exist within one state: carry the selected state across when switching to LGA scale.
          stateId:
            a.scale === "lga"
              ? s.selection.scale === "state" && s.selection.unitId
                ? s.selection.unitId
                : s.selection.stateId
              : s.selection.stateId,
          orderId: null,
        },
      };
    case "drill":
      return {
        ...s,
        selection: {
          scale: "lga",
          unitId: null,
          stateId: a.stateId,
          orderId: null,
        },
      };
    case "stateFocus":
      return {
        ...s,
        selection: {
          ...s.selection,
          stateId: a.stateId,
          unitId: null,
          orderId: null,
        },
      };
    case "selectUnit":
      return {
        ...s,
        selection: { ...s.selection, unitId: a.unitId, orderId: null },
      };
    case "selectOrder":
      // Order selection overlays the unit selection without discarding it, so clearing restores context.
      return { ...s, selection: { ...s.selection, orderId: a.orderId } };
    case "role":
      return {
        ...s,
        role: a.role,
        selection:
          a.role === "analyst"
            ? { ...s.selection, orderId: null }
            : s.selection,
        layers:
          a.role === "analyst" ? { ...s.layers, orderPoints: false } : s.layers,
      };
    case "fill":
      return { ...s, fillMetric: a.metric };
    case "layer":
      return { ...s, layers: { ...s.layers, [a.key]: a.on } };
    case "resetExtent":
      return {
        ...s,
        selection: { ...s.selection, unitId: null, orderId: null },
        resetToken: s.resetToken + 1,
      };
    case "resetAll":
      return { ...initial, role: s.role, resetToken: s.resetToken + 1 };
  }
}

export interface Derived {
  /** Orders passing period and non-geographic filters. Basis for sibling comparison on the map. */
  scoped: EnrichedOrder[];
  /** `scoped` restricted to the selected geography. Basis for every inspector figure. */
  inSelection: EnrichedOrder[];
  /** Same filters, previous equal-length period, same geography. */
  previous: EnrichedOrder[];
  unitStats: Map<string, UnitStat>;
  units: GeoUnit[];
  /** LGAs of the state chosen at LGA scale, once its boundary file has loaded. */
  lgas: AdminUnit[] | null;
  lgaLoading: boolean;
  order: EnrichedOrder | null;
  selectedUnit: GeoUnit | null;
}

interface Ctx {
  state: State;
  dispatch: (a: Action) => void;
  dataset: DashboardDataset | null;
  error: string | null;
  retry: () => void;
  derived: Derived | null;
  hydrated: boolean;
}

const DashCtx = createContext<Ctx | null>(null);

const SCALES: GeoScale[] = ["region", "state", "lga"];

function parseUrl(search: string): Partial<State> {
  const p = new URLSearchParams(search);
  const patch: Partial<State> = {};
  const f: Partial<DashboardFilters> = {};
  const date = /^\d{4}-\d{2}-\d{2}$/;
  const from = p.get("from");
  const to = p.get("to");
  if (from && date.test(from) && to && date.test(to) && from <= to) {
    f.from = from < DATASET_START ? DATASET_START : from;
    f.to = to > DATASET_END ? DATASET_END : to;
  }
  const list = (k: string) => p.get(k)?.split(",").filter(Boolean) ?? [];
  const cats = list("cat").filter(
    (c): c is "palm-oil" | "tapioca" | "garri" =>
      c === "palm-oil" || c === "tapioca" || c === "garri",
  );
  if (cats.length) f.categories = cats;
  const vars = list("pack").filter((v) => ALL_VARIANTS.some((x) => x.id === v));
  if (vars.length) f.variantIds = vars;
  const segs = list("seg").filter((s): s is (typeof SEGMENTS)[number] =>
    (SEGMENTS as string[]).includes(s),
  );
  if (segs.length) f.segments = segs;
  const chs = list("ch").filter((c): c is "online" | "phone" | "sales-desk" =>
    ["online", "phone", "sales-desk"].includes(c),
  );
  if (chs.length) f.channels = chs;
  const sts = list("st").filter(
    (s): s is DashboardFilters["statuses"][number] =>
      [
        "placed",
        "processing",
        "out-for-delivery",
        "delivered",
        "cancelled",
        "returned",
      ].includes(s),
  );
  if (sts.length) f.statuses = sts;
  if (Object.keys(f).length) patch.filters = { ...DEFAULT_FILTERS, ...f };
  const scale = p.get("scale") as GeoScale | null;
  const sel: GeoSelection = {
    scale: scale && SCALES.includes(scale) ? scale : "state",
    unitId: p.get("unit"),
    stateId: p.get("state"),
    orderId: p.get("order"),
  };
  if (scale || sel.unitId || sel.stateId || sel.orderId) patch.selection = sel;
  if (p.get("role") === "admin") patch.role = "admin";
  const fill = p.get("fill") as FillMetric | null;
  if (fill && FILL_METRICS.some((m) => m.key === fill)) patch.fillMetric = fill;
  return patch;
}

function toUrl(s: State): string {
  const p = new URLSearchParams();
  const { filters: f, selection: sel } = s;
  if (f.from !== DEFAULT_FILTERS.from || f.to !== DEFAULT_FILTERS.to) {
    p.set("from", f.from);
    p.set("to", f.to);
  }
  if (f.categories.length) p.set("cat", f.categories.join(","));
  if (f.variantIds.length) p.set("pack", f.variantIds.join(","));
  if (f.segments.length) p.set("seg", f.segments.join(","));
  if (f.channels.length) p.set("ch", f.channels.join(","));
  if (f.statuses.length) p.set("st", f.statuses.join(","));
  if (sel.scale !== "state") p.set("scale", sel.scale);
  if (sel.unitId) p.set("unit", sel.unitId);
  if (sel.stateId) p.set("state", sel.stateId);
  if (sel.orderId) p.set("order", sel.orderId);
  if (s.role === "admin") p.set("role", "admin");
  if (s.fillMetric !== "sales") p.set("fill", s.fillMetric);
  const q = p.toString();
  return q ? `?${q}` : window.location.pathname;
}

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial);
  const [dataset, setDataset] = useState<DashboardDataset | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    dispatch({ type: "hydrate", patch: parseUrl(window.location.search) });
    setHydrated(true);
  }, []);

  useEffect(() => {
    let live = true;
    setError(null);
    // `?fail=data` and `?latency=ms` exercise the error and loading states in design review.
    const q = new URLSearchParams(window.location.search);
    const wait = Number(q.get("latency")) || 0;
    const run = async () => {
      if (wait) await new Promise((r) => setTimeout(r, wait));
      if (q.get("fail") === "data" && attempt === 0)
        throw new Error("The orders service did not respond.");
      return fixtureDashboardData.load();
    };
    run()
      .then((d) => live && setDataset(d))
      .catch(
        (e: Error) =>
          live && setError(e.message || "Data could not be loaded."),
      );
    return () => {
      live = false;
    };
  }, [attempt]);

  useEffect(() => {
    if (!hydrated) return;
    window.history.replaceState(
      null,
      "",
      toUrl(state) + (window.location.hash ?? ""),
    );
  }, [state, hydrated]);

  // LGAs are loaded one state at a time, only when LGA scale is used for that state.
  const lgaState =
    state.selection.scale === "lga" ? state.selection.stateId : null;
  const [lgas, setLgas] = useState<{
    stateId: string;
    units: AdminUnit[];
  } | null>(null);
  const [lgaLoading, setLgaLoading] = useState(false);
  useEffect(() => {
    if (!lgaState || !dataset) return;
    let live = true;
    setLgaLoading(true);
    loadStateLgas(lgaState)
      .then((units) => {
        if (!live) return;
        setDataset((d) =>
          d ? { ...d, orders: assignLgas(d.orders, lgaState, units) } : d,
        );
        setLgas({ stateId: lgaState, units });
      })
      .catch(
        () =>
          live &&
          setError(
            "Local government boundaries for this state could not be loaded.",
          ),
      )
      .finally(() => live && setLgaLoading(false));
    return () => {
      live = false;
    };
    // `dataset` identity changes after assignLgas; only its first availability matters here.
  }, [lgaState, !!dataset]);

  const derived = useMemo<Derived | null>(() => {
    if (!dataset) return null;
    const { filters, selection } = state;
    const lgaUnits =
      lgas && lgas.stateId === selection.stateId ? lgas.units : null;
    const scoped = filterOrders(dataset.orders, filters);
    const prevAll = filterOrders(
      dataset.orders,
      filters,
      previousPeriod(filters),
    );
    const inSelection = applyGeoSelection(scoped, selection);
    const previous = applyGeoSelection(prevAll, selection);
    const units = unitsAt(selection.scale, dataset, lgaUnits);
    const statBase =
      selection.scale === "lga"
        ? scoped.filter((o) => o.stateId === selection.stateId)
        : scoped;
    const prevBase =
      selection.scale === "lga"
        ? prevAll.filter((o) => o.stateId === selection.stateId)
        : prevAll;
    const unitStats = aggregateByUnit(statBase, selection.scale);
    for (const [id, ps] of aggregateByUnit(prevBase, selection.scale)) {
      const cur = unitStats.get(id);
      if (cur) cur.prevGrossKobo = ps.grossKobo;
    }
    const order = selection.orderId
      ? (dataset.orders.find((o) => o.id === selection.orderId) ?? null)
      : null;
    return {
      scoped,
      inSelection,
      previous,
      unitStats,
      units,
      lgas: lgaUnits,
      lgaLoading,
      order,
      selectedUnit: units.find((u) => u.id === selection.unitId) ?? null,
    };
  }, [dataset, state, lgas, lgaLoading]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  const value = useMemo<Ctx>(
    () => ({ state, dispatch, dataset, error, retry, derived, hydrated }),
    [state, dataset, error, retry, derived, hydrated],
  );
  return <DashCtx.Provider value={value}>{children}</DashCtx.Provider>;
}

export function useDashboard(): Ctx {
  const v = useContext(DashCtx);
  if (!v) throw new Error("useDashboard must be used inside DashboardProvider");
  return v;
}

/** KPIs for the current selection and for the previous period, from the same filtered orders. */
export function useKpis() {
  const { derived } = useDashboard();
  return useMemo(
    () =>
      derived
        ? {
            current: computeKpis(derived.inSelection),
            previous: computeKpis(derived.previous),
          }
        : null,
    [derived],
  );
}

export { addDays };
