import type { PackagingType, StockStatus } from "@/features/catalogue/types";

export const STOCK_LABEL: Record<StockStatus, string> = {
  "in-stock": "In stock",
  "low-stock": "Low stock",
  "out-of-stock": "Out of stock",
};

export const PACKAGING_LABEL: Record<PackagingType, string> = {
  bottle: "Bottle",
  jerrycan: "Jerrycan",
  drum: "Drum",
  pouch: "Pouch",
  bag: "Bag",
  sack: "Sack",
};
