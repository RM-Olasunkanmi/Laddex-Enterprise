"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import type { Product } from "@/features/catalogue/types";

import { AddToCartButton } from "@/components/commerce/add-to-cart";
import { Price, UnitPrice } from "@/components/commerce/money";
import { QuantityStepper } from "@/components/commerce/quantity-stepper";
import { DeliveryCheck } from "@/components/delivery/delivery-check";
import { PACKAGING_LABEL } from "@/components/lx/labels";
import { Notice, StockTag, Tag } from "@/components/lx/primitives";
import { ProductGallery } from "@/components/product/gallery";
import { TierChart } from "@/components/product/tier-chart";
import {
  activeTier,
  pricePerBaseUnit,
  priceFor,
  tierSaving,
} from "@/features/catalogue/pricing";
import { packLabel } from "@/features/catalogue/selectors";
import { customerStore } from "@/features/customer/store";
import { isWholesale } from "@/features/customer/types";
import { formatNaira, formatPercent } from "@/lib/formatters";

export function ProductPurchase({
  product,
  initialPack,
}: {
  product: Product;
  initialPack?: string;
}) {
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
  const profile = customerStore.use();
  const access = customerStore.useHydrated() ? profile.access : "guest";
  const wholesaleUser = isWholesale(access);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("pack", variantId);
    window.history.replaceState(null, "", url);
  }, [variantId]);

  const price = priceFor(variant, qty, access);
  const total = price.unitPriceKobo * qty;
  const out = variant.stock.status === "out-of-stock";
  const tier = activeTier(variant.wholesaleTiers, qty);
  const belowMin =
    access === "wholesale-approved" && qty < variant.wholesaleMinQty;
  const unit = product.baseUnit === "l" ? "L" : "kg";

  return (
    <>
      <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-12">
        <div className="lg:sticky lg:top-32 self-start">
          <ProductGallery product={product} variant={variant} />
        </div>

        <div>
          <p className="eyebrow">
            {product.category === "palm-oil"
              ? "Sold by the litre"
              : "Sold by the kilo"}
          </p>
          <h1 className="text-4xl md:text-5xl mt-2">
            {product.name}{" "}
            <span className="text-ember">{packLabel(variant)}</span>
          </h1>
          <p className="mt-3 text-ink-2">{product.summary}</p>

          <fieldset className="mt-6">
            <legend className="label">Pack size</legend>
            <div
              className="grid grid-cols-2 sm:grid-cols-3 gap-2"
              role="radiogroup"
              aria-label="Pack size"
            >
              {variants.map((v) => {
                const sel = v.id === variantId;
                return (
                  <button
                    key={v.id}
                    type="button"
                    role="radio"
                    aria-checked={sel}
                    onClick={() => {
                      setVariantId(v.id);
                      setQty(1);
                    }}
                    className={`text-left min-h-[4.5rem] p-3 rounded-md border transition-colors duration-[var(--d-fast)] ${sel ? "border-ember border-2 bg-ember-tint/60" : "border-line-strong bg-card hover:border-ink"} ${v.stock.status === "out-of-stock" ? "opacity-70" : ""}`}
                  >
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="font-display text-xl">
                        {packLabel(v)}
                      </span>
                      {v.format === "bulk" && (
                        <span className="mono text-[0.625rem] uppercase tracking-wider text-ochre-deep">
                          Bulk
                        </span>
                      )}
                    </span>
                    <span className="block mono text-xs mt-1">
                      {formatNaira(v.retailPriceKobo)}
                    </span>
                    <span className="block mono text-[0.6875rem] text-ink-3">
                      {formatNaira(pricePerBaseUnit(v))} / {unit}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="mt-6 border-t border-b border-line py-5">
            <div className="flex items-end justify-between gap-4 flex-wrap">
              <div>
                <p className="eyebrow">
                  {price.basis === "account-tier"
                    ? "Your account price"
                    : "Price"}
                </p>
                <p className="mt-1 flex items-baseline gap-3">
                  <Price kobo={total} className="text-4xl font-semibold" />
                  <span className="mono text-sm text-ink-3">
                    {qty > 1
                      ? `${qty} x ${formatNaira(price.unitPriceKobo)}`
                      : "per pack"}
                  </span>
                </p>
                <UnitPrice
                  kobo={pricePerBaseUnit(variant, price.unitPriceKobo)}
                  unit={product.baseUnit}
                />
              </div>
              <div className="text-right space-y-1">
                <StockTag status={variant.stock.status} />
                <p className="text-xs text-ink-3">
                  {PACKAGING_LABEL[variant.packaging]} &middot; {variant.format}
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <QuantityStepper
                label="Quantity"
                value={qty}
                min={1}
                onChange={setQty}
              />
              <AddToCartButton
                variantId={variant.id}
                qty={qty}
                disabled={out}
                disabledReason="This pack is out of stock"
                className="flex-1 min-w-40"
              />
            </div>
            {out && (
              <p className="mt-3 text-sm text-danger">
                This pack is out of stock. Choose another size or request a
                quote for a restock date.
              </p>
            )}
            {belowMin && (
              <p className="mt-3 text-sm text-warning" role="alert">
                Wholesale orders of this pack start at {variant.wholesaleMinQty}
                . Below that, list price applies.
              </p>
            )}
          </div>

          {/* Volume pricing: wording depends on who is looking */}
          <section aria-labelledby="tiers" className="mt-6">
            <div className="flex items-center justify-between gap-3">
              <h2 id="tiers" className="!text-xl">
                Volume pricing
              </h2>
              {access === "wholesale-approved" ? (
                <Tag tone="success">Applies to your account</Tag>
              ) : (
                <Tag tone="info">Indicative only</Tag>
              )}
            </div>
            {access === "wholesale-approved" ? (
              <p className="text-sm text-ink-2 mt-1">
                Your approved account is charged the tier for the quantity you
                buy.
                {tier
                  ? ` At ${qty} packs: ${formatPercent(tierSaving(variant, tier), 0)} below list.`
                  : ""}
              </p>
            ) : (
              <Notice tone="info" className="mt-2">
                {access === "wholesale-pending"
                  ? "Your wholesale application is awaiting approval. These tiers are indicative and are not charged until it is approved."
                  : "Tiers apply to approved wholesale accounts, from " +
                    variant.wholesaleMinQty +
                    " packs. Shown for planning, not as an offer. List price is charged today."}
              </Notice>
            )}
            <div className="mt-4">
              <TierChart
                variant={variant}
                activeQty={access === "wholesale-approved" ? qty : undefined}
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href={`/wholesale/quote?pack=${variant.id}`}
                className="btn btn-line btn-sm min-h-11"
              >
                Request a wholesale quote
              </Link>
              {!wholesaleUser && (
                <Link
                  href="/wholesale/register"
                  className="btn btn-quiet btn-sm min-h-11 underline underline-offset-4"
                >
                  Register a business
                </Link>
              )}
            </div>
          </section>

          <DeliveryCheck
            weightKg={variant.shippingWeightKg * qty}
            className="mt-8"
          />
        </div>
      </div>

      {/* Sticky mobile buy bar */}
      <div
        className="lg:hidden fixed inset-x-0 bottom-0 z-30 bg-card border-t border-line-strong px-4 py-3 flex items-center gap-3 shadow-pop"
        role="region"
        aria-label="Quick buy"
      >
        <div className="min-w-0">
          <p className="font-display text-lg leading-tight truncate">
            {product.name} {packLabel(variant)}
          </p>
          <Price kobo={total} className="font-semibold" />
        </div>
        <AddToCartButton
          variantId={variant.id}
          qty={qty}
          disabled={out}
          disabledReason="Out of stock"
          className="ml-auto"
        />
      </div>
    </>
  );
}
