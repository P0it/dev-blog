import { PostEditor } from "@/components/admin/PostEditor";
import { getAllCategoriesFlat, getPostForEditor } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function EditorPage({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string }>;
}) {
  const { slug } = await searchParams;
  const categories = await getAllCategoriesFlat();
  const post = slug ? await getPostForEditor(slug) : null;

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
        status: post.status ?? "draft",
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
        status: "draft" as const,
      };

  return <PostEditor initial={initial} categories={categories} />;
}
