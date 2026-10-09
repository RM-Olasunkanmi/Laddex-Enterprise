"use client";

import { toggleTheme, useTheme } from "@/lib/design/theme";

/** Sun/moon switch. Announces the action it will perform, not the current state. */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const theme = useTheme();
  const toDark = theme === "light";
  return (
    <button type="button" onClick={toggleTheme} className={`btn btn-line btn-sm min-h-11 w-11 px-0 ${className}`} aria-label={toDark ? "Switch to dark theme" : "Switch to light theme"} title={toDark ? "Dark theme" : "Light theme"}>
      {toDark ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" strokeLinecap="round" />
        </svg>
      )}
    </button>
  );
}
