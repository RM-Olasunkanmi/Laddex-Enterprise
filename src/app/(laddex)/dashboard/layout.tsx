import config from "@payload-config";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getPayload } from "payload";

import type { Metadata } from "next";
import type { ReactNode } from "react";

import { DashboardShell } from "@/components/analytics/dashboard-shell";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Spatial intelligence",
  robots: { index: false, follow: false },
};

/** Staff dashboard: its own dense shell, separate from the storefront header and footer. */
export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const payload = await getPayload({ config });
  const { user } = await payload.auth({ headers: await headers() });
  const roles = user && "roles" in user && Array.isArray(user.roles) ? user.roles : [];
  if (!roles.some((role) => role === "admin" || role === "analyst")) {
    redirect("/admin/login?redirect=/dashboard");
  }

  return <DashboardShell>{children}</DashboardShell>;
}
