# Laddex design system

Source of truth: `src/lib/design/tokens.ts` (values JavaScript needs) and `src/styles/laddex.css` (CSS custom properties and component classes). `tokens.test.ts` fails if they drift apart or if a contrast pair drops below its target. The same tokens exist as Figma variables (see `docs/FIGMA.md`).

## Tokens

| Group              | Values                                                                                                                                               |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Surfaces           | paper `#F6F2EA`, paper-2 `#ECE6DA`, card `#FFFDF8`, rail `#1E1B17`                                                                                   |
| Text               | ink `#1E1B17`, ink-2 `#4A453D`, ink-3 `#675F54` (all at least 4.5:1 on paper and card)                                                               |
| Lines              | line `#D9D1C2`, line-strong `#B5AB97`                                                                                                                |
| Palm oil           | ember `#B23A0E`, deep `#8A2A06`, tint `#F3DCCB`                                                                                                      |
| Tapioca            | blue `#3F6FB5`, deep `#244A82`, tint `#DCE6F4`                                                                                                       |
| Wholesale / sample | ochre `#E3B04B`, text `#7A5200`, tint `#F6E6BF`                                                                                                      |
| Status             | success `#2E6B45`, warning `#8A5A00`, danger `#A12525`, each with a tint; always paired with text and a marker                                       |
| Type               | Fraunces Variable (display), Hanken Grotesk Variable (body), JetBrains Mono Variable (figures, labels)                                               |
| Space              | 4 px base: 4, 8, 12, 16, 24, 32, 48, 64, 96                                                                                                          |
| Radius             | 2, 4, 8 px (no pills)                                                                                                                                |
| Container          | page max 80 rem; reading 44 rem; dashboard fluid                                                                                                     |
| Elevation          | rule (1 px), raised, pop. Used sparingly; separation comes from rules and surface tone                                                               |
| Motion             | fast 120 ms, base 200 ms, slow 320 ms, camera 650 ms; one easing curve `cubic-bezier(.2,.7,.2,1)`; all collapse to ~0 under `prefers-reduced-motion` |
| Focus              | 2 px ink outline plus a 4 px ochre ring                                                                                                              |
| Chart              | see `DESIGN_DIRECTIONS.md`; sequential ember ramp `#FBEFE6 → #8A2A06` for normalised choropleths; zone categorical `#3F6FB5 #B23A0E #B07F10 #2F8F6B` |
| Map layers         | boundary `#8C8374`, selection outline `#1E1B17`, outside-zone fill `#ECE6DA`, pickup `#1E1B17` diamond, order points by segment colour               |

Density: the storefront uses 16 px body and 44 px controls; the dashboard uses 13 px body, mono figures and 36 px controls.

## Component inventory

| Area       | Components (path)                                                                                                                                              |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Navigation | `SiteHeader`, `Wordmark`, `MobileNavButton`, `NavDrawer`, `CartDrawer`, `DeliveryChip`, `PersonaSelect`, `SiteFooter` (`components/navigation`)                |
| Commerce   | `ProductCard`, `PackTable`, `QuantityStepper`, `AddToCartButton`, `Price`, `UnitPrice`, `CatalogueBrowser` (filters, sort, empty state)                        |
| Product    | `PackVisual` (development render), `PackLadder`, `ProductGallery`, `TierChart`, `ProductPurchase` (variant picker, tiers, sticky mobile buy bar), `ZoneSketch` |
| Wholesale  | `TierExplorer`, `QuoteBuilder`, `RegisterForm`, `ApprovalTimeline`, `WholesaleStatusBanner`, `AccountView`                                                     |
| Checkout   | `CartView`, `CheckoutPreview`, `OrderSummary`, `ConfirmationPreview`                                                                                           |
| Delivery   | `LocationPicker`, `CoverageBadge`, `DeliveryCheck`                                                                                                             |
| Maps       | `useMapLibre` (lifecycle, offline fallback), boundary layer helpers                                                                                            |
| Analytics  | `DashboardShell`, `FilterBar`, `MapToolbar`, `DashboardMap`, `AreaList`, `Inspector`, `OrderInspector`, `OrderTable`, `KpiTile`, section pages                 |
| Charts     | `ChartFrame` (title, definition, table view), `LineChart`, `HBarChart`, `StackedBar`, `Histogram`, `Sparkline`, `Legend`                                       |
| Primitives | `.btn` variants, `.field`, `.tag` (success, warning, danger, info, sample), `.panel`, `.dtable`, `.skel` loading, `Notice`, `SectionHeading`                   |

States covered: default, hover, focus-visible, active, disabled; loading (skeletons), empty, error with retry.

## Writing rules

Direct and specific: "Palm oil by the litre. Tapioca by the kilo." Prices are always labelled illustrative until real; statements about delivery say "estimate", never "guarantee"; no testimonials, counts or certifications appear anywhere.
