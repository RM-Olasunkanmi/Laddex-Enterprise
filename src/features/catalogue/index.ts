import {
  createFixtureCatalogue,
  type FixtureOptions,
} from "./adapters/fixture";
import { createPayloadCatalogue } from "./adapters/payload";

import type { CatalogueService } from "./contracts";
import type { CustomerAccess } from "@/features/customer/types";

export interface CatalogueOptions extends FixtureOptions {
  /** Wholesale tiers are returned only for wholesale-approved access. */
  access?: CustomerAccess;
}

/**
 * Single place that chooses the catalogue source. Development defaults to
 * fixtures for convenience; production defaults to Payload so sample prices
 * and stock can never be published by an omitted environment variable.
 */
export function getCatalogue(opts?: CatalogueOptions): CatalogueService {
  const source =
    process.env.LADDEX_CATALOGUE_SOURCE ??
    (process.env.NODE_ENV === "production" ? "payload" : "fixture");
  if (source === "payload") {
    return createPayloadCatalogue({ access: opts?.access });
  }
  if (source !== "fixture") {
    throw new Error(`Unsupported LADDEX_CATALOGUE_SOURCE: ${source}`);
  }
  return createFixtureCatalogue(opts);
}

export * from "./types";
