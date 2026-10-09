"use client";

import { useState } from "react";

import { addToCart } from "@/features/cart/store";
import { cartDrawer } from "@/lib/data/ui-store";

interface Props {
  variantId: string;
  qty: number;
  disabled?: boolean;
  disabledReason?: string;
  label?: string;
  className?: string;
  /** Open the cart drawer after adding. Off in the catalogue grid to keep browsing uninterrupted. */
  openDrawer?: boolean;
}

export function AddToCartButton({
  variantId,
  qty,
  disabled,
  disabledReason,
  label = "Add to cart",
  className = "",
  openDrawer = true,
}: Props) {
  const [done, setDone] = useState(false);
  return (
    <>
      <button
        type="button"
        className={`btn btn-primary ${done ? "[animation:tick_450ms_var(--ease)]" : ""} ${className}`}
        disabled={disabled}
        title={disabled ? disabledReason : undefined}
        onClick={() => {
          addToCart(variantId, qty);
          setDone(true);
          window.setTimeout(() => setDone(false), 1800);
          if (openDrawer) cartDrawer.set(true);
        }}
      >
        {done ? "Added ✓" : label}
      </button>
      <span className="sr-only" role="status" aria-live="polite">
        {done ? "Added to cart" : ""}
      </span>
    </>
  );
}
