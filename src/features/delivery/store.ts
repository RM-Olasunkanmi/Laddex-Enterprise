"use client";

import { createPersistedStore } from "@/lib/data/persisted-store";

import type { DeliveryLocation } from "./types";

export interface DeliveryState {
  location: DeliveryLocation | null;
  /** Chosen delivery option id: "home" | "pickup" | "freight". */
  optionId: string | null;
}

export const deliveryStore = createPersistedStore<DeliveryState>("delivery", { location: null, optionId: null });

export const setDeliveryLocation = (location: DeliveryLocation | null) =>
  deliveryStore.set((s) => ({ ...s, location, optionId: location ? s.optionId : null }));

export const setDeliveryOption = (optionId: string | null) => deliveryStore.set((s) => ({ ...s, optionId }));
