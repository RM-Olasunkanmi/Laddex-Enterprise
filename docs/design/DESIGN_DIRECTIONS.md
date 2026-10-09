# Design directions and research

## Inputs

- **Business facts used:** Laddex Enterprise sells palm oil (by volume) and tapioca (by mass), to individuals and to wholesale buyers, in packaged and bulk formats, in Nigeria, priced in naira.
- **Not available, so not claimed:** photography, certifications, origin, processing, years in operation, customer numbers, delivery times, real prices, real coverage. Every such value in the build is labelled illustrative or "to be confirmed".
- **UI/UX Pro Max** (installed with `uipro init --ai claude`, project-local in `.claude/skills/ui-ux-pro-max`) was queried for a food-commerce design system, chart guidance for geographic data and typography pairings. See "What the skill contributed" below.

## Three directions

| | A. Kitchen Editorial | B. Provenance Ledger | C. Weights & Measures (selected) |
|---|---|---|---|
| Idea | Large food photography, serif display, terracotta on cream | Field notes, sourcing stories, origin maps | Premium utilitarian retail: pack size and unit price are the typographic heroes |
| Strength | Appetising, familiar | Credible if provenance is real | Works with no photography, scales to wholesale tables and the dashboard, makes comparison easy |
| Risk | Needs photography that does not exist yet; reads as lifestyle, weak for trade buyers; drifts to beige and green | Requires verified origin and sourcing claims, which were explicitly not supplied | Can feel austere without a strong type and colour system |
| Verdict | Rejected | Rejected | **Selected** |

### Why C

Laddex's real commercial need is to make buying simple and credible across sizes from 500 ml to a 200 L drum and from 1 kg to 50 kg. The thing a buyer actually compares is price per litre or per kilo, so the interface shows it everywhere. The same typographic system (display serif for pack size, tabular figures for money) carries from retail cards to wholesale tier tables to analytics.

## Visual system in one paragraph

Paper and ink neutrals (`#F6F2EA`, `#1E1B17`); one expressive colour, palm-oil ember (`#B23A0E`), used for primary actions and the palm oil identity; a tapioca blue (`#3F6FB5`) for the second product family; ochre reserved for wholesale and sample-data flags. Fraunces (display), Hanken Grotesk (body), JetBrains Mono (figures, labels). 2 to 8 px radii, hairline rules instead of shadows, no gradients, no glass.

## Evaluating the skill's default recommendation

For "food commerce marketplace editorial premium" the skill returned: pattern *Feature-Rich Showcase*, style *Liquid Glass*, Playfair Display + Inter, near-black with a gold accent.

Rejected, with reasons:

- **Liquid Glass** (translucency, refraction) is in this brief's explicit avoid list, and its own accessibility note says "conditional".
- **Feature-Rich Showcase** (feature cards, social proof, logos) pushes the generic feature-card layout and "social proof" the brief forbids inventing.
- **Playfair + Inter** is the default editorial pairing used everywhere; Fraunces has a warmer, more characterful shape at display sizes and its optical-size axis keeps it legible small.
- **Gold on near-black** would have made palm oil look like a luxury spirit; ember on paper is closer to the product.

Adopted from the skill:

- Its chart guidance for geographic data: label regions directly, never rely on colour alone, provide a sortable region table and keyboard alternative (this became the "Areas as a list" panel), and switch to WebGL above ~1000 regions (not needed at 20 LGAs).
- Its pre-delivery checklist items: visible focus, 44 px targets, 150 to 300 ms transitions, reduced-motion support, tested at 375/768/1024/1440.

## Colour validation

Categorical series colours were run through the `dataviz` skill's validator (`validate_palette.js`, OKLab, colour-vision-deficiency simulation), not judged by eye. The first palette **failed**: the slate-teal tapioca colour and the neutral retail colour read as grey (chroma below floor) and one fell outside the lightness band. They were replaced and the final set passes every check:

| Series | Colour |
|---|---|
| Palm oil | `#B23A0E` |
| Tapioca | `#3F6FB5` |
| Wholesale | `#B07F10` |
| Retail | `#2F8F6B` |

Command: `node validate_palette.js "#B23A0E,#3F6FB5,#B07F10,#2F8F6B" --mode light --surface "#FFFDF8"` returned "ALL CHECKS PASS". Text contrast pairs are asserted in `src/lib/design/tokens.test.ts`. Every series is also distinguished by label, legend and a hatch texture on the second series in each pair.
