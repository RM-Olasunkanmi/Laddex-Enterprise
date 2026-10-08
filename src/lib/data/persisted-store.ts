"use client";

import { useSyncExternalStore } from "react";

/**
 * Minimal external store backed by localStorage. One mechanism for every piece of client
 * commerce state (cart, customer, delivery location), so there is no second state library.
 * Reads are wrapped in try/catch because storage can be blocked or empty (private windows).
 */
export interface PersistedStore<T> {
  get(): T;
  set(next: T | ((prev: T) => T)): void;
  reset(): void;
  subscribe(fn: () => void): () => void;
  use(): T;
  /** True once the browser has read persisted state. Use to avoid flashing server defaults. */
  useHydrated(): boolean;
}

export function createPersistedStore<T>(key: string, initial: T, version = 1): PersistedStore<T> {
  let current: T = initial;
  let raw: string | null = null;
  let hydrated = false;
  const listeners = new Set<() => void>();
  const storageKey = `laddex:${key}:v${version}`;

  const read = () => {
    try {
      const s = window.localStorage.getItem(storageKey);
      if (s === raw && hydrated) return;
      raw = s;
      current = s ? (JSON.parse(s) as T) : initial;
    } catch {
      current = initial;
    }
    hydrated = true;
  };

  const emit = () => listeners.forEach((l) => l());

  if (typeof window !== "undefined") {
    window.addEventListener("storage", (e) => {
      if (e.key === storageKey) {
        read();
        emit();
      }
    });
  }

  const store: PersistedStore<T> = {
    get() {
      if (typeof window !== "undefined" && !hydrated) read();
      return current;
    },
    set(next) {
      const value = typeof next === "function" ? (next as (p: T) => T)(store.get()) : next;
      current = value;
      try {
        raw = JSON.stringify(value);
        window.localStorage.setItem(storageKey, raw);
      } catch {
        /* storage unavailable: state stays in memory for this tab */
      }
      emit();
    },
    reset() {
      store.set(initial);
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    use() {
      return useSyncExternalStore(store.subscribe, store.get, () => initial);
    },
    useHydrated() {
      return useSyncExternalStore(
        store.subscribe,
        () => {
          if (!hydrated) store.get();
          return hydrated;
        },
        () => false,
      );
    },
  };
  return store;
}
