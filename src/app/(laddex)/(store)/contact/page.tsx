import { EnquiryForm } from "@/components/commerce/enquiry-form";
import { SectionHeading } from "@/components/lx/primitives";
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
  );
}
