import type { CategoryInfo, Product } from "./types";

/**
 * Replaceable catalogue boundary. The fixture adapter below serves development data; a
 * Payload adapter can implement the same interface (products, variants, price tiers) so the
 * storefront components do not change when the backend is connected.
 */
export interface CatalogueService {
  listCategories(): Promise<CategoryInfo[]>;
  listProducts(): Promise<Product[]>;
  getProduct(slug: string): Promise<Product | null>;
}
