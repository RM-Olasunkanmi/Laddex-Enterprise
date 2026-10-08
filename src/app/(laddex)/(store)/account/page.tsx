import type { Metadata } from "next";

import { AccountView } from "@/components/wholesale/account-view";

export const metadata: Metadata = { title: "Account" };

export default function AccountPage() {
  return (
    <div className="wrap py-10">
      <p className="eyebrow mb-2">Account</p>
      <h1 className="text-4xl md:text-5xl mb-8">Your account</h1>
      <AccountView />
    </div>
  );
}
