import { EnquiryForm } from "@/components/commerce/enquiry-form";
import { SectionHeading } from "@/components/lx/primitives";
import { PickupBooking } from "@/components/store/pickup-booking";
import {
  CallButtons,
  CopyAddressButton,
  DirectionButtons,
  StoreMap,
} from "@/components/store/store-map";
import {
  BUSINESS,
  type EnquiryTopic,
  ENQUIRY_TOPICS,
} from "@/content/business";

export const metadata = { title: "Contact and enquiries" };

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string }>;
}) {
  const { topic } = await searchParams;
  const defaultTopic = (ENQUIRY_TOPICS.find((t) => t.id === topic)?.id ??
    "order") as EnquiryTopic;
  const details = [
    ["Phone", BUSINESS.phone],
    ["WhatsApp", BUSINESS.whatsapp],
    ["Email", BUSINESS.email],
    ["Address", BUSINESS.address],
    ["Hours", BUSINESS.hours],
  ].filter(([, v]) => v);
  return (
    <>
    <div className="wrap pt-12 grid gap-10 lg:grid-cols-[1fr_1.2fr]">
      <div>
        <SectionHeading as="h1" eyebrow="Contact" title="Ask us anything">
          Questions about a product, a bulk order for resale, souvenirs for an
          event, or delivery to your state.
        </SectionHeading>
        {details.length > 0 ? (
          <dl className="mt-8 space-y-3">
            {details.map(([k, v]) => (
              <div key={k}>
                <dt className="eyebrow">{k}</dt>
                <dd className="mt-0.5">{v}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="mt-8 hint">
            Direct contact details will be shown here once Laddex confirms them.
            Until then, use the form.
          </p>
        )}
      </div>
      <EnquiryForm defaultTopic={defaultTopic} />
    </div>
    {BUSINESS.address && (
      <section aria-labelledby="visit" className="wrap pb-16">
        <div className="panel grid lg:grid-cols-[22rem_1fr] overflow-hidden">
          <div className="p-6 sm:p-8">
            <p className="eyebrow">Visit the store</p>
            <h2 id="visit" className="text-3xl mt-2">
              Find us in Epe
            </h2>
            <p className="mt-3 text-ink-2">{BUSINESS.address}</p>
            <p className="hint mt-1">{BUSINESS.hours}</p>
            <div className="mt-3">
              <CopyAddressButton />
            </div>
            <DirectionButtons />
            <div className="mt-4 flex flex-wrap gap-2">
              <CallButtons />
            </div>
            <PickupBooking />
          </div>
          <div className="p-6 sm:p-8 border-t lg:border-t-0 lg:border-l border-line">
            <StoreMap height="h-[24rem] lg:h-full lg:min-h-[26rem]" />
            <p className="hint mt-2">
              Approximate Epe-area pin only. Confirm the exact location with
              Laddex before travelling; do not use it as verified doorstep
              directions. Map data &copy; OpenStreetMap contributors.
            </p>
          </div>
        </div>
      </section>
    )}
    </>
  );
}
