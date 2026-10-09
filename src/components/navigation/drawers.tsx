"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";

import { Price } from "@/components/commerce/money";
import { QuantityStepper } from "@/components/commerce/quantity-stepper";
import { useCart } from "@/components/commerce/use-customer-pricing";
import { ProductPhoto } from "@/components/product/product-photo";
import { WhatsAppOrderButton } from "@/components/store/whatsapp-order";
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
      className={`m-0 p-0 h-dvh max-h-dvh w-[min(26rem,100vw)] bg-paper text-ink shadow-pop border-line ${side === "right" ? "ml-auto border-l" : "mr-auto border-r"} backdrop:bg-ink/45`}
    >
      <div className="h-full flex flex-col">{children}</div>
    </dialog>
  );
}

export function CartDrawer() {
  const open = cartDrawer.use();
  const cart = useCart();
  const close = () => cartDrawer.set(false);
  const pathname = usePathname();
  useEffect(() => cartDrawer.set(false), [pathname]);
  return (
    <Drawer open={open} onClose={close} side="right" label="Cart">
      <div className="flex items-center justify-between px-5 h-16 border-b border-line">
        <h2 className="text-xl">Your cart</h2>
        <button className="btn btn-quiet btn-sm min-h-11" onClick={close}>
          Close
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-5">
        {cart.lines.length === 0 ? (
          <div className="py-12 text-center">
            <p className="font-display text-xl">Nothing here yet</p>
            <p className="mt-2 text-ink-2 text-sm">
              Pick a pack size from palm oil or tapioca.
            </p>
            <div className="mt-5 flex justify-center gap-2">
              <Link
                className="btn btn-ink btn-sm"
                href="/shop/palm-oil"
                onClick={close}
              >
                Palm oil
              </Link>
              <Link
                className="btn btn-line btn-sm"
                href="/shop/tapioca"
                onClick={close}
              >
                Tapioca
              </Link>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {cart.lines.map((l) => (
              <li key={l.variant.id} className="py-4 flex gap-3 sm:gap-4">
                <ProductPhoto
                  product={l.product}
                  sizes="80px"
                  className="w-20 h-20 shrink-0 rounded-sm"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between gap-2">
                    <p className="font-medium">
                      {l.product.name}{" "}
                      <span className="mono text-ink-3 text-sm">
                        {packLabel(l.variant)}
                      </span>
                    </p>
                    <Price kobo={l.totalKobo} className="font-semibold" />
                  </div>
                  <p className="mono text-xs text-ink-3 mt-0.5">
                    {formatNaira(l.price.unitPriceKobo)} each
                  </p>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-1">
                    <QuantityStepper
                      size="sm"
                      label={`${l.product.name} ${packLabel(l.variant)} quantity`}
                      value={l.qty}
                      min={1}
                      onChange={(n) => setQty(l.variant.id, n)}
                    />
                    <button
                      type="button"
                      className="text-sm underline underline-offset-4 text-ink-2 min-h-11 px-2"
                      onClick={() => removeFromCart(l.variant.id)}
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
        <div className="border-t border-line p-5 space-y-3 bg-card">
          <div className="flex justify-between items-baseline">
            <span className="text-ink-2">Subtotal</span>
            <Price kobo={cart.subtotalKobo} className="text-xl font-semibold" />
          </div>
          <p className="text-xs text-ink-3">
            Delivery is calculated from your address at checkout.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Link href="/cart" className="btn btn-line" onClick={close}>
              View cart
            </Link>
            <Link href="/order" className="btn btn-primary" onClick={close}>
              Checkout preview
            </Link>
          </div>
          <WhatsAppOrderButton className="btn btn-line w-full" />
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
  const links = [
    { href: "/shop", label: "Shop", note: "All products" },
    { href: "/shop/palm-oil", label: "Palm oil", note: "" },
    { href: "/shop/tapioca", label: "Tapioca", note: "" },
    { href: "/shop/garri", label: "Garri", note: "" },
    { href: "/wholesale", label: "Wholesale", note: "" },
    { href: "/events", label: "Events", note: "" },
    { href: "/delivery", label: "Delivery", note: "" },
    { href: "/contact", label: "Contact", note: "" },
  ];
  return (
    <Drawer open={open} onClose={close} side="left" label="Menu">
      <div className="flex items-center justify-between px-5 h-16 border-b border-line">
        <span className="font-display text-2xl font-semibold">
          Laddex<span className="text-ember">.</span>
        </span>
        <button className="btn btn-quiet btn-sm min-h-11" onClick={close}>
          Close
        </button>
      </div>
      <nav aria-label="Menu" className="flex-1 overflow-y-auto">
        <ul>
          {links.map((l) => (
            <li key={l.href + l.label} className="border-b border-line">
              <Link
                href={l.href}
                className="flex items-baseline justify-between px-5 min-h-14 py-3 hover:bg-paper-2"
                onClick={close}
              >
                <span className="font-display text-xl">{l.label}</span>
                <span className="mono text-[0.6875rem] uppercase tracking-wider text-ink-3">
                  {l.note}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </Drawer>
  );
}
