"use client";

import { createPersistedStore } from "@/lib/data/persisted-store";

export interface CartItem {
  variantId: string;
  qty: number;
}

export const MAX_LINE_QTY = 999;

export const cartStore = createPersistedStore<CartItem[]>("cart", []);

const clamp = (n: number) =>
  Math.max(0, Math.min(MAX_LINE_QTY, Math.floor(Number.isFinite(n) ? n : 0)));

export function addToCart(variantId: string, qty = 1) {
  const q = clamp(qty);
  if (q === 0) return;
  cartStore.set((items) => {
    const existing = items.find((i) => i.variantId === variantId);
    if (existing)
      return items.map((i) =>
        i.variantId === variantId ? { ...i, qty: clamp(i.qty + q) } : i,
      );
    return [...items, { variantId, qty: q }];
  });
}

export function setQty(variantId: string, qty: number) {
  const q = clamp(qty);
  cartStore.set((items) =>
    q === 0
      ? items.filter((i) => i.variantId !== variantId)
      : items.map((i) => (i.variantId === variantId ? { ...i, qty: q } : i)),
  );
}

export function removeFromCart(variantId: string) {
  cartStore.set((items) => items.filter((i) => i.variantId !== variantId));
}

export function clearCart() {
  cartStore.set([]);
}
