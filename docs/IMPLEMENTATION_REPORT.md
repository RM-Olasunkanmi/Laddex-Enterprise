# Implementation report

## What changed in this revision (owner feedback)

1. **Real logo** in the header, footer, staff rail and favicon.
2. **Nationwide delivery**: all 36 states and the FCT, six regions, state then LGA selects, all 774 LGAs (loaded per state), region-shaded map. Rates are sample values.
3. **Theme switch**: light and dark, remembered, no flash on load; charts use CSS variables and the MapLibre map is rebuilt with a matching basemap.
4. **About section and enquiries**: short factual write-up on the home page; `/contact` form (preview only, sends nothing); contact details configurable in `src/content/business.ts` and hidden until supplied.
5. **Real products**: the invented litre sizes and drawn renders are gone. Palm oil, tapioca flakes, Garri Igbo and Ijebu Garri use the supplied photos. Sizes and prices remain illustrative and labelled.
6. **Retail, resale and events in one site**: three ways to buy on the home page, `/events` for souvenirs and bulk gifts, wholesale tiers on garri and others, "events" as a buyer segment in the analytics.
7. **Analytics rebuilt for intelligence, not just a map**: Overview, Geographic explorer (region, state, LGA), and Spatial insights (Moran's I, LISA clusters, Gi* hot spots, Gini and Lorenz, location quotients, distance bands, growth, expansion candidates, region by month).

## Architecture

Unchanged principles: typed contracts with fixture adapters (`CatalogueService`, `GeocodingService`, `DeliveryPricingService`, `RoutingService`, `DashboardDataService`), money in integer kobo, one pricing function for storefront and synthetic orders, boundaries joined by point-in-polygon. See `BACKEND_INTEGRATION.md`.

## Decisions to confirm with the owner

- Real pack sizes and prices (palm oil is currently shown as 1 to 5 L bottles purely as a placeholder).
- Whether palm oil is sold in other containers (the supplied photo shows large jerrycans as well as bottles).
- Real delivery rates and any regions not served.
- Where goods ship from (the distance analysis uses a placeholder base).
- Contact details, and whether event orders offer custom labels or gift packaging.

## Not done

Backend, payments, real inventory, real orders, authentication, server-side roles. The enquiry form and quote requests are not sent anywhere.

## Revision 2 (design, delivery address, stock)

- **Typography and look**: Bricolage Grotesque (headings), Instrument Serif italic (accent words), Plus Jakarta Sans (body), JetBrains Mono (labels). Pill buttons, larger radii, colour-blocked sections, grain texture.
- **Motion**: staggered hero headline, floating photos, rotating badge, marquee, scroll-driven reveals (pure CSS, `animation-timeline: view()`, no JavaScript), count-up numbers, state-by-state map reveal, hover lifts, add-to-cart tick, page fade between routes. All of it is off under `prefers-reduced-motion`, and content is complete without it.
- **Maps**: fills and bubbles fade and grow in, colours glide when filters change, the selected outline pulses, the dashboard opens with a settle onto the country, and the delivery pin drops with a pulse.
- **Delivery address**: state, then local government area, then street or landmark (required to confirm). "Use my current location" uses the browser's geolocation. Landmark chips and "Find it on the map" search inside the chosen area through OpenStreetMap Nominatim (live only; when unreachable the page says so and the customer describes the place and drops a pin).
- **Stock**: `/dashboard/stock` edits quantities per pack with a reason, a low-stock limit, and a movement log with CSV export. Saved levels change what the shop shows. They are stored in the browser only until a backend exists.
