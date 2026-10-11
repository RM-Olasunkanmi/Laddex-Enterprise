import Link from "next/link";

import { Wordmark } from "./site-header";

import { BUSINESS, BUSINESS_CONTACT } from "@/content/business";

const COLUMNS = [
  {
    title: "Shop",
    items: [
      { href: "/shop/palm-oil", label: "Palm oil" },
      { href: "/shop/tapioca", label: "Tapioca flakes" },
      { href: "/shop/garri", label: "Garri Igbo and Ijebu" },
      { href: "/shop", label: "All products" },
      { href: "/cart", label: "Cart" },
    ],
  },
  {
    title: "Buy in volume",
    items: [
      { href: "/wholesale", label: "Wholesale" },
      { href: "/wholesale/quote", label: "Request a quote" },
      { href: "/wholesale/register", label: "Register a business" },
      { href: "/events", label: "Events and souvenirs" },
    ],
  },
  {
    title: "Help",
    items: [
      { href: "/delivery", label: "Delivery" },
      { href: "/about", label: "About Laddex" },
      { href: "/contact", label: "Contact" },
      { href: "/delivery-policy", label: "Delivery policy" },
      { href: "/returns-refunds", label: "Returns and refunds" },
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
    ],
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-paper-2">
      <div className="wrap grid gap-10 py-12 md:grid-cols-12 md:gap-8 md:py-16">
        <div className="md:col-span-5 lg:col-span-4">
          <Wordmark />
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-ink-2">
            Palm oil, tapioca flakes, Garri Igbo and Ijebu Garri for
            households, shops, food vendors and events. Prices are in Nigerian
            Naira.
          </p>
          <address className="mt-5 space-y-1.5 text-sm not-italic text-ink-2">
            {BUSINESS.address && <p>{BUSINESS.address}</p>}
            {BUSINESS.phone && (
              <p>
                <a className="text-link" href={BUSINESS_CONTACT.phoneHref}>
                  Call {BUSINESS.phone}
                </a>
              </p>
            )}
            {BUSINESS.whatsapp && (
              <p>
                <a
                  className="text-link"
                  href={BUSINESS_CONTACT.whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  WhatsApp {BUSINESS.whatsapp}
                </a>
              </p>
            )}
            {BUSINESS.email && (
              <p>
                <a className="text-link" href={`mailto:${BUSINESS.email}`}>
                  {BUSINESS.email}
                </a>
              </p>
            )}
          </address>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 md:col-span-7 lg:col-span-7 lg:col-start-6">
          {COLUMNS.map((c) => (
            <nav key={c.title} aria-label={c.title}>
              <h2 className="eyebrow !text-ink-3">{c.title}</h2>
              <ul className="mt-4 space-y-1">
                {c.items.map((i) => (
                  <li key={i.href}>
                    <Link
                      href={i.href}
                      className="inline-flex min-h-9 items-center text-[0.9375rem] text-ink-2 hover:text-forest hover:underline hover:underline-offset-4"
                    >
                      {i.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>
      <div className="border-t border-line">
        <div className="wrap flex flex-col gap-2 py-5 text-xs text-ink-3 md:flex-row md:items-center md:justify-between">
          <p>
            &copy; {new Date().getFullYear()} {BUSINESS.name}, Epe, Lagos State.
            Prices, stock and delivery fees are confirmed with every order.
          </p>
          <p>
            Map data &copy; OpenStreetMap contributors. Boundaries:
            geoBoundaries (GRID3), CC BY 4.0.
          </p>
        </div>
      </div>
    </footer>
  );
}
