import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import {
  getAllPosts,
  getAllCategoriesFlat,
  getAllSeries,
  getAllTags,
  getAllProjectSlugs,
} from "@/lib/queries";
import { isoDate } from "@/lib/seo";
import { registry } from "@/content/algo/registry";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE.url;
  const [posts, categories, series, tags, projects] = await Promise.all([
    getAllPosts(),
    getAllCategoriesFlat(),
    getAllSeries(),
    getAllTags(),
    getAllProjectSlugs(),
  ]);

  // 글이 하나라도 올라오면 목록 페이지도 같이 바뀐다. 가장 최근 글 날짜를 목록의 lastmod 로 쓴다.
  const latest = posts[0] ? isoDate(posts[0]) : undefined;

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: latest, changeFrequency: "daily", priority: 1 },
    { url: `${base}/posts`, lastModified: latest, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/lab`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/algo`, changeFrequency: "weekly", priority: 0.7 },
    ...registry
      .filter((e) => e.status === "ready")
      .map((e) => ({
        url: `${base}/algo/${e.slug}`,
        changeFrequency: "monthly" as const,
        priority: 0.6,
      })),
    { url: `${base}/series`, lastModified: latest, changeFrequency: "weekly", priority: 0.5 },
    { url: `${base}/tags`, lastModified: latest, changeFrequency: "weekly", priority: 0.4 },
  ];

  const postRoutes: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${base}/posts/${p.slug}`,
    lastModified: isoDate(p),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((c) => ({
    url: c.parent_slug
      ? `${base}/posts/c/${c.parent_slug}/${c.slug}`
      : `${base}/posts/c/${c.slug}`,
    lastModified: latest,
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  // 사이트맵은 slug 만 필요하다 — getProjects() 는 프로젝트 본문까지 읽는다.
  const projectRoutes: MetadataRoute.Sitemap = projects.map((slug) => ({
    url: `${base}/lab/${slug}`,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const seriesRoutes: MetadataRoute.Sitemap = series.map((s) => ({
    url: `${base}/series/${s.slug}`,
    lastModified: latest,
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  const tagRoutes: MetadataRoute.Sitemap = tags.map(({ tag }) => ({
    url: `${base}/tags/${encodeURIComponent(tag)}`,
    lastModified: latest,
    changeFrequency: "weekly",
    priority: 0.3,
  }));

  return [
    ...staticRoutes,
    ...postRoutes,
    ...categoryRoutes,
    ...projectRoutes,
    ...seriesRoutes,
    ...tagRoutes,
  ];
}
