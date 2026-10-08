import type { Metadata } from "next";
import type { ReactNode } from "react";

import { DashboardShell } from "@/components/analytics/dashboard-shell";

export const metadata: Metadata = { title: "Spatial intelligence", robots: { index: false, follow: false } };

/** Staff dashboard: its own dense shell, separate from the storefront header and footer. */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
