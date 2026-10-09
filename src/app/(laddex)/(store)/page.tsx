import Link from "next/link";

import { PackTable } from "@/components/commerce/pack-table";
import { ProductCard } from "@/components/commerce/product-card";
import {
  Notice,
  SampleTag,
  SectionHeading,
  ButtonLink,
} from "@/components/lx/primitives";
import { PackLadder } from "@/components/product/pack-ladder";
import { TierChart } from "@/components/product/tier-chart";
import { ZoneSketch } from "@/components/product/zone-sketch";
import { getCatalogue } from "@/features/catalogue";
import { cheapestPerUnit } from "@/features/catalogue/pricing";
import { SAMPLE_ZONES } from "@/fixtures/geography/zones";
import { chart } from "@/lib/design/tokens";
import { formatNaira } from "@/lib/formatters";

const FEATURED = ["po-1l", "po-5l", "tp-5kg", "tp-25kg"];

export default async function HomePage() {
  const products = await getCatalogue().listProducts();
  const palm = products.find((p) => p.id === "palm-oil")!;
  const tapioca = products.find((p) => p.id === "tapioca")!;
  const featured = FEATURED.map((id) => {
    const product = products.find((p) => p.variants.some((v) => v.id === id))!;
    return { product, variant: product.variants.find((v) => v.id === id)! };
  });
  const wholesaleExample = palm.variants.find((v) => v.id === "po-25l")!;
  const palmBest = cheapestPerUnit(palm)!;
  const tapiocaBest = cheapestPerUnit(tapioca)!;

  return (
    <>
      {/* Hero: the proposition stated plainly, with the pack range drawn to scale */}
      <section className="border-b border-line">
        <div className="wrap grid gap-10 lg:grid-cols-[1.05fr_1fr] pt-10 pb-12 lg:pt-16 lg:pb-16 items-end">
          <div>
            <p className="eyebrow mb-5">
              Palm oil &middot; Tapioca &middot; Retail &amp; wholesale
            </p>
            <h1 className="text-[2.75rem] sm:text-6xl lg:text-[4.25rem] leading-[1.02]">
              Palm oil by the litre.
              <br />
              <span className="text-ember">Tapioca by the kilo.</span>
            </h1>
            <p className="mt-6 text-lg text-ink-2 max-w-xl">
              One catalogue for the household and the trade. Every pack shows
              its price per litre or kilo, so a 1 L bottle and a 25 L jerrycan
              compare directly. Check your address for delivery before you add
              to cart.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/shop/palm-oil">Shop palm oil</ButtonLink>
              <ButtonLink href="/shop/tapioca" variant="ink">
                Shop tapioca
              </ButtonLink>
              <ButtonLink href="/wholesale" variant="quiet">
                Buying for a business &rarr;
              </ButtonLink>
            </div>
            <dl className="mt-10 grid grid-cols-3 gap-4 border-t border-line-strong pt-5 max-w-xl">
              <div>
                <dt className="eyebrow">Palm oil</dt>
                <dd className="font-display text-2xl mt-1">
                  {palm.variants.length} sizes
                </dd>
                <dd className="text-xs text-ink-3">500 ml to 200 L</dd>
              </div>
              <div>
                <dt className="eyebrow">Tapioca</dt>
                <dd className="font-display text-2xl mt-1">
                  {tapioca.variants.length} sizes
                </dd>
                <dd className="text-xs text-ink-3">1 kg to 50 kg</dd>
              </div>
              <div>
                <dt className="eyebrow">Currency</dt>
                <dd className="font-display text-2xl mt-1">Naira</dd>
                <dd className="text-xs text-ink-3">Per unit and per pack</dd>
              </div>
            </dl>
          </div>
          <div className="relative bg-ember-tint/70 border border-line rounded-md p-5 sm:p-8 lg:pt-14">
            <PackLadder product={palm} />
          </div>
        </div>
      </section>

      {/* Featured packs */}
      <section className="wrap pt-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading eyebrow="Start here" title="Four common packs">
            Household sizes for palm oil and tapioca, with the larger pack
            beside each for comparison.
          </SectionHeading>
          <Link href="/shop" className="btn btn-line">
            See all {palm.variants.length + tapioca.variants.length} packs
          </Link>
        </div>
        <div className="mt-8 grid gap-3 sm:gap-5 grid-cols-2 lg:grid-cols-4">
          {featured.map(({ product, variant }) => (
            <ProductCard key={variant.id} product={product} variant={variant} />
          ))}
        </div>
      </section>

      {/* Two ways to buy */}
      <section className="wrap pt-20" aria-labelledby="ways">
        <SectionHeading
          eyebrow="Retail and wholesale"
          title={<span id="ways">Two ways to buy, one catalogue</span>}
        />
        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <div className="panel p-6 sm:p-8 flex flex-col">
            <p className="eyebrow">For the household</p>
            <h3 className="text-3xl mt-2">Buy a pack, pay list price</h3>
            <ol className="mt-5 space-y-4 text-ink-2">
              <li className="flex gap-4">
                <span className="mono text-ember w-6">01</span>Choose a pack.
                Bottles and small jerrycans are the usual household sizes.
              </li>
              <li className="flex gap-4">
                <span className="mono text-ember w-6">02</span>Pin your address
                to see whether a sample delivery zone covers it and what
                delivery would cost.
              </li>
              <li className="flex gap-4">
                <span className="mono text-ember w-6">03</span>Review the cart.
                Pickup from a distribution point is shown where one is
                configured.
              </li>
            </ol>
            <div className="mt-auto pt-8 flex gap-3 flex-wrap">
              <ButtonLink href="/shop">Browse packs</ButtonLink>
              <ButtonLink href="/delivery" variant="line">
                Check delivery
              </ButtonLink>
            </div>
          </div>
          <div className="p-6 sm:p-8 flex flex-col bg-ink text-paper rounded-md">
            <p className="eyebrow !text-rail-text/70">
              For shops, caterers and distributors
            </p>
            <h3 className="text-3xl mt-2 !text-paper">
              Buy in volume, priced in tiers
            </h3>
            <p className="mt-3 text-rail-text/85 max-w-md">
              Price breaks are set per pack and apply once an account is
              approved. Until then the tiers below are indicative, not an offer.
              Example: {wholesaleExample.size.amount} L jerrycan of palm oil.
            </p>
            <div className="mt-5 bg-paper text-ink rounded-sm p-4">
              <TierChart variant={wholesaleExample} />
            </div>
            <div className="mt-auto pt-8 flex gap-3 flex-wrap">
              <ButtonLink
                href="/wholesale/register"
                className="!bg-ochre !text-ink hover:!bg-ochre/85"
              >
                Register a business
              </ButtonLink>
              <ButtonLink
                href="/wholesale/quote"
                variant="line"
                className="!text-paper !border-rail-text/50 hover:!bg-paper/10"
              >
                Request a quote
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>

      {/* Packaging ledger */}
      <section className="wrap pt-20">
        <SectionHeading
          eyebrow="Packaging and quantities"
          title="Every pack, side by side"
        >
          Palm oil is priced per litre and tapioca per kilo. Larger packs cost
          less per unit: from {formatNaira(palmBest.perUnitKobo)} per litre and{" "}
          {formatNaira(tapiocaBest.perUnitKobo)} per kilo in these sample
          prices.
        </SectionHeading>
        <div className="mt-8 grid gap-6">
          <PackTable product={palm} />
          <PackTable product={tapioca} />
        </div>
        <p className="mt-4 hint">
          <SampleTag />{" "}
          <span className="ml-2">
            Sizes, packaging and prices are illustrative until Laddex confirms
            the catalogue.
          </span>
        </p>
      </section>

      {/* Delivery */}
      <section className="wrap pt-20" aria-labelledby="deliv">
        <div className="panel grid lg:grid-cols-[1fr_1.1fr] overflow-hidden">
          <div className="p-6 sm:p-10 flex flex-col">
            <p className="eyebrow">Delivery</p>
            <h2 id="deliv" className="text-3xl md:text-4xl mt-2">
              Find your address on the map
            </h2>
            <p className="mt-3 text-ink-2">
              Search for an address or drop a pin. You will see the local
              government area it falls in, whether a sample service zone
              includes it, and the delivery options with a cost estimate where a
              pricing rule exists.
            </p>
            <form
              action="/delivery"
              className="mt-6 flex gap-2"
              role="search"
              aria-label="Find a delivery address"
            >
              <label className="sr-only" htmlFor="home-addr">
                Address or area in Lagos
              </label>
              <input
                id="home-addr"
                name="q"
                className="field"
                placeholder="Try Ikeja, Lekki or Ikorodu"
              />
              <button className="btn btn-ink">Search</button>
            </form>
            <ul className="mt-5 flex flex-wrap gap-2 list-none p-0">
              {SAMPLE_ZONES.map((z, i) => (
                <li
                  key={z.id}
                  className="inline-flex items-center gap-2 text-xs border border-line rounded-sm px-2 py-1 bg-paper"
                >
                  <span
                    aria-hidden="true"
                    className="w-3 h-3 rounded-[1px]"
                    style={{ background: chart.zones[i] }}
                  />
                  {z.short}: {z.lgaIds.length}{" "}
                  {z.lgaIds.length === 1 ? "LGA" : "LGAs"}
                </li>
              ))}
            </ul>
            <Notice
              tone="sample"
              className="mt-6"
              title="Sample zones, not verified coverage"
            >
              These zones are configuration used to build the interface. They
              will be replaced by Laddex&rsquo;s confirmed delivery areas.
            </Notice>
          </div>
          <div className="bg-paper-2 p-6 sm:p-10 grid place-items-center border-t lg:border-t-0 lg:border-l border-line">
            <ZoneSketch className="w-full h-auto" />
          </div>
        </div>
      </section>

      {/* How it works: factual statements about this site's behaviour */}
      <section className="wrap pt-20">
        <SectionHeading
          eyebrow="How pricing and delivery work"
          title="What this store will and will not tell you"
        />
        <dl className="mt-8 grid gap-px bg-line border border-line rounded-md overflow-hidden sm:grid-cols-2 lg:grid-cols-4">
          {[
            [
              "Unit price always shown",
              "Each pack lists its price per litre or kilo next to the pack price.",
            ],
            [
              "Wholesale tiers need approval",
              "Volume prices apply to approved business accounts. Others see them as indicative only.",
            ],
            [
              "Delivery is estimated, not promised",
              "A fee appears only where a pricing rule is configured. Otherwise you get a written quote.",
            ],
            [
              "Distance is straight-line",
              "Pickup distances are measured in a straight line and are not road travel distances.",
            ],
          ].map(([t, d]) => (
            <div key={t} className="bg-card p-5">
              <dt className="font-display text-lg">{t}</dt>
              <dd className="mt-2 text-sm text-ink-2">{d}</dd>
            </div>
          ))}
        </dl>
      </section>
    </>
  );
}
