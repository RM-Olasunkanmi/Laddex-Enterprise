"use client";

import { useId } from "react";

import { MAX_LINE_QTY } from "@/features/cart/store";

interface Props {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  label: string;
  size?: "md" | "sm";
}

/** Touch-sized stepper: 44px targets, a typeable field, and clamped values. */
export function QuantityStepper({ value, onChange, min = 0, max = MAX_LINE_QTY, label, size = "md" }: Props) {
  const id = useId();
  const dim = size === "md" ? "h-11 w-11" : "h-9 w-9";
  const clamp = (n: number) => Math.max(min, Math.min(max, Number.isFinite(n) ? Math.floor(n) : min));
  return (
    <div className="inline-flex items-stretch border border-line-strong rounded-md bg-card" role="group" aria-label={label}>
      <button type="button" className={`${dim} grid place-items-center text-lg hover:bg-paper-2 disabled:opacity-40 rounded-l-md`} onClick={() => onChange(clamp(value - 1))} disabled={value <= min} aria-label={`Decrease ${label}`}>
        <span aria-hidden="true">&minus;</span>
      </button>
      <input
        id={id}
        inputMode="numeric"
        pattern="[0-9]*"
        value={value}
        onChange={(e) => onChange(clamp(parseInt(e.target.value.replace(/\D/g, "") || String(min), 10)))}
        aria-label={label}
        className={`${size === "md" ? "w-14" : "w-12"} text-center mono bg-transparent border-x border-line focus-visible:z-10`}
      />
      <button type="button" className={`${dim} grid place-items-center text-lg hover:bg-paper-2 disabled:opacity-40 rounded-r-md`} onClick={() => onChange(clamp(value + 1))} disabled={value >= max} aria-label={`Increase ${label}`}>
        <span aria-hidden="true">+</span>
      </button>
    </div>
  );
}
