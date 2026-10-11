"use client";

import { useEffect, useRef, useState } from "react";

import { addToCart } from "@/features/cart/store";
import { cartDrawer } from "@/lib/data/ui-store";

interface Props {
  variantId: string;
  qty: number;
  disabled?: boolean;
  disabledReason?: string;
  label?: string;
  /** What is being added, for the screen-reader confirmation ("Palm Oil 5 L added to cart"). */
  itemLabel?: string;
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
  itemLabel,
  className = "",
  openDrawer = true,
}: Props) {
  const [done, setDone] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
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
          window.clearTimeout(timer.current);
          timer.current = window.setTimeout(() => setDone(false), 1800);
          if (openDrawer) cartDrawer.set(true);
        }}
      >
        {done ? (
          <>
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
              <path
                d="M3 8.5 6.5 12 13 4.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Added
          </>
        ) : (
          label
        )}
      </button>
      <span className="sr-only" role="status" aria-live="polite">
        {done ? `${itemLabel ? `${itemLabel} added` : "Added"} to cart` : ""}
      </span>
    </>
  );
}
