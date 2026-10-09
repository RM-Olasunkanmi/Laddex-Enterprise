import "@fontsource-variable/fraunces/opsz.css";
import "@fontsource-variable/hanken-grotesk/index.css";
import "@fontsource-variable/jetbrains-mono/index.css";
import "@/styles/laddex.css";

import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: {
    default: "Laddex Enterprise: palm oil and tapioca",
    template: "%s | Laddex Enterprise",
  },
  description:
    "Palm oil by the litre and tapioca by the kilo, in retail packs and wholesale volumes, with delivery checked against your address.",
};

export const viewport: Viewport = { themeColor: "#F6F2EA" };

export default function LaddexRootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en-NG">
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
