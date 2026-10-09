"use client";

import { useMemo, useState } from "react";

import { Tag } from "@/components/lx/primitives";
import { packLabel } from "@/features/catalogue/selectors";
import { unitName } from "@/features/spatial-intelligence/geo-units";
import { aggregateByUnit } from "@/features/spatial-intelligence/metrics";
import { useDashboard } from "@/features/spatial-intelligence/state";
import {
  OUTSIDE_ZONES,
  UNASSIGNED,
} from "@/features/spatial-intelligence/types";
import { ALL_VARIANTS } from "@/fixtures/products/products";
import { formatDay, formatNaira, formatNairaCompact } from "@/lib/formatters";

type SortKey = "date" | "goods";
const TONE = {
  delivered: "success",
  cancelled: "danger",
  returned: "warning",
  placed: "info",
  processing: "info",
  "out-for-delivery": "info",
} as const;

/**
 * Orders in the selected geography under the active filters. Order-level rows (and the location
 * they imply) are restricted to the admin role; analysts get area aggregates instead.
 */
export function OrderTable() {
  const { state, dispatch, derived, dataset } = useDashboard();
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({
    key: "date",
    dir: -1,
  });
  const [limit, setLimit] = useState(12);
  const rows = useMemo(() => {
    if (!derived) return [];
    return [...derived.inSelection].sort(
      (a, b) =>
        (sort.key === "date" ? a.ts - b.ts : a.goodsKobo - b.goodsKobo) *
        sort.dir,
    );
  }, [derived, sort]);
  const areaRows = useMemo(
    () =>
      derived
        ? [...aggregateByUnit(derived.inSelection, "lga").values()].sort(
            (a, b) => b.grossKobo - a.grossKobo,
          )
        : [],
    [derived],
  );
  if (!derived || !dataset)
    return (
      <div className="p-4">
        <div className="skel h-40" aria-busy="true" />
      </div>
    );
  const lgaName = (id: string | null) =>
    id
      ? (dataset.lgas.find((l) => l.id === id)?.name ?? id)
      : "Outside Lagos / unlocated";

  if (state.role !== "admin") {
    return (
      <section aria-labelledby="ot-title" className="p-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 id="ot-title" className="!text-xl">
            Areas in this selection
          </h2>
          <Tag tone="info">Analyst view: aggregates only</Tag>
        </div>
        <p className="hint mb-3">
          Individual orders and customer locations require the admin role.
          Switch role in the filter bar to review order-level records.
        </p>
        <div
          className="overflow-x-auto border border-line rounded-sm"
          tabIndex={0}
          role="region"
          aria-label="Areas in this selection"
        >
          <table className="dtable">
            <thead>
              <tr>
                <th scope="col">Local government area</th>
                <th scope="col" className="!text-right">
                  Orders
                </th>
                <th scope="col" className="!text-right">
                  Gross sales
                </th>
                <th scope="col" className="!text-right">
                  Wholesale
                </th>
              </tr>
            </thead>
            <tbody>
              {areaRows.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center text-ink-3 py-6">
                    No orders for these filters
                  </td>
                </tr>
              )}
              {areaRows.map((a) => (
                <tr key={a.id}>
                  <td>
                    {a.id === UNASSIGNED
                      ? "Outside Lagos / unlocated"
                      : lgaName(a.id)}
                  </td>
                  <td className="r">{a.ordersPlaced}</td>
                  <td className="r">{formatNaira(a.grossKobo)}</td>
                  <td className="r">
                    {a.grossKobo
                      ? `${Math.round((a.wholesaleKobo / a.grossKobo) * 100)}%`
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    );
  }

  const th = (key: SortKey, label: string, right = false) => (
    <th
      scope="col"
      className={right ? "!text-right" : ""}
      aria-sort={
        sort.key === key
          ? sort.dir === 1
            ? "ascending"
            : "descending"
          : "none"
      }
    >
      <button
        className="uppercase tracking-wider hover:text-ink"
        onClick={() =>
          setSort((s) => ({
            key,
            dir: s.key === key ? (s.dir === 1 ? -1 : 1) : -1,
          }))
        }
      >
        {label}
        {sort.key === key ? (sort.dir === 1 ? " ▲" : " ▼") : ""}
      </button>
    </th>
  );
  return (
    <section aria-labelledby="ot-title" className="p-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 id="ot-title" className="!text-xl">
          Orders <span className="mono text-sm text-ink-3">{rows.length}</span>
        </h2>
        <Tag tone="sample">Admin: order-level</Tag>
      </div>
      <div
        className="overflow-x-auto border border-line rounded-sm max-h-[26rem] overflow-y-auto"
        tabIndex={0}
        role="region"
        aria-label="Orders table"
      >
        <table className="dtable min-w-[40rem]">
          <thead>
            <tr>
              <th scope="col">Order</th>
              {th("date", "Date")}
              <th scope="col">Segment</th>
              <th scope="col">Area</th>
              <th scope="col">Items</th>
              {th("goods", "Goods", true)}
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center text-ink-3 py-6">
                  No orders for these filters
                </td>
              </tr>
            )}
            {rows.slice(0, limit).map((o) => (
              <tr key={o.id} aria-selected={state.selection.orderId === o.id}>
                <td>
                  <button
                    className="mono underline underline-offset-4 min-h-8"
                    onClick={() =>
                      dispatch({
                        type: "selectOrder",
                        orderId: state.selection.orderId === o.id ? null : o.id,
                      })
                    }
                  >
                    {o.id}
                  </button>
                </td>
                <td className="whitespace-nowrap">{formatDay(o.placedAt)}</td>
                <td>{o.segment}</td>
                <td>{lgaName(o.lgaId)}</td>
                <td className="text-ink-2">
                  {o.lines
                    .map(
                      (l) =>
                        `${l.qty}×${packLabel(ALL_VARIANTS.find((v) => v.id === l.variantId)!)}`,
                    )
                    .join(", ")}
                </td>
                <td className="r">{formatNairaCompact(o.goodsKobo)}</td>
                <td>
                  <Tag tone={TONE[o.status]}>{o.status.replace(/-/g, " ")}</Tag>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > limit && (
        <button
          className="btn btn-line btn-sm mt-3 min-h-11"
          onClick={() => setLimit((l) => l + 25)}
        >
          Show 25 more
        </button>
      )}
    </section>
  );
}

export { unitName, OUTSIDE_ZONES };
