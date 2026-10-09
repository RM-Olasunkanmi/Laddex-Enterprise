import type {
  CategoryInfo,
  PackVariant,
  PackagingType,
  PriceTier,
  Product,
  ProductImage,
  SalesFormat,
  StockStatus,
} from "@/features/catalogue/types";
import type { Unit } from "@/lib/formatters";

/**
 * DEVELOPMENT FIXTURES. Product names, the products' look and the photographs come from material
 * Laddex supplied. Every pack size, price, tier, stock level and weight below is illustrative until
 * Laddex confirms the real catalogue. Nothing here is a confirmed offer.
 * Prices are integer kobo. Tiers are generated from a base price and a discount ratio so the stored
 * numbers stay reproducible.
 */

export const CATEGORIES: CategoryInfo[] = [
  {
    id: "palm-oil",
    name: "Palm oil",
    unitKind: "volume",
    tagline: "Sold by the litre",
    blurb:
      "Bottled palm oil in five sizes. Each size shows its price per litre so you can compare them.",
  },
  {
    id: "tapioca",
    name: "Tapioca flakes",
    unitKind: "mass",
    tagline: "Sold by the kilo",
    blurb: "Tapioca flakes in pouches and bags, priced per kilogram.",
  },
  {
    id: "garri",
    name: "Garri",
    unitKind: "mass",
    tagline: "Igbo and Ijebu, sold by the kilo",
    blurb:
      "Garri Igbo and Ijebu Garri, from a 1 kg pouch to a sack for resale.",
  },
];

/** Round to the nearest 10 naira so tier prices read like real price lists. */
const roundTen = (kobo: number) => Math.round(kobo / 1000) * 1000;

