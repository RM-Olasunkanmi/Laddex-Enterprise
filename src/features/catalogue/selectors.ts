import { formatSize } from "@/lib/formatters";

import { pricePerBaseUnit } from "./pricing";
import type { CategoryId, PackVariant, Product, SalesFormat } from "./types";

export interface PackListing {
  product: Product;
  variant: PackVariant;
}

export type SortKey = "featured" | "price-asc" | "price-desc" | "unit-asc" | "size-asc" | "size-desc";

export interface CatalogueQuery {
  category: CategoryId | "all";
  format: SalesFormat | "all";
  inStockOnly: boolean;
  /** Pack size labels such as "5 L". Only meaningful inside a single category. */
  sizes: string[];
  sort: SortKey;
}

export const DEFAULT_QUERY: CatalogueQuery = { category: "all", format: "all", inStockOnly: false, sizes: [], sort: "featured" };

export const packLabel = (v: PackVariant) => formatSize(v.size.amount, v.size.unit);

export function toListings(products: Product[]): PackListing[] {
  return products.flatMap((product) => product.variants.map((variant) => ({ product, variant })));
}

/** Sort options that make sense for a category. Per-unit and size sorts need a single unit kind. */
export function sortOptions(category: CatalogueQuery["category"]): { key: SortKey; label: string }[] {
  const base: { key: SortKey; label: string }[] = [
    { key: "featured", label: "Featured" },
    { key: "price-asc", label: "Pack price, low to high" },
    { key: "price-desc", label: "Pack price, high to low" },
  ];
  if (category === "all") return base;
  const unit = category === "palm-oil" ? "litre" : "kilo";
  return [
    ...base,
    { key: "unit-asc", label: `Price per ${unit}, low to high` },
    { key: "size-asc", label: "Pack size, small to large" },
    { key: "size-desc", label: "Pack size, large to small" },
  ];
}

export function availableSizes(products: Product[], category: CatalogueQuery["category"]): string[] {
  if (category === "all") return [];
  const p = products.find((x) => x.category === category);
  return p ? [...p.variants].sort((a, b) => a.contentBase - b.contentBase).map(packLabel) : [];
}

/** A query is normalised so stale sizes or invalid sorts cannot survive a category change. */
export function normaliseQuery(q: CatalogueQuery, products: Product[]): CatalogueQuery {
  const sizes = availableSizes(products, q.category);
  const sort = sortOptions(q.category).some((o) => o.key === q.sort) ? q.sort : "featured";
  return { ...q, sizes: q.sizes.filter((s) => sizes.includes(s)), sort };
}

export function applyQuery(listings: PackListing[], rawQuery: CatalogueQuery, products: Product[]): PackListing[] {
  const q = normaliseQuery(rawQuery, products);
  const out = listings.filter(({ product, variant }) => {
    if (q.category !== "all" && product.category !== q.category) return false;
    if (q.format !== "all" && variant.format !== q.format) return false;
    if (q.inStockOnly && variant.stock.status === "out-of-stock") return false;
    if (q.sizes.length && !q.sizes.includes(packLabel(variant))) return false;
    return true;
  });
  const idx = new Map(listings.map((l, i) => [l.variant.id, i]));
  const cmp: Record<SortKey, (a: PackListing, b: PackListing) => number> = {
    featured: (a, b) => (idx.get(a.variant.id) ?? 0) - (idx.get(b.variant.id) ?? 0),
    "price-asc": (a, b) => a.variant.retailPriceKobo - b.variant.retailPriceKobo,
    "price-desc": (a, b) => b.variant.retailPriceKobo - a.variant.retailPriceKobo,
    "unit-asc": (a, b) => (pricePerBaseUnit(a.variant) ?? Infinity) - (pricePerBaseUnit(b.variant) ?? Infinity),
    "size-asc": (a, b) => a.variant.contentBase - b.variant.contentBase,
    "size-desc": (a, b) => b.variant.contentBase - a.variant.contentBase,
  };
  return [...out].sort(cmp[q.sort]);
}

export function relatedProducts(product: Product, all: Product[]): Product[] {
  return all.filter((p) => p.id !== product.id);
}

export function findVariant(products: Product[], variantId: string): { product: Product; variant: PackVariant } | null {
  for (const product of products) {
    const variant = product.variants.find((v) => v.id === variantId);
    if (variant) return { product, variant };
  }
  return null;
}
