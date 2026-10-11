import Image from "next/image";
import Link from "next/link";

import { ProductCard } from "@/components/commerce/product-card";
import {
  ButtonLink,
  Notice,
  SampleTag,
  SectionHeading,
} from "@/components/lx/primitives";
import { RegionSketch } from "@/components/product/region-sketch";
import { BANK_TRANSFER_ENABLED, BUSINESS } from "@/content/business";
import { getCatalogue } from "@/features/catalogue";
import { REGIONS } from "@/fixtures/geography/regions";

const WAYS_TO_BUY = [
  {
    eyebrow: "For the household",
    title: "Buy a pack at list price",
    body: "Choose a size, then check delivery for your address.",
    href: "/shop",
  },
  {
    eyebrow: "For shops and resellers",
    title: "Buy in volume, priced in tiers",
    body: "Price breaks are indicative. Request a current wholesale quote before ordering.",
    href: "/wholesale",
  },
  {
    eyebrow: "For events and gifts",
    title: "Souvenirs in numbers",
    body: "Small sizes in bulk for weddings, ceremonies and corporate gifts, quoted per event.",
    href: "/events",
  },
] as const;

export default async function HomePage() {
  const products = await getCatalogue().listProducts();
  const hasIllustrativeProducts = products.some((product) =>
    product.variants.some((variant) => variant.dataStatus === "illustrative"),
  );
  const paymentsEnabled = process.env.NEXT_PUBLIC_ENABLE_PAYSTACK === "true";
  const stateCount = REGIONS.reduce((n, r) => n + r.stateIds.length, 0);

  const intro = paymentsEnabled
    ? "Buy a single pack online, or buy in volume to resell."
    : BANK_TRANSFER_ENABLED
      ? "Choose your packs, pay by bank transfer and upload your receipt. We confirm every order."
      : "Choose your packs, then send the order to Laddex for confirmation.";

  return (
    <>
      <section className="border-b border-line">
        <div className="wrap grid gap-10 pt-10 pb-12 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-16 lg:pt-20 lg:pb-20">
          <div>
            <p className="eyebrow">Epe, Lagos State &middot; Nigeria</p>
            <h1 className="mt-5 text-[2.75rem] leading-[1.04] sm:text-6xl lg:text-[4.5rem]">
              <span className="block">Pure. Natural.</span>
              <span className="accent block text-ember">Royal.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-ink-2">
              Palm oil, tapioca flakes, Garri Igbo and Ijebu Garri, for your
              kitchen, your shop or your event. {intro}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/shop">Shop products</ButtonLink>
              <ButtonLink href="/wholesale" variant="line">
                Buy to resell
              </ButtonLink>
            </div>
          </div>
          <figure>
            <div className="overflow-hidden rounded-lg border border-line bg-paper-2">
              <Image
                src="/products/palm-oil-lineup.webp"
                alt="Bottles of Laddex palm oil with red caps"
                width={500}
                height={330}
                priority
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="aspect-[3/2] w-full object-cover"
              />
            </div>
            <figcaption className="mt-2 hint">
              Palm oil, 1 L to 5 L. Sample photo supplied by Laddex.
            </figcaption>
          </figure>
        </div>
        <dl className="wrap grid divide-y divide-line border-t border-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {[
            [
              "Retail and wholesale",
              "Single packs for households, volume tiers for resellers.",
            ],
            [
              "Delivery on request",
              "Estimated by weight and region, confirmed by Laddex.",
            ],
            ["Visit the Epe store", `${BUSINESS.address}. Please book first.`],
          ].map(([term, detail]) => (
            <div key={term} className="py-4 sm:px-5 sm:first:pl-0">
              <dt className="font-display text-base font-semibold">{term}</dt>
              <dd className="mt-1 text-sm text-ink-2">{detail}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="wrap pt-16" aria-labelledby="range">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading
            eyebrow="The range"
            title={<span id="range">Choose a product and size</span>}
          >
            Each card follows the size you pick, with its own price and stock.
          </SectionHeading>
          <Link href="/shop" className="btn btn-line">
            See every product
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {products.map((p, i) => (
            <ProductCard key={p.id} product={p} priority={i < 2} />
          ))}
        </div>
        {hasIllustrativeProducts && (
          <p className="mt-4 hint">
            <SampleTag />{" "}
            <span className="ml-2">
              Sizes and prices are illustrative until Laddex confirms the
              catalogue.
            </span>
          </p>
        )}
      </section>

      <section className="wrap pt-20" aria-labelledby="about">
        <div className="grid items-start gap-6 lg:grid-cols-[1fr_1.3fr] lg:gap-12">
          <div>
            <p className="eyebrow mb-3">About Laddex</p>
            <h2 id="about" className="text-3xl md:text-4xl">
              A Nigerian supplier of everyday staples
            </h2>
          </div>
          <div className="space-y-4 text-base text-ink-2 md:text-lg">
            <p>
              {BUSINESS.name} supplies{" "}
              {BUSINESS.products.slice(0, -1).join(", ").toLowerCase()} and{" "}
              {BUSINESS.products[BUSINESS.products.length - 1].toLowerCase()}.
              The same stock serves {BUSINESS.buyers.join(", ").toLowerCase()}.
            </p>
            <p className="text-base">
              <span className="font-medium text-ink">Visit the store:</span>{" "}
              {BUSINESS.address}. {BUSINESS.hours}{" "}
              <Link
                href="/contact#visit"
                className="font-medium text-ink underline underline-offset-4"
              >
                Map and directions
              </Link>
            </p>
          </div>
        </div>
      </section>

      <section className="wrap pt-20" aria-labelledby="ways">
        <SectionHeading
          eyebrow="Three ways to buy"
          title={<span id="ways">One catalogue, three kinds of customer</span>}
        />
        <ul className="mt-6 divide-y divide-line border-y border-line">
          {WAYS_TO_BUY.map((w) => (
            <li key={w.title}>
              <Link
                href={w.href}
                className="group flex items-start justify-between gap-6 py-6"
              >
                <span>
                  <span className="eyebrow block">{w.eyebrow}</span>
                  <span className="mt-1 block font-display text-xl font-semibold sm:text-2xl">
                    {w.title}
                  </span>
                  <span className="mt-1 block max-w-xl text-ink-2">
                    {w.body}
                  </span>
                </span>
                <span
                  aria-hidden="true"
                  className="mt-2 text-xl text-ember transition-transform duration-200 group-hover:translate-x-1"
                >
                  &rarr;
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="wrap pt-20" aria-labelledby="deliv">
        <div className="panel grid overflow-hidden lg:grid-cols-[1fr_1.1fr]">
          <div className="flex flex-col p-6 sm:p-10">
            <p className="eyebrow">Delivery</p>
            <h2 id="deliv" className="mt-2 text-3xl md:text-4xl">
              Delivery across Nigeria
            </h2>
            <p className="mt-3 text-ink-2">
              Search all {stateCount} states including the FCT. Pick your state
              and local government area to see an estimate, then confirm that
              delivery is available with Laddex.
            </p>
            <form
              action="/delivery"
              className="mt-6 flex flex-col gap-2 sm:flex-row"
              role="search"
              aria-label="Find a delivery address"
            >
              <label className="sr-only" htmlFor="home-addr">
                Town, city or state
              </label>
              <input
                id="home-addr"
                name="q"
                className="field min-w-0 flex-1"
                placeholder="Try Ibadan, Enugu or Kano"
              />
              <button className="btn btn-ink w-full sm:w-auto">Search</button>
            </form>
            <Notice
              tone="sample"
              className="mt-6"
              title="Sample delivery rates"
            >
              Regional rates are placeholders until Laddex confirms its own.
            </Notice>
          </div>
          <div className="hidden place-items-center border-l border-line bg-paper-2 p-10 lg:grid">
            <RegionSketch className="w-full max-w-lg" />
          </div>
        </div>
      </section>

      <section className="wrap pt-20">
        <div className="flex flex-wrap items-center justify-between gap-6 rounded-lg bg-rail p-6 text-rail-text sm:p-10">
          <div className="max-w-xl">
            <h2 className="text-3xl text-rail-text sm:text-4xl">
              Questions or a large order?
            </h2>
            <p className="mt-2 text-rail-text/80">
              Send the details to Laddex to request availability, price and
              delivery information.
            </p>
          </div>
          <ButtonLink href="/contact">Contact us</ButtonLink>
        </div>
      </section>
    </>
  );
}
