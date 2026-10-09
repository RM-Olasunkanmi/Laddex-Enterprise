"use client";

import { useState } from "react";

import { Notice } from "@/components/lx/primitives";
import { ENQUIRY_TOPICS, type EnquiryTopic } from "@/content/business";

interface Values {
  name: string;
  contact: string;
  topic: EnquiryTopic;
  state: string;
  message: string;
}
const EMPTY: Values = { name: "", contact: "", topic: "order", state: "", message: "" };

/**
 * Frontend-only enquiry form. Nothing is transmitted: the submission is kept in this browser's
 * memory to show the confirmation state. A backend adapter replaces the submit handler later
 * (docs/BACKEND_INTEGRATION.md).
 */
export function EnquiryForm({ defaultTopic = "order" }: { defaultTopic?: EnquiryTopic }) {
  const [v, setV] = useState<Values>({ ...EMPTY, topic: defaultTopic });
  const [errors, setErrors] = useState<Partial<Record<keyof Values, string>>>({});
  const [done, setDone] = useState(false);
  const set = <K extends keyof Values>(k: K, val: Values[K]) => setV((x) => ({ ...x, [k]: val }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (!v.name.trim()) next.name = "Enter your name";
    if (!v.contact.trim()) next.contact = "Enter a phone number or email so we can reply";
    else if (!/^\+?[\d\s()-]{7,}$/.test(v.contact.trim()) && !/^\S+@\S+\.\S+$/.test(v.contact.trim()))
      next.contact = "Enter a valid phone number or email address";
    if (v.message.trim().length < 10) next.message = "Tell us a little more (at least 10 characters)";
    setErrors(next);
    if (Object.keys(next).length === 0) setDone(true);
  }

  if (done)
    return (
      <div role="status" className="panel p-6">
        <h2 className="text-2xl">Enquiry recorded in this preview</h2>
        <p className="mt-2 text-ink-2">
          Thank you, {v.name.trim()}. Nothing was sent: this is a design preview with no backend connected. Once
          connected, this form creates an enquiry record for staff and the reply goes to {v.contact.trim()}.
        </p>
        <button className="btn btn-line mt-5 min-h-11" onClick={() => { setV({ ...EMPTY, topic: defaultTopic }); setDone(false); }}>
          Send another
        </button>
      </div>
    );

  const field = (id: keyof Values, label: string, input: React.ReactNode) => (
    <div>
      <label htmlFor={`enq-${id}`} className="block text-sm font-medium mb-1.5">{label}</label>
      {input}
      {errors[id] && <p id={`enq-${id}-err`} className="mt-1 text-sm text-danger">{errors[id]}</p>}
    </div>
  );
  const aria = (id: keyof Values) => ({ id: `enq-${id}`, "aria-invalid": !!errors[id], "aria-describedby": errors[id] ? `enq-${id}-err` : undefined });

  return (
    <form onSubmit={submit} noValidate className="panel p-5 sm:p-7 grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {field("name", "Your name", <input {...aria("name")} className="field" autoComplete="name" value={v.name} onChange={(e) => set("name", e.target.value)} />)}
        {field("contact", "Phone or email", <input {...aria("contact")} className="field" autoComplete="email" value={v.contact} onChange={(e) => set("contact", e.target.value)} />)}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {field("topic", "What is this about?", (
          <select {...aria("topic")} className="field" value={v.topic} onChange={(e) => set("topic", e.target.value as EnquiryTopic)}>
            {ENQUIRY_TOPICS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        ))}
        {field("state", "State you are in (optional)", <input {...aria("state")} className="field" autoComplete="address-level1" value={v.state} onChange={(e) => set("state", e.target.value)} />)}
      </div>
      {field("message", "Your message", <textarea {...aria("message")} className="field min-h-32" value={v.message} onChange={(e) => set("message", e.target.value)} />)}
      <Notice tone="sample">Preview only. This form does not send anything yet.</Notice>
      <div><button type="submit" className="btn btn-primary min-h-11">Send enquiry</button></div>
    </form>
  );
}
