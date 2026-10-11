"use client";

import Link from "next/link";
import { useState } from "react";

import type { Product } from "@/features/catalogue/types";

import { AddToCartButton } from "@/components/commerce/add-to-cart";
import { Price, UnitPrice } from "@/components/commerce/money";
import { StockLine } from "@/components/lx/primitives";
import { ProductPhoto } from "@/components/product/product-photo";
import { pricePerBaseUnit } from "@/features/catalogue/pricing";
import { packLabel, sortedVariants } from "@/features/catalogue/selectors";
import { useStockedProduct } from "@/features/catalogue/stock";

/**
 * One product, with its sizes as selectable chips. The price, unit price, stock and add-to-cart
 * button follow the chosen size, so buying a different size never needs a different page.
 * Phones get a horizontal row (photo beside the details); wider screens a vertical card.
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
    <article className="group grid grid-cols-[7.25rem_1fr] gap-4 border-b border-line pb-6 xs:grid-cols-[9rem_1fr] sm:flex sm:flex-col sm:gap-0 sm:overflow-hidden sm:rounded-lg sm:border sm:bg-card sm:pb-0">
      <Link
        href={href}
        className="relative block self-start overflow-hidden rounded-md sm:self-stretch sm:rounded-none"
        tabIndex={-1}
        aria-hidden="true"
      >
        <ProductPhoto
          product={product}
          sizes="(min-width: 1280px) 300px, (min-width: 640px) 45vw, 144px"
          priority={priority}
          className="aspect-[4/5] transition-transform duration-[600ms] ease-[var(--ease)] group-hover:scale-[1.03] sm:aspect-[5/4]"
        />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col sm:p-5">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-xl sm:text-[1.375rem]">
            <Link href={href} className="hover:text-forest">
              {product.name}
            </Link>
          </h3>
        </div>
        <p className="mt-0.5 text-sm text-ink-3">
          {product.unitKind === "volume" ? "Sold by the litre" : "Sold by the kilo"}
          {" · "}
          {variants.length} {variants.length === 1 ? "size" : "sizes"}
        </p>

        <fieldset className="mt-3 flex flex-wrap gap-1.5">
          <legend className="sr-only">{product.name} size</legend>
          {variants.map((v) => (
            <label key={v.id}>
              <input
                className="peer sr-only"
                type="radio"
                name={`pack-${product.id}`}
                value={v.id}
                checked={v.id === id}
                onChange={() => setId(v.id)}
              />
              <span
                className="chip !min-h-9 !px-2.5 text-[0.8125rem]"
                data-unavailable={v.stock.status === "out-of-stock" || undefined}
              >
                {packLabel(v)}
                {v.stock.status === "out-of-stock" && (
                  <span className="sr-only"> (out of stock)</span>
                )}
              </span>
            </label>
          ))}
        </fieldset>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-x-3 gap-y-1">
          <div>
            <Price
              kobo={variant.retailPriceKobo}
              className="block text-xl font-semibold leading-tight"
            />
            <UnitPrice kobo={pricePerBaseUnit(variant)} unit={product.baseUnit} />
          </div>
          <StockLine status={variant.stock.status} />
        </div>

        <div className="mt-4 sm:mt-auto sm:pt-4">
          <AddToCartButton
            variantId={variant.id}
            qty={1}
            disabled={out}
            disabledReason="This size is out of stock"
            label={out ? "Out of stock" : "Add to cart"}
            itemLabel={`${product.name} ${packLabel(variant)}`}
            className="w-full min-h-11"
          />
        </div>
      </div>
    </article>
  );
}
