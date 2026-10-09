"use client";

import { useMemo } from "react";

import type { CustomerAccess } from "@/features/customer/types";

import { useCatalogue } from "@/components/lx/catalogue-provider";
import { summariseCart } from "@/features/cart/selectors";
import { cartStore } from "@/features/cart/store";

/** Public cart contents use catalogue list prices. Server render shows an empty cart. */
export function useCart() {
  const { products } = useCatalogue();
  const items = cartStore.use();
  const hydrated = cartStore.useHydrated();
  const summary = useMemo(
    () => summariseCart(items, products, "guest"),
    [items, products],
  );
  return { ...summary, items, access: "guest" as CustomerAccess, hydrated };
}
