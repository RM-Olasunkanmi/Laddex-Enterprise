"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { CategoryInfo, Product } from "@/features/catalogue/types";

import { useStocked } from "@/features/catalogue/stock";

interface CatalogueContextValue {
  products: Product[];
  categories: CategoryInfo[];
}

const Ctx = createContext<CatalogueContextValue | null>(null);

/**
 * Hands the server-fetched catalogue to client components (cart, drawer, pickers) so they
 * never import fixtures directly. Swapping the catalogue adapter changes nothing here.
 */
export function CatalogueProvider({
  products,
  categories,
  children,
}: CatalogueContextValue & { children: ReactNode }) {
  const stocked = useStocked(products);
  return (
    <Ctx.Provider value={{ products: stocked, categories }}>
      {children}
    </Ctx.Provider>
  );
}

export function useCatalogue(): CatalogueContextValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useCatalogue must be used inside CatalogueProvider");
  return v;
}
