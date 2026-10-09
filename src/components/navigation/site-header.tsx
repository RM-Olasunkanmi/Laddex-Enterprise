import Link from "next/link";

import {
  CartButton,
  DeliveryChip,
  MobileNavButton,
  PersonaSelect,
} from "./header-client";

export const NAV = [
  {
    href: "/shop",
    label: "Shop",
    children: [
      { href: "/shop/palm-oil", label: "Palm oil", note: "By the litre" },
      { href: "/shop/tapioca", label: "Tapioca", note: "By the kilo" },
      { href: "/shop", label: "All packs", note: "Compare sizes" },
    ],
  },
  { href: "/wholesale", label: "Wholesale" },
  { href: "/delivery", label: "Delivery" },
  { href: "/account", label: "Account" },
] as const;

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`font-display text-[1.65rem] leading-none tracking-tight font-semibold text-ink ${className}`}
      aria-label="Laddex Enterprise, home"
    >
      Laddex<span className="text-ember">.</span>
    </Link>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 bg-paper/95 backdrop-blur-[2px] border-b border-line">
      <div className="bg-ink text-rail-text">
        <div className="wrap flex items-center justify-between gap-4 py-1.5 text-xs">
          <p className="truncate">
            <span className="mono tracking-wider uppercase text-ochre">
              Prototype
            </span>
            <span className="ml-2 hidden xs:inline">
              Sample prices, stock and delivery zones. Not a live offer.
            </span>
          </p>
          <PersonaSelect />
        </div>
      </div>
      <div className="wrap flex h-[4.25rem] items-center gap-6">
        <MobileNavButton />
        <Wordmark />
        <nav
          aria-label="Primary"
          className="hidden lg:flex items-center gap-1 ml-6"
        >
          {NAV.map((item) =>
            "children" in item ? (
              <div key={item.href} className="relative group">
                <Link
                  href={item.href}
                  className="btn btn-quiet btn-sm text-[0.9375rem]"
                >
                  {item.label}
                  <span aria-hidden="true" className="text-ink-3 text-xs">
                    ▾
                  </span>
                </Link>
                <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 transition-[opacity,visibility] duration-[var(--d-base)] absolute left-0 top-full pt-2 w-64">
                  <ul className="panel shadow-pop p-1.5">
                    {item.children.map((c) => (
                      <li key={c.href + c.label}>
                        <Link
                          href={c.href}
                          className="flex items-baseline justify-between gap-3 px-3 py-2.5 rounded-sm hover:bg-paper-2"
                        >
                          <span className="font-medium">{c.label}</span>
                          <span className="mono text-[0.6875rem] text-ink-3 uppercase tracking-wider">
                            {c.note}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className="btn btn-quiet btn-sm text-[0.9375rem]"
              >
                {item.label}
              </Link>
            ),
          )}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <DeliveryChip />
          <CartButton />
        </div>
      </div>
    </header>
  );
}
