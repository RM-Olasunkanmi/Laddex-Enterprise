import { createFixtureCatalogue, type FixtureOptions } from "./adapters/fixture";
import type { CatalogueService } from "./contracts";

/**
 * Single place that chooses the catalogue source. Swap `createFixtureCatalogue` for a
 * Payload-backed adapter (see docs/BACKEND_INTEGRATION.md) without touching components.
 */
export function getCatalogue(opts?: FixtureOptions): CatalogueService {
  return createFixtureCatalogue(opts);
}

export * from "./types";
