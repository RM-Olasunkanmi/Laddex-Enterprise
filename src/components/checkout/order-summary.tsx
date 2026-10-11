"use client";

import { Price } from "@/components/commerce/money";
import { useCart } from "@/components/commerce/use-customer-pricing";

/** Cart totals before checkout. Delivery is chosen, and priced by the server, at checkout. */
export function OrderSummary() {
  const cart = useCart();
  const items = cart.lines.reduce((n, l) => n + l.qty, 0);
  return (
    <aside
      aria-label="Order summary"
      className="rounded-lg border border-line bg-card p-5"
    >
      <h2 className="text-xl">Summary</h2>
      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-ink-2">
            Goods ({items} {items === 1 ? "item" : "items"})
          </dt>
          <dd>
            <Price kobo={cart.subtotalKobo} />
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-ink-2">Delivery</dt>
          <dd className="text-right text-ink-3">At checkout</dd>
        </div>
        <div className="flex items-baseline justify-between border-t border-line pt-3 text-base">
          <dt className="font-semibold">Subtotal</dt>
          <dd>
            <Price kobo={cart.subtotalKobo} className="text-xl font-semibold" />
          </dd>
        </div>
      </dl>
    </aside>
  );
}
