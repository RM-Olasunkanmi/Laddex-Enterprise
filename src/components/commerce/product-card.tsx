import Link from "next/link";

import type { PackVariant, Product } from "@/features/catalogue/types";

import { AddToCartButton } from "@/components/commerce/add-to-cart";
import { Price, UnitPrice } from "@/components/commerce/money";
import { PACKAGING_LABEL } from "@/components/lx/labels";
import { StockTag, Tag } from "@/components/lx/primitives";
import { packScale } from "@/components/product/pack-ladder";
import { PackVisual } from "@/components/product/pack-visual";
import { pricePerBaseUnit } from "@/features/catalogue/pricing";
import { packLabel } from "@/features/catalogue/selectors";

export function ProductCard({
  product,
  variant,
  priority = false,
}: {
  product: Product;
  variant: PackVariant;
  priority?: boolean;
}) {
  const href = `/products/${product.slug}?pack=${variant.id}`;
  const out = variant.stock.status === "out-of-stock";
  return (
    <article className="group flex flex-col bg-card border border-line rounded-md overflow-hidden transition-shadow duration-[var(--d-base)] hover:shadow-raised">
      <Link
        href={href}
        className="relative block bg-paper-2 aspect-[4/3] sm:aspect-[5/4] px-3 pt-3 sm:px-6 sm:pt-6"
        data-priority={priority || undefined}
      >
        <PackVisual
          packaging={variant.packaging}
          category={product.category}
          sizeLabel={packLabel(variant)}
          scale={packScale(variant, product)}
          caption={false}
          decorative
          className="w-full h-full transition-transform duration-[var(--d-slow)] ease-[var(--ease)] group-hover:-translate-y-0.5"
        />
        <span className="sr-only">
          {product.name} {packLabel(variant)}
        </span>
        <span className="absolute left-3 top-3 flex gap-1.5">
          <Tag tone={variant.format === "bulk" ? "sample" : "default"}>
            {variant.format === "bulk" ? "Bulk" : "Packaged"}
          </Tag>
        </span>
      </Link>
      <div className="flex-1 flex flex-col p-3 sm:p-4">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="!text-base sm:!text-xl !font-semibold">
            <Link href={href} className="hover:underline underline-offset-4">
              {product.name}
            </Link>
          </h3>
          <span className="font-display text-base sm:text-xl">
            {packLabel(variant)}
          </span>
        </div>
        <p className="text-sm text-ink-3 mt-0.5">
          {PACKAGING_LABEL[variant.packaging]}
        </p>
        <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row sm:items-end justify-between gap-2 sm:gap-3">
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
        <div className="mt-3 sm:mt-4 grid sm:grid-cols-[1fr_auto] gap-2">
          <AddToCartButton
            variantId={variant.id}
            qty={1}
            disabled={out}
            disabledReason="Out of stock"
            openDrawer
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
