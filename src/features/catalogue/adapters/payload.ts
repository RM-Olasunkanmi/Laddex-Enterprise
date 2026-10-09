import config from "@payload-config";
import { getPayload } from "payload";

import type { CatalogueService } from "@/features/catalogue/contracts";
import type {
  CategoryId,
  CategoryInfo,
  PackagingType,
  PackVariant,
  PriceTier,
  Product,
  SalesFormat,
} from "@/features/catalogue/types";
import type { CustomerAccess } from "@/features/customer/types";
import type { Kobo, Unit } from "@/lib/formatters";

import { CATEGORIES } from "@/fixtures/products/products";

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface PayloadCatalogueOptions {
  /**
   * Wholesale tiers are included ONLY for wholesale-approved accounts.
   * Everyone else receives empty tier lists, so the server never leaks
   * volume pricing and never accepts it from a client.
   */
  access?: CustomerAccess;
}

type Doc = Record<string, any>;

const textItems = (rows: any): string[] =>
  Array.isArray(rows) ? rows.map((r: any) => r?.text).filter(Boolean) : [];

function stockStatus(qty: number, lowAt: number) {
  if (qty <= 0) return "out-of-stock" as const;
  if (qty <= lowAt) return "low-stock" as const;
  return "in-stock" as const;
}

function toVariant(v: Doc, productId: string, includeTiers: boolean): PackVariant | null {
  const l = v?.laddex;
  if (!l?.sku || l.sizeAmount == null || !l.sizeUnit || l.contentBase == null) return null;
  const qty = Number(v.inventory ?? 0);
  const tiers: PriceTier[] = includeTiers && Array.isArray(l.wholesaleTiers)
    ? l.wholesaleTiers
        .filter((t: any) => t && Number(t.minQty) > 0 && Number(t.unitPriceKobo) >= 0)
        .map((t: any) => ({
          minQty: Number(t.minQty),
          unitPriceKobo: Number(t.unitPriceKobo) as Kobo,
        }))
    : [];
  return {
    id: String(l.sku).toLowerCase(),
    sku: String(l.sku),
    productId,
    size: { amount: Number(l.sizeAmount), unit: l.sizeUnit as Unit },
    contentBase: Number(l.contentBase),
    packaging: l.packaging as PackagingType,
    format: (l.format ?? "packaged") as SalesFormat,
    retailPriceKobo: Number(l.retailPriceKobo ?? 0) as Kobo,
    wholesaleTiers: tiers,
    wholesaleMinQty: Number(l.wholesaleMinQty ?? 1),
    stock: { status: stockStatus(qty, Number(l.lowStockThreshold ?? 5)), qtyAvailable: qty },
    shippingWeightKg: Number(l.shippingWeightKg ?? 0),
    dataStatus: "confirmed",
  };
}

function toProduct(p: Doc, variants: PackVariant[]): Product | null {
  const l = p?.laddex;
  if (!l?.category || !l?.baseUnit) return null;
  const category = l.category as CategoryId;
  const photographs = Array.isArray(p.gallery)
    ? p.gallery.flatMap((row: any) => {
        const image = row?.image;
        if (!image || typeof image !== "object") return [];
        const rendition = image.sizes?.gallery;
        const src = rendition?.url ?? image.url;
        if (!src) return [];
        const focalX = Number(image.focalX ?? 50);
        const focalY = Number(image.focalY ?? 50);
        return [{
          id: String(image.id),
          src: String(src),
          alt: String(image.alt ?? p.title ?? "Product photograph"),
          width: Number(rendition?.width ?? image.width ?? 1200),
          height: Number(rendition?.height ?? image.height ?? 1200),
          position: `${focalX}% ${focalY}%`,
        }];
      })
    : [];
  return {
    id: String(p.slug ?? p.id),
    slug: String(p.slug ?? p.id),
    category,
    name: String(p.title ?? "Untitled"),
    unitKind: l.baseUnit === "l" ? "volume" : "mass",
    baseUnit: l.baseUnit,
    summary: l.summary ?? "",
    description: textItems(l.details),
    specs: Array.isArray(l.specs)
      ? l.specs.map((s: any) => ({ label: s.label, value: s.value, note: s.note ?? undefined }))
      : [],
    packagingNotes: textItems(l.packagingNotes),
    usage: textItems(l.usage),
    variants,
    photographs,
  };
}

/**
 * Payload-backed CatalogueService. Reads products + variants (with the Laddex
 * field groups) through the Payload local API. Drafts are excluded; only
 * published documents reach the storefront.
 */
export function createPayloadCatalogue(
  opts: PayloadCatalogueOptions = {},
): CatalogueService {
  const includeTiers = opts.access === "wholesale-approved";

  const load = async (): Promise<Product[]> => {
    const payload = await getPayload({ config });
    const [productsRes, variantsRes] = await Promise.all([
      payload.find({
        collection: "products",
        depth: 1,
        limit: 100,
        pagination: false,
        overrideAccess: true,
        where: { _status: { equals: "published" } },
      }),
      payload.find({
        collection: "variants",
        depth: 0,
        limit: 500,
        pagination: false,
        overrideAccess: true,
        where: { _status: { equals: "published" } },
      }),
    ]);
    const byProduct = new Map<string, PackVariant[]>();
    for (const v of variantsRes.docs as Doc[]) {
      const pid = typeof v.product === "object" ? v.product?.id : v.product;
      if (pid == null) continue;
      const mapped = toVariant(v, String(pid), includeTiers);
      if (mapped) {
        const list = byProduct.get(String(pid)) ?? [];
        list.push(mapped);
        byProduct.set(String(pid), list);
      }
    }
    const out: Product[] = [];
    for (const p of productsRes.docs as Doc[]) {
      const slug = String(p.slug ?? p.id);
      const mapped = toProduct(p, (byProduct.get(String(p.id)) ?? []).map((v) => ({ ...v, productId: slug })));
      if (mapped && mapped.variants.length > 0) out.push(mapped);
    }
    return out;
  };

  return {
    async listCategories(): Promise<CategoryInfo[]> {
      const products = await load();
      const ids = new Set(products.map((p) => p.category));
      return CATEGORIES.filter((c) => ids.has(c.id));
    },
    async listProducts() {
      return load();
    },
    async getProduct(slug) {
      const products = await load();
      return products.find((p) => p.slug === slug) ?? null;
    },
  };
}
