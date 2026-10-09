"use client";

import Link from "next/link";
import { useState } from "react";

import type { Product } from "@/features/catalogue/types";

import { AddToCartButton } from "@/components/commerce/add-to-cart";
import { Price, UnitPrice } from "@/components/commerce/money";
import { StockTag } from "@/components/lx/primitives";
import { ProductPhoto } from "@/components/product/product-photo";
import { pricePerBaseUnit } from "@/features/catalogue/pricing";
import { packLabel, sortedVariants } from "@/features/catalogue/selectors";
import { useStockedProduct } from "@/features/catalogue/stock";

/**
 * One product, with its sizes as selectable chips. The price, unit price, stock and add-to-cart
 * button follow the chosen size, so buying a different size never needs a different page.
 */
export function ProductCard({
  product: baseProduct,
  initialVariantId,
  priority = false,
}: {
  product: Product;
  initialVariantId?: string;
  priority?: boolean;
}) {
  const product = useStockedProduct(baseProduct);
  const variants = sortedVariants(product);
  const firstInStock =
    variants.find((v) => v.stock.status !== "out-of-stock") ?? variants[0];
  const [id, setId] = useState(
    variants.find((v) => v.id === initialVariantId)?.id ?? firstInStock.id,
  );
  const variant = variants.find((v) => v.id === id)!;
  const href = `/products/${product.slug}?pack=${variant.id}`;
  const out = variant.stock.status === "out-of-stock";

  return (
    <article className="group lift flex flex-col bg-card border border-line rounded-[1.5rem] overflow-hidden">
      <Link
        href={href}
        className="relative block"
        tabIndex={-1}
        aria-hidden="true"
      >
        <ProductPhoto
          product={product}
          sizes="(min-width: 1280px) 22vw, (min-width: 640px) 45vw, 50vw"
          priority={priority}
          className="aspect-square transition-transform duration-[var(--d-slow)] ease-[var(--ease)] group-hover:scale-[1.02]"
        />
      </Link>
      <div className="flex-1 flex flex-col p-3 sm:p-4">
        <h3 className="!text-lg sm:!text-xl !font-semibold">
          <Link href={href} className="hover:underline underline-offset-4">
            {product.name}
          </Link>
        </h3>
        <p className="text-xs sm:text-sm text-ink-3 mt-0.5">
          {product.unitKind === "volume"
            ? "Sold by the litre"
            : "Sold by the kilo"}
        </p>

        <div
          role="radiogroup"
          aria-label={`${product.name} size`}
          className="mt-3 flex flex-wrap gap-1.5"
        >
          {variants.map((v) => {
            const sel = v.id === id;
            const sold = v.stock.status === "out-of-stock";
            return (
              <button
                key={v.id}
                type="button"
                role="radio"
                aria-checked={sel}
                onClick={() => setId(v.id)}
                className={`min-h-9 min-w-11 px-2.5 rounded-full border text-sm mono transition-transform duration-200 active:scale-95 ${sel ? "border-ember bg-ember-tint text-ink" : "border-line-strong bg-card hover:border-ink"} ${sold && !sel ? "border-dashed text-ink-3" : ""}`}
              >
                {packLabel(v)}
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <Price
              kobo={variant.retailPriceKobo}
              className="text-lg sm:text-xl font-semibold"
            />
            <div>
              <UnitPrice
                kobo={pricePerBaseUnit(variant)}
                unit={product.baseUnit}
              />
            </div>
          </div>
          <StockTag status={variant.stock.status} />
        </div>

        <div className="mt-3 sm:mt-4 grid sm:grid-cols-[1fr_auto] gap-2 mt-auto pt-1">
          <AddToCartButton
            variantId={variant.id}
            qty={1}
            disabled={out}
            disabledReason="This size is out of stock"
            className="btn-sm min-h-11"
          />
          <Link
            href={href}
            className="hidden sm:inline-flex btn btn-line btn-sm min-h-11"
          >
            Details
          </Link>
        </div>
      </div>
    </article>
  );
}
