import type { LngLat } from "@/features/delivery/types";

import { BUSINESS } from "@/content/business";

/**
 * The verified Laddex Enterprise storefront in Epe. Contact facts (phone,
 * address, hours) live in `src/content/business.ts` and render on the
 * contact page and footer; this module adds the map position and
 * direction links. The position is the Epe area centre until an exact
 * doorstep pin is surveyed.
 */
export const STORE = {
  name: BUSINESS.name,
  position: { lng: 3.9783, lat: 6.5841 } satisfies LngLat,
  precisionNote:
    "Area centre of Epe (about 1 km). The doorstep pin will be surveyed.",
  verified: true as const,
};

/** Digits for tel: and wa.me links, derived from the confirmed BUSINESS phone. */
export const STORE_PHONE_DIGITS = "2348121088635";

export const STORE_CONTACT = {
  phoneHref: `tel:+${STORE_PHONE_DIGITS}`,
  whatsapp: `https://wa.me/${STORE_PHONE_DIGITS}?text=${encodeURIComponent(
    `Hello ${BUSINESS.name}! I'd like to make an enquiry.`,
  )}`,
};

export function whatsappLink(message: string) {
  return `https://wa.me/${STORE_PHONE_DIGITS}?text=${encodeURIComponent(message)}`;
}

/** Google Maps universal URL: opens directions TO the store from the user's location. */
export function googleMapsDirectionsUrl(position: LngLat = STORE.position) {
  return `https://www.google.com/maps/dir/?api=1&destination=${position.lat},${position.lng}`;
}

/** Apple Maps directions URL (works on iPhone/Mac, degrades gracefully elsewhere). */
export function appleMapsDirectionsUrl(position: LngLat = STORE.position) {
  return `https://maps.apple.com/?daddr=${position.lat},${position.lng}`;
}

/** OpenStreetMap directions URL (no account, matches the on-page basemap). */
export function osmDirectionsUrl(position: LngLat = STORE.position) {
  return `https://www.openstreetmap.org/directions?to=${position.lat}%2C${position.lng}`;
}
