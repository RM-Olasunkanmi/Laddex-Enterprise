import { formatSize } from "@/lib/formatters";

import { cheapestPerUnit, fromPrice } from "./pricing";
import type { CategoryId, PackVariant, Product } from "./types";

export type SortKey = "featured" | "price-asc" | "price-desc" | "unit-asc";

export interface CatalogueQuery {
  category: CategoryId | "all";
  inStockOnly: boolean;
  sort: SortKey;
}

export const DEFAULT_QUERY: CatalogueQuery = { category: "all", inStockOnly: false, sort: "featured" };

export const packLabel = (v: PackVariant) => formatSize(v.size.amount, v.size.unit);

/** Sort options that make sense for a category. Per-unit price needs one unit kind (litres or kilograms). */
export function sortOptions(category: CatalogueQuery["category"]): { key: SortKey; label: string }[] {
  const base: { key: SortKey; label: string }[] = [
    { key: "featured", label: "Featured" },
    { key: "price-asc", label: "Lowest pack price first" },
    { key: "price-desc", label: "Highest pack price first" },
  ];
  if (category === "all") return base;
  const unit = category === "palm-oil" ? "litre" : "kilo";
  return [...base, { key: "unit-asc", label: `Lowest price per ${unit} first` }];
}

/** A query is normalised so an invalid sort cannot survive a category change. */
export function normaliseQuery(q: CatalogueQuery): CatalogueQuery {
  return { ...q, sort: sortOptions(q.category).some((o) => o.key === q.sort) ? q.sort : "featured" };
}

const inStock = (p: Product) => p.variants.some((v) => v.stock.status !== "out-of-stock");

export function applyQuery(products: Product[], rawQuery: CatalogueQuery): Product[] {
  const q = normaliseQuery(rawQuery);
  const order = new Map(products.map((p, i) => [p.id, i]));
  const out = products.filter((p) => (q.category === "all" || p.category === q.category) && (!q.inStockOnly || inStock(p)));
  const cmp: Record<SortKey, (a: Product, b: Product) => number> = {
    featured: (a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0),
    "price-asc": (a, b) => fromPrice(a) - fromPrice(b),
    "price-desc": (a, b) => fromPrice(b) - fromPrice(a),
    "unit-asc": (a, b) => (cheapestPerUnit(a)?.perUnitKobo ?? Infinity) - (cheapestPerUnit(b)?.perUnitKobo ?? Infinity),
  };
  return [...out].sort(cmp[q.sort]);
}

export function relatedProducts(product: Product, all: Product[]): Product[] {
  const same = all.filter((p) => p.id !== product.id && p.category === product.category);
  const other = all.filter((p) => p.id !== product.id && p.category !== product.category);
  return [...same, ...other];
}

export function findVariant(products: Product[], variantId: string): { product: Product; variant: PackVariant } | null {
  for (const product of products) {
    const variant = product.variants.find((v) => v.id === variantId);
    if (variant) return { product, variant };
  }
  return null;
}

export const sortedVariants = (p: Product) => [...p.variants].sort((a, b) => a.contentBase - b.contentBase);
