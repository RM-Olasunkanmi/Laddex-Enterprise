import type { ReactNode } from "react";

/** A template (unlike a layout) remounts on every navigation, so each page fades in. */
export default function Template({ children }: { children: ReactNode }) {
  return <div className="page-in">{children}</div>;
}
