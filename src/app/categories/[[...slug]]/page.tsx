import { permanentRedirect } from "next/navigation";

export default async function LegacyCategoriesRedirect({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;
  const segments = slug ?? [];
  if (segments.length === 0) permanentRedirect("/posts");
  permanentRedirect(`/posts/c/${segments.join("/")}`);
}
