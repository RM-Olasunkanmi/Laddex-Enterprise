"use client";

import { useState } from "react";

import { BUSINESS } from "@/content/business";
import { STORE, whatsappLink } from "@/lib/store";

const DAYS = ["Today", "Tomorrow"] as const;
const WINDOWS = [
  { id: "morning", label: "Morning (8am – 12pm)" },
  { id: "afternoon", label: "Afternoon (12pm – 5pm)" },
] as const;

/**
 * Book-first pickup: the buyer picks a day and a window, then confirms on
 * WhatsApp with the slot already filled in the message.
 */
export function PickupBooking() {
  const [day, setDay] = useState<(typeof DAYS)[number]>("Today");
  const [windowId, setWindowId] = useState<(typeof WINDOWS)[number]["id"]>(
    "morning",
  );
  const windowLabel = WINDOWS.find((w) => w.id === windowId)!.label;
  const href = whatsappLink(
    `Hello ${STORE.name}! I'd like to book a pickup for ${day}, ${windowLabel}. My order is: `,
  );

  return (
    <div className="mt-4 grid gap-2">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label htmlFor="pickup-day" className="label">
            Day
          </label>
          <select
            id="pickup-day"
            className="field"
            value={day}
            onChange={(e) => setDay(e.target.value as typeof day)}
          >
            {DAYS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="pickup-window" className="label">
            Window
          </label>
          <select
            id="pickup-window"
            className="field"
            value={windowId}
            onChange={(e) =>
              setWindowId(e.target.value as typeof windowId)
            }
          >
            {WINDOWS.map((w) => (
              <option key={w.id} value={w.id}>
                {w.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-primary w-full"
      >
        Book {day.toLowerCase()}, {windowLabel.toLowerCase()} on WhatsApp (opens in a new tab)
      </a>
      <p className="hint">
        {BUSINESS.hours} Collection address: {BUSINESS.address}.
      </p>
    </div>
  );
}
