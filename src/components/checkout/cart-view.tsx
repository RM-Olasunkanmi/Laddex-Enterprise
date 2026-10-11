"use client";

import Link from "next/link";

import { OrderSummary } from "./order-summary";

import { Price, UnitPrice } from "@/components/commerce/money";
import { QuantityStepper } from "@/components/commerce/quantity-stepper";
import { useCart } from "@/components/commerce/use-customer-pricing";
import { Notice } from "@/components/lx/primitives";
import { ProductPhoto } from "@/components/product/product-photo";
import { WhatsAppOrderButton } from "@/components/store/whatsapp-order";
import { CHECKOUT_LIVE } from "@/content/business";
import { clearCart, MAX_LINE_QTY, removeFromCart, setQty } from "@/features/cart/store";
import { pricePerBaseUnit } from "@/features/catalogue/pricing";
import { packLabel } from "@/features/catalogue/selectors";
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
      <div className="rounded-lg border border-dashed border-line-strong px-6 py-14 text-center">
        <p className="font-display text-3xl">Your cart is empty</p>
        <p className="mx-auto mt-2 max-w-md text-ink-2">
          Choose a product and size from the shop, or send us a volume enquiry
          if you are buying for a shop or an event.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link href="/shop" className="btn btn-primary">
            Shop products
          </Link>
          <Link href="/wholesale/quote" className="btn btn-line">
            Request a wholesale quote
          </Link>
        </div>
      </div>
    );
  }
  const outOfStock = cart.lines.some((l) => l.variant.stock.status === "out-of-stock");
  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
      <div className="lg:col-span-7 xl:col-span-8">
        {cart.missing.length > 0 && (
          <Notice tone="warning" className="mb-4">
            Some items are no longer in the catalogue and were left out of the
            totals.
          </Notice>
        )}
        {outOfStock && (
          <Notice tone="warning" className="mb-4">
            One or more sizes in your cart are out of stock. Remove them to
            check out.
          </Notice>
        )}
        <ul className="divide-y divide-line border-y border-line">
          {cart.lines.map((l) => {
            const max =
              l.variant.stock.qtyAvailable > 0
                ? Math.min(MAX_LINE_QTY, l.variant.stock.qtyAvailable)
                : MAX_LINE_QTY;
            const label = `${l.product.name} ${packLabel(l.variant)}`;
            return (
              <li
                key={l.variant.id}
                className="grid grid-cols-[5.5rem_1fr] gap-4 py-5 sm:grid-cols-[7rem_1fr_auto] sm:gap-6"
              >
                <ProductPhoto
                  product={l.product}
                  sizes="112px"
                  className="aspect-square w-full rounded-md"
                />
                <div className="min-w-0">
                  <Link
                    href={`/products/${l.product.slug}?pack=${l.variant.id}`}
                    className="font-display text-xl hover:text-forest"
                  >
                    {l.product.name}
                  </Link>
                  <p className="mt-0.5 text-sm text-ink-2">
                    {packLabel(l.variant)} &middot;{" "}
                    <span className="num">{formatNaira(l.price.unitPriceKobo)}</span>{" "}
                    each
                  </p>
                  <UnitPrice
                    kobo={pricePerBaseUnit(l.variant, l.price.unitPriceKobo)}
                    unit={l.product.baseUnit}
                  />
                  {l.variant.stock.status === "out-of-stock" && (
                    <p className="mt-2 text-sm text-danger" role="alert">
                      Out of stock. Remove it to check out.
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                    <QuantityStepper
                      size="sm"
                      label={`${label} quantity`}
                      value={l.qty}
                      min={1}
                      max={max}
                      onChange={(n) => setQty(l.variant.id, n)}
                    />
                    <button
                      className="min-h-11 text-sm text-ink-2 underline underline-offset-4 hover:text-ink"
                      onClick={() => removeFromCart(l.variant.id)}
                      aria-label={`Remove ${label}`}
                    >
                      Remove
                    </button>
                    <Price
                      kobo={l.totalKobo}
                      className="ml-auto text-lg font-semibold sm:hidden"
                    />
                  </div>
                </div>
                <Price
                  kobo={l.totalKobo}
                  className="hidden text-xl font-semibold sm:block"
                />
              </li>
            );
          })}
        </ul>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <Link href="/shop" className="text-link">
            &larr; Continue shopping
          </Link>
          <button
            className="btn btn-quiet btn-sm text-ink-2 underline underline-offset-4"
            onClick={clearCart}
          >
            Empty cart
          </button>
        </div>
      </div>
      <div className="space-y-3 lg:col-span-5 xl:col-span-4">
        <OrderSummary />
        <Link
          href="/order"
          className={`btn btn-primary btn-lg w-full ${outOfStock ? "pointer-events-none opacity-50" : ""}`}
          aria-disabled={outOfStock || undefined}
        >
          {CHECKOUT_LIVE ? "Continue to checkout" : "Continue to checkout preview"}
        </Link>
        <WhatsAppOrderButton />
        <p className="pt-1 text-center text-xs text-ink-3">
          Delivery or free pickup in Epe is chosen at checkout.
        </p>
      </div>
    </div>
  );
}
