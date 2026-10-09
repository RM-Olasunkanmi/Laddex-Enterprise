/**
 * Laddex operational seed. IDEMPOTENT and NON-DESTRUCTIVE: it upserts by
 * region, name, slug, sku and value, and never calls migrate:fresh. Safe to
 * run against Neon.
 *
 * Usage:  DATABASE_URL=<url> PAYLOAD_SECRET=<secret> pnpm seed:laddex
 *
 * Seeds:
 * - inactive delivery-zone drafts from the sample region rates
 * - distribution-points: the Epe store with an unverified approximate pin
 * - products + pack-size variant types/options/variants from the fixtures
 *   (palm oil, tapioca, garri), with the Laddex field groups the Payload
 *   catalogue adapter reads
 *
 * Money note: the ecommerce plugin prices in `priceInUSD`. Laddex stores
 * INTEGER KOBO there (misnamed, kept for plugin compatibility) so that cart
 * subtotal -> order amount -> Paystack verification all compare the same
 * integer units. Never store floats.
 */
import "dotenv/config";
import { getPayload } from "payload";

import config from "@payload-config";
import { BUSINESS } from "@/content/business";
import { PRODUCTS } from "@/fixtures/products/products";
import { REGIONS } from "@/fixtures/geography/regions";
import { STORE } from "@/lib/store";

import { makeRichTextDescription } from "./helpers";

async function main() {
  const payload = await getPayload({ config });
  const stats = { zones: 0, points: 0, products: 0, variants: 0 };

  for (const r of REGIONS) {
    const data = {
      regionId: r.id,
      name: r.name,
      bands: r.pricing.bands.map((b) => ({
        upToKg: b.upToKg,
        feeKobo: b.feeKobo,
      })),
      active: false,
    };
    const existing = await payload.find({
      collection: "delivery-zones",
      limit: 1,
      pagination: false,
      where: { regionId: { equals: r.id } },
    });
    if (existing.totalDocs > 0) {
      await payload.update({
        collection: "delivery-zones",
        id: existing.docs[0].id,
        data,
      });
    } else {
      await payload.create({ collection: "delivery-zones", data });
      stats.zones += 1;
    }
  }

  const storePoint = {
    name: `${BUSINESS.name} (Epe store)`,
    address: BUSINESS.address,
    lng: STORE.position.lng,
    lat: STORE.position.lat,
    openingHours: BUSINESS.hours,
    phone: BUSINESS.phone,
    verified: false,
    active: true,
  };
  const existingStore = await payload.find({
    collection: "distribution-points",
    limit: 1,
    pagination: false,
    where: { name: { equals: storePoint.name } },
  });
  if (existingStore.totalDocs > 0) {
    await payload.update({
      collection: "distribution-points",
      id: existingStore.docs[0].id,
      data: storePoint,
    });
  } else {
    await payload.create({
      collection: "distribution-points",
      data: storePoint,
    });
    stats.points += 1;
  }

  for (const product of PRODUCTS) {
    const existingProduct = await payload.find({
      collection: "products",
      limit: 1,
      pagination: false,
      where: { slug: { equals: product.slug } },
    });
    const productData = {
      title: product.name,
      slug: product.slug,
      description: makeRichTextDescription(product.description.join("\n\n")),
      _status: "draft" as const,
      // Integer kobo, same units as the variants below. The product-level
      // price is the fallback the cart reads when a variant does not enable
      // its own price, so it tracks the cheapest pack.
      priceInUSD: Math.min(...product.variants.map((v) => v.retailPriceKobo)),
      // Seeded from the product's own copy so the owner only has to choose a
      // meta image before publishing. `meta.image` stays empty on purpose: it
      // is required to publish and picking it is an owner decision.
      meta: {
        title: product.name,
        description: product.summary,
      },
      laddex: {
        category: product.category,
        baseUnit: product.baseUnit,
        summary: product.summary,
        details: product.description.map((text) => ({ text })),
        specs: product.specs.map((s) => ({ ...s })),
        packagingNotes: product.packagingNotes.map((text) => ({ text })),
        usage: product.usage.map((text) => ({ text })),
      },
    };
    let productId: number | string;
    if (existingProduct.totalDocs > 0) {
      productId = existingProduct.docs[0].id;
      await payload.update({
        collection: "products",
        id: productId,
        data: productData,
        draft: true,
      });
    } else {
      const created = await payload.create({
        collection: "products",
        data: productData,
        draft: true,
      });
      productId = created.id;
      stats.products += 1;
    }

    for (const variant of product.variants) {
      const typeLabel = `${product.name} pack size`;
      const existingType = await payload.find({
        collection: "variantTypes",
        limit: 1,
        pagination: false,
        where: { label: { equals: typeLabel } },
      });
      let typeId: number | string;
      if (existingType.totalDocs > 0) {
        typeId = existingType.docs[0].id;
      } else {
        const created = await payload.create({
          collection: "variantTypes",
          data: {
            label: typeLabel,
            name: product.id,
            selectorStyle: "buttons",
          },
        });
        typeId = created.id;
      }

      const optionLabel = `${variant.size.amount} ${variant.size.unit}`;
      const existingOption = await payload.find({
        collection: "variantOptions",
        limit: 1,
        pagination: false,
        where: { value: { equals: variant.id } },
      });
      let optionId: number | string;
      if (existingOption.totalDocs > 0) {
        optionId = existingOption.docs[0].id;
      } else {
        const created = await payload.create({
          collection: "variantOptions",
          data: { variantType: typeId, label: optionLabel, value: variant.id },
        });
        optionId = created.id;
      }

      const variantData = {
        product: productId,
        options: [optionId],
        inventory: variant.stock.qtyAvailable,
        priceInUSDEnabled: true,
        // Integer kobo in the plugin price field: keeps cart, order and
        // Paystack amounts in the same integer units (see header note).
        priceInUSD: variant.retailPriceKobo,
        _status: "draft" as const,
        laddex: {
          sku: variant.sku,
          sizeAmount: variant.size.amount,
          sizeUnit: variant.size.unit,
          contentBase: variant.contentBase,
          packaging: variant.packaging,
          format: variant.format,
          retailPriceKobo: variant.retailPriceKobo,
          wholesaleTiers: variant.wholesaleTiers.map((t) => ({ ...t })),
          wholesaleMinQty: variant.wholesaleMinQty,
          stockQty: variant.stock.qtyAvailable,
          shippingWeightKg: variant.shippingWeightKg,
        },
      };
      const existingVariant = await payload.find({
        collection: "variants",
        limit: 1,
        pagination: false,
        where: { "laddex.sku": { equals: variant.sku } },
      });
      if (existingVariant.totalDocs > 0) {
        await payload.update({
          collection: "variants",
          id: existingVariant.docs[0].id,
          data: variantData,
          draft: true,
        });
      } else {
        await payload.create({
          collection: "variants",
          data: variantData,
          draft: true,
        });
        stats.variants += 1;
      }
    }
  }

  // eslint-disable-next-line no-console
  console.log("Laddex seed complete:", stats);
  process.exit(0);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
