import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicNav } from "@/components/layout/PublicNav";
import { Footer } from "@/components/layout/Footer";
import { PageBody } from "@/components/post/PageBody";
import { isPageBody } from "@/lib/page-html";

// 개발용 미리보기 — 적재 전 auto-drafts/posts/<slug>.html 원고를 실제 상세 화면과 같은
// 틀(메뉴·본문·푸터)로 띄운다. 캡처·검수용이라 프로덕션에서는 열지 않는다.
export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function PagePreview({ params }: { params: Promise<{ slug: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const { slug } = await params;
  const file = path.join(process.cwd(), "auto-drafts", "posts", `${slug.replace(/[^\w-]/g, "")}.html`);
  if (!existsSync(file)) notFound();
  const body = readFileSync(file, "utf8").replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "");
  if (!isPageBody(body)) notFound();
  return (
    <>
      <PublicNav active="home" locale="ko" switchPath={`/posts/${slug}`} />
      <PageBody html={body} />
      <Footer />
    </>
  );
}
