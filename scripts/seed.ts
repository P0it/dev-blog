/**
 * Seed Supabase with the mock data currently in src/data/*.
 * Usage:
 *   1. Make sure .env.local has NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 *   2. Run the SQL in supabase/migrations/0001_init.sql against the project
 *   3. npm run db:seed
 *
 * Idempotent: upserts by slug.
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

import { categoryGroups } from "../src/data/categories";
import { featuredPosts, recentPosts, archive2026Extra, archive2025 } from "../src/data/posts";
import { projects } from "../src/data/projects";
import type { Post } from "../src/lib/types";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function parseDateToISO(d: string): string {
  // mock dates are "YYYY.MM.DD"
  const [y, m, day] = d.split(".");
  return new Date(Date.UTC(Number(y), Number(m) - 1, Number(day))).toISOString();
}

function slugifyTag(label: string): string {
  return label
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{Letter}\p{Number}-]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

async function seedCategories() {
  console.log("→ categories");
  // 1) parents first so children can reference them
  for (let i = 0; i < categoryGroups.length; i++) {
    const g = categoryGroups[i];
    const { error } = await supabase
      .from("categories")
      .upsert({ slug: g.slug, label: g.label, parent_id: null, sort_order: i }, { onConflict: "slug" });
    if (error) throw error;
  }
  // 2) lookup parent ids
  const { data: parents, error: pe } = await supabase
    .from("categories")
    .select("id, slug")
    .is("parent_id", null);
  if (pe) throw pe;
  const parentBySlug = new Map((parents ?? []).map((p) => [p.slug, p.id]));

  // 3) children
  for (const g of categoryGroups) {
    for (let i = 0; i < g.children.length; i++) {
      const c = g.children[i];
      const { error } = await supabase.from("categories").upsert(
        {
          slug: c.slug,
          label: c.label,
          parent_id: parentBySlug.get(g.slug) ?? null,
          sort_order: i,
        },
        { onConflict: "slug" },
      );
      if (error) throw error;
    }
  }
}

async function seedProjects() {
  console.log("→ projects");
  for (let i = 0; i < projects.length; i++) {
    const p = projects[i];
    const slug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    const { error } = await supabase.from("projects").upsert(
      {
        slug,
        name: p.name,
        year: p.year,
        description: p.desc,
        plan: p.plan,
        build: p.build,
        stack: p.stack,
        url: p.url,
        host: p.host,
        thumb_kind: p.k,
        sort_order: i,
      },
      { onConflict: "slug" },
    );
    if (error) throw error;
  }
}

async function loadCategoryIdByLabel(): Promise<Map<string, string>> {
  const { data, error } = await supabase.from("categories").select("id, label");
  if (error) throw error;
  return new Map((data ?? []).map((c) => [c.label, c.id]));
}

async function upsertTags(labels: string[]): Promise<Map<string, string>> {
  const unique = Array.from(new Set(labels));
  for (const label of unique) {
    const slug = slugifyTag(label);
    const { error } = await supabase
      .from("tags")
      .upsert({ slug, label }, { onConflict: "slug" });
    if (error) throw error;
  }
  const { data, error } = await supabase.from("tags").select("id, label");
  if (error) throw error;
  return new Map((data ?? []).map((t) => [t.label, t.id]));
}

async function seedPosts() {
  console.log("→ posts");
  const categoryByLabel = await loadCategoryIdByLabel();

  const fullPosts: Post[] = [...featuredPosts, ...recentPosts];
  const allTagLabels = fullPosts.flatMap((p) => p.tags);
  const tagIdByLabel = await upsertTags(allTagLabels);

  for (const p of fullPosts) {
    const publishedAt = parseDateToISO(p.date);
    const reading = Number((p.readingMin.match(/\d+/) ?? ["0"])[0]) || null;
    const { data: upserted, error } = await supabase
      .from("posts")
      .upsert(
        {
          slug: p.slug,
          title: p.title,
          excerpt: p.excerpt,
          body_md: `# ${p.title}\n\n${p.excerpt}\n\n_본문은 어드민에서 작성합니다._\n`,
          category_id: categoryByLabel.get(p.category) ?? null,
          status: "published",
          published_at: publishedAt,
          reading_min: reading,
          thumb_kind: p.thumbKind,
          is_featured: Boolean(p.isFeatured),
        },
        { onConflict: "slug" },
      )
      .select("id")
      .single();
    if (error) throw error;
    const postId = upserted!.id;

    // tags
    await supabase.from("post_tags").delete().eq("post_id", postId);
    const tagRows = p.tags
      .map((label) => tagIdByLabel.get(label))
      .filter((id): id is string => Boolean(id))
      .map((tag_id) => ({ post_id: postId, tag_id }));
    if (tagRows.length) {
      const { error: tErr } = await supabase.from("post_tags").insert(tagRows);
      if (tErr) throw tErr;
    }

    // featured chips
    await supabase.from("post_featured_chips").delete().eq("post_id", postId);
    if (p.featuredChips?.length) {
      const chipRows = p.featuredChips.map((c, i) => ({
        post_id: postId,
        position: i,
        variant: c.variant,
        label: c.label,
      }));
      const { error: cErr } = await supabase.from("post_featured_chips").insert(chipRows);
      if (cErr) throw cErr;
    }
  }

  // archive-only stubs (no body, just metadata)
  const archiveStubs = [...archive2026Extra, ...archive2025];
  for (const a of archiveStubs) {
    const publishedAt = parseDateToISO(a.date);
    const { error } = await supabase
      .from("posts")
      .upsert(
        {
          slug: a.slug,
          title: a.title,
          excerpt: "",
          body_md: "",
          category_id: categoryByLabel.get(a.category) ?? null,
          status: "published",
          published_at: publishedAt,
        },
        { onConflict: "slug" },
      );
    if (error) throw error;
  }
}

async function main() {
  console.log(`Seeding ${url}`);
  await seedCategories();
  await seedProjects();
  await seedPosts();
  console.log("✓ seed complete");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
