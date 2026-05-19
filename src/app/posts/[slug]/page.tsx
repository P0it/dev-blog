import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllPostSlugs, getPostBySlug, getRelatedPosts, getPostViews, getSeriesContext } from "@/lib/queries";
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
  const url = `${SITE.url}/posts/${post.slug}`;
  return {
    title: post.title,
    description: post.excerpt || undefined,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: "article",
      url,
      title: post.title,
      description: post.excerpt || undefined,
      publishedTime: post.date.replace(/\./g, "-"),
      authors: [SITE.author],
      tags: post.tags,
    },
    twitter: { card: "summary_large_image", title: post.title, description: post.excerpt || undefined },
  };
}

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();
  const [related, views, series] = await Promise.all([
    getRelatedPosts(post, 4),
    getPostViews(slug),
    post.seriesSlug ? getSeriesContext(post.seriesSlug) : Promise.resolve(null),
  ]);
  return <PostDetailView post={post} locale="ko" related={related} views={views} series={series} />;
}
