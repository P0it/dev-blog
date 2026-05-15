import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CategoryGroup } from "@/lib/types";
import type { CategoryRow } from "./types";

// Public read: tree of top-level categories with their children and post counts.
// Counts include only published posts.
export async function getCategoryTree(): Promise<CategoryGroup[]> {
  const supabase = await createSupabaseServerClient();

  const [{ data: cats, error: catErr }, { data: counts, error: countErr }] = await Promise.all([
    supabase
      .from("categories")
      .select("id, slug, label, parent_id, sort_order")
      .order("sort_order", { ascending: true }),
    supabase
      .from("posts")
      .select("category_id")
      .eq("status", "published"),
  ]);

  if (catErr) throw catErr;
  if (countErr) throw countErr;

  const rows = (cats ?? []) as CategoryRow[];
  const countByCategory = new Map<string, number>();
  for (const { category_id } of (counts ?? []) as { category_id: string | null }[]) {
    if (!category_id) continue;
    countByCategory.set(category_id, (countByCategory.get(category_id) ?? 0) + 1);
  }

  const roots = rows.filter((r) => r.parent_id === null);
  const childrenByParent = new Map<string, CategoryRow[]>();
  for (const r of rows) {
    if (r.parent_id) {
      const arr = childrenByParent.get(r.parent_id) ?? [];
      arr.push(r);
      childrenByParent.set(r.parent_id, arr);
    }
  }

  return roots.map((root) => {
    const children = childrenByParent.get(root.id) ?? [];
    const childCount = children.reduce(
      (sum, c) => sum + (countByCategory.get(c.id) ?? 0),
      0,
    );
    const ownCount = countByCategory.get(root.id) ?? 0;
    return {
      slug: root.slug,
      label: root.label,
      count: ownCount + childCount,
      expanded: true,
      children: children.map((c) => ({
        slug: c.slug,
        label: c.label,
        count: countByCategory.get(c.id) ?? 0,
      })),
    };
  });
}
