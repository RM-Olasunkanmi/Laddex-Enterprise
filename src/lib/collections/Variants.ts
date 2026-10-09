import type { CollectionOverride } from "@payloadcms/plugin-ecommerce/types";
import type { Field } from "payload";

import {
  adminOnlyAccess,
  isAdmin,
  patchPricesGroupField,
} from "@/lib/collections/base-fields";
import { laddexVariantGroup } from "@/lib/collections/laddex-fields";

export const Variants: CollectionOverride = ({ defaultCollection }) => {
  const fields = (defaultCollection.fields ?? []).map((f): Field => {
    if (f.type === "group") return patchPricesGroupField(f, false);

    const name = "name" in f ? f.name : undefined;
    if (name === "options") {
      return {
        ...f,
        admin: {
          ...f.admin,
          description:
            "Choose one option from every variant type enabled on the product.",
        },
      } as Field;
    }

    if (name === "inventory") {
      const current = f as Field & { access?: Record<string, unknown> };
      return {
        ...current,
        required: true,
        access: { ...(current.access ?? {}), read: isAdmin },
        admin: {
          ...f.admin,
          description:
            "Inventory for this exact combination. Set to 0 to disable it in the storefront.",
        },
      } as Field;
    }

    return f;
  });

  fields.push({
    name: "originalPriceInUSD",
    type: "number",
    min: 0,
    admin: {
      description:
        "Original price before discount (optional). Shown as a strikethrough price when set.",
      condition: (data) => Boolean(data?.priceInUSDEnabled),
    },
  });

  if (laddexVariantGroup.type === "group") {
    fields.push({
      ...laddexVariantGroup,
      fields: laddexVariantGroup.fields.filter((field) => {
        const name = "name" in field ? field.name : undefined;
        return name !== "stockQty";
      }).map((field) => {
        const name = "name" in field ? field.name : undefined;
        if (name !== "wholesaleTiers") return field;
        const current = field as Field & { access?: Record<string, unknown> };
        return {
          ...current,
          access: { ...(current.access ?? {}), read: isAdmin },
        } as Field;
      }),
    });
  }

  return {
    ...defaultCollection,
    access: {
      ...adminOnlyAccess,
      read: ({ req }) =>
        isAdmin({ req }) ? true : { _status: { equals: "published" } },
    },
    admin: {
      ...(defaultCollection.admin ?? {}),
      defaultColumns: Array.from(
        new Set([
          ...(defaultCollection.admin?.defaultColumns ?? []),
          "priceInUSD",
          "inventory",
        ]),
      ),
    },
    fields,
  };
};
