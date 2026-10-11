/** Storefront navigation, shared by the desktop header and the mobile menu. */
export const NAV = [
  { href: "/", label: "Home" },
  {
    href: "/shop",
    label: "Shop",
    children: [
      { href: "/shop/palm-oil", label: "Palm oil", note: "By the litre" },
      { href: "/shop/tapioca", label: "Tapioca flakes", note: "By the kilo" },
      { href: "/shop/garri", label: "Garri", note: "Igbo and Ijebu" },
      { href: "/shop", label: "All products", note: "Compare sizes" },
    ],
  },
  { href: "/wholesale", label: "Wholesale" },
  { href: "/events", label: "Events" },
  { href: "/delivery", label: "Delivery" },
  { href: "/about", label: "About" },
] as const;
