import { permanentRedirect } from "next/navigation";

export default async function LegacyCategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  permanentRedirect(`/shop/${encodeURIComponent(slug)}`);
}