function tiers(
  base: number,
  breaks: [qty: number, discount: number][],
): PriceTier[] {
  return breaks.map(([minQty, d]) => ({
    minQty,
    unitPriceKobo: roundTen(base * (1 - d)),
  }));
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

function variants(
  productId: string,
  skuPrefix: string,
  seeds: VariantSeed[],
): PackVariant[] {
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

const SAMPLE = "Sample photo supplied by Laddex";
const photo = (
  id: string,
  file: string,
  alt: string,
  width: number,
  height: number,
  position?: string,
): ProductImage => ({
  id,
  src: `/products/${file}`,
  alt,
  width,
  height,
  position,
  note: SAMPLE,
});

export const PRODUCTS: Product[] = [
  {
    id: "palm-oil",
    slug: "palm-oil",
    category: "palm-oil",
    name: "Palm Oil",
    unitKind: "volume",
    baseUnit: "l",
    summary: "Laddex palm oil in bottles from 1 litre up to 5 litres.",
    description: [
      "Palm oil is a vegetable cooking oil pressed from the fruit of the oil palm. It is used in stews, soups and frying across Nigerian kitchens and in food production.",
      "Laddex palm oil comes in clear bottles with red caps; the larger sizes have a carry handle on the cap. Choose a small bottle for the household or a larger one to stock a shop, a kitchen or an event.",
    ],
    specs: [
      { label: "Sold by", value: "Litre (volume)" },
      {
        label: "Bottle sizes",
        value: "1 L, 2 L, 3 L, 4 L, 5 L",
        note: "Sizes are illustrative until confirmed by Laddex.",
      },
      {
        label: "Grade and processing",
        value: "To be confirmed by Laddex",
        note: "No grade or processing claim is made until supplied.",
      },
      { label: "Shelf life", value: "To be confirmed by Laddex" },
      {
        label: "Shipping weight basis",
        value: "About 0.91 kg per litre plus the bottle",
        note: "Generic density used only to estimate delivery weight.",
      },
    ],
    packagingNotes: [
      "Sold as single bottles. Wholesale quantities are counted in bottles of the same size.",
      "Pack sizes and fill volumes are placeholders until the final specification is confirmed.",
    ],
    usage: [
      "Household cooking",
      "Shops, restaurants and caterers",
      "Events and gifts",
    ],
    variants: variants("palm-oil", "PO", [
      {
        id: "po-1l",
        size: 1,
        unit: "l",
        contentBase: 1,
        packaging: "bottle",
        format: "packaged",
        naira: 3500,
        breaks: [
          [12, 0.05],
          [48, 0.09],
        ],
        moq: 12,
        stock: ["in-stock", 640],
        weightKg: 1.0,
      },
      {
        id: "po-2l",
        size: 2,
        unit: "l",
        contentBase: 2,
        packaging: "bottle",
        format: "packaged",
        naira: 6800,
        breaks: [
          [6, 0.04],
          [24, 0.08],
        ],
        moq: 6,
        stock: ["in-stock", 410],
        weightKg: 1.95,
      },
      {
        id: "po-3l",
        size: 3,
        unit: "l",
        contentBase: 3,
        packaging: "bottle",
        format: "packaged",
        naira: 10000,
        breaks: [
          [6, 0.04],
          [24, 0.08],
        ],
        moq: 6,
        stock: ["in-stock", 280],
        weightKg: 2.9,
      },
      {
        id: "po-4l",
        size: 4,
        unit: "l",
        contentBase: 4,
        packaging: "bottle",
        format: "packaged",
        naira: 13000,
        breaks: [
          [4, 0.04],
          [12, 0.07],
          [40, 0.1],
        ],
        moq: 4,
        stock: ["low-stock", 18],
        weightKg: 3.85,
      },
      {
        id: "po-5l",
        size: 5,
        unit: "l",
        contentBase: 5,
        packaging: "bottle",
        format: "packaged",
        naira: 16000,
        breaks: [
          [4, 0.04],
          [12, 0.07],
          [40, 0.1],
        ],
        moq: 4,
        stock: ["in-stock", 220],
        weightKg: 4.8,
      },
    ]),
    photographs: [
      photo(
        "palm-lineup",
        "palm-oil-lineup.webp",
        "Five Laddex palm oil bottles of different sizes with red caps, standing together",
        500,
        330,
        "50% 40%",
      ),
      photo(
        "palm-full",
        "palm-oil-full.webp",
        "Laddex palm oil bottles on a woven mat beside a glass bowl of palm oil",
        540,
        717,
        "50% 50%",
      ),
    ],
  },
  {
    id: "tapioca-flakes",
    slug: "tapioca-flakes",
    category: "tapioca",
    name: "Tapioca Flakes",
    unitKind: "mass",
    baseUnit: "kg",
    summary: "Laddex tapioca flakes in pouches and bags.",
    description: [
      "Tapioca is a starch made from cassava root. The flakes are used for puddings, drinks and desserts, and as an ingredient by food makers.",
      "Laddex tapioca flakes are packed in printed pouches. Smaller pouches suit the kitchen; larger bags suit shops and caterers.",
    ],
    specs: [
      { label: "Sold by", value: "Kilogram (mass)" },
      {
        label: "Pack sizes",
        value: "500 g, 1 kg, 5 kg",
        note: "Sizes are illustrative until confirmed by Laddex.",
      },
      {
        label: "Ingredients and allergens",
        value: "To be confirmed by Laddex",
      },
      { label: "Shelf life", value: "To be confirmed by Laddex" },
      {
        label: "Storage",
        value: "Keep sealed, cool and dry",
        note: "General guidance. Confirm against the Laddex label.",
      },
    ],
    packagingNotes: [
      "Pouches and bags are sold singly. Wholesale quantities are counted in packs of the same size.",
      "Pack sizes are placeholders until the final specification is confirmed.",
    ],
    usage: [
      "Household cooking",
      "Bakeries, caterers and dessert makers",
      "Shops and resellers",
    ],
    variants: variants("tapioca-flakes", "TF", [
      {
        id: "tf-500g",
        size: 500,
        unit: "g",
        contentBase: 0.5,
        packaging: "pouch",
        format: "packaged",
        naira: 1600,
        breaks: [
          [24, 0.05],
          [96, 0.09],
        ],
        moq: 24,
        stock: ["out-of-stock", 0],
        weightKg: 0.55,
      },
      {
        id: "tf-1kg",
        size: 1,
        unit: "kg",
        contentBase: 1,
        packaging: "pouch",
        format: "packaged",
        naira: 3000,
        breaks: [
          [12, 0.05],
          [48, 0.09],
        ],
        moq: 12,
        stock: ["in-stock", 900],
        weightKg: 1.05,
      },
      {
        id: "tf-5kg",
        size: 5,
        unit: "kg",
        contentBase: 5,
        packaging: "bag",
        format: "packaged",
        naira: 14000,
        breaks: [
          [6, 0.05],
          [24, 0.09],
        ],
        moq: 6,
        stock: ["in-stock", 260],
        weightKg: 5.2,
      },
    ]),
    photographs: [
      photo(
        "tapioca-flakes",
        "tapioca-flakes.webp",
        "Shelves of Laddex Tapioca Flakes pouches with yellow and red labels",
        250,
        330,
        "50% 30%",
      ),
    ],
  },
  {
    id: "garri-igbo",
    slug: "garri-igbo",
    category: "garri",
    name: "Garri Igbo",
    unitKind: "mass",
    baseUnit: "kg",
    summary: "Laddex Garri Igbo, from a 1 kg pouch to a 50 kg sack.",
    description: [
      "Garri is a staple made from fermented, grated and roasted cassava. It is eaten soaked with water, sugar and groundnuts, or made into a firm dough (eba) to go with soups and stews.",
      "Laddex Garri Igbo is packed in a printed 1 kg pouch for the kitchen, with larger bags and sacks for shops, resellers and events.",
    ],
    specs: [
      { label: "Sold by", value: "Kilogram (mass)" },
      {
        label: "Pack sizes",
        value: "1 kg, 5 kg, 25 kg, 50 kg",
        note: "The 1 kg pouch is shown on the packaging. Larger sizes are illustrative until confirmed.",
      },
      { label: "Ingredients", value: "To be confirmed by Laddex" },
      { label: "Shelf life", value: "To be confirmed by Laddex" },
      {
        label: "Storage",
        value: "Keep sealed, cool and dry",
        note: "General guidance. Confirm against the Laddex label.",
      },
    ],
    packagingNotes: [
      "Pouches and bags are sold singly; sacks are sold per sack.",
      "Larger pack sizes are placeholders until the final specification is confirmed.",
    ],
    usage: ["Household meals", "Shops and resellers", "Events and souvenirs"],
    variants: variants("garri-igbo", "GI", [
      {
        id: "gi-1kg",
        size: 1,
        unit: "kg",
        contentBase: 1,
        packaging: "pouch",
        format: "packaged",
        naira: 1800,
        breaks: [
          [12, 0.05],
          [48, 0.09],
        ],
        moq: 12,
        stock: ["in-stock", 1500],
        weightKg: 1.05,
      },
      {
        id: "gi-5kg",
        size: 5,
        unit: "kg",
        contentBase: 5,
        packaging: "bag",
        format: "packaged",
        naira: 8500,
        breaks: [
          [6, 0.05],
          [24, 0.09],
        ],
        moq: 6,
        stock: ["in-stock", 420],
        weightKg: 5.2,
      },
      {
        id: "gi-25kg",
        size: 25,
        unit: "kg",
        contentBase: 25,
        packaging: "sack",
        format: "bulk",
        naira: 40000,
        breaks: [
          [4, 0.04],
          [20, 0.08],
          [60, 0.11],
        ],
        moq: 4,
        stock: ["in-stock", 96],
        weightKg: 25.4,
      },
      {
        id: "gi-50kg",
        size: 50,
        unit: "kg",
        contentBase: 50,
        packaging: "sack",
        format: "bulk",
        naira: 77000,
        breaks: [
          [2, 0.04],
          [10, 0.08],
          [40, 0.12],
        ],
        moq: 2,
        stock: ["low-stock", 12],
        weightKg: 50.6,
      },
    ]),
    photographs: [
      photo(
        "garri-igbo",
        "garri-igbo.webp",
        "Laddex Garri Igbo 1 kg pouch with a red, green and yellow label",
        166,
        235,
        "50% 30%",
      ),
      photo(
        "garri-shelf",
        "garri-shelf.webp",
        "Laddex Garri Igbo and Ijebu Garri pouches on a shelf",
        268,
        250,
        "50% 40%",
      ),
    ],
  },
  {
    id: "garri-ijebu",
    slug: "garri-ijebu",
    category: "garri",
    name: "Ijebu Garri",
    unitKind: "mass",
    baseUnit: "kg",
    summary: "Laddex Ijebu Garri, from a 1 kg pouch to a 50 kg sack.",
    description: [
      "Ijebu garri is garri made in the Ijebu style. Like Garri Igbo it is eaten soaked or made into eba.",
      "Laddex Ijebu Garri is packed in a printed 1 kg pouch for the kitchen, with larger bags and sacks for shops, resellers and events.",
    ],
    specs: [
      { label: "Sold by", value: "Kilogram (mass)" },
      {
        label: "Pack sizes",
        value: "1 kg, 5 kg, 25 kg, 50 kg",
        note: "The 1 kg pouch is shown on the packaging. Larger sizes are illustrative until confirmed.",
      },
      { label: "Ingredients", value: "To be confirmed by Laddex" },
      { label: "Shelf life", value: "To be confirmed by Laddex" },
      {
        label: "Storage",
        value: "Keep sealed, cool and dry",
        note: "General guidance. Confirm against the Laddex label.",
      },
    ],
    packagingNotes: [
      "Pouches and bags are sold singly; sacks are sold per sack.",
      "Larger pack sizes are placeholders until the final specification is confirmed.",
    ],
    usage: ["Household meals", "Shops and resellers", "Events and souvenirs"],
    variants: variants("garri-ijebu", "GJ", [
      {
        id: "gj-1kg",
        size: 1,
        unit: "kg",
        contentBase: 1,
        packaging: "pouch",
        format: "packaged",
        naira: 1900,
        breaks: [
          [12, 0.05],
          [48, 0.09],
        ],
        moq: 12,
        stock: ["in-stock", 1300],
        weightKg: 1.05,
      },
      {
        id: "gj-5kg",
        size: 5,
        unit: "kg",
        contentBase: 5,
        packaging: "bag",
        format: "packaged",
        naira: 9000,
        breaks: [
          [6, 0.05],
          [24, 0.09],
        ],
        moq: 6,
        stock: ["in-stock", 380],
        weightKg: 5.2,
      },
      {
        id: "gj-25kg",
        size: 25,
        unit: "kg",
        contentBase: 25,
        packaging: "sack",
        format: "bulk",
        naira: 42500,
        breaks: [
          [4, 0.04],
          [20, 0.08],
          [60, 0.11],
        ],
        moq: 4,
        stock: ["in-stock", 84],
        weightKg: 25.4,
      },
      {
        id: "gj-50kg",
        size: 50,
        unit: "kg",
        contentBase: 50,
        packaging: "sack",
        format: "bulk",
        naira: 82000,
        breaks: [
          [2, 0.04],
          [10, 0.08],
          [40, 0.12],
        ],
        moq: 2,
        stock: ["out-of-stock", 0],
        weightKg: 50.6,
      },
    ]),
    photographs: [
      photo(
        "garri-ijebu",
        "garri-ijebu.webp",
        "Laddex Ijebu Garri 1 kg pouches on a shelf",
        160,
        240,
        "50% 40%",
      ),
      photo(
        "garri-shelf",
        "garri-shelf.webp",
        "Laddex Garri Igbo and Ijebu Garri pouches on a shelf",
        268,
        250,
        "50% 40%",
      ),
    ],
  },
];

export const ALL_VARIANTS: PackVariant[] = PRODUCTS.flatMap((p) => p.variants);
export const categoryOf = (variantId: string) =>
  PRODUCTS.find((p) => p.variants.some((v) => v.id === variantId))!.category;
