import Image from "next/image";

import { EventEnquiryForm } from "@/components/commerce/event-enquiry-form";
import { ButtonLink } from "@/components/lx/primitives";
import { BUSINESS, BUSINESS_CONTACT } from "@/content/business";

export const metadata = {
  title: "Events and souvenirs",
  description:
    "Garri, tapioca flakes and palm oil in small packs, ordered in numbers for weddings, ceremonies and company gifts.",
};

const PHOTOS = [
  { src: "/products/garri-igbo.webp", alt: "Laddex Garri Igbo 1 kg pouch", width: 166, height: 235 },
  { src: "/products/tapioca-flakes.webp", alt: "Laddex Tapioca Flakes pouches", width: 250, height: 330 },
  { src: "/products/garri-ijebu.webp", alt: "Laddex Ijebu Garri 1 kg pouches", width: 160, height: 240 },
] as const;

export default function EventsPage() {
  return (
    <>
      <section className="border-b border-line bg-amber-tint/60">
        <div className="wrap grid gap-10 pb-14 pt-10 lg:grid-cols-12 lg:items-center lg:gap-14 lg:pb-20 lg:pt-16">
          <div className="lg:col-span-7">
            <p className="eyebrow !text-amber">Events and souvenirs</p>
            <h1 className="display mt-4 text-[2.5rem] sm:text-6xl">
              Useful gifts your guests will take home.
            </h1>
            <p className="lede mt-5 max-w-xl">
              Garri, tapioca flakes and palm oil in household sizes, ordered in
              numbers for weddings, naming ceremonies, burials, birthdays and
              company gifts. Tell us the date, the number of packs and how you
              want them, and we quote for your event.
            </p>
            <div className="mt-8 flex flex-col gap-3 xs:flex-row">
              <ButtonLink href="#enquire" size="lg">
                Plan an event order
              </ButtonLink>
              <a
                href={BUSINESS_CONTACT.whatsappHref}
                className="btn btn-line btn-lg"
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp {BUSINESS.whatsapp}
              </a>
            </div>
          </div>
          <div className="flex items-end justify-center gap-3 sm:gap-5 lg:col-span-5">
            {PHOTOS.map((p, i) => (
              <div
                key={p.src}
                className={`w-[31%] max-w-44 overflow-hidden rounded-md border-4 border-card bg-card shadow-raised ${i === 1 ? "z-10 -mb-3" : i === 0 ? "-rotate-2" : "rotate-2"}`}
              >
                <Image
                  src={p.src}
                  alt={p.alt}
                  width={p.width}
                  height={p.height}
                  priority
                  sizes="176px"
                  className="aspect-[3/4] w-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="wrap section" aria-labelledby="how">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-4">
            <p className="eyebrow">How event orders work</p>
            <h2 id="how" className="mt-3 text-[2rem] leading-[1.08] md:text-[2.5rem]">
              Three steps to a quote
            </h2>
            <ol className="mt-8 space-y-6">
              {[
                ["Choose the products", "The smaller packs (1 L palm oil, 1 kg garri, small tapioca pouches) are the usual choice for guests."],
                ["Send the numbers and date", "How many packs, when you need them, and where they are going."],
                ["Get a written quote", "Price, availability, packaging and delivery confirmed before you pay."],
              ].map(([t, d], i) => (
                <li key={t} className="grid grid-cols-[2rem_1fr] gap-3">
                  <span className="num font-display text-lg text-forest">0{i + 1}</span>
                  <span>
                    <span className="block font-semibold">{t}</span>
                    <span className="mt-1 block text-[0.9375rem] leading-relaxed text-ink-2">{d}</span>
                  </span>
                </li>
              ))}
            </ol>
            <p className="mt-8 rounded-md bg-paper-2 px-4 py-3 text-sm text-ink-2">
              Custom labels, gift packaging and lead times depend on the order.
              We confirm what is possible in your quote rather than promise it
              here.
            </p>
          </div>
          <div id="enquire" className="scroll-mt-24 lg:col-span-8">
            <h2 className="sr-only">Event enquiry</h2>
            <EventEnquiryForm />
          </div>
        </div>
      </section>
    </>
  );
}
