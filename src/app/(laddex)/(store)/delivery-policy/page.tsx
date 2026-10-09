import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Delivery policy",
  robots: { index: false, follow: false },
  description: "How delivery and collection are arranged for Laddex orders.",
};

export default function DeliveryPolicyPage() {
  return (
    <article className="wrap py-12 max-w-3xl">
      <p className="eyebrow mb-3">Legal</p>
      <h1 className="text-4xl md:text-5xl">Delivery policy</h1>
      <p className="mt-4 text-sm text-ink-3">
        [Owner review required: confirm service areas, dispatch days, collection
        address and approved delivery partners before launch.]
      </p>

      <div className="mt-10 space-y-8 text-ink-2">
        <section>
          <h2 className="text-2xl text-ink">Confirming delivery</h2>
          <p className="mt-2">
            Delivery availability and charges depend on the destination, order
            size and weight. Rates shown before confirmation may be estimates.
            Laddex will confirm the charge and delivery arrangement before an
            order is accepted or ask for your agreement if it changes.
          </p>
        </section>
        <section>
          <h2 className="text-2xl text-ink">Receiving an order</h2>
          <p className="mt-2">
            Provide an accurate address and a reachable Nigerian phone number.
            Someone should be available to receive and check the delivery. Extra
            cost caused by an incorrect address or failed delivery will be
            discussed with you before another attempt.
          </p>
        </section>
        <section>
          <h2 className="text-2xl text-ink">Delays or damage</h2>
          <p className="mt-2">
            Delivery times are not guaranteed unless confirmed in writing.
            Contact Laddex promptly if an order is late, incomplete or damaged,
            and keep the packaging and photographs so the issue can be checked.
          </p>
        </section>
      </div>
    </article>
  );
}
