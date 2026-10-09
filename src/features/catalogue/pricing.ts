import type { PackVariant, PriceTier, Product } from "./types";
import type { CustomerAccess } from "@/features/customer/types";
import type { Kobo } from "@/lib/formatters";

export type PriceBasis = "list" | "indicative-tier" | "account-tier";

export interface PriceResult {
  unitPriceKobo: Kobo;
  /** Which price list produced the number. Only "account-tier" is a price the account may rely on. */
  basis: PriceBasis;
  /** The tier that applied, when one did. */
  tier: PriceTier | null;
}

/** Highest tier whose minQty is at or below qty. Tiers need not be sorted. */
export function activeTier(tiers: PriceTier[], qty: number): PriceTier | null {
  let best: PriceTier | null = null;
  for (const t of tiers) {
    if (qty >= t.minQty && (!best || t.minQty > best.minQty)) best = t;
  }
  return best;
}

/**
 * Unit price for a pack at a quantity.
 *
 * Wholesale tier prices only become the charged price for an approved wholesale account.
 * For everyone else the charged price stays at list; tiers can be displayed as indicative
 * but are never applied, so they cannot be mistaken for a contractual offer.
 */
export function priceFor(
  variant: PackVariant,
  qty: number,
  access: CustomerAccess,
): PriceResult {
  if (access === "wholesale-approved") {
    const tier = activeTier(variant.wholesaleTiers, qty);
    if (tier && qty >= variant.wholesaleMinQty) {
      return { unitPriceKobo: tier.unitPriceKobo, basis: "account-tier", tier };
    }
  }
  return { unitPriceKobo: variant.retailPriceKobo, basis: "list", tier: null };
}

export function lineTotal(
  variant: PackVariant,
  qty: number,
  access: CustomerAccess,
): Kobo {
  if (qty <= 0) return 0;
  return priceFor(variant, qty, access).unitPriceKobo * qty;
}

/** Price per litre or kilogram, in kobo. Null if the pack has no content (guards divide by zero). */
export function pricePerBaseUnit(
  variant: PackVariant,
  unitPriceKobo: Kobo = variant.retailPriceKobo,
): Kobo | null {
  if (!(variant.contentBase > 0)) return null;
  return Math.round(unitPriceKobo / variant.contentBase);
}

/** Saving of a tier against list as a ratio (0.07 means 7% below list). */
export function tierSaving(variant: PackVariant, tier: PriceTier): number {
  return variant.retailPriceKobo > 0
    ? 1 - tier.unitPriceKobo / variant.retailPriceKobo
    : 0;
}

export function cheapestPerUnit(
  product: Product,
): { variantId: string; perUnitKobo: Kobo } | null {
  let best: { variantId: string; perUnitKobo: Kobo } | null = null;
  for (const v of product.variants) {
    const p = pricePerBaseUnit(v);
    if (p !== null && (!best || p < best.perUnitKobo))
      best = { variantId: v.id, perUnitKobo: p };
  }
  return best;
}

export function fromPrice(product: Product): Kobo {
  return Math.min(...product.variants.map((v) => v.retailPriceKobo));
}
