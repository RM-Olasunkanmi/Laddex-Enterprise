import "@fontsource-variable/fraunces/opsz.css";
import "@fontsource-variable/hanken-grotesk/index.css";
import "@fontsource-variable/jetbrains-mono/index.css";
import "@/styles/laddex.css";

import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { themeScript } from "@/lib/design/theme-script";

export const metadata: Metadata = {
  title: {
    default: "Laddex Enterprise: palm oil, tapioca flakes and garri",
    template: "%s | Laddex Enterprise",
  },
  description:
    "Palm oil, tapioca flakes, Garri Igbo and Ijebu Garri for homes, shops and events. Delivery across Nigeria.",
  icons: { icon: "/brand/laddex-logo-64.png", apple: "/brand/laddex-logo.png" },
};

export const viewport: Viewport = { themeColor: "#F8F6F0" };

export default function LaddexRootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en-NG" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
