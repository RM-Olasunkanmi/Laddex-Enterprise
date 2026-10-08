import type { CategoryInfo, PackVariant, PackagingType, PriceTier, Product, SalesFormat, StockStatus } from "@/features/catalogue/types";
import type { Unit } from "@/lib/formatters";

/**
 * DEVELOPMENT FIXTURES. Every size, price, tier, stock level and weight below is
 * illustrative until Laddex supplies the real catalogue. Nothing here is a confirmed offer.
 * Prices are integer kobo. Tiers are generated from a base price and a discount ratio so
 * the stored numbers stay reproducible.
 */

export const CATEGORIES: CategoryInfo[] = [
  {
    id: "palm-oil",
    name: "Palm oil",
    unitKind: "volume",
    tagline: "Sold by the litre",
    blurb: "Packs from a bottle to a drum. Unit price is shown per litre so sizes compare directly.",
  },
  {
    id: "tapioca",
    name: "Tapioca",
    unitKind: "mass",
    tagline: "Sold by the kilo",
    blurb: "Pouches, bags and sacks. Unit price is shown per kilogram so sizes compare directly.",
  },
];

/** Round to the nearest 10 naira so tier prices read like real price lists. */
const roundTen = (kobo: number) => Math.round(kobo / 1000) * 1000;

function tiers(base: number, breaks: [qty: number, discount: number][]): PriceTier[] {
  return breaks.map(([minQty, d]) => ({ minQty, unitPriceKobo: roundTen(base * (1 - d)) }));
}

interface VariantSeed {
  id: string;
  size: number;
  unit: Unit;
  contentBase: number;
  packaging: PackagingType;
  format: SalesFormat;
  naira: number;
  breaks: [number, number][];
  moq: number;
  stock: [StockStatus, number];
  weightKg: number;
}

function variants(productId: string, skuPrefix: string, seeds: VariantSeed[]): PackVariant[] {
  return seeds.map((s) => ({
    id: s.id,
    sku: `${skuPrefix}-${s.size}${s.unit.toUpperCase()}`,
    productId,
    size: { amount: s.size, unit: s.unit },
    contentBase: s.contentBase,
    packaging: s.packaging,
    format: s.format,
    retailPriceKobo: s.naira * 100,
    wholesaleTiers: tiers(s.naira * 100, s.breaks),
    wholesaleMinQty: s.moq,
    stock: { status: s.stock[0], qtyAvailable: s.stock[1] },
    shippingWeightKg: s.weightKg,
    dataStatus: "illustrative" as const,
  }));
}

