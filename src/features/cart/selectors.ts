import type { CartItem } from "./store";
import type { PackVariant, Product } from "@/features/catalogue/types";
import type { CustomerAccess } from "@/features/customer/types";
import type { Kobo } from "@/lib/formatters";

import {
  lineTotal,
  priceFor,
  type PriceResult,
} from "@/features/catalogue/pricing";
import { findVariant } from "@/features/catalogue/selectors";

export interface CartLine {
  product: Product;
  variant: PackVariant;
  qty: number;
  price: PriceResult;
  totalKobo: Kobo;
  /** Quantity is below the wholesale minimum for this pack (wholesale accounts only). */
  belowWholesaleMin: boolean;
  weightKg: number;
}

export interface CartSummary {
  lines: CartLine[];
  /** Items whose variant is no longer in the catalogue; surfaced so they can be removed. */
  missing: string[];
  subtotalKobo: Kobo;
  /** What the same cart would cost at list price, to show account savings honestly. */
  listSubtotalKobo: Kobo;
  weightKg: number;
  packCount: number;
}

export function summariseCart(
  items: CartItem[],
  products: Product[],
  access: CustomerAccess,
): CartSummary {
  const lines: CartLine[] = [];
  const missing: string[] = [];
  for (const item of items) {
    const found = findVariant(products, item.variantId);
    if (!found) {
      missing.push(item.variantId);
      continue;
    }
    const { product, variant } = found;
    lines.push({
      product,
      variant,
      qty: item.qty,
      price: priceFor(variant, item.qty, access),
      totalKobo: lineTotal(variant, item.qty, access),
      belowWholesaleMin:
        access === "wholesale-approved" && item.qty < variant.wholesaleMinQty,
      weightKg: variant.shippingWeightKg * item.qty,
    });
  }
  const subtotalKobo = lines.reduce((s, l) => s + l.totalKobo, 0);
  const listSubtotalKobo = lines.reduce(
    (s, l) => s + l.variant.retailPriceKobo * l.qty,
    0,
  );
  return {
    lines,
    missing,
    subtotalKobo,
    listSubtotalKobo,
    weightKg: Math.round(lines.reduce((s, l) => s + l.weightKg, 0) * 100) / 100,
    packCount: lines.reduce((s, l) => s + l.qty, 0),
  };
}
