import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import { getAllPosts, getAllCategoriesFlat } from "@/lib/queries";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE.url;
  const [posts, categories] = await Promise.all([getAllPosts(), getAllCategoriesFlat()]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/posts`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/categories`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/lab`, changeFrequency: "monthly", priority: 0.5 },
  ];

  const postRoutes: MetadataRoute.Sitemap = posts.flatMap((p) => {
    const entries: MetadataRoute.Sitemap = [
      {
        url: `${base}/posts/${p.slug}`,
        lastModified: p.date.replace(/\./g, "-"),
        changeFrequency: "weekly",
        priority: 0.8,
      },
    ];
    if (p.titleEn) {
      entries.push({
        url: `${base}/en/posts/${p.slug}`,
        lastModified: p.translatedAt ?? p.date.replace(/\./g, "-"),
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
    return entries;
  });

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((c) => ({
    url: c.parent_slug
      ? `${base}/categories/${c.parent_slug}/${c.slug}`
      : `${base}/categories/${c.slug}`,
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  return [...staticRoutes, ...postRoutes, ...categoryRoutes];
}
