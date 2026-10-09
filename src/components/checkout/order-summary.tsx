"use client";

import { useMemo } from "react";

import type { DeliveryOption } from "@/features/delivery/types";

import { Price } from "@/components/commerce/money";
import { useCart } from "@/components/commerce/use-customer-pricing";
import { estimateDelivery } from "@/features/delivery/pricing";
import { deliveryStore } from "@/features/delivery/store";
import { formatNaira } from "@/lib/formatters";

/** Cart totals including the chosen delivery option. Delivery is shown as pending until a location and option are chosen. */
export function useOrderTotals() {
  const cart = useCart();
  const { resolution, optionId, location } = deliveryStore.use();
  const estimate = useMemo(
    () =>
      resolution
        ? estimateDelivery({ resolution, weightKg: cart.weightKg })
        : null,
    [resolution, cart.weightKg],
  );
  const option: DeliveryOption | null =
    estimate?.options.find((o) => o.id === optionId && o.available) ?? null;
  const deliveryKobo =
    option && option.feeKobo !== null ? option.feeKobo : null;
  const totalKobo = cart.subtotalKobo + (deliveryKobo ?? 0);
  return {
    cart,
    location,
    resolution,
    option,
    deliveryKobo,
    totalKobo,
    estimate,
  };
}

export function OrderSummary({ showLines = true }: { showLines?: boolean }) {
  const { cart, option, deliveryKobo, totalKobo, location } = useOrderTotals();
  const saving = cart.listSubtotalKobo - cart.subtotalKobo;
  return (
    <aside
      aria-label="Order summary"
      className="panel p-5 space-y-4 lg:sticky lg:top-32"
    >
      <h2 className="!text-xl">Order summary</h2>
      {showLines && (
        <ul className="divide-y divide-line text-sm list-none p-0">
          {cart.lines.map((l) => (
            <li key={l.variant.id} className="py-2 flex justify-between gap-3">
              <span>
                {l.qty} &times; {l.product.name}{" "}
                <span className="mono text-ink-3">
                  {l.variant.size.amount}{" "}
                  {l.variant.size.unit === "l" ? "L" : l.variant.size.unit}
                </span>
              </span>
              <Price kobo={l.totalKobo} />
            </li>
          ))}
        </ul>
      )}
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-ink-2">Subtotal</dt>
          <dd>
            <Price kobo={cart.subtotalKobo} />
          </dd>
        </div>
        {saving > 0 && (
          <div className="flex justify-between text-success">
            <dt>Account tier savings included</dt>
            <dd className="num">-{formatNaira(saving)}</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt className="text-ink-2">Delivery</dt>
          <dd className="text-right">
            {!location ? (
              <span className="text-ink-3">Choose a location</span>
            ) : !option ? (
              <span className="text-ink-3">Choose an option</span>
            ) : deliveryKobo === null ? (
              <span>Quote required</span>
            ) : deliveryKobo === 0 ? (
              "No charge"
            ) : (
              <Price kobo={deliveryKobo} />
            )}
          </dd>
        </div>
        <div className="flex justify-between border-t border-line-strong pt-3 text-base">
          <dt className="font-semibold">
            Total{option && deliveryKobo === null ? " (excl. delivery)" : ""}
          </dt>
          <dd>
            <Price kobo={totalKobo} className="text-xl font-semibold" />
          </dd>
        </div>
      </dl>
      {option?.feeBasis === "sample-rule" && (
        <p className="hint">
          Delivery fee comes from a sample rule and is not a confirmed charge.
        </p>
      )}
    </aside>
  );
}
