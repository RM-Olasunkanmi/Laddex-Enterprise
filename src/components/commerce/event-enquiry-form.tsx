"use client";

import { useRef, useState } from "react";

import { useCatalogue } from "@/components/lx/catalogue-provider";
import { BUSINESS, BUSINESS_CONTACT } from "@/content/business";
import { isNgPhone } from "@/features/cart/preview-order";
import { packLabel, sortedVariants } from "@/features/catalogue/selectors";

const EVENT_TYPES = [
  "Wedding",
  "Naming ceremony",
  "Burial or remembrance",
  "Birthday or anniversary",
  "Company or staff gifts",
  "Religious or community event",
  "Something else",
] as const;

const todayIso = () => new Date().toISOString().slice(0, 10);

/**
 * Event and souvenir enquiry. Like the other enquiry forms, it does not store anything: it
 * opens WhatsApp with a complete, readable message for the customer to send.
 */
export function EventEnquiryForm() {
  const { products } = useCatalogue();
  const formRef = useRef<HTMLFormElement>(null);
  const [chosen, setChosen] = useState<Record<string, string>>({});
  const [f, setF] = useState({
    units: "",
    date: "",
    type: EVENT_TYPES[0] as string,
    packaging: "",
    location: "",
    pickup: false,
    name: "",
    phone: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) =>
    setF((x) => ({ ...x, [k]: v }));

  const toggle = (productId: string, defaultVariant: string) =>
    setChosen((c) => {
      const next = { ...c };
      if (next[productId]) delete next[productId];
      else next[productId] = defaultVariant;
      return next;
    });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (Object.keys(chosen).length === 0) er.products = "Choose at least one product.";
    if (!(Number(f.units) > 0)) er.units = "Enter roughly how many packs you need.";
    if (!f.date) er.date = "Choose the event date.";
    if (!f.pickup && f.location.trim().length < 3)
      er.location = "Tell us the state and area, or choose pickup in Epe.";
    if (f.name.trim().length < 2) er.name = "Enter your name.";
    if (!isNgPhone(f.phone)) er.phone = "Enter a Nigerian mobile number, for example 0803 123 4567.";
    setErrors(er);
    if (Object.keys(er).length) {
      requestAnimationFrame(() =>
        formRef.current?.querySelector<HTMLElement>("[aria-invalid='true']")?.focus(),
      );
      return;
    }
    const lines = products
      .filter((p) => chosen[p.id])
      .map((p) => {
        const v = p.variants.find((x) => x.id === chosen[p.id]);
        return `- ${p.name}${v ? ` ${packLabel(v)}` : ""}`;
      });
    const message = [
      `Hello ${BUSINESS.name}, I would like a quote for an event.`,
      `Event: ${f.type}`,
      `Date: ${new Date(`${f.date}T12:00:00`).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}`,
      `About ${Number(f.units)} packs of:`,
      ...lines,
      f.packaging.trim() ? `Packaging: ${f.packaging.trim()}` : "",
      f.pickup ? "I will pick up in Epe." : `Deliver to: ${f.location.trim()}`,
      `Name: ${f.name.trim()}`,
      `Phone: ${f.phone.trim()}`,
    ]
      .filter(Boolean)
      .join("\n");
    window.location.assign(
      `${BUSINESS_CONTACT.whatsappHref}?text=${encodeURIComponent(message)}`,
    );
  };

  const err = (id: string) =>
    errors[id] ? (
      <p id={`ev-${id}-err`} className="mt-1 text-sm text-danger">
        {errors[id]}
      </p>
    ) : null;
  const aria = (id: string) => ({
    id: `ev-${id}`,
    "aria-invalid": !!errors[id] || undefined,
    "aria-describedby": errors[id] ? `ev-${id}-err` : undefined,
  });

  return (
    <form
      ref={formRef}
      onSubmit={submit}
      noValidate
      className="space-y-7 rounded-lg border border-line bg-card p-5 sm:p-8"
    >
      <fieldset aria-describedby={errors.products ? "ev-products-err" : undefined}>
        <legend className="label">Which products?</legend>
        <div className="mt-1 grid gap-2 sm:grid-cols-2">
          {products.map((p, i) => {
            const variants = sortedVariants(p);
            const on = !!chosen[p.id];
            return (
              <div
                key={p.id}
                className={`rounded-md border p-3 transition-colors ${on ? "border-forest bg-forest-tint" : "border-line-strong"}`}
              >
                <label className="flex min-h-9 cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-[var(--color-forest)]"
                    checked={on}
                    onChange={() => toggle(p.id, variants[0]?.id ?? "")}
                    aria-invalid={(i === 0 && !!errors.products) || undefined}
                  />
                  <span className="font-medium">{p.name}</span>
                </label>
                {on && (
                  <label className="mt-2 block text-sm">
                    <span className="sr-only">{p.name} pack size</span>
                    <select
                      className="field !min-h-10 text-sm"
                      value={chosen[p.id]}
                      onChange={(e) => setChosen((c) => ({ ...c, [p.id]: e.target.value }))}
                    >
                      {variants.map((v) => (
                        <option key={v.id} value={v.id}>
                          {packLabel(v)} pack
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </div>
            );
          })}
        </div>
        {err("products")}
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <label htmlFor="ev-units" className="label">
            Number of packs
          </label>
          <input
            {...aria("units")}
            className="field"
            inputMode="numeric"
            placeholder="e.g. 200"
            value={f.units}
            onChange={(e) => set("units", e.target.value.replace(/\D/g, ""))}
          />
          {err("units")}
        </div>
        <div>
          <label htmlFor="ev-date" className="label">
            Event date
          </label>
          <input
            {...aria("date")}
            type="date"
            min={todayIso()}
            className="field"
            value={f.date}
            onChange={(e) => set("date", e.target.value)}
          />
          {err("date")}
        </div>
        <div>
          <label htmlFor="ev-type" className="label">
            Type of event
          </label>
          <select
            id="ev-type"
            className="field"
            value={f.type}
            onChange={(e) => set("type", e.target.value)}
          >
            {EVENT_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="ev-packaging" className="label">
          Packaging or labelling you would like{" "}
          <span className="font-normal text-ink-3">(optional)</span>
        </label>
        <textarea
          id="ev-packaging"
          className="field min-h-24"
          placeholder="e.g. names and date on a sticker, packed in gift bags of three"
          value={f.packaging}
          onChange={(e) => set("packaging", e.target.value)}
        />
        <p className="hint mt-1">
          We tell you what we can do in your quote. Custom packaging is not
          guaranteed.
        </p>
      </div>

      <div>
        <label htmlFor="ev-location" className="label">
          Where should it go?
        </label>
        <input
          {...aria("location")}
          className="field"
          placeholder="State and area, e.g. Ikeja, Lagos"
          autoComplete="address-level2"
          value={f.location}
          disabled={f.pickup}
          onChange={(e) => set("location", e.target.value)}
        />
        {err("location")}
        <label className="mt-2 flex min-h-11 cursor-pointer items-center gap-3 text-sm">
          <input
            type="checkbox"
            className="h-4 w-4 accent-[var(--color-forest)]"
            checked={f.pickup}
            onChange={(e) => set("pickup", e.target.checked)}
          />
          I will pick up from the Epe store
        </label>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="ev-name" className="label">
            Your name
          </label>
          <input
            {...aria("name")}
            className="field"
            autoComplete="name"
            value={f.name}
            onChange={(e) => set("name", e.target.value)}
          />
          {err("name")}
        </div>
        <div>
          <label htmlFor="ev-phone" className="label">
            Mobile number
          </label>
          <input
            {...aria("phone")}
            className="field"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="0803 123 4567"
            value={f.phone}
            onChange={(e) => set("phone", e.target.value)}
          />
          {err("phone")}
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-ink-2">
          This opens WhatsApp with your details. Send the message and we reply
          with a quote.
        </p>
        <button type="submit" className="btn btn-primary btn-lg shrink-0">
          Continue on WhatsApp
        </button>
      </div>
    </form>
  );
}
