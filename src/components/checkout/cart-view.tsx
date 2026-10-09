"use client";

import Link from "next/link";

import { OrderSummary } from "./order-summary";

import { Price, UnitPrice } from "@/components/commerce/money";
import { QuantityStepper } from "@/components/commerce/quantity-stepper";
import { useCart } from "@/components/commerce/use-customer-pricing";
import { Notice, Tag } from "@/components/lx/primitives";
import { packScale } from "@/components/product/pack-ladder";
import { PackVisual } from "@/components/product/pack-visual";
import { clearCart, removeFromCart, setQty } from "@/features/cart/store";
import { pricePerBaseUnit, activeTier } from "@/features/catalogue/pricing";
import { packLabel } from "@/features/catalogue/selectors";
import { ACCESS_LABEL } from "@/features/customer/types";
import { formatNaira } from "@/lib/formatters";

export function CartView() {
  const cart = useCart();
  if (!cart.hydrated)
    return (
      <div
        className="skel h-64 w-full"
        aria-busy="true"
        aria-label="Loading cart"
      />
    );
  if (cart.lines.length === 0) {
    return (
      <div className="panel p-10 text-center max-w-xl mx-auto">
        <p className="font-display text-3xl">Your cart is empty</p>
        <p className="mt-2 text-ink-2">
          Add a pack from palm oil or tapioca, or request a wholesale quote for
          volume.
        </p>
        <div className="mt-6 flex justify-center gap-3 flex-wrap">
          <Link href="/shop/palm-oil" className="btn btn-primary">
            Palm oil
          </Link>
          <Link href="/shop/tapioca" className="btn btn-ink">
            Tapioca
          </Link>
          <Link href="/wholesale/quote" className="btn btn-line">
            Wholesale quote
          </Link>
        </div>
      </div>
    );
  }
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-ink-2">
            Pricing as: <strong>{ACCESS_LABEL[cart.access]}</strong>
          </p>
          <button
            className="btn btn-quiet btn-sm underline underline-offset-4"
            onClick={clearCart}
          >
            Empty cart
          </button>
        </div>
        {cart.missing.length > 0 && (
          <Notice tone="warning" className="mb-3">
            Some items are no longer in the catalogue and were left out of the
            totals.
          </Notice>
        )}
        <ul className="panel divide-y divide-line list-none p-0">
          {cart.lines.map((l) => {
            const nextTier = l.variant.wholesaleTiers
              .filter((t) => t.minQty > l.qty)
              .sort((a, b) => a.minQty - b.minQty)[0];
            const indicative =
              cart.access !== "wholesale-approved"
                ? activeTier(l.variant.wholesaleTiers, l.qty)
                : null;
            return (
              <li
                key={l.variant.id}
                className="p-4 grid grid-cols-[5.5rem_1fr] sm:grid-cols-[6.5rem_1fr_auto] gap-4"
              >
                <div className="bg-paper-2 rounded-sm h-28 sm:h-32">
                  <PackVisual
                    packaging={l.variant.packaging}
                    category={l.product.category}
                    sizeLabel={packLabel(l.variant)}
                    scale={packScale(l.variant, l.product)}
                    caption={false}
                    className="w-full h-full p-1"
                  />
                </div>
                <div className="min-w-0">
                  <Link
                    href={`/products/${l.product.slug}?pack=${l.variant.id}`}
                    className="font-display text-xl hover:underline underline-offset-4"
                  >
                    {l.product.name} {packLabel(l.variant)}
                  </Link>
                  <p className="mono text-xs text-ink-3 mt-1">
                    {l.variant.sku} &middot;{" "}
                    {formatNaira(l.price.unitPriceKobo)} each &middot;{" "}
                    <UnitPrice
                      kobo={pricePerBaseUnit(l.variant, l.price.unitPriceKobo)}
                      unit={l.product.baseUnit}
                      className="!text-xs"
                    />
                  </p>
                  {l.price.basis === "account-tier" && (
                    <p className="mt-2">
                      <Tag tone="success">Account tier applied</Tag>
                    </p>
                  )}
                  {indicative && (
                    <p className="mt-2 text-xs text-ink-2">
                      Approved wholesale accounts would see{" "}
                      {formatNaira(indicative.unitPriceKobo)} per pack at this
                      quantity (indicative).
                    </p>
                  )}
                  {cart.access === "wholesale-approved" && nextTier && (
                    <p className="mt-2 text-xs text-ink-2">
                      Add {nextTier.minQty - l.qty} more for{" "}
                      {formatNaira(nextTier.unitPriceKobo)} per pack.
                    </p>
                  )}
                  {l.belowWholesaleMin && (
                    <p className="mt-2 text-xs text-warning" role="alert">
                      Below the wholesale minimum of {l.variant.wholesaleMinQty}
                      : list price applies.
                    </p>
                  )}
                  {l.variant.stock.status === "out-of-stock" && (
                    <p className="mt-2 text-xs text-danger" role="alert">
                      Out of stock. Remove it or request a quote.
                    </p>
                  )}
                  <div className="mt-3 flex items-center gap-3 sm:hidden">
                    <QuantityStepper
                      size="sm"
                      label={`${l.product.name} ${packLabel(l.variant)} quantity`}
                      value={l.qty}
                      min={1}
                      onChange={(n) => setQty(l.variant.id, n)}
                    />
                    <Price
                      kobo={l.totalKobo}
                      className="font-semibold ml-auto"
                    />
                  </div>
                </div>
                <div className="hidden sm:flex flex-col items-end justify-between">
                  <Price kobo={l.totalKobo} className="text-xl font-semibold" />
                  <QuantityStepper
                    size="sm"
                    label={`${l.product.name} ${packLabel(l.variant)} quantity`}
                    value={l.qty}
                    min={1}
                    onChange={(n) => setQty(l.variant.id, n)}
                  />
                  <button
                    className="text-sm underline underline-offset-4 text-ink-2 min-h-11"
                    onClick={() => removeFromCart(l.variant.id)}
                  >
                    Remove
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="space-y-4">
        <OrderSummary showLines={false} />
        <Link href="/order" className="btn btn-primary w-full">
          Continue to checkout preview
        </Link>
        <Link href="/delivery" className="btn btn-line w-full">
          Check delivery first
        </Link>
      </div>
    </div>
  );
}
