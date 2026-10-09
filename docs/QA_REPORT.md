# QA report

Run against a production build (`pnpm build && pnpm start -p 3355`).

| Check                                   | Result                                                                                                                                                                                                             |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `pnpm typecheck`, `pnpm lint`           | clean (starter files excluded from the Laddex rules)                                                                                                                                                               |
| `pnpm test`                             | 125 unit tests: pricing, tokens (contrast and palette), delivery, analytics metrics and reconciliation, selection reducer, spatial statistics                                                                      |
| `scripts/qa/e2e.mjs`                    | 22 browser checks: logo, theme persistence, shop, cart, nationwide delivery, contact form, events, wholesale, dashboard filters, drill to LGAs, insights determinism, admin role, error and retry, mobile overflow |
| `scripts/qa/a11y.mjs` (axe WCAG 2.1 AA) | 20 routes: 0 violations at desktop and phone width; dark theme checked with `DARK=1`                                                                                                                               |
| `scripts/qa/perf.mjs`                   | see the table the script prints; dashboard pages transfer more because of boundaries and the map                                                                                                                   |
| `scripts/qa/gallery.mjs`                | 29 screenshots in `/screenshots`, including dark theme, LGA view, insights                                                                                                                                         |

## Not verified here

- The online basemap, live geocoder and Figma and Cloudflare services are blocked in the build sandbox. Only the offline fallbacks were exercised.
- Screen-reader and keyboard walkthroughs by a person are still needed; automated tools find part of the issues.
- Real devices, and production performance on Cloudflare.
- The photos are low resolution samples, so image quality on large screens is not representative of final photography.
