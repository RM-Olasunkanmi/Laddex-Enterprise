"use client";

import { createPersistedStore } from "@/lib/data/persisted-store";

import type { CustomerAccess, CustomerProfile } from "./types";

const GUEST: CustomerProfile = { access: "guest", displayName: null };

export const customerStore = createPersistedStore<CustomerProfile>("customer", GUEST);

/**
 * Development personas so each purchasing path can be reviewed. In production the profile
 * comes from the authenticated session (Payload user + wholesale account record).
 */
export const PERSONAS: Record<CustomerAccess, CustomerProfile> = {
  guest: GUEST,
  retail: { access: "retail", displayName: "Retail customer" },
  "wholesale-pending": {
    access: "wholesale-pending",
    displayName: "Sample Trading Co.",
    business: { name: "Sample Trading Co.", kind: "distributor", status: "in-review", submittedAt: "2026-09-29T09:00:00+01:00" },
  },
  "wholesale-approved": {
    access: "wholesale-approved",
    displayName: "Sample Trading Co.",
    business: { name: "Sample Trading Co.", kind: "distributor", status: "approved", submittedAt: "2026-09-12T09:00:00+01:00" },
  },
};

export function setPersona(access: CustomerAccess) {
  customerStore.set(PERSONAS[access]);
}

export function submitWholesaleApplication(business: { name: string; kind: NonNullable<CustomerProfile["business"]>["kind"] }) {
  customerStore.set({
    access: "wholesale-pending",
    displayName: business.name,
    business: { ...business, status: "submitted", submittedAt: new Date().toISOString() },
  });
}
