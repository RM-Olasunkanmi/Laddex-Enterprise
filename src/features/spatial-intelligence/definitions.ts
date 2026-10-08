/**
 * Plain-language definition of every metric the dashboard displays: what it counts, how it is
 * calculated, and what it cannot tell you. Rendered as tooltips and on the Methods panel.
 */
export interface MetricDefinition {
  id: string;
  label: string;
  unit: string;
  definition: string;
  formula: string;
  caveat?: string;
}

export const METRICS: Record<string, MetricDefinition> = {
  gross: {
    id: "gross",
    label: "Gross sales",
    unit: "NGN",
    definition: "Value of goods on orders that were not cancelled. Delivery fees are reported separately.",
    formula: "sum(order goods value) over non-cancelled orders",
    caveat: "Includes goods later returned. See net sales.",
  },
  net: {
    id: "net",
    label: "Net sales",
    unit: "NGN",
    definition: "Gross sales minus the value of goods returned.",
    formula: "gross sales - returned goods value",
    caveat: "Returns are attributed to the order date, not the return date.",
  },
  orders: {
    id: "orders",
    label: "Orders",
    unit: "count",
    definition: "Orders placed in the period, including cancelled ones. Cancelled orders are shown separately and excluded from sales.",
    formula: "count(orders placed)",
  },
  aov: {
    id: "aov",
    label: "Average order value",
    unit: "NGN",
    definition: "Average value of goods per non-cancelled order.",
    formula: "gross sales / non-cancelled orders",
    caveat: "Shown as an em dash when there are no orders. Wholesale orders pull the average up; read it with the segment filter applied.",
  },
  packs: {
    id: "packs",
    label: "Packs sold",
    unit: "packs",
    definition: "Number of packs on non-cancelled orders. Litres of palm oil and kilograms of tapioca are reported separately and never added together.",
    formula: "sum(line quantity)",
  },
  fulfilment: {
    id: "fulfilment",
    label: "Fulfilment rate",
    unit: "%",
    definition: "Share of closed orders that were delivered. Closed means delivered, cancelled or returned. Open orders are left out so recent orders do not distort the rate.",
    formula: "delivered / (delivered + cancelled + returned)",
  },
  repeat: {
    id: "repeat",
    label: "Repeat-purchase rate",
    unit: "%",
    definition: "Share of buying customers who placed two or more non-cancelled orders inside the selected period.",
    formula: "customers with >= 2 orders / customers with >= 1 order",
    caveat: "Bounded by the period you choose: a short range understates repeat buying. It does not use purchases before the range.",
  },
  velocity: {
    id: "velocity",
    label: "Pack velocity",
    unit: "packs per day",
    definition: "Average packs sold per day over the selected period.",
    formula: "packs sold / days in period",
  },
  density: {
    id: "density",
    label: "Order density",
    unit: "orders per km²",
    definition: "Non-cancelled orders divided by the land area of the local government area, so large and small areas can be compared.",
    formula: "orders / LGA area (km²)",
    caveat: "Area is calculated from the boundary polygon and includes water and unsettled land, so rural LGAs read low.",
  },
  salesPerZone: {
    id: "salesPerZone",
    label: "Sales per service area",
    unit: "NGN",
    definition: "Gross sales of orders located inside each sample delivery zone.",
    formula: "sum(gross) grouped by zone from a point-in-polygon spatial join",
    caveat: "Zones are sample configuration, not verified coverage.",
  },
  concentration: {
    id: "concentration",
    label: "Demand concentration",
    unit: "share / index",
    definition: "How unevenly sales are spread across areas. Top-3 share is the portion of sales in the three biggest areas. HHI is the sum of squared shares: 1 divided by the number of areas means perfectly even, 1 means everything in one area.",
    formula: "top3 = sum of 3 largest shares; HHI = sum(share^2)",
    caveat: "Orders without a usable location are excluded because they belong to no area.",
  },
  deliveryCost: {
    id: "deliveryCost",
    label: "Delivery cost distribution",
    unit: "NGN",
    definition: "Distribution of delivery fees charged on non-cancelled delivery orders. Fees come from a sample zone rule or from a manual quote where no rule exists.",
    formula: "histogram of delivery fee; median and 90th percentile",
  },
  coverage: {
    id: "coverage",
    label: "Coverage versus observed orders",
    unit: "share of orders",
    definition: "Where orders came from relative to the sample service zones: inside a zone, inside Lagos but outside every zone, outside the Lagos boundaries loaded here, or without a usable location.",
    formula: "count by spatial class / non-cancelled orders",
    caveat: "Compares demand with sample configuration. It says nothing about real delivery capacity.",
  },
  change: {
    id: "change",
    label: "Change versus previous period",
    unit: "%",
    definition: "Percentage change against the immediately preceding period of equal length, with the same filters.",
    formula: "(current - previous) / previous",
    caveat: "Not shown when the previous period is zero or has no data.",
  },
};

export const SYNTHETIC_NOTICE =
  "Synthetic development data. Orders, customers, volumes and locations are generated for interface development and do not describe real Laddex sales.";
