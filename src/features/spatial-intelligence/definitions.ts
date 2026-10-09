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
    definition:
      "Value of goods on orders that were not cancelled. Delivery fees are reported separately.",
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
    definition:
      "Orders placed in the period, including cancelled ones. Cancelled orders are shown separately and excluded from sales.",
    formula: "count(orders placed)",
  },
  aov: {
    id: "aov",
    label: "Average order value",
    unit: "NGN",
    definition: "Average value of goods per non-cancelled order.",
    formula: "gross sales / non-cancelled orders",
    caveat:
      "Shown as an em dash when there are no orders. Wholesale orders pull the average up; read it with the segment filter applied.",
  },
  packs: {
    id: "packs",
    label: "Packs sold",
    unit: "packs",
    definition:
      "Number of packs on non-cancelled orders. Litres of palm oil and kilograms of tapioca and garri are reported separately and never added together.",
    formula: "sum(line quantity)",
  },
  fulfilment: {
    id: "fulfilment",
    label: "Fulfilment rate",
    unit: "%",
    definition:
      "Share of closed orders that were delivered. Closed means delivered, cancelled or returned. Open orders are left out so recent orders do not distort the rate.",
    formula: "delivered / (delivered + cancelled + returned)",
  },
  repeat: {
    id: "repeat",
    label: "Repeat-purchase rate",
    unit: "%",
    definition:
      "Share of buying customers who placed two or more non-cancelled orders inside the selected period.",
    formula: "customers with >= 2 orders / customers with >= 1 order",
    caveat:
      "Bounded by the period you choose: a short range understates repeat buying. It does not use purchases before the range.",
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
    definition:
      "Non-cancelled orders divided by the land area of the state or local government area, so large and small areas can be compared.",
    formula: "orders / area (km²)",
    caveat:
      "Area is calculated from the boundary polygon and includes water and unsettled land, so large rural states read low. No population data is used, so this is not a per-person measure.",
  },
  salesPerZone: {
    id: "salesPerZone",
    label: "Sales per region",
    unit: "NGN",
    definition:
      "Gross sales of orders located inside each of the six geopolitical regions.",
    formula:
      "sum(gross) grouped by region from a point-in-polygon spatial join to state boundaries",
  },
  concentration: {
    id: "concentration",
    label: "Demand concentration",
    unit: "share / index",
    definition:
      "How unevenly sales are spread across areas. Top-3 share is the portion of sales in the three biggest areas. HHI is the sum of squared shares: 1 divided by the number of areas means perfectly even, 1 means everything in one area.",
    formula: "top3 = sum of 3 largest shares; HHI = sum(share^2)",
    caveat:
      "Orders without a usable location are excluded because they belong to no area.",
  },
  deliveryCost: {
    id: "deliveryCost",
    label: "Delivery cost distribution",
    unit: "NGN",
    definition:
      "Distribution of delivery fees charged on non-cancelled orders. Fees come from a sample regional rate by order weight, or from a manual quote where the order is heavier than every band.",
    formula: "histogram of delivery fee; median and 90th percentile",
    caveat:
      "Rates are sample configuration, not Laddex's real delivery prices.",
  },
  coverage: {
    id: "coverage",
    label: "Geographic reach",
    unit: "states",
    definition:
      "How many of Nigeria's 36 states and the FCT have at least one non-cancelled order in the selected period.",
    formula: "count of distinct states with orders",
    caveat:
      "Reach says where orders came from, not where Laddex could deliver.",
  },
  moran: {
    id: "moran",
    label: "Global Moran's I",
    unit: "index, -1 to +1",
    definition:
      "Whether states with similar values sit next to each other more than chance would put them. Positive means similar values cluster (high beside high, low beside low); near zero means no spatial pattern; negative means high and low states alternate.",
    formula:
      "I = (n / S0) * sum_ij w_ij z_i z_j / sum_i z_i^2, queen-contiguity weights, row-standardised; p from 999 seeded random permutations",
    caveat:
      "Only 37 units, so the test has modest power. States differ hugely in size, and the pattern in this build comes from synthetic orders. Treat it as a method demonstration until real orders are connected.",
  },
  lisa: {
    id: "lisa",
    label: "Local clusters (LISA)",
    unit: "category",
    definition:
      "For each state, compares its value with its neighbours' average. High-High and Low-Low are clusters; High-Low and Low-High are outliers. Only states with p < 0.05 are classed.",
    formula:
      "I_i = z_i * mean(z of neighbours); significance by 999 conditional permutations",
    caveat:
      "With 37 states some states will be flagged by chance (multiple testing). Use the flags to decide where to look, not as proof.",
  },
  gistar: {
    id: "gistar",
    label: "Hot and cold spots (Getis-Ord Gi*)",
    unit: "z-score",
    definition:
      "Measures whether a state and its neighbours together hold unusually high or low values. A z-score above 1.96 is a hot spot, below -1.96 a cold spot (about 95% confidence).",
    formula:
      "Gi* = (sum_j w_ij x_j - mean * sum_j w_ij) / (s * sqrt((n * sum w^2 - (sum w)^2) / (n - 1))), binary weights including the state itself",
    caveat:
      "Large states and tiny states are treated alike. Results shift with the measure chosen.",
  },
  gini: {
    id: "gini",
    label: "Concentration (Gini and Lorenz curve)",
    unit: "0 to 1",
    definition:
      "How unevenly sales are spread across states. 0 means every state buys the same; values near 1 mean almost everything comes from one state. The Lorenz curve shows the cumulative share of sales against the cumulative share of states.",
    formula:
      "G = 2 * sum(i * x_i) / (n * sum(x)) - (n + 1) / n, states sorted ascending",
    caveat:
      "Includes states with zero sales. Differences in state population are not adjusted for.",
  },
  lq: {
    id: "lq",
    label: "Location quotient",
    unit: "ratio, 1 = national mix",
    definition:
      "A state's share of one product (or buyer segment) divided by the country's share. 1.4 means that product is 40% more important here than nationally; 0.6 means 40% less.",
    formula: "LQ = (x_ic / x_i) / (X_c / X)",
    caveat:
      "Unreliable for states with few orders; those are greyed out. It shows mix, not size.",
  },
  distanceBands: {
    id: "distanceBands",
    label: "Sales by distance from base",
    unit: "share of sales",
    definition:
      "Sales grouped by straight-line distance between the order and a chosen base location.",
    formula:
      "great-circle distance from the origin to each order point, grouped into bands",
    caveat:
      "Straight-line distance, not road distance or delivery time. The base is a placeholder you can change; Laddex's real dispatch point has not been supplied.",
  },
  growth: {
    id: "growth",
    label: "Growth by state",
    unit: "%",
    definition:
      "Change in gross sales against the previous period of equal length.",
    formula: "(current - previous) / previous",
    caveat:
      "States with very small previous sales show large percentages; those are marked low-base and left out of rankings.",
  },
  opportunity: {
    id: "opportunity",
    label: "Expansion candidates",
    unit: "score",
    definition:
      "States whose own demand is well below what their neighbours' demand would suggest, ranked by that gap with a small bonus for recent growth. A prompt for where to investigate first.",
    formula:
      "score = (mean neighbour z - own z) + 0.5 * clamp(growth, -0.5, 1), only where the gap exceeds 0.4",
    caveat:
      "Does not use population, income, competitors or logistics costs, so it is a shortlist for judgement, not a forecast of sales.",
  },
  change: {
    id: "change",
    label: "Change versus previous period",
    unit: "%",
    definition:
      "Percentage change against the immediately preceding period of equal length, with the same filters.",
    formula: "(current - previous) / previous",
    caveat: "Not shown when the previous period is zero or has no data.",
  },
};

export const SYNTHETIC_NOTICE =
  "Synthetic development data. Orders, customers, volumes and locations are generated for interface development and do not describe real Laddex sales.";
