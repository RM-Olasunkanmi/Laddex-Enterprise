import type { Kobo, Unit } from "@/lib/formatters";

export type CategoryId = "palm-oil" | "tapioca";
export type UnitKind = "volume" | "mass";
export type SalesFormat = "packaged" | "bulk";
export type PackagingType = "bottle" | "jerrycan" | "drum" | "pouch" | "bag" | "sack";

/** Marks values that come from development fixtures rather than confirmed Laddex data. */
export type DataStatus = "illustrative" | "confirmed";

export interface PriceTier {
  /** Applies from this pack quantity upward. */
  minQty: number;
  /** Price per pack at this quantity break. */
  unitPriceKobo: Kobo;
}

export type StockStatus = "in-stock" | "low-stock" | "out-of-stock";

export interface PackVariant {
  id: string;
  sku: string;
  productId: string;
  size: { amount: number; unit: Unit };
  /** Contents expressed in the product's base unit (litres or kilograms) for per-unit pricing. */
  contentBase: number;
  packaging: PackagingType;
  format: SalesFormat;
  /** List price for one pack, available to every customer. */
  retailPriceKobo: Kobo;
  /** Indicative volume tiers for wholesale accounts. Not a contractual offer. */
  wholesaleTiers: PriceTier[];
  /** Minimum pack count for a wholesale order of this pack. */
  wholesaleMinQty: number;
  stock: { status: StockStatus; qtyAvailable: number };
  /** Approximate shipping weight of one filled pack in kilograms (contents plus packaging). */
  shippingWeightKg: number;
  dataStatus: DataStatus;
}

export interface ProductSpec {
  label: string;
  value: string;
  /** Explains where a value is an assumption rather than a confirmed fact. */
  note?: string;
}

export interface ProductImage {
  id: string;
  /** "photograph" is supplied Laddex photography; "development-render" is a placeholder. */
  kind: "photograph" | "development-render";
  src?: string;
  alt: string;
}

export interface Product {
  id: string;
  slug: string;
  category: CategoryId;
  name: string;
  unitKind: UnitKind;
  baseUnit: "l" | "kg";
  summary: string;
  description: string[];
  specs: ProductSpec[];
  packagingNotes: string[];
  usage: string[];
  variants: PackVariant[];
  /** Real photographs go here when supplied; until then the UI shows labelled development renders. */
  photographs: ProductImage[];
}

export interface CategoryInfo {
  id: CategoryId;
  name: string;
  unitKind: UnitKind;
  tagline: string;
  blurb: string;
}
