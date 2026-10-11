import Image from "next/image";
import Link from "next/link";

import { ProductCard } from "@/components/commerce/product-card";
import { ButtonLink, SampleTag } from "@/components/lx/primitives";
import {
  BANK_TRANSFER_ENABLED,
  BUSINESS,
  BUSINESS_CONTACT,
} from "@/content/business";
import { getCatalogue } from "@/features/catalogue";
import { googleMapsDirectionsUrl } from "@/lib/store";

const WAYS_TO_BUY = [
  {
    who: "For your kitchen",
    title: "Buy a pack",
    body: "Choose a size, add it to your cart and pay by bank transfer. Collect in Epe or have it delivered.",
    href: "/shop",
    cta: "Shop products",
  },
  {
    who: "For shops, vendors and restaurants",
    title: "Buy in volume",
    body: "Tell us the products, sizes and quantities you need and where they are going. We reply with a written quote.",
    href: "/wholesale",
    cta: "Wholesale enquiries",
  },
  {
    who: "For weddings, ceremonies and companies",
    title: "Order souvenirs",
    body: "Small packs in numbers for guests and staff. Share your date, guest count and packaging, and we quote per event.",
    href: "/events",
    cta: "Plan an event order",
  },
] as const;

const WHAT_TO_EXPECT = [
  {
    title: "Prices you can compare",
    body: "Every size shows its pack price and its price per litre or kilo, so you can see what a larger pack saves.",
  },
  {
    title: "Stock shown before you buy",
    body: "Each size says whether it is in stock, low or out. Sizes we cannot supply cannot be added to the cart.",
  },
  {
    title: "Payments checked by a person",
    body: "We match every bank transfer against our account before an order is confirmed. A receipt alone does not confirm it.",
  },
  {
    title: "A store you can visit",
    body: `${BUSINESS.address.replace(", Nigeria", "")}. Pickup and walk-in by appointment.`,
  },
] as const;

/** Small supplied photographs, shown near their native size so they stay sharp. */
const EVENT_PHOTOS = [
  { src: "/products/tapioca-flakes.webp", alt: "Laddex Tapioca Flakes pouches", width: 250, height: 330, tilt: "-rotate-2" },
  { src: "/products/garri-igbo.webp", alt: "Laddex Garri Igbo 1 kg pouch", width: 166, height: 235, tilt: "z-10 -mb-2" },
  { src: "/products/garri-ijebu.webp", alt: "Laddex Ijebu Garri 1 kg pouches", width: 160, height: 240, tilt: "rotate-2" },
] as const;

