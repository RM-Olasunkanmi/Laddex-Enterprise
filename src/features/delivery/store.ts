"use client";

import type { DeliveryLocation, LocationResolution } from "./types";

import { createPersistedStore } from "@/lib/data/persisted-store";

export interface DeliveryState {
  location: DeliveryLocation | null;
  /** Spatial-join result stored with the confirmed location so pages need not reload boundaries. */
  resolution: LocationResolution | null;
  /** Chosen delivery option id: "home" | "pickup" | "freight". */
  optionId: string | null;
}

export const deliveryStore = createPersistedStore<DeliveryState>("delivery", {
  location: null,
  resolution: null,
  optionId: null,
});

export const setDeliveryLocation = (
  location: DeliveryLocation | null,
  resolution: LocationResolution | null = null,
) =>
  deliveryStore.set((s) => ({
    location,
    resolution,
    optionId: location ? s.optionId : null,
  }));

export const setDeliveryOption = (optionId: string | null) =>
  deliveryStore.set((s) => ({ ...s, optionId }));
