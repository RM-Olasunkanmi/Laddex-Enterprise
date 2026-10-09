/**
 * INVENTED demand model for the synthetic orders. It exists so the dashboard has plausible
 * geography to analyse; none of it describes real Laddex customers or markets.
 */

/** Relative order volume by state. Larger urban and populous states weigh more. */
export const STATE_WEIGHT: Record<string, number> = {
  lagos: 30,
  ogun: 10,
  oyo: 9,
  osun: 4,
  ondo: 4,
  ekiti: 2.5,
  fct: 9,
  kwara: 3.5,
  kogi: 2,
  niger: 2.5,
  nasarawa: 2,
  plateau: 2.5,
  benue: 2.5,
  rivers: 9,
  delta: 5,
  edo: 5,
  "akwa-ibom": 4,
  "cross-river": 3,
  bayelsa: 1.8,
  enugu: 6,
  anambra: 7,
  imo: 4.5,
  abia: 4,
  ebonyi: 2,
  kano: 6,
  kaduna: 4.5,
  katsina: 1.8,
  jigawa: 1,
  kebbi: 0.8,
  sokoto: 0.8,
  zamfara: 0.6,
  bauchi: 1.4,
  gombe: 1,
  adamawa: 1.2,
  borno: 0.9,
  taraba: 0.9,
  yobe: 0.5,
};

/** Annual-style growth of each state over the dataset window (0.4 = volume ends 40% above where it starts). */
export const STATE_GROWTH: Record<string, number> = {
  lagos: 0.25,
  ogun: 0.5,
  oyo: 0.4,
  osun: 0.2,
  fct: 0.6,
  kwara: 0.55,
  niger: 0.3,
  rivers: 0.2,
  delta: 0.1,
  edo: 0.2,
  enugu: 0.5,
  anambra: 0.15,
  imo: 0.0,
  abia: -0.05,
  kano: 0.7,
  kaduna: 0.45,
  plateau: 0.35,
  "akwa-ibom": 0.1,
  "cross-river": 0.05,
  ondo: 0.1,
  ekiti: 0.0,
  katsina: 0.3,
  bauchi: 0.2,
};

/** Product mix by region: [palm oil, tapioca flakes, garri igbo, ijebu garri]. Invented preferences. */
export const REGION_PRODUCT_MIX: Record<
  string,
  [number, number, number, number]
> = {
  "south-west": [3, 1.2, 1.6, 3.2],
  "south-east": [2.8, 0.8, 3.6, 0.7],
  "south-south": [3.2, 1.6, 2.4, 0.9],
  "north-central": [2.2, 1.0, 2.0, 1.1],
  "north-west": [1.4, 0.6, 1.2, 0.6],
  "north-east": [1.2, 0.5, 1.0, 0.5],
};

/** Share of each state's buyers that are wholesale or event buyers. */
export const STATE_WHOLESALE_BIAS: Record<string, number> = {
  lagos: 1.8,
  ogun: 1.5,
  kano: 1.6,
  rivers: 1.3,
  anambra: 1.7,
  enugu: 1.3,
  fct: 1.0,
  oyo: 1.4,
};
export const STATE_EVENTS_BIAS: Record<string, number> = {
  lagos: 2.0,
  fct: 1.8,
  oyo: 1.3,
  rivers: 1.5,
  enugu: 1.3,
  anambra: 1.2,
  edo: 1.2,
  kwara: 1.1,
};
