"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";

import { isActive } from "./header-client";
import { NAV } from "./nav";
import { ThemeToggle } from "./theme-toggle";

import { Price } from "@/components/commerce/money";
import { QuantityStepper } from "@/components/commerce/quantity-stepper";
import { useCart } from "@/components/commerce/use-customer-pricing";
import { ProductPhoto } from "@/components/product/product-photo";
import { WhatsAppOrderButton } from "@/components/store/whatsapp-order";
import { BUSINESS, BUSINESS_CONTACT, CHECKOUT_LIVE } from "@/content/business";
import { removeFromCart, setQty } from "@/features/cart/store";
import { packLabel } from "@/features/catalogue/selectors";
import { cartDrawer, navDrawer } from "@/lib/data/ui-store";
import { formatNaira } from "@/lib/formatters";

/** Native <dialog>: focus is trapped and Escape closes it without extra code. */
function Drawer({
  open,
  onClose,
  side,
  label,
  children,
}: {
  open: boolean;
  onClose: () => void;
  side: "left" | "right";
  label: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      aria-label={label}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      data-side={side}
      className={`drawer m-0 h-dvh max-h-dvh w-[min(27rem,100vw)] border-line bg-paper p-0 text-ink shadow-pop backdrop:bg-[#0b120d]/50 ${side === "right" ? "ml-auto border-l" : "mr-auto border-r"}`}
    >
      <div className="flex h-full flex-col">{children}</div>
    </dialog>
  );
}

function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className="btn btn-quiet min-h-11 w-11 !px-0"
      onClick={onClick}
      aria-label="Close"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M6 6l12 12M18 6 6 18"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}

export function CartDrawer() {
  const open = cartDrawer.use();
  const cart = useCart();
  const close = () => cartDrawer.set(false);
  const pathname = usePathname();
  useEffect(() => cartDrawer.set(false), [pathname]);
  const count = cart.lines.reduce((n, l) => n + l.qty, 0);
  return (
    <Drawer open={open} onClose={close} side="right" label="Cart">
      <div className="flex h-16 items-center justify-between border-b border-line pl-5 pr-2">
        <h2 className="text-xl">
          Your cart
          {count > 0 && (
            <span className="num ml-2 font-sans text-sm font-normal text-ink-3">
              {count} {count === 1 ? "item" : "items"}
            </span>
          )}
        </h2>
        <CloseButton onClick={close} />
      </div>
      <div className="flex-1 overflow-y-auto overscroll-contain px-5">
        {cart.lines.length === 0 ? (
          <div className="py-14 text-center">
            <p className="font-display text-2xl">Your cart is empty</p>
            <p className="mx-auto mt-2 max-w-xs text-sm text-ink-2">
              Choose a product and size from the shop. Prices are shown per
              pack and per litre or kilo.
            </p>
            <Link
              className="btn btn-primary mt-6"
              href="/shop"
              onClick={close}
            >
              Shop products
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {cart.lines.map((l) => (
              <li key={l.variant.id} className="flex gap-4 py-5">
                <ProductPhoto
                  product={l.product}
                  sizes="80px"
                  className="h-20 w-20 shrink-0 rounded-md"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/products/${l.product.slug}?pack=${l.variant.id}`}
                        className="font-medium hover:underline underline-offset-4"
                        onClick={close}
                      >
                        {l.product.name}
                      </Link>
                      <p className="text-sm text-ink-3">
                        {packLabel(l.variant)} &middot;{" "}
                        <span className="num">
                          {formatNaira(l.price.unitPriceKobo)}
                        </span>{" "}
                        each
                      </p>
                    </div>
                    <Price kobo={l.totalKobo} className="font-semibold" />
                  </div>
                  {l.variant.stock.status === "out-of-stock" && (
                    <p className="mt-1 text-xs text-danger" role="alert">
                      Out of stock. Remove it to check out.
                    </p>
                  )}
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <QuantityStepper
                      size="sm"
                      label={`${l.product.name} ${packLabel(l.variant)} quantity`}
                      value={l.qty}
                      min={1}
                      onChange={(n) => setQty(l.variant.id, n)}
                    />
                    <button
                      type="button"
                      className="min-h-11 px-2 text-sm text-ink-2 underline underline-offset-4 hover:text-ink"
                      onClick={() => removeFromCart(l.variant.id)}
                      aria-label={`Remove ${l.product.name} ${packLabel(l.variant)}`}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      {cart.lines.length > 0 && (
        <div className="space-y-3 border-t border-line bg-card p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <div className="flex items-baseline justify-between">
            <span className="text-ink-2">Subtotal</span>
            <Price kobo={cart.subtotalKobo} className="text-xl font-semibold" />
          </div>
          <p className="text-xs text-ink-3">
            Delivery is worked out at checkout from your state and area, or
            choose free pickup in Epe.
          </p>
          <Link
            href="/order"
            className="btn btn-primary btn-lg w-full"
            onClick={close}
          >
            {CHECKOUT_LIVE ? "Checkout" : "Checkout preview"}
          </Link>
          <div className="grid grid-cols-2 gap-2">
            <Link href="/cart" className="btn btn-line btn-sm min-h-11" onClick={close}>
              View cart
            </Link>
            <WhatsAppOrderButton className="btn btn-line btn-sm min-h-11" short />
          </div>
        </div>
      )}
    </Drawer>
  );
}

export function NavDrawer() {
  const open = navDrawer.use();
  const close = () => navDrawer.set(false);
  const pathname = usePathname();
  useEffect(() => navDrawer.set(false), [pathname]);
  const shop = NAV.find((n) => "children" in n);
  return (
    <Drawer open={open} onClose={close} side="right" label="Menu">
      <div className="flex h-16 items-center justify-between border-b border-line pl-5 pr-2">
        <span className="font-display text-xl font-semibold">Menu</span>
        <CloseButton onClick={close} />
      </div>
      <nav aria-label="Menu" className="flex-1 overflow-y-auto px-5 py-4">
        <ul className="divide-y divide-line">
          {NAV.map((l) => {
            const active = isActive(pathname, l.href);
            return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className={`flex min-h-14 items-center justify-between py-3 font-display text-2xl ${active ? "text-forest" : ""}`}
                  aria-current={active ? "page" : undefined}
                  onClick={close}
                >
                  {l.label}
                  <span aria-hidden="true" className="text-base text-ink-3">
                    &rarr;
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
        {shop && "children" in shop && (
          <div className="mt-6">
            <p className="eyebrow">Shop by product</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {shop.children.slice(0, 3).map((c) => (
                <li key={c.href}>
                  <Link
                    href={c.href}
                    className="chip"
                    onClick={close}
                  >
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </nav>
      <div className="space-y-3 border-t border-line p-5 text-sm pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          <a href={BUSINESS_CONTACT.whatsappHref} className="text-link">
            WhatsApp {BUSINESS.whatsapp}
          </a>
          <a href={BUSINESS_CONTACT.phoneHref} className="text-link">
            Call
          </a>
          <Link href="/contact" className="text-link" onClick={close}>
            Contact
          </Link>
        </div>
        <div className="flex items-center justify-between text-ink-3">
          <span>Appearance</span>
          <ThemeToggle />
        </div>
      </div>
    </Drawer>
  );
}
