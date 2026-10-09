"use client";

import { useMemo } from "react";

import type { PackVariant, Product, StockStatus } from "./types";

import { createPersistedStore } from "@/lib/data/persisted-store";

/**
 * Stock levels the shop owner has set. This is a browser-local overlay on the catalogue: it
 * changes what THIS browser shows (storefront and staff pages alike) and survives reloads, but
 * it is not shared with other devices or customers until a backend stores stock
 * (docs/BACKEND_INTEGRATION.md). Same shape as the real thing: variant id to quantity.
 */
export interface StockMove {
  at: string;
  variantId: string;
  from: number;
  to: number;
  note: string;
}
export interface StockState {
  qty: Record<string, number>;
  log: StockMove[];
  /** At or below this many packs a pack shows as low stock. */
  lowAt: number;
}

export const DEFAULT_LOW_AT = 20;
export const stockStore = createPersistedStore<StockState>("stock", {
  qty: {},
  log: [],
  lowAt: DEFAULT_LOW_AT,
});

export const statusFor = (qty: number, lowAt: number): StockStatus =>
  qty <= 0 ? "out-of-stock" : qty <= lowAt ? "low-stock" : "in-stock";

export function withStock(v: PackVariant, s: StockState): PackVariant {
  const q = s.qty[v.id];
  if (q === undefined) return v;
  return { ...v, stock: { status: statusFor(q, s.lowAt), qtyAvailable: q } };
}

/** Records one or more changes in a single write, with a movement log entry for each. */
export function applyStockChanges(
  changes: { variantId: string; to: number; from: number; note: string }[],
) {
  const at = new Date().toISOString();
  stockStore.set((s) => ({
    ...s,
    qty: {
      ...s.qty,
      ...Object.fromEntries(
        changes.map((c) => [c.variantId, Math.max(0, Math.round(c.to))]),
      ),
    },
    log: [
      ...changes
        .filter((c) => c.to !== c.from)
        .map((c) => ({
          at,
          variantId: c.variantId,
          from: c.from,
          to: Math.max(0, Math.round(c.to)),
          note: c.note,
        })),
      ...s.log,
    ].slice(0, 200),
  }));
}
export const setLowAt = (n: number) =>
  stockStore.set((s) => ({ ...s, lowAt: Math.max(0, Math.round(n)) }));
export const resetStock = () =>
  stockStore.set((s) => ({ ...s, qty: {}, log: [] }));

/** The catalogue with the owner's stock levels applied. Before hydration it returns the catalogue as given. */
export function useStocked(products: Product[]): Product[] {
  const s = stockStore.use();
  const hydrated = stockStore.useHydrated();
  return useMemo(
    () =>
      hydrated && Object.keys(s.qty).length
        ? products.map((p) => ({
            ...p,
            variants: p.variants.map((v) =>
              v.dataStatus === "illustrative" ? withStock(v, s) : v,
            ),
          }))
        : products,
    [products, s, hydrated],
  );
}
export function useStockedProduct(product: Product): Product {
  return useStocked(useMemo(() => [product], [product]))[0];
}
