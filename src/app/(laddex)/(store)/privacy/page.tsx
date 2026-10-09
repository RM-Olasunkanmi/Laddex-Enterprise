import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy notice",
  description: "How Laddex Enterprise handles customer information.",
  robots: { index: false, follow: false },
};

export default function PrivacyPage() {
  return (
    <article className="wrap py-12 max-w-3xl">
      <p className="eyebrow mb-3">Legal</p>
      <h1 className="text-4xl md:text-5xl">Privacy notice</h1>
      <p className="mt-4 text-sm text-ink-3">
        [Owner/legal review required: add the effective date and business contact
        details before launch.]
      </p>

      <div className="mt-10 space-y-8 text-ink-2">
        <section>
          <h2 className="text-2xl text-ink">Information we collect</h2>
          <p className="mt-2">
            When you contact us, request a quote or place an order, we may
            collect your name, phone number, email address, delivery address,
            order details and business information. Payment providers process
            card or bank details; Laddex should not receive or store full card
            details.
          </p>
        </section>
        <section>
          <h2 className="text-2xl text-ink">How information is used</h2>
          <p className="mt-2">
            We use information to respond to enquiries, prepare quotes, fulfil
            orders, arrange delivery, keep business records and protect the
            service from misuse. We may use service providers only where needed
            for hosting, communication, payment or delivery.
          </p>
        </section>
        <section>
          <h2 className="text-2xl text-ink">Retention and your choices</h2>
          <p className="mt-2">
            Records should be kept only as long as needed for these purposes and
            any applicable Nigerian legal or accounting requirements. Use the
            contact page to ask about your information or request a correction.
            [Legal review required: confirm retention periods, lawful bases,
            processors and the process for data-rights requests.]
          </p>
        </section>
      </div>
    </article>
  );
}
