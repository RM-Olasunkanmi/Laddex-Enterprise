import Link from "next/link";

import type { Metadata } from "next";

import {
  SectionHeading,
  ButtonLink,
  SampleTag,
} from "@/components/lx/primitives";
import { TierExplorer } from "@/components/wholesale/tier-explorer";
import { getCatalogue } from "@/features/catalogue";
import { pricePerBaseUnit } from "@/features/catalogue/pricing";
import { packLabel } from "@/features/catalogue/selectors";
import { formatNaira } from "@/lib/formatters";

export const metadata: Metadata = {
  title: "Wholesale",
  description:
    "Volume pricing, minimum order quantities, quotes and repeat ordering for businesses.",
};

export default async function WholesalePage() {
  const products = await getCatalogue().listProducts();
  const hasPublishedTiers = products.some((product) =>
    product.variants.some((variant) => variant.wholesaleTiers.length > 0),
  );
  return (
    <>
      <section className="border-b border-line">
        <div className="wrap grid gap-10 pb-14 pt-10 lg:grid-cols-12 lg:gap-14 lg:pb-20 lg:pt-16">
          <div className="lg:col-span-7">
            <p className="eyebrow">Wholesale</p>
            <h1 className="display mt-4 text-[2.5rem] sm:text-6xl">
              Supply for shops, vendors and kitchens.
            </h1>
            <p className="lede mt-5 max-w-xl">
              Palm oil, tapioca flakes and garri by the carton, bag or sack.
              Tell us what you need and where it is going, and we reply with a
              written quote covering price, stock and delivery.
            </p>
            <div className="mt-8 flex flex-col gap-3 xs:flex-row">
              <ButtonLink href="/wholesale/quote" size="lg">
                Request a quote
              </ButtonLink>
              <ButtonLink href="/wholesale/register" variant="line" size="lg">
                Register a business
              </ButtonLink>
            </div>
          </div>
          <div className="lg:col-span-5">
            <div className="rounded-lg bg-rail p-6 text-rail-text sm:p-8">
              <p className="eyebrow !text-amber-bright">Who buys wholesale</p>
              <ul className="mt-4 divide-y divide-rail-line">
                {[
                  ["Shops and resellers", "Restock shelves by the pack size your customers buy."],
                  ["Food vendors and restaurants", "Regular supply of palm oil and garri for the kitchen."],
                  ["Caterers and event suppliers", "Large one-off orders for a date."],
                  ["Distributors", "Volume across several products and sizes."],
                ].map(([t, d]) => (
                  <li key={t} className="py-3.5">
                    <p className="font-semibold">{t}</p>
                    <p className="mt-0.5 text-sm text-rail-text/75">{d}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="wrap section" aria-labelledby="how">
        <SectionHeading
          eyebrow="How it works"
          title={<span id="how">From enquiry to delivery</span>}
        />
        <ol className="mt-10 grid gap-8 md:grid-cols-4 md:gap-6">
          {[
            ["Send your list", "Products, pack sizes, quantities, your business name and where the goods are going."],
            ["We check stock", "We confirm what is available now and whether delivery is possible to your location."],
            ["You get a written quote", "Price per pack, any volume price, delivery fee and timing, in writing."],
            ["Confirm and pay", "Agree the quote, pay by bank transfer, and we arrange dispatch or pickup."],
          ].map(([t, d], i) => (
            <li key={t} className="border-t-2 border-forest pt-4">
              <p className="num font-display text-sm text-forest">0{i + 1}</p>
              <p className="mt-2 font-display text-xl">{t}</p>
              <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-2">{d}</p>
            </li>
          ))}
        </ol>
        <p className="mt-10 max-w-2xl rounded-md bg-paper-2 px-5 py-4 text-sm text-ink-2">
          Volume prices, minimum quantities and delivery fees are agreed per
          order. We do not publish discounts or delivery times that we have not
          confirmed for you.
        </p>
      </section>

      {hasPublishedTiers && (
        <section className="wrap pb-16">
          <SectionHeading
            eyebrow="Volume pricing"
            title="See what a bigger order does to the price"
          />
          <div className="mt-8">
            <TierExplorer />
          </div>
        </section>
      )}

      {hasPublishedTiers && <section className="wrap pb-16">
        <SectionHeading
          eyebrow="Minimum orders"
          title="Minimum quantities and price breaks, by pack"
        >
          Quantities are counted in packs of the same size. Tier prices are
          illustrative and must be confirmed in a current quote. <SampleTag />
        </SectionHeading>
        <div className="mt-8 grid gap-6">
          {products.filter((p) => p.variants.some((v) => v.wholesaleTiers.length > 0)).map((p) => (
            <div
              key={p.id}
              className="panel overflow-x-auto"
              tabIndex={0}
              role="region"
              aria-label="Wholesale price breaks, scrollable"
            >
              <table className="dtable min-w-[40rem]">
                <caption className="text-left px-4 py-3 border-b border-line font-display text-lg">
                  {p.name}
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Pack</th>
                    <th scope="col" className="!text-right">
                      List
                    </th>
                    <th scope="col" className="!text-right">
                      Minimum
                    </th>
                    <th scope="col" className="!text-right">
                      Break 1
                    </th>
                    <th scope="col" className="!text-right">
                      Break 2
                    </th>
                    <th scope="col" className="!text-right">
                      Break 3
                    </th>
                    <th scope="col" className="!text-right">
                      Best per {p.baseUnit === "l" ? "L" : "kg"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[...p.variants]
                    .sort((a, b) => a.contentBase - b.contentBase)
                    .map((v) => {
                      const t = [...v.wholesaleTiers].sort(
                        (a, b) => a.minQty - b.minQty,
                      );
                      if (t.length === 0) return null;
                      return (
                        <tr key={v.id}>
                          <td className="font-display text-base whitespace-nowrap">
                            <Link
                              href={`/wholesale/quote?pack=${v.id}`}
                              className="hover:underline underline-offset-4"
                            >
                              {packLabel(v)}
                            </Link>
                          </td>
                          <td className="r">
                            {formatNaira(v.retailPriceKobo)}
                          </td>
                          <td className="r">{v.wholesaleMinQty}+</td>
                          {[0, 1, 2].map((i) => (
                            <td key={i} className="r">
                              {t[i] ? (
                                <>
                                  {formatNaira(t[i].unitPriceKobo)}
                                  <span className="block text-[0.6875rem] text-ink-3">
                                    {t[i].minQty}+ packs
                                  </span>
                                </>
                              ) : (
                                "—"
                              )}
                            </td>
                          ))}
                          <td className="r">
                            {formatNaira(
                              pricePerBaseUnit(v, t.at(-1)!.unitPriceKobo),
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </section>}

      <section className="border-t border-line bg-paper-2">
        <div className="wrap section grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <h2 className="text-3xl md:text-4xl">Ready with a list?</h2>
            <p className="mt-3 max-w-xl text-ink-2">
              Build your request pack by pack. It opens in WhatsApp for you to
              check and send.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/wholesale/quote" size="lg">
              Request a quote
            </ButtonLink>
            <ButtonLink href="/events" variant="line" size="lg">
              Event orders
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
