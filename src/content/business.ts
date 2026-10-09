/**
 * Facts about the business that appear on the site. Fields left empty are not shown: nothing
 * here is invented. Fill them in with confirmed details (see docs/ASSETS.md).
 */
export const BUSINESS = {
  name: "Laddex Enterprise",
  tagline: "Pure. Natural. Royal.",
  country: "Nigeria",
  /** Confirmed contact details. Empty strings are hidden. */
  phone: "0812 108 8635",
  whatsapp: "0812 108 8635",
  email: "",
  address: "9 Adeboale Street, Epe, Lagos State, Nigeria",
  hours: "8:00 am – 5:00 pm, pickup and walk-in. Please book before you come.",
  /** What Laddex supplies, as stated by the owner. */
  products: ["Palm oil", "Tapioca flakes", "Garri Igbo", "Ijebu Garri"],
  /** Who Laddex supplies, as stated by the owner. */
  buyers: [
    "Households",
    "Shops and resellers",
    "Caterers and restaurants",
    "Event organisers (souvenirs and bulk gifts)",
  ],
} as const;

export const BUSINESS_CONTACT = {
  phoneHref: "tel:+2348121088635",
  whatsappNumber: "2348121088635",
  whatsappHref: "https://wa.me/2348121088635",
} as const;

export const ENQUIRY_TOPICS = [
  { id: "order", label: "An order or product question" },
  { id: "wholesale", label: "Buying to resell (wholesale)" },
  { id: "events", label: "Souvenirs or bulk gifts for an event" },
  { id: "delivery", label: "Delivery to my state" },
  { id: "other", label: "Something else" },
] as const;
export type EnquiryTopic = (typeof ENQUIRY_TOPICS)[number]["id"];
