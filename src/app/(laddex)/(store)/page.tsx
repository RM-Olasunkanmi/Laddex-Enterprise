import Image from "next/image";
import Link from "next/link";

import { PackTable } from "@/components/commerce/pack-table";
import { ProductCard } from "@/components/commerce/product-card";
import { ButtonLink, Notice, SampleTag, SectionHeading } from "@/components/lx/primitives";
import { RegionSketch } from "@/components/product/region-sketch";
import { BUSINESS } from "@/content/business";
import { getCatalogue } from "@/features/catalogue";
import { CATEGORIES } from "@/fixtures/products/products";
import { REGIONS } from "@/fixtures/geography/regions";

const CATEGORY_PHOTO: Record<string, { src: string; w: number; h: number; alt: string }> = {
  "palm-oil": { src: "/products/palm-oil-lineup.webp", w: 500, h: 330, alt: "Bottles of Laddex palm oil with red caps" },
  tapioca: { src: "/products/tapioca-flakes.webp", w: 250, h: 330, alt: "Pouch of Laddex tapioca flakes" },
  garri: { src: "/products/garri-shelf.webp", w: 268, h: 250, alt: "Garri Igbo and Ijebu Garri pouches on a shelf" },
};

export default async function HomePage() {
  const products = await getCatalogue().listProducts();
  const stateCount = REGIONS.reduce((n, r) => n + r.stateIds.length, 0);

  return (
    <>
      <section className="border-b border-line">
        <div className="wrap grid gap-10 lg:grid-cols-[1.05fr_1fr] pt-10 pb-12 lg:pt-16 lg:pb-16 items-center">
          <div>
            <p className="eyebrow mb-5">Palm oil &middot; Tapioca &middot; Garri &middot; Delivered across Nigeria</p>
            <h1 className="text-[2.6rem] sm:text-6xl lg:text-[4rem] leading-[1.03]">
              Pure. Natural.
              <br />
              <span className="text-ember">Royal.</span>
            </h1>
            <p className="mt-6 text-lg text-ink-2 max-w-xl">
              Palm oil, tapioca flakes, Garri Igbo and Ijebu Garri, for your kitchen, your shop or your event. Buy a
              single pack online, or buy in volume to resell.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/shop">Shop all products</ButtonLink>
              <ButtonLink href="/wholesale" variant="ink">Buy to resell</ButtonLink>
              <ButtonLink href="/events" variant="quiet">Souvenirs and events &rarr;</ButtonLink>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Image src="/products/palm-oil-lineup.webp" alt="Bottles of Laddex palm oil with red caps" width={500} height={330} priority className="col-span-2 w-full h-auto rounded-md border border-line object-cover" />
            <Image src="/products/garri-shelf.webp" alt="Garri Igbo, Ijebu Garri and tapioca flakes on a shelf" width={268} height={250} className="w-full h-full rounded-md border border-line object-cover" />
            <Image src="/products/tapioca-flakes.webp" alt="Laddex tapioca flakes pouch" width={250} height={330} className="w-full h-full rounded-md border border-line object-cover" />
            <p className="col-span-2 hint">Sample photos supplied by Laddex.</p>
          </div>
        </div>
      </section>

      <section className="wrap pt-16" aria-labelledby="about">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.3fr] items-start">
          <div>
            <p className="eyebrow mb-3">About Laddex</p>
            <h2 id="about" className="text-3xl md:text-4xl">A Nigerian supplier of everyday staples</h2>
          </div>
          <div className="text-ink-2 space-y-4 text-base md:text-lg">
            <p>
              {BUSINESS.name} supplies {BUSINESS.products.slice(0, -1).join(", ").toLowerCase()} and{" "}
              {BUSINESS.products[BUSINESS.products.length - 1].toLowerCase()}. The same stock serves{" "}
              {BUSINESS.buyers.join(", ").toLowerCase()}.
            </p>
            <p>Orders go to every state in Nigeria. Delivery is priced by weight and region, and you can check the cost for your address before you buy.</p>
            <Link href="/contact" className="inline-block underline underline-offset-4 text-ink font-medium">Ask a question or request a quote</Link>
          </div>
        </div>
      </section>

      <section className="wrap pt-16">
        <SectionHeading eyebrow="Products" title="What we supply" />
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {CATEGORIES.map((c) => {
            const ph = CATEGORY_PHOTO[c.id];
            return (
              <Link key={c.id} href={`/shop/${c.id}`} className="group panel overflow-hidden flex flex-col">
                <div className="aspect-[4/3] bg-paper-2 overflow-hidden">
                  <Image src={ph.src} alt={ph.alt} width={ph.w} height={ph.h} className="w-full h-full object-cover transition-transform duration-[var(--d-slow)] group-hover:scale-[1.03]" />
                </div>
                <div className="p-5">
                  <h3 className="text-2xl">{c.name}</h3>
                  <p className="mono text-xs uppercase tracking-wider text-ink-3 mt-1">{c.tagline}</p>
                  <p className="mt-2 text-sm text-ink-2">{c.blurb}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="wrap pt-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading eyebrow="Start here" title="Pick a size and add to cart">Each card follows the size you choose, with its own price and stock.</SectionHeading>
          <Link href="/shop" className="btn btn-line">See every product</Link>
        </div>
        <div className="mt-8 grid gap-3 sm:gap-5 grid-cols-2 lg:grid-cols-4">
          {products.map((p, i) => (
            <ProductCard key={p.id} product={p} priority={i < 2} />
          ))}
        </div>
      </section>

      <section className="wrap pt-20" aria-labelledby="ways">
        <SectionHeading eyebrow="Three ways to buy" title={<span id="ways">One catalogue, three kinds of customer</span>} />
        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {[
            ["For the household", "Buy a pack at list price", "Choose a size, check delivery to your address and pay for what you need.", "/shop", "Browse products"],
            ["For shops and resellers", "Buy in volume, priced in tiers", "Price breaks apply once a business account is approved. Until then tiers are indicative, not an offer.", "/wholesale", "Wholesale pricing"],
            ["For events and gifts", "Souvenirs in numbers", "Small sizes in bulk for weddings, ceremonies and corporate gifts, quoted per event.", "/events", "Plan an event"],
          ].map(([eyebrow, title, body, href, cta], i) => (
            <div key={title} className={`p-6 sm:p-7 flex flex-col rounded-md ${i === 1 ? "bg-ink text-paper" : "panel"}`}>
              <p className={`eyebrow ${i === 1 ? "!text-rail-text/70" : ""}`}>{eyebrow}</p>
              <h3 className={`text-2xl mt-2 ${i === 1 ? "!text-paper" : ""}`}>{title}</h3>
              <p className={`mt-3 ${i === 1 ? "text-rail-text/85" : "text-ink-2"}`}>{body}</p>
              <div className="mt-auto pt-6">
                <ButtonLink href={href} variant={i === 1 ? "primary" : "line"}>{cta}</ButtonLink>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="wrap pt-20">
        <SectionHeading eyebrow="Sizes and prices" title="Every pack, side by side">
          Priced per litre or per kilo, so a small bottle and a large sack compare directly.
        </SectionHeading>
        <div className="mt-8 grid gap-6">
          {products.map((p) => (
            <PackTable key={p.id} product={p} />
          ))}
        </div>
        <p className="mt-4 hint">
          <SampleTag /> <span className="ml-2">Sizes and prices are illustrative until Laddex confirms the catalogue.</span>
        </p>
      </section>

      <section className="wrap pt-20" aria-labelledby="deliv">
        <div className="panel grid lg:grid-cols-[1fr_1.1fr] overflow-hidden">
          <div className="p-6 sm:p-10 flex flex-col">
            <p className="eyebrow">Delivery</p>
            <h2 id="deliv" className="text-3xl md:text-4xl mt-2">Delivered across Nigeria</h2>
            <p className="mt-3 text-ink-2">
              All {stateCount} states including the FCT, in six delivery regions. Pick your state and local government
              area to see the delivery estimate for your cart weight.
            </p>
            <form action="/delivery" className="mt-6 flex gap-2" role="search" aria-label="Find a delivery address">
              <label className="sr-only" htmlFor="home-addr">Town, city or state</label>
              <input id="home-addr" name="q" className="field" placeholder="Try Ibadan, Enugu or Kano" />
              <button className="btn btn-ink">Search</button>
            </form>
            <Notice tone="sample" className="mt-6" title="Sample delivery rates">
              Regional rates are placeholders used to build the interface. They will be replaced by Laddex&rsquo;s confirmed rates.
            </Notice>
          </div>
          <div className="bg-paper-2 p-6 sm:p-10 grid place-items-center border-t lg:border-t-0 lg:border-l border-line">
            <RegionSketch className="w-full max-w-lg" />
          </div>
        </div>
      </section>

      <section className="wrap pt-20">
        <SectionHeading eyebrow="How pricing and delivery work" title="What this store will and will not tell you" />
        <dl className="mt-8 grid gap-px bg-line border border-line rounded-md overflow-hidden sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Unit price always shown", "Each pack lists its price per litre or kilo next to the pack price."],
            ["Wholesale tiers need approval", "Volume prices apply to approved business accounts. Others see them as indicative only."],
            ["Delivery is estimated, not promised", "A fee appears where a rate is configured. Otherwise you get a written quote."],
            ["Data is labelled", "Sample prices, stock and photos are marked until Laddex confirms them."],
          ].map(([t, d]) => (
            <div key={t} className="bg-card p-5">
              <dt className="font-display text-lg">{t}</dt>
              <dd className="mt-2 text-sm text-ink-2">{d}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="wrap pt-20">
        <div className="panel p-6 sm:p-10 flex flex-wrap items-center justify-between gap-5">
          <div>
            <h2 className="text-3xl">Questions or a large order?</h2>
            <p className="mt-2 text-ink-2">Send an enquiry and we will reply with availability, price and delivery.</p>
          </div>
          <ButtonLink href="/contact">Contact us</ButtonLink>
        </div>
      </section>
    </>
  );
}
