"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { SYNTHETIC_NOTICE } from "@/features/spatial-intelligence/definitions";
import { DashboardProvider, useDashboard } from "@/features/spatial-intelligence/state";

import { FilterBar } from "./filter-bar";

export const DASH_NAV = [
  { href: "/dashboard", label: "Geographic intelligence", note: "Map and statistics" },
  { href: "/dashboard/orders", label: "Orders", note: "Records" },
  { href: "/dashboard/customers", label: "Customers", note: "Segments and repeat buying" },
  { href: "/dashboard/inventory", label: "Inventory", note: "Stock and velocity" },
  { href: "/dashboard/wholesale", label: "Wholesale operations", note: "Accounts and tiers" },
  { href: "/dashboard/reports", label: "Reports and methods", note: "Definitions, sources" },
] as const;

function Rail() {
  const path = usePathname();
  return (
    <nav aria-label="Dashboard" className="hidden lg:flex flex-col w-60 shrink-0 bg-rail text-rail-text">
      <div className="h-14 px-5 flex items-center border-b border-rail-line">
        <Link href="/" className="font-display text-2xl font-semibold text-paper" aria-label="Laddex storefront">Laddex<span className="text-ember">.</span></Link>
        <span className="ml-2 mono text-[0.625rem] uppercase tracking-wider text-rail-text/70">Staff</span>
      </div>
      <ul className="p-2 space-y-0.5 flex-1">
        {DASH_NAV.map((n) => {
          const active = n.href === "/dashboard" ? path === "/dashboard" : path.startsWith(n.href);
          return (
            <li key={n.href}>
              <Link href={n.href} aria-current={active ? "page" : undefined} className={`block px-3 py-2.5 rounded-sm min-h-11 ${active ? "bg-paper text-ink" : "hover:bg-rail-line"}`}>
                <span className="block text-sm font-medium">{n.label}</span>
                <span className={`block text-[0.6875rem] ${active ? "text-ink-3" : "text-rail-text/60"}`}>{n.note}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="p-4 border-t border-rail-line text-[0.6875rem] text-rail-text/70 space-y-2">
        <p><span className="inline-block w-2 h-2 rotate-45 bg-ochre mr-2" />{SYNTHETIC_NOTICE}</p>
        <Link href="/" className="underline underline-offset-4">Back to storefront</Link>
      </div>
    </nav>
  );
}

function MobileHeader() {
  const path = usePathname();
  const current = DASH_NAV.find((n) => (n.href === "/dashboard" ? path === "/dashboard" : path.startsWith(n.href))) ?? DASH_NAV[0];
  return (
    <header className="lg:hidden bg-rail text-rail-text flex items-center gap-3 px-4 h-12">
      <Link href="/" className="font-display text-xl font-semibold text-paper" aria-label="Laddex storefront">Laddex<span className="text-ember">.</span></Link>
      <details className="relative ml-auto">
        <summary className="list-none text-sm min-h-10 flex items-center gap-2 cursor-pointer">{current.label} <span aria-hidden="true">▾</span></summary>
        <ul className="absolute right-0 top-full mt-1 w-64 bg-card text-ink border border-line-strong rounded-md shadow-pop z-50 p-1 list-none">
          {DASH_NAV.map((n) => <li key={n.href}><Link href={n.href} className="block px-3 py-2.5 rounded-sm hover:bg-paper-2 min-h-11">{n.label}</Link></li>)}
        </ul>
      </details>
    </header>
  );
}

function Gate({ children }: { children: ReactNode }) {
  const { error, retry, dataset } = useDashboard();
  if (error) {
    return (
      <div className="p-10 max-w-lg" role="alert">
        <p className="eyebrow mb-2">Data unavailable</p>
        <h1 className="!text-3xl">The dashboard could not load its data</h1>
        <p className="mt-2 text-ink-2">{error} Nothing has been changed. Boundary files and orders are loaded when the page opens.</p>
        <button className="btn btn-ink mt-5" onClick={retry}>Try again</button>
      </div>
    );
  }
  return <>{dataset || true ? children : null}</>;
}

export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <DashboardProvider>
      <div className="flex flex-col lg:flex-row min-h-dvh lg:h-dvh lg:overflow-hidden bg-paper">
        <Rail />
        <MobileHeader />
        <div className="flex-1 min-w-0 flex flex-col lg:overflow-hidden">
          <FilterBar />
          <Gate>{children}</Gate>
        </div>
      </div>
    </DashboardProvider>
  );
}
