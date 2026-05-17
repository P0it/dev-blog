"use client";

import { useEffect, useRef } from "react";

// Giscus (GitHub Discussions 기반 댓글).
// 필요한 env (모두 NEXT_PUBLIC_):
//   NEXT_PUBLIC_GISCUS_REPO          예: P0it/dev-blog
//   NEXT_PUBLIC_GISCUS_REPO_ID
//   NEXT_PUBLIC_GISCUS_CATEGORY      예: Announcements
//   NEXT_PUBLIC_GISCUS_CATEGORY_ID
// https://giscus.app 에서 repo 연결 후 위 4개 값을 발급받아 .env.local에 추가.

export function Comments({ term }: { term: string }) {
  const ref = useRef<HTMLDivElement>(null);

  const repo = process.env.NEXT_PUBLIC_GISCUS_REPO;
  const repoId = process.env.NEXT_PUBLIC_GISCUS_REPO_ID;
  const category = process.env.NEXT_PUBLIC_GISCUS_CATEGORY;
  const categoryId = process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID;
  const configured = !!(repo && repoId && category && categoryId);

  useEffect(() => {
    if (!configured || !ref.current) return;
    if (ref.current.querySelector("iframe.giscus-frame")) return;

    const theme =
      typeof document !== "undefined" &&
      document.documentElement.getAttribute("data-theme") === "dark"
        ? "dark"
        : "light";

    const s = document.createElement("script");
    s.src = "https://giscus.app/client.js";
    s.async = true;
    s.crossOrigin = "anonymous";
    s.setAttribute("data-repo", repo!);
    s.setAttribute("data-repo-id", repoId!);
    s.setAttribute("data-category", category!);
    s.setAttribute("data-category-id", categoryId!);
    s.setAttribute("data-mapping", "specific");
    s.setAttribute("data-term", term);
    s.setAttribute("data-strict", "1");
    s.setAttribute("data-reactions-enabled", "1");
    s.setAttribute("data-emit-metadata", "0");
    s.setAttribute("data-input-position", "top");
    s.setAttribute("data-theme", theme);
    s.setAttribute("data-lang", "ko");
    ref.current.appendChild(s);
  }, [configured, repo, repoId, category, categoryId, term]);

  if (!configured) return null;

  return (
    <div
      style={{
        marginTop: 64,
        paddingTop: 32,
        borderTop: "1px solid var(--line-subtle)",
      }}
    >
      <div className="t-overline" style={{ marginBottom: 16 }}>댓글</div>
      <div ref={ref} />
    </div>
  );
}
