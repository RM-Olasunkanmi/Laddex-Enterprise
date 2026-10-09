import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of sale",
  description: "Basic terms for orders placed with Laddex Enterprise.",
  robots: { index: false, follow: false },
};

export default function TermsPage() {
  return (
    <article className="wrap py-12 max-w-3xl">
      <p className="eyebrow mb-3">Legal</p>
      <h1 className="text-4xl md:text-5xl">Terms of sale</h1>
      <p className="mt-4 text-sm text-ink-3">
        [Owner/legal review required: add the effective date, registered business
        details and governing-law wording before launch.]
      </p>

      <div className="mt-10 space-y-8 text-ink-2">
        <section>
          <h2 className="text-2xl text-ink">Orders and prices</h2>
          <p className="mt-2">
            An order or quote request is not accepted until Laddex confirms it.
            Product availability, pack details, price and delivery charge must be
            confirmed before payment. Obvious website errors may be corrected
            before an order is accepted.
          </p>
        </section>
        <section>
          <h2 className="text-2xl text-ink">Payment and fulfilment</h2>
          <p className="mt-2">
            Use only the payment method and account confirmed by Laddex. We will
            agree the delivery or collection arrangement for an accepted order.
            Any estimated time is an estimate unless Laddex confirms otherwise
            in writing.
          </p>
        </section>
        <section>
          <h2 className="text-2xl text-ink">Product information</h2>
          <p className="mt-2">
            Check the product label and confirmed specification before use,
            especially for ingredients, allergens, storage and shelf life.
            Website photographs and descriptions may not show minor packaging
            changes.
          </p>
        </section>
        <section>
          <h2 className="text-2xl text-ink">Your rights</h2>
          <p className="mt-2">
            Nothing here is intended to remove rights that cannot lawfully be
            excluded under applicable Nigerian consumer law. See the delivery
            and returns pages, and contact us promptly if there is a problem.
          </p>
        </section>
      </div>
    </article>
  );
}
