"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { NAV } from "./nav";

import { useCart } from "@/components/commerce/use-customer-pricing";
import { deliveryStore } from "@/features/delivery/store";
import { cartDrawer, navDrawer } from "@/lib/data/ui-store";

export const isActive = (pathname: string, href: string) =>
  href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

/** Desktop navigation (1024px and up). The Shop item opens a small category menu on hover or focus. */
export function PrimaryNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Primary" className="ml-6 hidden items-center gap-0.5 lg:flex">
      {NAV.map((item) => {
        const active = isActive(pathname, item.href);
        const cls = `relative inline-flex min-h-11 items-center gap-1 rounded-md px-3 text-[0.9375rem] font-medium transition-colors duration-[var(--d-fast)] ${active ? "text-forest" : "text-ink-2 hover:text-ink"}`;
        const bar = active && (
          <span
            aria-hidden="true"
            className="absolute inset-x-3 -bottom-[0.9rem] h-0.5 rounded-full bg-forest"
          />
        );
        if (!("children" in item))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cls}
              aria-current={active ? "page" : undefined}
            >
              {item.label}
              {bar}
            </Link>
          );
        return (
          <div key={item.href} className="group relative">
            <Link
              href={item.href}
              className={cls}
              aria-current={active ? "page" : undefined}
            >
              {item.label}
              <svg
                width="10"
                height="10"
                viewBox="0 0 10 10"
                aria-hidden="true"
                className="text-ink-3 transition-transform duration-[var(--d-base)] group-hover:rotate-180 group-focus-within:rotate-180"
              >
                <path d="M2 3.5 5 6.5 8 3.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
              </svg>
              {bar}
            </Link>
            <div className="invisible absolute left-0 top-full w-72 translate-y-1 pt-3 opacity-0 transition-[opacity,visibility,transform] duration-[var(--d-base)] ease-[var(--ease)] group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
              <ul className="panel p-1.5 shadow-pop">
                {item.children.map((c) => (
                  <li key={c.href + c.label}>
                    <Link
                      href={c.href}
                      className="flex items-baseline justify-between gap-3 rounded-md px-3 py-2.5 hover:bg-paper-2"
                    >
                      <span className="font-medium text-ink">{c.label}</span>
                      <span className="text-xs text-ink-3">{c.note}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );
      })}
    </nav>
  );
}

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
      className="btn btn-quiet relative min-h-11 gap-2 !px-2.5 sm:!px-3"
      onClick={() => cartDrawer.set(true)}
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        aria-hidden="true"
      >
        <path
          d="M5 8h14l-1.2 11.1a1 1 0 0 1-1 .9H7.2a1 1 0 0 1-1-.9L5 8Z"
          strokeLinejoin="round"
        />
        <path d="M9 10V7a3 3 0 0 1 6 0v3" strokeLinecap="round" />
      </svg>
      <span className="sr-only text-[0.9375rem] sm:not-sr-only">Cart</span>
      <span
        className={`num grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[0.6875rem] font-semibold ${count ? "bg-forest text-on-forest" : "bg-paper-2 text-ink-3"} ${bump ? "animate-[bump_.35s_var(--ease)]" : ""}`}
      >
        {count}
        <span className="sr-only"> {count === 1 ? "item" : "items"}</span>
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
      className="btn btn-quiet min-h-11 w-11 shrink-0 !px-0 lg:hidden"
      onClick={() => navDrawer.set(true)}
      aria-label="Open menu"
      aria-haspopup="dialog"
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        aria-hidden="true"
      >
        <path d="M4 8h16M4 16h16" strokeLinecap="round" />
      </svg>
    </button>
  );
}
