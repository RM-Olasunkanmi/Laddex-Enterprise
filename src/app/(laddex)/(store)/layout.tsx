import type { ReactNode } from "react";

import { CatalogueProvider } from "@/components/lx/catalogue-provider";
import { CartDrawer, NavDrawer } from "@/components/navigation/drawers";
import { SiteFooter } from "@/components/navigation/site-footer";
import { SiteHeader } from "@/components/navigation/site-header";
import { getCatalogue } from "@/features/catalogue";

export default async function StoreLayout({
  children,
}: {
  children: ReactNode;
}) {
  const catalogue = getCatalogue();
  const [products, categories] = await Promise.all([
    catalogue.listProducts(),
    catalogue.listCategories(),
  ]);
  return (
    <CatalogueProvider products={products} categories={categories}>
      <SiteHeader />
      <main id="main" className="min-h-[60vh]">
        {children}
      </main>
      <SiteFooter />
      <CartDrawer />
      <NavDrawer />
    </CatalogueProvider>
  );
}
