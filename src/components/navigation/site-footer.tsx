import Link from "next/link";

import { BUSINESS } from "@/content/business";

import { Wordmark } from "./site-header";

const col = (title: string, items: { href: string; label: string }[]) => (
  <div>
    <h3 className="eyebrow !font-mono !font-medium !text-[0.6875rem] mb-4 [font-family:var(--font-mono)]">
      {title}
    </h3>
    <ul className="space-y-2.5">
      {items.map((i) => (
        <li key={i.href + i.label}>
          <Link
            href={i.href}
            className="text-ink-2 hover:text-ink underline-offset-4 hover:underline"
          >
            {i.label}
          </Link>
        </li>
      ))}
    </ul>
  </div>
);

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line-strong bg-paper-2">
      <div className="wrap py-14 grid gap-12 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="max-w-xs">
          <Wordmark />
          <p className="mt-4 text-ink-2 text-sm">
            Palm oil, tapioca flakes and garri, for households, shops and
            events. Delivery across Nigeria. Prices in Nigerian Naira.
          </p>
          {(BUSINESS.phone || BUSINESS.whatsapp || BUSINESS.email || BUSINESS.address) && (
            <ul className="mt-4 space-y-1 text-sm text-ink-2 list-none p-0">
              {BUSINESS.phone && <li>Phone: {BUSINESS.phone}</li>}
              {BUSINESS.whatsapp && <li>WhatsApp: {BUSINESS.whatsapp}</li>}
              {BUSINESS.email && <li>{BUSINESS.email}</li>}
              {BUSINESS.address && <li>{BUSINESS.address}</li>}
            </ul>
          )}
        </div>
        {col("Shop", [
          { href: "/shop/palm-oil", label: "Palm oil" },
          { href: "/shop/tapioca", label: "Tapioca flakes" },
          { href: "/shop/garri", label: "Garri Igbo and Ijebu" },
          { href: "/shop", label: "All pack sizes" },
          { href: "/cart", label: "Cart" },
        ])}
        {col("Wholesale", [
          { href: "/wholesale", label: "Volume pricing" },
          { href: "/wholesale/quote", label: "Request a quote" },
          { href: "/wholesale/register", label: "Register a business" },
          { href: "/events", label: "Souvenirs and events" },
          { href: "/contact", label: "Contact us" },
        ])}
        {col("Delivery", [
          { href: "/delivery", label: "Delivery across Nigeria" },
          { href: "/order", label: "Checkout preview" },
          { href: "/dashboard", label: "Business intelligence (staff)" },
        ])}
      </div>
      <div className="border-t border-line">
        <div className="wrap py-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between text-xs text-ink-3">
          <p>
            &copy; Laddex Enterprise. Prototype build: product sizes, prices,
            stock, delivery rates and orders are illustrative until real data is
            connected.
          </p>
          <p className="mono">
            Map data &copy; OpenStreetMap contributors. Boundaries:
            geoBoundaries (GRID3), CC BY 4.0.
          </p>
        </div>
      </div>
    </footer>
  );
}
