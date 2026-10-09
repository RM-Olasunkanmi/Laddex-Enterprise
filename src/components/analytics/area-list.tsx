"use client";

import {
  formatFill,
  fillValue,
} from "@/features/spatial-intelligence/choropleth";
import {
  FILL_METRICS,
  useDashboard,
} from "@/features/spatial-intelligence/state";
import { formatInt, formatNaira } from "@/lib/formatters";

/** Keyboard and screen-reader alternative to the map: every area, its figures, and a select button. */
export function AreaList() {
  const { state, dispatch, derived } = useDashboard();
  if (!derived) return null;
  const metric = FILL_METRICS.find((m) => m.key === state.fillMetric)!;
  const rows = [...derived.units]
    .map((u) => ({ u, s: derived.unitStats.get(u.id) }))
    .sort((a, b) => (b.s?.grossKobo ?? 0) - (a.s?.grossKobo ?? 0));
  return (
    <details className="border-t border-line">
      <summary className="px-4 py-3 cursor-pointer text-sm font-medium min-h-11">
        Areas as a list (keyboard alternative to the map)
      </summary>
      <div className="max-h-72 overflow-auto px-4 pb-4">
        <table className="dtable">
          <caption className="sr-only">
            Areas at the current scale with sales, orders and the map statistic
          </caption>
          <thead>
            <tr>
              <th scope="col">Area</th>
              <th scope="col" className="!text-right">
                Orders
              </th>
              <th scope="col" className="!text-right">
                Gross sales
              </th>
              <th scope="col" className="!text-right">
                {metric.label}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ u, s }) => (
              <tr key={u.id} aria-selected={state.selection.unitId === u.id}>
                <td>
                  <button
                    className="underline underline-offset-4 min-h-8 text-left"
                    onClick={() =>
                      dispatch({
                        type: "selectUnit",
                        unitId: state.selection.unitId === u.id ? null : u.id,
                      })
                    }
                    aria-pressed={state.selection.unitId === u.id}
                  >
                    {u.name}
                  </button>
                </td>
                <td className="r">{formatInt(s?.ordersPlaced ?? 0)}</td>
                <td className="r">{formatNaira(s?.grossKobo ?? 0)}</td>
                <td className="r">
                  {formatFill(
                    state.fillMetric,
                    fillValue(state.fillMetric, s, u),
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
