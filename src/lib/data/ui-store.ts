"use client";

import { useSyncExternalStore } from "react";

/** Small non-persisted store for transient UI such as drawers. */
export function createUiStore<T>(initial: T) {
  let value = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => value,
    set(next: T) {
      value = next;
      listeners.forEach((l) => l());
    },
    subscribe(fn: () => void) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    use(): T {
      return useSyncExternalStore(
        (fn) => {
          listeners.add(fn);
          return () => listeners.delete(fn);
        },
        () => value,
        () => initial,
      );
    },
  };
}

export const cartDrawer = createUiStore(false);
export const navDrawer = createUiStore(false);
