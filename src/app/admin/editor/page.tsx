import { PostEditor } from "@/components/admin/PostEditor";
import { getAllCategoriesFlat, getPostForEditor } from "@/lib/queries";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function EditorPage({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string }>;
}) {
  const { slug } = await searchParams;
  const categories = await getAllCategoriesFlat();
  const post = slug ? await getPostForEditor(slug) : null;

  // 에디터의 날짜 입력 초깃값 — Post 타입은 표시용 'date'만 갖고 있어 원본 ISO를 별도 조회.
  let publishedAt: string | null = null;
  if (post) {
    const { data } = await supabaseServer()
      .from("posts")
      .select("published_at")
      .eq("slug", post.slug)
      .maybeSingle();
    publishedAt = data?.published_at ?? null;
  }

  const initial = post
    ? {
        originalSlug: post.slug,
        title: post.title,
        bodyMd: post.bodyMd ?? "",
        categorySlug: post.categorySlug ?? null,
        tags: post.tags,
        coverImage: post.coverImage ?? null,
        thumbKind: post.thumbKind,
        publishedAt: post.publishedAt ?? null,
        sourceDate: post.sourceDate ?? null,
        status: post.status ?? "draft",
        publishedAt,
      }
    : {
        originalSlug: null,
        title: "",
        bodyMd: "",
        categorySlug: null,
        tags: [],
        coverImage: null,
        thumbKind: null,
        publishedAt: null,
        sourceDate: null,
        status: "draft" as const,
        publishedAt: null,
      };

  return <PostEditor initial={initial} categories={categories} />;
}
