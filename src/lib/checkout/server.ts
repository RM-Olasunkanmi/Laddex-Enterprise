import config from "@payload-config";
import { getPayload } from "payload";

import type { Kobo } from "@/lib/formatters";
import type { Payload } from "payload";

import { RequestValidationError } from "@/lib/checkout/request";


export interface PricedLine {
  variantId: string;
  payloadVariantId: number;
  payloadProductId: number;
  label: string;
  qty: number;
  unitKobo: Kobo;
  totalKobo: Kobo;
  weightKg: number;
}

export interface PricedCart {
  lines: PricedLine[];
  goodsKobo: Kobo;
  weightKg: number;
}

type VariantDoc = {
  id: number;
  inventory?: number | null;
  product?:
    | number
    | {
        id: number;
        title?: string | null;
        _status?: "draft" | "published" | null;
      };
  laddex?: {
    sku?: string | null;
    sizeAmount?: number | null;
    sizeUnit?: string | null;
    retailPriceKobo?: number | null;
    shippingWeightKg?: number | null;
  } | null;
  _status?: "draft" | "published" | null;
};

/** Strictly validates and prices the complete submitted cart from Payload. */
export async function priceLines(
  rawLines: { variantId?: unknown; qty?: unknown }[],
  payload?: Payload,
): Promise<PricedCart> {
  if (!Array.isArray(rawLines) || rawLines.length === 0 || rawLines.length > 50) {
    throw new RequestValidationError("Cart must contain between 1 and 50 lines.");
  }

  const requested = new Map<string, number>();
  for (const raw of rawLines) {
    if (typeof raw?.variantId !== "string" || !raw.variantId.trim()) {
      throw new RequestValidationError("Every cart line requires a variantId.");
    }
    const qty = Number(raw.qty);
    if (!Number.isSafeInteger(qty) || qty < 1 || qty > 999) {
      throw new RequestValidationError("Cart quantities must be whole numbers from 1 to 999.");
    }
    const id = raw.variantId.trim().toLowerCase();
    const aggregate = (requested.get(id) ?? 0) + qty;
    if (aggregate > 999) {
      throw new RequestValidationError(`Requested quantity is too large for ${id}.`);
    }
    requested.set(id, aggregate);
  }

  const client = payload ?? (await getPayload({ config }));
  const result = await client.find({
    collection: "variants",
    depth: 1,
    limit: 500,
    pagination: false,
    overrideAccess: true,
    where: { _status: { equals: "published" } },
  });
  const variants = new Map<string, VariantDoc>();
  for (const doc of result.docs as VariantDoc[]) {
    const sku = String(doc.laddex?.sku ?? "").trim().toLowerCase();
    if (sku && requested.has(sku)) {
      if (variants.has(sku)) {
        throw new RequestValidationError(`Pack SKU is not unique: ${sku}.`);
      }
      variants.set(sku, doc);
    }
  }

  const lines: PricedLine[] = [];
  for (const [variantId, qty] of requested) {
    const variant = variants.get(variantId);
    const product =
      variant && typeof variant.product === "object" ? variant.product : null;
    if (!variant || !product || product._status !== "published") {
      throw new RequestValidationError(`Unknown or unpublished pack: ${variantId}.`);
    }

    const inventory = Number(variant.inventory);
    if (!Number.isSafeInteger(inventory) || inventory < qty) {
      throw new RequestValidationError(`Only ${Math.max(0, inventory || 0)} of ${variantId} is available.`);
    }
    const unitKobo = Number(variant.laddex?.retailPriceKobo);
    const shippingWeightKg = Number(variant.laddex?.shippingWeightKg);
    if (!Number.isSafeInteger(unitKobo) || unitKobo < 0 || !(shippingWeightKg > 0)) {
      throw new RequestValidationError(`Pack is not configured for checkout: ${variantId}.`);
    }

    const size = `${variant.laddex?.sizeAmount ?? ""}${variant.laddex?.sizeUnit ?? ""}`;
    lines.push({
      variantId,
      payloadVariantId: variant.id,
      payloadProductId: product.id,
      label: `${product.title ?? "Product"} ${size}`.trim(),
      qty,
      unitKobo: unitKobo as Kobo,
      totalKobo: (unitKobo * qty) as Kobo,
      weightKg: Math.round(shippingWeightKg * qty * 100) / 100,
    });
  }

  return {
    lines,
    goodsKobo: lines.reduce((sum, line) => sum + line.totalKobo, 0) as Kobo,
    weightKg: Math.round(lines.reduce((sum, line) => sum + line.weightKg, 0) * 100) / 100,
  };
}
