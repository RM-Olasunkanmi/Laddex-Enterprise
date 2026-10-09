import Link from "next/link";

import type { Metadata } from "next";

import {
  Notice,
  SectionHeading,
  ButtonLink,
  SampleTag,
} from "@/components/lx/primitives";
import { WholesaleStatusBanner } from "@/components/wholesale/status";
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
  return (
    <>
      <section className="border-b border-line bg-paper-2/60">
        <div className="wrap py-12 lg:py-16 grid gap-8 lg:grid-cols-[1.3fr_1fr] items-end">
          <div>
            <p className="eyebrow mb-4">Wholesale, resale and events</p>
            <h1 className="text-5xl lg:text-6xl">
              Buy in volume, priced by the pack.
            </h1>
            <p className="mt-5 text-lg text-ink-2 max-w-xl">
              For shops, resellers, caterers and event suppliers. Price breaks
              are set for each pack size, with a minimum order for each.
              Register a business to buy at your tier, ask for a quote for an
              unusual volume, and reorder from past purchases. Buying souvenirs
              for an event? See the events page.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <ButtonLink href="/wholesale/register">
                Register a business
              </ButtonLink>
              <ButtonLink href="/wholesale/quote" variant="ink">
                Request a quote
              </ButtonLink>
              <ButtonLink href="/account" variant="quiet">
                Repeat an order &rarr;
              </ButtonLink>
            </div>
          </div>
          <WholesaleStatusBanner />
        </div>
      </section>

      <section className="wrap pt-16">
        <SectionHeading
          eyebrow="Volume pricing"
          title="See what a bigger order does to the price"
        />
        <div className="mt-8">
          <TierExplorer />
        </div>
      </section>

      <section className="wrap pt-20">
        <SectionHeading
          eyebrow="Minimum orders"
          title="Minimum quantities and price breaks, by pack"
        >
          Quantities are counted in packs of the same size. Tier prices are
          illustrative and apply to approved accounts. <SampleTag />
        </SectionHeading>
        <div className="mt-8 grid gap-6">
          {products.map((p) => (
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
      </section>

      <section className="wrap pt-20">
        <SectionHeading
          eyebrow="How a business account works"
          title="From registration to repeat orders"
        />
        <ol className="mt-8 grid gap-px bg-line border border-line rounded-md overflow-hidden md:grid-cols-4 list-none p-0">
          {[
            [
              "1",
              "Register",
              "Tell us about the business and what you buy. Takes a few minutes.",
            ],
            [
              "2",
              "Review",
              "Laddex staff review the application. No review time is promised here.",
            ],
            [
              "3",
              "Buy at your tier",
              "Once approved, tier prices apply automatically in the cart.",
            ],
            [
              "4",
              "Repeat",
              "Reorder any past order in one click from your account.",
            ],
          ].map(([n, t, d]) => (
            <li key={n} className="bg-card p-5">
              <p className="mono text-ember">{n}</p>
              <p className="font-display text-xl mt-1">{t}</p>
              <p className="mt-2 text-sm text-ink-2">{d}</p>
            </li>
          ))}
        </ol>
        <Notice
          tone="sample"
          className="mt-6"
          title="Approval is a staff decision"
        >
          The approval states in this prototype are sample personas. Real
          approval will be recorded by Laddex staff in the admin system.
        </Notice>
      </section>
    </>
  );
}
