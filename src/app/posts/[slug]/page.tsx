import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllPostSlugs, getPostBySlug, getRelatedPosts, getPostViews, getSeriesContext, getPostGraph } from "@/lib/queries";
import { PostDetailView } from "@/components/page/PostDetailView";
import { SITE } from "@/lib/site";
import { blogPostingJsonLd, breadcrumbJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

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
  const [related, views, series, graph] = await Promise.all([
    getRelatedPosts(post, 4),
    getPostViews(slug),
    post.seriesSlug ? getSeriesContext(post.seriesSlug) : Promise.resolve(null),
    getPostGraph(),
  ]);
  const crumbs = [
    { name: SITE.name, path: "/" },
    { name: "전체 글", path: "/posts" },
    ...(post.categorySlug ? [{ name: post.category, path: `/posts/c/${post.categorySlug}` }] : []),
    { name: post.title, path: `/posts/${post.slug}` },
  ];

  return (
    <>
      <JsonLd data={[blogPostingJsonLd(post), breadcrumbJsonLd(crumbs)]} />
      <PostDetailView post={post} locale="ko" related={related} views={views} series={series} graph={graph} />
    </>
  );
}
