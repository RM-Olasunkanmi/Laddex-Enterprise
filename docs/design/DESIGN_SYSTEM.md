# Laddex design system

Source of truth: `src/lib/design/tokens.ts` (values JavaScript needs) and `src/styles/laddex.css` (CSS custom properties and component classes). `tokens.test.ts` fails if they drift apart or if a contrast pair drops below its target.

## Direction (revision 3)

A food brand, not a marketplace or a dashboard. Warm ivory surfaces, dark forest-green type and actions taken from the palm leaves in the logo, and palm-oil amber used sparingly as a second accent. Photography is shown whole and never sits under text. Several supplied photographs are small (160 to 540 px wide), so layouts show them near their native size, on a soft backdrop, rather than cropping and enlarging them.

## Tokens

| Group      | Light                                                                                     | Notes                                                                    |
| ---------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Surfaces   | paper `#F7F3EA`, paper-2 `#EEE8DA`, card `#FFFDF8`, rail `#132A1E` (dark forest band)      | Dark theme: `#101712`, `#16201A`, `#1A251E`, rail `#0B120D`              |
| Text       | ink `#14211A`, ink-2 `#3B4A40`, ink-3 `#5C6A60`                                            | ink is a very dark green, not black; ink-3 is at least 4.5:1 on paper-2  |
| Lines      | line `#DAD4C4`, line-strong `#B0AA97`                                                      |                                                                          |
| Primary    | forest `#1F4A33`, forest-deep `#153524`, forest-tint `#E2EBE1`, on-forest `#FFFFFF`        | Buttons, selection, links, eyebrows. 10:1 on paper                       |
| Accent     | amber `#9A5410` (text), amber-bright `#D98A1F` (marks on dark), amber-tint `#F5E5C8`       | Small highlights and the events band. Never large fills behind body text |
| Palm red   | ember `#B3261E`                                                                            | Palm oil identity in charts and the map pin on /delivery only            |
| Status     | success, warning, danger, each with a tint; always paired with words and a dot             |                                                                          |
| Sample     | ochre text on ochre tint                                                                   | Marks illustrative data                                                  |
| Type       | Fraunces Variable (display), Plus Jakarta Sans Variable (body), JetBrains Mono (dashboard) | Storefront prices use tabular sans figures, not mono                     |
| Radius     | 4, 8, 14 px                                                                                | No pill buttons; pills only for small chips                              |
| Motion     | 120 / 200 / 320 ms, one easing curve; hero fade, drawer slide, add-to-cart tick, step fade | All collapse under `prefers-reduced-motion`. No scroll-driven reveals    |
| Focus      | 2 px forest outline plus a soft amber ring                                                 | Fields show a forest border and halo                                     |

Rhythm: storefront sections use `.section` (56 px block padding on phones, 88 px from 1024 px). Controls are at least 44 px tall; body text 16 px, form inputs 16 px so iOS does not zoom.

## Storefront classes

`.btn` with `btn-primary` (forest), `btn-ink`, `btn-line`, `btn-quiet`, `btn-on-dark`, `btn-line-on-dark`, sizes `btn-sm` and `btn-lg`; `.chip` (size options and category filters, `data-selected`, `data-unavailable`); `.stock` with `stock-in`, `stock-low`, `stock-out`; `.field`, `.label`, `.hint`; `.eyebrow`, `.display`, `.lede`, `.text-link`; `.section`; `.skel`.

## Component inventory

| Area       | Components                                                                                                                      |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Navigation | `SiteHeader`, `Wordmark`, `PrimaryNav` (active state, Shop menu), `CartButton`, `NavDrawer`, `CartDrawer`, `SiteFooter`, `NAV`  |
| Commerce   | `ProductCard` (row on phones, card from 640 px), `CatalogueBrowser`, `AddToCartButton`, `QuantityStepper`, `Price`, `UnitPrice` |
| Product    | `ProductPurchase` (size cards, stock-capped quantity, pickup/delivery facts, sticky mobile bar), `ProductGallery`, `ProductPhoto` |
| Checkout   | `CheckoutFlow` (4 steps), `AddressFields` (state, LGA, address, optional GPS or pin), `PinMap` (lazy), `BankDetails`, `CartView` |
| Enquiries  | `EnquiryForm`, `EventEnquiryForm`, `QuoteBuilder`, `RegisterForm`: each opens WhatsApp with a complete message                   |
| Delivery   | `LocationPicker` (fees from `/api/delivery/estimate`; "pending confirmation" until zones are live), `CoverageBadge`               |
| Primitives | `ButtonLink`, `SectionHeading`, `Notice`, `Tag`, `StockTag`, `StockLine`, `SampleTag`                                            |

## Writing rules

Direct and specific. No testimonials, certifications, origins, nutritional or shelf-life claims, delivery times or discounts unless the business has confirmed them. Delivery fees that are not confirmed are labelled "pending confirmation" and quoted before payment. A receipt upload is described as "not yet confirmed" until staff verify the transfer.
