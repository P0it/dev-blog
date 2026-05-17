import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getAllPostSlugs, getPostBySlug, getRelatedPosts, localize } from "@/lib/queries";
import { PostDetailView } from "@/components/page/PostDetailView";
import { SITE } from "@/lib/site";

export const revalidate = 60;

export async function generateStaticParams() {
  const slugs = await getAllPostSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};
  const localized = localize(post, "en");
  const url = `${SITE.url}/en/posts/${post.slug}`;
  return {
    title: localized.title,
    description: localized.excerpt || undefined,
    alternates: {
      canonical: url,
      languages: { ko: `${SITE.url}/posts/${post.slug}` },
    },
    openGraph: {
      type: "article",
      url,
      locale: "en_US",
      title: localized.title,
      description: localized.excerpt || undefined,
    },
    twitter: { card: "summary_large_image", title: localized.title, description: localized.excerpt || undefined },
  };
}

export default async function EnPostDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();
  // 번역 없는 글은 KO 페이지로 보냄
  if (!post.titleEn) redirect(`/posts/${slug}`);
  const related = (await getRelatedPosts(post, 4)).map((r) => localize(r, "en"));
  return <PostDetailView post={localize(post, "en")} locale="en" related={related} />;
}
