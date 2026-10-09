import "@fontsource-variable/bricolage-grotesque/index.css";
import "@fontsource-variable/plus-jakarta-sans/index.css";
import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-serif/400-italic.css";
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
