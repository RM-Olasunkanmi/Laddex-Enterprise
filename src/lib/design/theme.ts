"use client";

import { useSyncExternalStore } from "react";

import type { Theme } from "./tokens";

import { KEY } from "./theme-script";
const listeners = new Set<() => void>();

const read = (): Theme => (typeof document !== "undefined" && document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light");

export function setTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
  try {
    window.localStorage.setItem(KEY, theme);
  } catch {
    /* storage blocked: the choice lasts for this page view only */
  }
  listeners.forEach((l) => l());
}

export const toggleTheme = () => setTheme(read() === "dark" ? "light" : "dark");

/** Current theme. Server render and first hydration report "light"; the real value follows immediately. */
export function useTheme(): Theme {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    read,
    () => "light",
  );
}
