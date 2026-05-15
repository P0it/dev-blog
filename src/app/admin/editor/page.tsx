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
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        bodyMd: post.bodyMd ?? "",
        categorySlug: post.categorySlug ?? null,
        tags: post.tags,
        thumbKind: post.thumbKind,
        isFeatured: post.isFeatured ?? false,
        readingMin: post.readingMin,
        status: post.status ?? "draft",
      }
    : {
        originalSlug: null,
        slug: "",
        title: "",
        excerpt: "",
        bodyMd: "",
        categorySlug: null,
        tags: [],
        thumbKind: "a",
        isFeatured: false,
        readingMin: "",
        status: "draft" as const,
      };

  return <PostEditor initial={initial} categories={categories} />;
}
