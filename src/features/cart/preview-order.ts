"use client";

import { createPersistedStore } from "@/lib/data/persisted-store";

export interface PreviewOrder {
  reference: string;
  createdAt: string;
  contact: { name: string; phone: string; email: string };
  address: {
    street: string;
    landmark: string;
    notes: string;
    lga: string | null;
    state: string | null;
  };
  delivery: { label: string; feeKobo: number | null; basis: string };
  lines: { label: string; qty: number; unitKobo: number; totalKobo: number }[];
  subtotalKobo: number;
  totalKobo: number;
  access: string;
}

/** The last previewed order, kept so the confirmation page can render it. Nothing is sent anywhere. */
export const previewOrderStore = createPersistedStore<PreviewOrder | null>(
  "preview-order",
  null,
);

/** Nigerian mobile numbers: 0 or +234 followed by 7/8/9 then 0/1, then 8 digits. */
export const NG_PHONE = /^(\+234|0)[789][01]\d{8}$/;
export const isNgPhone = (s: string) => NG_PHONE.test(s.replace(/[\s-]/g, ""));
