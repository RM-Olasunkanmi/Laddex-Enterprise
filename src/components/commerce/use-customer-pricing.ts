"use client";

import { useMemo } from "react";

import { useCatalogue } from "@/components/lx/catalogue-provider";
import { summariseCart } from "@/features/cart/selectors";
import { cartStore } from "@/features/cart/store";
import { customerStore } from "@/features/customer/store";

/** Cart contents priced for the current customer. Server render shows an empty cart; the client hydrates from storage. */
export function useCart() {
  const { products } = useCatalogue();
  const items = cartStore.use();
  const profile = customerStore.use();
  const hydrated = cartStore.useHydrated();
  const summary = useMemo(() => summariseCart(items, products, profile.access), [items, products, profile.access]);
  return { ...summary, items, access: profile.access, hydrated };
}
