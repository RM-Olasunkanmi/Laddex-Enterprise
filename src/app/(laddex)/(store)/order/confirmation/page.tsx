import type { Metadata } from "next";

import { ConfirmationPreview } from "@/components/checkout/confirmation";

export const metadata: Metadata = { title: "Order confirmation preview" };

export default function ConfirmationPage() {
  return (
    <div className="wrap py-10">
      <ConfirmationPreview />
    </div>
  );
}