export default async function HomePage() {
  const products = await getCatalogue().listProducts();
  const hasIllustrativeProducts = products.some((product) =>
    product.variants.some((variant) => variant.dataStatus === "illustrative"),
  );

  return (
    <>
      {/* Hero: text and photographs never overlap, so the packs stay fully visible. */}
      <section className="relative overflow-hidden border-b border-line">
        <div className="wrap grid gap-8 pb-12 pt-8 sm:pt-12 lg:grid-cols-12 lg:gap-10 lg:pb-20 lg:pt-16">
          <div className="lg:col-span-6 lg:self-center xl:col-span-5">
            <p className="eyebrow hero-fade">
              {BUSINESS.tagline.replace(/\.$/, "")} &middot; Epe, Lagos State
            </p>
            <h1 className="display hero-fade mt-4 text-[2.5rem] text-ink [--i:1] xs:text-[2.875rem] sm:text-6xl xl:text-[4.25rem]">
              Palm oil, garri and tapioca, from&nbsp;Epe to your kitchen.
            </h1>
            <p className="lede hero-fade mt-5 max-w-xl [--i:2]">
              {BUSINESS.name} supplies palm oil, tapioca flakes, Garri Igbo and
              Ijebu Garri to households, shops, food vendors and event
              planners. Buy a single pack here, or ask us for a volume quote.
            </p>
            <div className="hero-fade mt-7 flex flex-col gap-3 [--i:3] xs:flex-row">
              <ButtonLink href="/shop" size="lg">
                Shop products
              </ButtonLink>
              <ButtonLink href="/wholesale" variant="line" size="lg">
                Wholesale enquiries
              </ButtonLink>
            </div>
            <dl className="hero-fade mt-9 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-line pt-6 text-sm [--i:4] sm:grid-cols-3">
              <div>
                <dt className="font-semibold text-ink">Pickup in Epe</dt>
                <dd className="text-ink-3">8 am to 5 pm, by appointment</dd>
              </div>
              <div>
                <dt className="font-semibold text-ink">Delivery</dt>
                <dd className="text-ink-3">
                  Quoted for every state and the FCT
                </dd>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <dt className="font-semibold text-ink">
                  {BANK_TRANSFER_ENABLED ? "Bank transfer" : "Confirmed orders"}
                </dt>
                <dd className="text-ink-3">
                  {BANK_TRANSFER_ENABLED
                    ? "Checked by our staff before dispatch"
                    : "Every order confirmed by a person"}
                </dd>
              </div>
            </dl>
          </div>

          {/* Photo composition: a wide palm oil image over two pouch close-ups. Text never sits on a photo. */}
          <div className="hero-fade grid grid-cols-2 gap-3 [--i:2] sm:gap-4 lg:col-span-6 lg:self-center xl:col-span-7 xl:pl-8">
            <figure className="relative col-span-2 overflow-hidden rounded-lg bg-paper-2">
              <Image
                src="/products/palm-oil-lineup.webp"
                alt="Five Laddex palm oil bottles of different sizes with red caps, standing together"
                width={500}
                height={330}
                priority
                sizes="(min-width: 1280px) 640px, (min-width: 1024px) 48vw, 100vw"
                className="aspect-[16/10] w-full object-cover object-[50%_45%]"
              />
              <figcaption className="absolute bottom-3 left-3 rounded-sm bg-card/95 px-2.5 py-1 text-xs font-semibold text-ink">
                Palm oil &middot; 1 L to 5 L
              </figcaption>
            </figure>
            <figure className="relative overflow-hidden rounded-lg bg-amber-tint">
              <Image
                src="/products/tapioca-flakes.webp"
                alt="Shelves of Laddex Tapioca Flakes pouches with yellow and red labels"
                width={250}
                height={330}
                priority
                sizes="(min-width: 1024px) 24vw, 48vw"
                className="aspect-[4/3] w-full object-cover object-[50%_30%]"
              />
              <figcaption className="absolute bottom-2 left-2 rounded-sm bg-card/95 px-2 py-1 text-xs font-semibold text-ink">
                Tapioca flakes
              </figcaption>
            </figure>
            <figure className="relative overflow-hidden rounded-lg bg-forest-tint">
              <Image
                src="/products/garri-shelf.webp"
                alt="Laddex Garri Igbo and Ijebu Garri pouches on a shelf"
                width={268}
                height={250}
                sizes="(min-width: 1024px) 24vw, 48vw"
                className="aspect-[4/3] w-full object-cover"
              />
              <figcaption className="absolute bottom-2 left-2 rounded-sm bg-card/95 px-2 py-1 text-xs font-semibold text-ink">
                Garri Igbo and Ijebu
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="section" aria-labelledby="range">
        <div className="wrap">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <p className="eyebrow">The range</p>
              <h2
                id="range"
                className="mt-3 text-[2rem] leading-[1.08] md:text-[2.75rem]"
              >
                Four staples, in the sizes you need
              </h2>
              <p className="lede mt-3">
                Pick a size on any product to see its price, its price per
                litre or kilo, and whether it is in stock.
              </p>
            </div>
            <Link href="/shop" className="text-link hidden sm:inline">
              Compare every size &rarr;
            </Link>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 sm:gap-5 lg:mt-10 lg:grid-cols-4">
            {products.map((p, i) => (
              <ProductCard key={p.id} product={p} priority={i < 2} />
            ))}
          </div>
          {hasIllustrativeProducts && (
            <p className="hint mt-5 flex flex-wrap items-center gap-2">
              <SampleTag />
              Sizes and prices are illustrative until Laddex confirms the
              catalogue.
            </p>
          )}
          <Link href="/shop" className="text-link mt-6 inline-block sm:hidden">
            Compare every size &rarr;
          </Link>
        </div>
      </section>

      {/* Ways to buy: a dark band, typography-led. */}
      <section className="bg-rail text-rail-text" aria-labelledby="ways">
        <div className="wrap section">
          <div className="grid gap-10 xl:grid-cols-12">
            <div className="max-w-xl xl:col-span-4">
              <p className="eyebrow !text-amber-bright">Ways to buy</p>
              <h2
                id="ways"
                className="mt-3 text-[2rem] leading-[1.08] text-rail-text md:text-[2.75rem]"
              >
                One supplier for the home, the shop and the event
              </h2>
            </div>
            <ol className="grid gap-px overflow-hidden rounded-lg bg-rail-line md:grid-cols-3 xl:col-span-8">
              {WAYS_TO_BUY.map((w, i) => (
                <li key={w.title} className="flex flex-col bg-rail p-6 md:p-7">
                  <span
                    aria-hidden="true"
                    className="num font-display text-sm text-amber-bright"
                  >
                    0{i + 1}
                  </span>
                  <p className="mt-6 text-sm text-rail-text/75">{w.who}</p>
                  <h3 className="mt-1 text-2xl text-rail-text">{w.title}</h3>
                  <p className="mt-3 text-[0.9375rem] leading-relaxed text-rail-text/80">
                    {w.body}
                  </p>
                  <Link
                    href={w.href}
                    className="mt-6 inline-flex min-h-11 items-center gap-2 self-start font-semibold text-rail-text underline decoration-rail-text/40 underline-offset-4 hover:decoration-rail-text md:mt-auto md:pt-6"
                  >
                    {w.cta} <span aria-hidden="true">&rarr;</span>
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* What to expect: photograph left, plain commitments right. */}
      <section className="section" aria-labelledby="expect">
        <div className="wrap grid items-center gap-10 lg:grid-cols-12 lg:gap-14">
          <figure className="lg:col-span-5">
            <div className="overflow-hidden rounded-lg bg-paper-2">
              <Image
                src="/products/palm-oil-bottles.webp"
                alt="Laddex palm oil bottles with red caps and carry handles"
                width={540}
                height={290}
                sizes="(min-width: 1024px) 38vw, 100vw"
                className="aspect-[3/2] w-full object-cover"
              />
            </div>
            <figcaption className="hint mt-2">
              Laddex palm oil bottles. Photograph supplied by Laddex.
            </figcaption>
          </figure>
          <div className="lg:col-span-7">
            <p className="eyebrow">Buying from Laddex</p>
            <h2
              id="expect"
              className="mt-3 max-w-xl text-[2rem] leading-[1.08] md:text-[2.75rem]"
            >
              What you can expect from us
            </h2>
            <dl className="mt-8 grid gap-x-10 gap-y-7 sm:grid-cols-2">
              {WHAT_TO_EXPECT.map((x) => (
                <div key={x.title} className="border-t-2 border-forest pt-4">
                  <dt className="font-display text-xl">{x.title}</dt>
                  <dd className="mt-2 text-[0.9375rem] leading-relaxed text-ink-2">
                    {x.body}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* Events */}
      <section className="pb-14 lg:pb-22" aria-labelledby="events">
        <div className="wrap">
          <div className="grid overflow-hidden rounded-lg bg-amber-tint lg:grid-cols-2">
            <div className="flex flex-col justify-center p-6 sm:p-10 lg:p-14">
              <p className="eyebrow !text-amber">Events and souvenirs</p>
              <h2
                id="events"
                className="mt-3 text-[2rem] leading-[1.08] md:text-[2.5rem]"
              >
                Useful gifts your guests will take home
              </h2>
              <p className="mt-4 max-w-md leading-relaxed text-ink-2">
                Garri, tapioca and palm oil in small packs, ordered in numbers
                for weddings, naming ceremonies, burials and staff gifts. Tell
                us the date, the number of guests and how you want them
                packed.
              </p>
              <div className="mt-7">
                <ButtonLink href="/events">Plan an event order</ButtonLink>
              </div>
            </div>
            <div className="flex items-end justify-center gap-3 px-6 pb-8 sm:gap-5 lg:py-14 lg:pr-14">
              {EVENT_PHOTOS.map((photo) => (
                <div
                  key={photo.src}
                  className={`w-[30%] max-w-40 overflow-hidden rounded-md border-4 border-card bg-card shadow-raised ${photo.tilt}`}
                >
                  <Image
                    src={photo.src}
                    alt={photo.alt}
                    width={photo.width}
                    height={photo.height}
                    sizes="160px"
                    className="aspect-[3/4] w-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Delivery and visit, side by side. */}
      <section className="border-t border-line bg-paper-2" aria-label="Delivery and store">
        <div className="wrap section grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="eyebrow">Delivery</p>
            <h2 className="mt-3 text-[2rem] leading-[1.08] md:text-[2.5rem]">
              Delivery across Nigeria
            </h2>
            <p className="mt-4 max-w-lg leading-relaxed text-ink-2">
              Choose your state and local government area to see the options
              for your order. Fees depend on where you are and how heavy the
              order is. Where a fee is not yet confirmed, we say so and quote
              it before you pay.
            </p>
            <form
              action="/delivery"
              className="mt-6 flex max-w-lg flex-col gap-2 xs:flex-row"
              role="search"
              aria-label="Check delivery to a town or state"
            >
              <label className="sr-only" htmlFor="home-addr">
                Town, city or state
              </label>
              <input
                id="home-addr"
                name="q"
                className="field min-w-0 flex-1"
                placeholder="Town or state, e.g. Ibadan"
                autoComplete="address-level2"
              />
              <button className="btn btn-ink">Check delivery</button>
            </form>
          </div>
          <div id="visit">
            <p className="eyebrow">Visit or call</p>
            <h2 className="mt-3 text-[2rem] leading-[1.08] md:text-[2.5rem]">
              Our store in Epe
            </h2>
            <address className="mt-4 not-italic leading-relaxed text-ink-2">
              {BUSINESS.address}
              <br />
              {BUSINESS.hours}
            </address>
            <ul className="mt-6 flex flex-wrap gap-3">
              {BUSINESS.whatsapp && (
                <li>
                  <a
                    href={BUSINESS_CONTACT.whatsappHref}
                    className="btn btn-primary"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    WhatsApp {BUSINESS.whatsapp}
                  </a>
                </li>
              )}
              {BUSINESS.phone && (
                <li>
                  <a href={BUSINESS_CONTACT.phoneHref} className="btn btn-line">
                    Call {BUSINESS.phone}
                  </a>
                </li>
              )}
              <li>
                <a
                  href={googleMapsDirectionsUrl()}
                  className="btn btn-quiet underline underline-offset-4"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Directions
                  <span className="sr-only"> (opens Google Maps)</span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Closing call to action */}
      <section className="wrap section text-center" aria-labelledby="closing">
        <h2
          id="closing"
          className="mx-auto max-w-2xl text-[2rem] leading-[1.08] md:text-5xl"
        >
          Stock your kitchen, your shelf or your event.
        </h2>
        <p className="lede mx-auto mt-4 max-w-xl">
          Choose your products and sizes now. We confirm every order before it is
          dispatched.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 xs:flex-row">
          <ButtonLink href="/shop" size="lg">
            Shop products
          </ButtonLink>
          <ButtonLink href="/contact" variant="line" size="lg">
            Ask a question
          </ButtonLink>
        </div>
      </section>
    </>
  );
}
