import type { Metadata } from "next";

import { RegisterForm } from "@/components/wholesale/register-form";

export const metadata: Metadata = { title: "Register a business" };

export default function RegisterPage() {
  return (
    <div className="wrap py-10">
      <p className="eyebrow mb-2">Wholesale</p>
      <h1 className="text-4xl md:text-5xl mb-3">Register a business</h1>
      <p className="text-ink-2 max-w-xl mb-8">Approved accounts are charged volume tiers automatically and can reorder from past orders.</p>
      <RegisterForm />
    </div>
  );
}
