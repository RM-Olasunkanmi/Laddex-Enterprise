"use client";

import { useMemo, useState } from "react";

import { Page } from "./section-pages";

import { Notice, StockTag } from "@/components/lx/primitives";
import { packLabel } from "@/features/catalogue/selectors";
import {
  applyStockChanges,
  resetStock,
  setLowAt,
  statusFor,
  stockStore,
} from "@/features/catalogue/stock";
import { ALL_VARIANTS, PRODUCTS } from "@/fixtures/products/products";
import { formatDate, formatInt } from "@/lib/formatters";

const REASONS = [
  "Restock delivery received",
  "Stock count",
  "Damaged or expired",
  "Correction",
  "Returned by customer",
];

/**
 * Staff stock editor. Edit quantities, review the changes, save them with a reason. Saved levels
 * drive the storefront in this browser (see features/catalogue/stock.ts for the limits).
 */
export function StockPage() {
  const s = stockStore.use();
  const hydrated = stockStore.useHydrated();
  const [draft, setDraft] = useState<Record<string, number>>({});
  const [reason, setReason] = useState(REASONS[0]);
  const [saved, setSaved] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const current = (id: string) =>
    s.qty[id] ?? ALL_VARIANTS.find((v) => v.id === id)!.stock.qtyAvailable;
  const shown = (id: string) => draft[id] ?? current(id);
  const changed = useMemo(
    () => Object.entries(draft).filter(([id, q]) => q !== current(id)),
    [draft, s],
  );  
  const set = (id: string, q: number) =>
    setDraft((d) => ({
      ...d,
      [id]: Math.max(0, Math.round(Number.isFinite(q) ? q : 0)),
    }));

  const levels = ALL_VARIANTS.map((v) => statusFor(shown(v.id), s.lowAt));
  const out = levels.filter((l) => l === "out-of-stock").length;
  const low = levels.filter((l) => l === "low-stock").length;

  const save = () => {
    applyStockChanges(
      changed.map(([id, to]) => ({
        variantId: id,
        from: current(id),
        to,
        note: reason,
      })),
    );
    setSaved(
      `Saved ${changed.length} change${changed.length === 1 ? "" : "s"}. The shop now shows the new levels.`,
    );
    setDraft({});
    window.setTimeout(() => setSaved(null), 5000);
  };
  const name = (id: string) => {
    const v = ALL_VARIANTS.find((x) => x.id === id)!;
    return `${PRODUCTS.find((p) => p.id === v.productId)!.name} ${packLabel(v)}`;
  };
  const csv = () => {
    const rows = [
      ["time", "pack", "from", "to", "reason"],
      ...s.log.map((m) => [
        m.at,
        name(m.variantId),
        String(m.from),
        String(m.to),
        m.note,
      ]),
    ];
    const blob = new Blob(
      [
        rows
          .map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(","))
          .join("\n"),
      ],
      { type: "text/csv" },
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "laddex-stock-movements.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <Page
      title="Stock"
      lead="Set how many packs of each size are on hand. Customers see the new levels straight away: in stock, low stock, or out of stock."
    >
      <Notice tone="sample" title="Saved in this browser only">
        There is no backend yet, so stock changes are stored in this browser and
        shown to this browser&rsquo;s shop view. They are not sent to other
        devices or customers. When the backend is connected, this same screen
        writes to the inventory system.
      </Notice>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["Packs out of stock", out, out ? "text-danger" : ""],
          ["Packs low (at or under the limit)", low, low ? "text-warning" : ""],
          ["Pack sizes tracked", ALL_VARIANTS.length, ""],
        ].map(([l, v, c]) => (
          <div key={String(l)} className="panel p-4">
            <p className="text-xs text-ink-3">{l}</p>
            <p className={`mono text-3xl mt-1 ${c}`}>{v}</p>
          </div>
        ))}
      </div>

      <div className="panel p-4 flex flex-wrap items-end gap-4">
        <div>
          <label htmlFor="low-at" className="label">
            Low-stock limit (packs)
          </label>
          <input
            id="low-at"
            type="number"
            min={0}
            className="field !w-28"
            value={s.lowAt}
            onChange={(e) => setLowAt(Number(e.target.value))}
          />
        </div>
        <p className="hint max-w-md">
          A pack at or under this many shows as &ldquo;Low stock&rdquo;; zero
          shows as &ldquo;Out of stock&rdquo; and cannot be added to a cart.
        </p>
      </div>

      {PRODUCTS.map((p) => (
        <section
          key={p.id}
          className="panel overflow-x-auto"
          aria-label={`${p.name} stock`}
        >
          <table className="dtable min-w-[36rem]">
            <caption className="text-left px-4 py-3 border-b border-line font-display text-lg">
              {p.name}
            </caption>
            <thead>
              <tr>
                <th scope="col">Pack</th>
                <th scope="col">Shows as</th>
                <th scope="col" className="!text-right">
                  On hand
                </th>
                <th scope="col">Adjust</th>
              </tr>
            </thead>
            <tbody>
              {[...p.variants]
                .sort((a, b) => a.contentBase - b.contentBase)
                .map((v) => {
                  const q = shown(v.id);
                  const dirty = q !== current(v.id);
                  return (
                    <tr key={v.id} className={dirty ? "bg-ochre-tint/50" : ""}>
                      <td className="font-medium">{packLabel(v)}</td>
                      <td>
                        <StockTag status={statusFor(q, s.lowAt)} />
                      </td>
                      <td className="r">
                        <label className="sr-only" htmlFor={`q-${v.id}`}>
                          On hand, {name(v.id)}
                        </label>
                        <input
                          id={`q-${v.id}`}
                          type="number"
                          min={0}
                          className="field !w-24 !min-h-9 !py-1 text-right mono"
                          value={q}
                          onChange={(e) => set(v.id, Number(e.target.value))}
                        />
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            [-1, "−1"],
                            [10, "+10"],
                            [50, "+50"],
                          ].map(([d, l]) => (
                            <button
                              key={String(l)}
                              type="button"
                              className="rounded-full border border-line-strong px-2.5 min-h-9 text-sm mono hover:border-ink hover:bg-paper-2 active:scale-95 transition"
                              aria-label={`${l} for ${name(v.id)}`}
                              onClick={() => set(v.id, q + Number(d))}
                            >
                              {l}
                            </button>
                          ))}
                          <button
                            type="button"
                            className="rounded-full border border-line-strong px-2.5 min-h-9 text-sm hover:border-ink hover:bg-paper-2 active:scale-95 transition"
                            aria-label={`Mark ${name(v.id)} out of stock`}
                            onClick={() => set(v.id, 0)}
                          >
                            Out
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </section>
      ))}

      <div
        className="sticky bottom-3 z-10 panel shadow-pop p-3 flex flex-wrap items-center gap-3 bg-card/95 backdrop-blur"
        role="group"
        aria-label="Save stock changes"
      >
        <label htmlFor="reason" className="text-sm font-medium">
          Reason
        </label>
        <select
          id="reason"
          className="field !w-auto !min-h-10"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        >
          {REASONS.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
        <button
          type="button"
          className="btn btn-primary min-h-10"
          disabled={changed.length === 0}
          onClick={save}
        >
          {changed.length
            ? `Save ${changed.length} change${changed.length === 1 ? "" : "s"}`
            : "No changes yet"}
        </button>
        <button
          type="button"
          className="btn btn-quiet btn-sm underline underline-offset-4"
          disabled={changed.length === 0}
          onClick={() => setDraft({})}
        >
          Discard
        </button>
        <p
          role="status"
          aria-live="polite"
          className={`text-sm text-success ${saved ? "[animation:pop_400ms_var(--ease)]" : ""}`}
        >
          {saved}
        </p>
      </div>

      <section className="panel p-4" aria-labelledby="moves">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <h2 id="moves" className="!text-xl">
            Recent stock movements
          </h2>
          <div className="flex gap-2">
            <button
              type="button"
              className="btn btn-line btn-sm min-h-9"
              disabled={!s.log.length}
              onClick={csv}
            >
              Download CSV
            </button>
            <button
              type="button"
              className="btn btn-line btn-sm min-h-9"
              disabled={
                !hydrated || (!s.log.length && !Object.keys(s.qty).length)
              }
              onClick={() =>
                confirmReset
                  ? (resetStock(), setConfirmReset(false), setDraft({}))
                  : setConfirmReset(true)
              }
            >
              {confirmReset
                ? "Click again to confirm reset"
                : "Reset to catalogue values"}
            </button>
          </div>
        </div>
        {s.log.length === 0 ? (
          <p className="text-sm text-ink-3">No changes saved yet.</p>
        ) : (
          <table className="dtable">
            <thead>
              <tr>
                <th scope="col">When</th>
                <th scope="col">Pack</th>
                <th scope="col" className="!text-right">
                  Change
                </th>
                <th scope="col">Reason</th>
              </tr>
            </thead>
            <tbody>
              {s.log.slice(0, 15).map((m) => (
                <tr key={m.at + m.variantId}>
                  <td className="whitespace-nowrap">{formatDate(m.at)}</td>
                  <td>{name(m.variantId)}</td>
                  <td className="r mono">
                    {formatInt(m.from)} → {formatInt(m.to)}
                  </td>
                  <td>{m.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </Page>
  );
}
