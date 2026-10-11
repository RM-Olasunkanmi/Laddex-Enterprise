"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import type { Product } from "@/features/catalogue/types";

import { AddToCartButton } from "@/components/commerce/add-to-cart";
import { Price, UnitPrice } from "@/components/commerce/money";
import { QuantityStepper } from "@/components/commerce/quantity-stepper";
import { PACKAGING_LABEL } from "@/components/lx/labels";
import { StockLine } from "@/components/lx/primitives";
import { ProductGallery } from "@/components/product/gallery";
import { TierChart } from "@/components/product/tier-chart";
import { BUSINESS } from "@/content/business";
import { MAX_LINE_QTY } from "@/features/cart/store";
import { pricePerBaseUnit, priceFor } from "@/features/catalogue/pricing";
import { packLabel } from "@/features/catalogue/selectors";
import { useStockedProduct } from "@/features/catalogue/stock";
import { formatNaira } from "@/lib/formatters";

export function ProductPurchase({
  product: baseProduct,
  initialPack,
}: {
  product: Product;
  initialPack?: string;
}) {
  const product = useStockedProduct(baseProduct);
  const variants = useMemo(
    () => [...product.variants].sort((a, b) => a.contentBase - b.contentBase),
    [product],
  );
  const firstAvailable =
    variants.find((v) => v.stock.status !== "out-of-stock") ?? variants[0];
  const [variantId, setVariantId] = useState(
    variants.find((v) => v.id === initialPack)?.id ?? firstAvailable.id,
  );
  const variant = variants.find((v) => v.id === variantId)!;
  const [qty, setQty] = useState(1);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("pack", variantId);
    window.history.replaceState(null, "", url);
  }, [variantId]);

  const price = priceFor(variant, qty, "guest");
  const total = price.unitPriceKobo * qty;
  const out = variant.stock.status === "out-of-stock";
  const unitWord = product.baseUnit === "l" ? "litre" : "kilo";
  // Never let the stepper ask for more packs than are in stock.
  const maxQty =
    variant.stock.qtyAvailable > 0
      ? Math.min(MAX_LINE_QTY, variant.stock.qtyAvailable)
      : MAX_LINE_QTY;
  const hasTiers = variant.wholesaleTiers.length > 0;
  const itemLabel = `${product.name} ${packLabel(variant)}`;

  return (
    <>
      <div className="grid gap-8 lg:grid-cols-12 lg:gap-14">
        <div className="self-start lg:sticky lg:top-28 lg:col-span-6 xl:col-span-7">
          <ProductGallery product={product} />
        </div>

        <div className="lg:col-span-6 xl:col-span-5">
          <p className="eyebrow">
            {product.category === "palm-oil" ? "Palm oil" : product.category === "tapioca" ? "Tapioca" : "Garri"}
            {" · "}Sold by the {unitWord}
          </p>
          <h1 className="display mt-3 text-[2.5rem] sm:text-5xl">
            {product.name}
          </h1>
          <p className="lede mt-4">{product.summary}</p>

          <div className="mt-6 flex flex-wrap items-baseline gap-x-4 gap-y-1 border-y border-line py-5">
            <Price
              kobo={total}
              className="text-[2rem] font-semibold leading-none tracking-tight"
            />
            <span className="num text-sm text-ink-3">
              {qty > 1
                ? `${qty} × ${formatNaira(price.unitPriceKobo)}`
                : `for one ${packLabel(variant)} ${PACKAGING_LABEL[variant.packaging].toLowerCase()}`}
            </span>
            <span className="w-full">
              <UnitPrice
                kobo={pricePerBaseUnit(variant, price.unitPriceKobo)}
                unit={product.baseUnit}
              />
            </span>
          </div>

          <fieldset className="mt-6">
            <legend className="label">
              Size: <span className="font-normal text-ink-2">{packLabel(variant)}</span>
            </legend>
            <div className="mt-1 grid grid-cols-2 gap-2 xs:grid-cols-3">
              {variants.map((v) => {
                const sel = v.id === variantId;
                const sold = v.stock.status === "out-of-stock";
                return (
                  <label key={v.id} className="block">
                    <input
                      type="radio"
                      name="pack"
                      value={v.id}
                      checked={sel}
                      onChange={() => {
                        setVariantId(v.id);
                        setQty(1);
                      }}
                      className="peer sr-only"
                    />
                    <span
                      className={`block min-h-[4.5rem] rounded-md border p-3 transition-colors duration-[var(--d-fast)] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-forest ${sel ? "border-forest bg-forest-tint shadow-[inset_0_0_0_1px_var(--color-forest)]" : "border-line-strong bg-card hover:border-ink-3"} ${sold && !sel ? "border-dashed" : ""}`}
                    >
                      <span className="block font-display text-xl leading-tight">
                        {packLabel(v)}
                      </span>
                      <span className="num mt-1 block text-sm font-medium">
                        {formatNaira(v.retailPriceKobo)}
                      </span>
                      <span className="num block text-xs text-ink-3">
                        {sold
                          ? "Out of stock"
                          : `${formatNaira(pricePerBaseUnit(v))} per ${product.baseUnit === "l" ? "L" : "kg"}`}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="mt-6">
            <StockLine status={variant.stock.status} />
            {variant.stock.status === "low-stock" && variant.stock.qtyAvailable > 0 && (
              <span className="ml-2 text-sm text-ink-3">
                Only {variant.stock.qtyAvailable} left
              </span>
            )}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <QuantityStepper
              label="Quantity"
              value={qty}
              min={1}
              max={maxQty}
              onChange={setQty}
            />
            <AddToCartButton
              variantId={variant.id}
              qty={qty}
              disabled={out}
              disabledReason="This size is out of stock"
              label={out ? "Out of stock" : "Add to cart"}
              itemLabel={itemLabel}
              className="btn-lg min-w-44 flex-1"
            />
          </div>
          {out && (
            <p className="mt-3 text-sm text-danger" role="status">
              This pack is out of stock. Choose another size, or{" "}
              <Link href="/contact" className="underline underline-offset-4">
                ask us
              </Link>{" "}
              when it will be back.
            </p>
          )}

          <dl className="mt-8 divide-y divide-line rounded-lg border border-line bg-card text-sm">
            <div className="grid gap-1 p-4 sm:grid-cols-[7.5rem_1fr]">
              <dt className="font-semibold">Pickup</dt>
              <dd className="text-ink-2">
                No delivery charge. Collect from our store in Epe,{" "}
                {BUSINESS.hours.split(",")[0]}. Please book first.
              </dd>
            </div>
            <div className="grid gap-1 p-4 sm:grid-cols-[7.5rem_1fr]">
              <dt className="font-semibold">Delivery</dt>
              <dd className="text-ink-2">
                Fee depends on your state and the order weight (this pack is
                about {Math.max(1, Math.round(variant.shippingWeightKg))} kg).
                You see it at checkout; if it is not confirmed for your area we
                quote before you pay.{" "}
                <Link href="/delivery" className="text-link">
                  Check your area
                </Link>
              </dd>
            </div>
            <div className="grid gap-1 p-4 sm:grid-cols-[7.5rem_1fr]">
              <dt className="font-semibold">Buying more?</dt>
              <dd className="text-ink-2">
                For shops, vendors and events, from {variant.wholesaleMinQty}{" "}
                packs of this size.{" "}
                <Link
                  href={`/wholesale/quote?pack=${variant.id}`}
                  className="text-link"
                >
                  Request a wholesale quote
                </Link>
              </dd>
            </div>
          </dl>

          {hasTiers && (
            <section aria-labelledby="tiers" className="mt-8">
              <h2 id="tiers" className="text-xl">
                Indicative volume pricing
              </h2>
              <p className="mt-1 text-sm text-ink-3">
                For approved wholesale accounts. Confirmed in your written quote.
              </p>
              <div className="mt-4">
                <TierChart variant={variant} activeQty={undefined} />
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Sticky buy bar on phones and tablets, clear of the safe area. */}
      <div
        className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-line bg-card/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-pop backdrop-blur lg:hidden"
        role="region"
        aria-label="Quick add to cart"
      >
        <div className="min-w-0">
          <p className="truncate text-sm text-ink-3">
            {product.name} &middot; {packLabel(variant)}
            {qty > 1 ? ` × ${qty}` : ""}
          </p>
          <Price kobo={total} className="text-lg font-semibold" />
        </div>
        <AddToCartButton
          variantId={variant.id}
          qty={qty}
          disabled={out}
          disabledReason="Out of stock"
          label={out ? "Out of stock" : "Add to cart"}
          itemLabel={itemLabel}
          className="ml-auto shrink-0"
        />
      </div>
    </>
  );
}
