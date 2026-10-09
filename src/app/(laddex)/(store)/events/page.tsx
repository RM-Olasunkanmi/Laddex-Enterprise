import { ProductCard } from "@/components/commerce/product-card";
import { EnquiryForm } from "@/components/commerce/enquiry-form";
import { ButtonLink, Notice, SectionHeading } from "@/components/lx/primitives";
import { getCatalogue } from "@/features/catalogue";
import { fromPrice } from "@/features/catalogue/pricing";
import { formatNaira } from "@/lib/formatters";

export const metadata = { title: "Souvenirs and events" };

export default async function EventsPage() {
  const products = await getCatalogue().listProducts();
  return (
    <>
      <section className="wrap pt-12">
        <SectionHeading as="h1" eyebrow="Souvenirs, gifts and events" title="Food staples that make useful gifts">
          Palm oil, tapioca flakes and garri in household sizes can be ordered in numbers for weddings, naming
          ceremonies, funerals, corporate gifts and festive hampers.
        </SectionHeading>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {[
            ["Pick the pack", "The smallest sizes (1 L palm oil, 1 kg garri, 500 g tapioca) are the usual choices for souvenirs."],
            ["Tell us the numbers", "Send the quantity, the date you need it by and the state it is going to."],
            ["Get a written quote", "Price, availability and delivery for your event are confirmed in writing before you pay."],
          ].map(([t, d], i) => (
            <div key={t} className="panel p-5">
              <p className="mono text-ember">0{i + 1}</p>
              <h3 className="text-xl mt-1">{t}</h3>
              <p className="mt-2 text-sm text-ink-2">{d}</p>
            </div>
          ))}
        </div>
        <Notice tone="sample" className="mt-6" title="What is not yet confirmed">
          Custom labels, gift packaging and event lead times have not been confirmed by Laddex, so this page does not
          promise them. Ask in the enquiry and they will be answered before you commit.
        </Notice>
      </section>

      <section className="wrap pt-14">
        <SectionHeading title="Popular gift sizes">
          Starting from {formatNaira(Math.min(...products.map(fromPrice)))} a pack at sample prices. Quantity breaks
          for large orders are quoted per event.
        </SectionHeading>
        <div className="mt-8 grid gap-3 sm:gap-5 grid-cols-2 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      <section className="wrap pt-14 grid gap-8 lg:grid-cols-[1fr_1.2fr]" id="enquire">
        <div>
          <SectionHeading title="Planning an event?">Send the details and we will come back with a quote.</SectionHeading>
          <div className="mt-6"><ButtonLink href="/wholesale/quote" variant="line">Build a quote instead</ButtonLink></div>
        </div>
        <EnquiryForm defaultTopic="events" />
      </section>
    </>
  );
}
