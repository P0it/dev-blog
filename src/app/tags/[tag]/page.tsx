import type { Metadata } from "next";
import Link from "next/link";
import { permanentRedirect } from "next/navigation";
import { PublicNav } from "@/components/layout/PublicNav";
import { Footer } from "@/components/layout/Footer";
import { Chip } from "@/components/ui/Chip";
import { CoverThumb } from "@/components/post/CoverThumb";
import { getAllTags, getPostsByTag } from "@/lib/queries";
import { SITE } from "@/lib/site";
import { breadcrumbJsonLd } from "@/lib/seo";
import { tagKey } from "@/lib/tags";
import { JsonLd } from "@/components/seo/JsonLd";

export const revalidate = 60;

export async function generateStaticParams() {
  const tags = await getAllTags();
  return tags.map(({ tag }) => ({ tag: encodeURIComponent(tag) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tag: string }>;
}): Promise<Metadata> {
  const { tag } = await params;
  const decoded = decodeURIComponent(tag);
  const url = `${SITE.url}/tags/${encodeURIComponent(decoded)}`;
  const description = `"${decoded}" 태그가 달린 글`;
  return {
    title: `#${decoded}`,
    description,
    alternates: { canonical: url },
    openGraph: { type: "website", url, title: `#${decoded}`, description },
  };
}

export default async function TagPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;
  const decoded = decodeURIComponent(tag);

  // 표기를 통합하기 전 주소(/tags/AI 등)로 들어오면 정규 표기로 영구 이동시킨다.
  // 안 그러면 옛 주소가 빈 태그 페이지로 남아 중복·빈 페이지가 색인된다.
  const all = await getAllTags();
  const canonical = all.find((t) => tagKey(t.tag) === tagKey(decoded))?.tag;
  if (canonical && canonical !== decoded) {
    permanentRedirect(`/tags/${encodeURIComponent(canonical)}`);
  }

  const posts = await getPostsByTag(decoded);

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: SITE.name, path: "/" },
          { name: "태그", path: "/tags" },
          { name: `#${decoded}`, path: `/tags/${encodeURIComponent(decoded)}` },
        ])}
      />
      <PublicNav active="" locale="ko" switchPath={`/tags/${tag}`} />
      <div className="container-wide" style={{ paddingTop: 56, paddingBottom: 80 }}>
        <div className="meta" style={{ marginBottom: 6 }}>
          <Link href="/tags" style={{ color: "inherit" }}>태그</Link> / #{decoded}
        </div>
        <h1 style={{ fontSize: 36, margin: 0, letterSpacing: "-0.02em" }}>#{decoded}</h1>
        <p style={{ color: "var(--fg-neutral)", fontSize: 15, marginTop: 8 }}>
          {posts.length === 0 ? "글이 없습니다." : `${posts.length}편`}
        </p>

        <div style={{ marginTop: 32 }}>
          {posts.map((p) => (
            <div key={p.slug} className="post-card">
              <div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                  <Chip variant="outline">{p.category}</Chip>
                </div>
                <Link href={`/posts/${p.slug}`} style={{ color: "inherit" }}>
                  <h3>{p.title}</h3>
                </Link>
                {p.excerpt && <p>{p.excerpt}</p>}
                {p.tags.length > 0 && (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {p.tags.map((t) => (
                      <Link key={t} href={`/tags/${encodeURIComponent(t)}`}>
                        <Chip variant={t === decoded ? "blue" : "default"}>{t}</Chip>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              <Link href={`/posts/${p.slug}`} aria-label={p.title}>
                <CoverThumb post={p} />
              </Link>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </>
  );
}
