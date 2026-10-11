import Image from "next/image";

import type { Metadata } from "next";

import { ButtonLink } from "@/components/lx/primitives";
import { BUSINESS, BUSINESS_CONTACT } from "@/content/business";
import { googleMapsDirectionsUrl } from "@/lib/store";

export const metadata: Metadata = {
  title: "About",
  description:
    "Laddex Enterprise supplies palm oil, tapioca flakes, Garri Igbo and Ijebu Garri from Epe, Lagos State.",
};

/** Only facts recorded in src/content/business.ts appear here. Nothing about history or sourcing is invented. */
export default function AboutPage() {
  return (
    <>
      <section className="border-b border-line">
        <div className="wrap grid gap-10 pb-14 pt-10 lg:grid-cols-12 lg:items-center lg:gap-14 lg:pb-20 lg:pt-16">
          <div className="lg:col-span-6">
            <p className="eyebrow">About {BUSINESS.name}</p>
            <h1 className="display mt-4 text-[2.5rem] sm:text-6xl">
              Everyday staples, sold plainly.
            </h1>
            <p className="lede mt-5">
              {BUSINESS.name} is a food business in Epe, Lagos State. We supply{" "}
              {BUSINESS.products.slice(0, -1).join(", ").toLowerCase()} and{" "}
              {BUSINESS.products.at(-1)} to households, shops and resellers,
              caterers and restaurants, and event organisers.
            </p>
            <p className="mt-4 leading-relaxed text-ink-2">
              The same stock serves every customer: a single pack for the
              kitchen, or volume for a shelf, a kitchen or an event. Every
              order is confirmed by a person before it is dispatched.
            </p>
          </div>
          <figure className="lg:col-span-6">
            <div className="overflow-hidden rounded-lg bg-paper-2">
              <Image
                src="/products/palm-oil-lineup.webp"
                alt="Five Laddex palm oil bottles of different sizes with red caps, standing together"
                width={500}
                height={330}
                priority
                sizes="(min-width: 1024px) 45vw, 100vw"
                className="aspect-[3/2] w-full object-cover"
              />
            </div>
            <figcaption className="hint mt-2">
              Laddex palm oil. Photograph supplied by Laddex.
            </figcaption>
          </figure>
        </div>
      </section>

      <section className="wrap section grid gap-12 md:grid-cols-2 lg:gap-16" aria-label="What we sell and who we serve">
        <div>
          <h2 className="text-3xl md:text-4xl">What we sell</h2>
          <ul className="mt-6 divide-y divide-line border-y border-line">
            {BUSINESS.products.map((p) => (
              <li key={p} className="py-3.5 font-display text-xl">
                {p}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-3xl md:text-4xl">Who we supply</h2>
          <ul className="mt-6 divide-y divide-line border-y border-line">
            {BUSINESS.buyers.map((b) => (
              <li key={b} className="py-3.5 text-lg text-ink-2">
                {b}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-rail text-rail-text" aria-labelledby="visit">
        <div className="wrap section grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="eyebrow !text-amber-bright">Visit or call</p>
            <h2 id="visit" className="mt-3 text-3xl text-rail-text md:text-4xl">
              {BUSINESS.address}
            </h2>
            <p className="mt-3 text-rail-text/80">{BUSINESS.hours}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              href={BUSINESS_CONTACT.whatsappHref}
              className="btn btn-on-dark"
              target="_blank"
              rel="noopener noreferrer"
            >
              WhatsApp {BUSINESS.whatsapp}
            </a>
            <a
              href={googleMapsDirectionsUrl()}
              className="btn btn-line-on-dark"
              target="_blank"
              rel="noopener noreferrer"
            >
              Directions<span className="sr-only"> (opens Google Maps)</span>
            </a>
          </div>
        </div>
      </section>

      <section className="wrap section text-center">
        <h2 className="text-3xl md:text-4xl">See the range</h2>
        <div className="mt-6 flex flex-col justify-center gap-3 xs:flex-row">
          <ButtonLink href="/shop" size="lg">
            Shop products
          </ButtonLink>
          <ButtonLink href="/contact" variant="line" size="lg">
            Contact us
          </ButtonLink>
        </div>
      </section>
    </>
  );
}
