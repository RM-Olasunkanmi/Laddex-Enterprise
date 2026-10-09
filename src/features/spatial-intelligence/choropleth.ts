import { ratio } from "./metrics";

import type { GeoUnit } from "./geo-units";
import type { UnitStat } from "./metrics";
import type { FillMetric } from "./state";

import { chart } from "@/lib/design/tokens";
import { formatInt, formatNairaCompact, formatPercent } from "@/lib/formatters";

/** Value of the normalised statistic for one unit, or null when it cannot be computed (no data, no area). */
export function fillValue(
  metric: FillMetric,
  stat: UnitStat | undefined,
  unit: GeoUnit,
): number | null {
  if (!stat) return null;
  switch (metric) {
    case "salesPerKm2":
      return unit.areaKm2 ? ratio(stat.grossKobo, unit.areaKm2) : null;
    case "ordersPerKm2":
      return unit.areaKm2 ? ratio(stat.ordersActive, unit.areaKm2) : null;
    case "aov":
      return stat.aovKobo;
    case "fulfilment":
      return stat.fulfilmentRate;
    case "wholesaleShare":
      return ratio(stat.wholesaleKobo, stat.grossKobo);
  }
}

export function formatFill(metric: FillMetric, v: number | null): string {
  if (v === null) return "—";
  switch (metric) {
    case "salesPerKm2":
      return `${formatNairaCompact(v)}/km²`;
    case "ordersPerKm2":
      return `${v >= 10 ? v.toFixed(0) : v.toFixed(2)}/km²`;
    case "aov":
      return formatNairaCompact(v);
    case "fulfilment":
    case "wholesaleShare":
      return formatPercent(v, 0);
  }
}

export interface Classes {
  /** Upper bounds of each class, ascending. */
  breaks: number[];
  colors: readonly string[];
}

/** Quantile classes so each shade holds a similar number of areas; fewer classes when there are few distinct values. */
export function classify(values: number[], k = 5): Classes | null {
  const v = values.filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
  if (v.length === 0) return null;
  const distinct = new Set(v).size;
  const n = Math.max(1, Math.min(k, distinct));
  const breaks: number[] = [];
  for (let i = 1; i <= n; i++)
    breaks.push(v[Math.min(v.length - 1, Math.ceil((i / n) * v.length) - 1)]);
  const colors =
    n === 5
      ? chart.sequential
      : (Array.from(
          { length: n },
          (_, i) => chart.sequential[Math.round((i / Math.max(1, n - 1)) * 4)],
        ) as string[]);
  return { breaks, colors };
}

export function colorFor(c: Classes | null, v: number | null): string | null {
  if (c === null || v === null) return null;
  const i = c.breaks.findIndex((b) => v <= b);
  return c.colors[i === -1 ? c.colors.length - 1 : i];
}

export function legendRows(
  c: Classes | null,
  metric: FillMetric,
): { color: string; label: string }[] {
  if (!c) return [];
  return c.breaks.map((b, i) => ({
    color: c.colors[i],
    label: `${i === 0 ? "up to" : "to"} ${formatFill(metric, b)}`,
  }));
}

export { formatInt };
