"use client";

import { useRef, useState } from "react";

import { BUSINESS_CONTACT } from "@/content/business";
import { isNgPhone } from "@/features/cart/preview-order";

const KINDS = [
  ["distributor", "Distributor or reseller"],
  ["retailer", "Shop or market trader"],
  ["restaurant", "Restaurant or caterer"],
  ["processor", "Food processor or manufacturer"],
  ["other", "Other"],
] as const;

export function RegisterForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [v, setV] = useState({
    business: "",
    kind: "distributor",
    contact: "",
    phone: "",
    email: "",
    volume: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (v.business.trim().length < 2) er.business = "Enter the business name.";
    if (v.contact.trim().length < 2) er.contact = "Enter a contact person.";
    if (!isNgPhone(v.phone))
      er.phone = "Enter a Nigerian mobile number such as 0803 123 4567.";
    if (!/^\S+@\S+\.\S+$/.test(v.email))
      er.email = "Enter a valid email address.";
    setErrors(er);
    if (Object.keys(er).length) {
      requestAnimationFrame(() =>
        formRef.current?.querySelector<HTMLElement>("[aria-invalid='true']")?.focus(),
      );
      return;
    }
    const kind = KINDS.find(([id]) => id === v.kind)?.[1] ?? v.kind;
    const message = [
      "Hello Laddex Enterprise, I would like to register my business for wholesale enquiries.",
      `Business: ${v.business.trim()}`,
      `Business type: ${kind}`,
      `Contact person: ${v.contact.trim()}`,
      `Phone: ${v.phone.trim()}`,
      `Email: ${v.email.trim()}`,
      v.volume.trim() ? `Expected monthly order: ${v.volume.trim()}` : "",
    ].filter(Boolean).join("\n");
    window.location.assign(
      `${BUSINESS_CONTACT.whatsappHref}?text=${encodeURIComponent(message)}`,
    );
  };
  const input = (
    id: keyof typeof v,
    label: string,
    extra: React.InputHTMLAttributes<HTMLInputElement> = {},
  ) => (
    <div>
      <label className="label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className="field"
        value={v[id]}
        onChange={(e) => setV({ ...v, [id]: e.target.value })}
        aria-invalid={!!errors[id]}
        aria-describedby={errors[id] ? `${id}-e` : undefined}
        {...extra}
      />
      {errors[id] && (
        <p id={`${id}-e`} role="alert" className="text-sm text-danger mt-1">
          {errors[id]}
        </p>
      )}
    </div>
  );
  return (
    <form ref={formRef} onSubmit={submit} noValidate className="max-w-2xl space-y-5">
      <p className="text-sm text-ink-2">
        Continuing opens WhatsApp with your application details. Review and send the message there.
      </p>
      {input("business", "Business name", { autoComplete: "organization" })}
      <div>
        <label className="label" htmlFor="kind">
          Type of business
        </label>
        <select
          id="kind"
          className="field"
          value={v.kind}
          onChange={(e) => setV({ ...v, kind: e.target.value })}
        >
          {KINDS.map(([k, l]) => (
            <option key={k} value={k}>
              {l}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        {input("contact", "Contact person", { autoComplete: "name" })}
        {input("phone", "Mobile number", {
          autoComplete: "tel",
          inputMode: "tel",
          placeholder: "0803 123 4567",
        })}
      </div>
      {input("email", "Email", { type: "email", autoComplete: "email" })}
      <div>
        <label className="label" htmlFor="volume">
          What do you expect to buy each month? (optional)
        </label>
        <textarea
          id="volume"
          className="field min-h-24"
          value={v.volume}
          onChange={(e) => setV({ ...v, volume: e.target.value })}
          placeholder="e.g. forty 25 kg sacks of garri a month, twelve cartons of palm oil"
        />
        <p className="hint mt-1">
          Helps staff review the application. Not a commitment.
        </p>
      </div>
      <button className="btn btn-primary">Continue on WhatsApp</button>
    </form>
  );
}
