import { CATEGORIES, PRODUCTS } from "@/fixtures/products/products";

import type { CatalogueService } from "../contracts";

export class CatalogueUnavailableError extends Error {
  constructor() {
    super("The catalogue could not be loaded.");
    this.name = "CatalogueUnavailableError";
  }
}

export interface FixtureOptions {
  /** Artificial delay in ms, to exercise loading states during design review. */
  latencyMs?: number;
  /** Throw to exercise the error state. */
  fail?: boolean;
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function createFixtureCatalogue(opts: FixtureOptions = {}): CatalogueService {
  const gate = async () => {
    if (opts.latencyMs) await wait(opts.latencyMs);
    if (opts.fail) throw new CatalogueUnavailableError();
  };
  return {
    async listCategories() {
      await gate();
      return CATEGORIES;
    },
    async listProducts() {
      await gate();
      return PRODUCTS;
    },
    async getProduct(slug) {
      await gate();
      return PRODUCTS.find((p) => p.slug === slug) ?? null;
    },
  };
}
