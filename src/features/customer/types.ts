/**
 * What the signed-in visitor is allowed to see and be charged.
 * - guest / retail: list prices only. Wholesale tiers are shown as indicative at most.
 * - wholesale-pending: applied, not yet approved. Treated like retail for charging.
 * - wholesale-approved: tier pricing applies and is shown as the account's price.
 */
export type CustomerAccess =
  "guest" | "retail" | "wholesale-pending" | "wholesale-approved";

export interface CustomerProfile {
  access: CustomerAccess;
  displayName: string | null;
  business?: {
    name: string;
    kind: "distributor" | "restaurant" | "retailer" | "processor" | "other";
    status: "submitted" | "in-review" | "approved";
    submittedAt: string | null;
  };
}

export const ACCESS_LABEL: Record<CustomerAccess, string> = {
  guest: "Guest",
  retail: "Retail account",
  "wholesale-pending": "Wholesale, awaiting approval",
  "wholesale-approved": "Wholesale, approved",
};

export const isWholesale = (a: CustomerAccess) =>
  a === "wholesale-pending" || a === "wholesale-approved";
