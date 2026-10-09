import type { Metadata } from "next";

import { RegisterForm } from "@/components/wholesale/register-form";

export const metadata: Metadata = {
  title: "Register a business",
  robots: { index: false, follow: false },
};

export default function RegisterPage() {
  return (
    <div className="wrap py-10">
      <p className="eyebrow mb-2">Wholesale</p>
      <h1 className="text-4xl md:text-5xl mb-3">Register a business</h1>
      <p className="text-ink-2 max-w-xl mb-8">
        Share your business and expected order volume with Laddex on WhatsApp.
        Catalogue tiers are illustrative until you receive a current quote.
      </p>
      <RegisterForm />
    </div>
  );
}