export const PRODUCTS: Product[] = [
  {
    id: "palm-oil",
    slug: "palm-oil",
    category: "palm-oil",
    name: "Palm Oil",
    unitKind: "volume",
    baseUnit: "l",
    summary: "Palm oil in household bottles, jerrycans and drums.",
    description: [
      "Palm oil is a vegetable cooking oil pressed from the fruit of the oil palm. It is used in stews, soups and frying across Nigerian kitchens and in food production.",
      "Laddex offers it in five pack sizes. Choose a bottle or small jerrycan for the household, or a larger jerrycan or drum to stock a shop, restaurant or processing line.",
    ],
    specs: [
      { label: "Sold by", value: "Litre (volume)" },
      { label: "Pack sizes", value: "500 ml, 1 L, 5 L, 25 L, 200 L" },
      { label: "Grade and processing", value: "To be confirmed by Laddex", note: "No grade, colour class or processing claim is made until supplied." },
      { label: "Shelf life", value: "To be confirmed by Laddex" },
      { label: "Shipping weight basis", value: "About 0.91 kg per litre plus packaging", note: "Generic density used only to estimate delivery weight." },
    ],
    packagingNotes: [
      "Bottles and jerrycans are sold as single packs. Drums are sold per drum.",
      "Packaging materials are placeholders until the final specification is confirmed.",
    ],
    usage: ["Household cooking", "Restaurants and caterers", "Food processors and resellers"],
    variants: variants("palm-oil", "PO", [
      { id: "po-500ml", size: 500, unit: "ml", contentBase: 0.5, packaging: "bottle", format: "packaged", naira: 1900, breaks: [[12, 0.05], [48, 0.09]], moq: 12, stock: ["out-of-stock", 0], weightKg: 0.55 },
      { id: "po-1l", size: 1, unit: "l", contentBase: 1, packaging: "bottle", format: "packaged", naira: 3400, breaks: [[12, 0.05], [48, 0.09]], moq: 12, stock: ["in-stock", 640], weightKg: 1.0 },
      { id: "po-5l", size: 5, unit: "l", contentBase: 5, packaging: "jerrycan", format: "packaged", naira: 15500, breaks: [[6, 0.04], [24, 0.08]], moq: 6, stock: ["in-stock", 310], weightKg: 4.8 },
      { id: "po-25l", size: 25, unit: "l", contentBase: 25, packaging: "jerrycan", format: "bulk", naira: 71000, breaks: [[4, 0.04], [12, 0.07], [40, 0.1]], moq: 4, stock: ["low-stock", 18], weightKg: 24.2 },
      { id: "po-200l", size: 200, unit: "l", contentBase: 200, packaging: "drum", format: "bulk", naira: 540000, breaks: [[2, 0.05], [10, 0.09]], moq: 2, stock: ["in-stock", 22], weightKg: 195 },
    ]),
    photographs: [],
  },
  {
    id: "tapioca",
    slug: "tapioca",
    category: "tapioca",
    name: "Tapioca",
    unitKind: "mass",
    baseUnit: "kg",
    summary: "Tapioca in pouches, bags and sacks.",
    description: [
      "Tapioca is a starch made from cassava root. Cooks use it for puddings, thickening and drinks, and food makers use it as an ingredient.",
      "Laddex offers it in four pack sizes, from a kitchen pouch to a sack for trade buyers.",
    ],
    specs: [
      { label: "Sold by", value: "Kilogram (mass)" },
      { label: "Pack sizes", value: "1 kg, 5 kg, 25 kg, 50 kg" },
      { label: "Form (starch, flakes or pearls)", value: "To be confirmed by Laddex", note: "The product form is not assumed until supplied." },
      { label: "Shelf life", value: "To be confirmed by Laddex" },
      { label: "Storage", value: "Keep sealed, cool and dry", note: "General guidance. Confirm against the Laddex label." },
    ],
    packagingNotes: [
      "Pouches and bags are sold singly. Sacks are sold per sack.",
      "Packaging materials are placeholders until the final specification is confirmed.",
    ],
    usage: ["Household cooking", "Bakeries and caterers", "Food manufacturers and resellers"],
    variants: variants("tapioca", "TP", [
      { id: "tp-1kg", size: 1, unit: "kg", contentBase: 1, packaging: "pouch", format: "packaged", naira: 2400, breaks: [[12, 0.05], [60, 0.09]], moq: 12, stock: ["in-stock", 1200], weightKg: 1.05 },
      { id: "tp-5kg", size: 5, unit: "kg", contentBase: 5, packaging: "bag", format: "packaged", naira: 10800, breaks: [[6, 0.05], [24, 0.09]], moq: 6, stock: ["in-stock", 420], weightKg: 5.2 },
      { id: "tp-25kg", size: 25, unit: "kg", contentBase: 25, packaging: "sack", format: "bulk", naira: 48000, breaks: [[4, 0.04], [20, 0.08], [60, 0.11]], moq: 4, stock: ["in-stock", 96], weightKg: 25.4 },
      { id: "tp-50kg", size: 50, unit: "kg", contentBase: 50, packaging: "sack", format: "bulk", naira: 91000, breaks: [[2, 0.04], [10, 0.08], [40, 0.12]], moq: 2, stock: ["low-stock", 12], weightKg: 50.6 },
    ]),
    photographs: [],
  },
];

export const ALL_VARIANTS: PackVariant[] = PRODUCTS.flatMap((p) => p.variants);
