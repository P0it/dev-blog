import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // 어드민·내부 도구·API 는 색인 대상이 아니고,
        // /search 는 쿼리마다 URL 이 갈라져 얇은 중복 페이지를 만든다.
        disallow: ["/admin", "/admin/", "/api/", "/internal/", "/search"],
      },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
