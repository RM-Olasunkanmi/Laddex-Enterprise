import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Returns and refunds",
  robots: { index: false, follow: false },
  description: "How to report a problem with a Laddex order.",
};

export default function ReturnsRefundsPage() {
  return (
    <article className="wrap py-12 max-w-3xl">
      <p className="eyebrow mb-3">Legal</p>
      <h1 className="text-4xl md:text-5xl">Returns and refunds</h1>
      <p className="mt-4 text-sm text-ink-3">
        [Owner/legal review required: confirm reporting periods, return address,
        refund method and any food-safety restrictions before launch.]
      </p>

      <div className="mt-10 space-y-8 text-ink-2">
        <section>
          <h2 className="text-2xl text-ink">Report a problem</h2>
          <p className="mt-2">
            Check your order when it arrives. If an item is wrong, missing,
            damaged or appears unsafe, stop using it and contact Laddex promptly
            through the contact page. Include the order reference, a description
            and clear photographs where possible.
          </p>
        </section>
        <section>
          <h2 className="text-2xl text-ink">Assessment</h2>
          <p className="mt-2">
            Keep the product and packaging until Laddex reviews the issue. For
            food-safety reasons, opened food may not be suitable for resale, but
            that does not remove any rights you have for faulty, unsafe or
            incorrectly supplied goods.
          </p>
        </section>
        <section>
          <h2 className="text-2xl text-ink">Outcome</h2>
          <p className="mt-2">
            After checking the issue, Laddex will explain the available remedy,
            which may be replacement, correction, credit or refund as applicable.
            No fixed outcome or processing time is promised on this draft page.
          </p>
        </section>
      </div>
    </article>
  );
}
