"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { useCart } from "@/components/commerce/use-customer-pricing";
import { deliveryStore } from "@/features/delivery/store";
import { cartDrawer, navDrawer } from "@/lib/data/ui-store";

export function CartButton() {
  const { packCount, hydrated } = useCart();
  const count = hydrated ? packCount : 0;
  const [bump, setBump] = useState(false);
  const prev = useRef(count);
  useEffect(() => {
    if (count > prev.current) {
      setBump(true);
      const t = window.setTimeout(() => setBump(false), 400);
      prev.current = count;
      return () => window.clearTimeout(t);
    }
    prev.current = count;
  }, [count]);
  return (
    <button
      type="button"
      className="btn btn-line btn-sm relative min-h-11"
      onClick={() => cartDrawer.set(true)}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <path
          d="M3 4h2.2l2.1 10.2a1 1 0 0 0 1 .8h8.6a1 1 0 0 0 1-.8L19.5 8H6.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="9.5" cy="19" r="1.2" fill="currentColor" stroke="none" />
        <circle cx="16.5" cy="19" r="1.2" fill="currentColor" stroke="none" />
      </svg>
      <span className="sr-only sm:not-sr-only">Cart</span>
      <span
        className={`mono min-w-5 text-center rounded-sm px-1 text-xs ${count ? "bg-ember text-on-ember" : "bg-paper-2 text-ink-3"} ${bump ? "animate-[bump_.35s_var(--ease)]" : ""}`}
      >
        {count}
        <span className="sr-only"> {count === 1 ? "pack" : "packs"}</span>
      </span>
    </button>
  );
}

export function DeliveryChip() {
  const { location } = deliveryStore.use();
  const hydrated = deliveryStore.useHydrated();
  return (
    <Link
      href="/delivery"
      className="hidden md:inline-flex btn btn-quiet btn-sm min-h-11 max-w-56 items-center gap-2"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <path d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11Z" />
        <circle cx="12" cy="10" r="2.4" />
      </svg>
      <span className="truncate text-left">
        <span className="block text-[0.6875rem] text-ink-3 leading-none mb-0.5">
          Deliver to
        </span>
        <span className="block text-sm leading-none truncate">
          {hydrated && location ? location.label : "Set location"}
        </span>
      </span>
    </Link>
  );
}

export function MobileNavButton() {
  return (
    <button
      type="button"
      className="xl:hidden btn btn-line btn-sm min-h-11 w-11 shrink-0 px-0"
      onClick={() => navDrawer.set(true)}
      aria-label="Open menu"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
      </svg>
    </button>
  );
}
