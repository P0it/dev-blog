import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Project } from "@/lib/types";
import type { ProjectRow } from "./types";

export async function getProjects(): Promise<Project[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("projects")
    .select("slug, name, year, description, plan, build, stack, url, host, thumb_kind, sort_order")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  const rows = (data ?? []) as Omit<ProjectRow, "id" | "created_at">[];
  return rows.map((r) => ({
    k: r.thumb_kind ?? "a",
    name: r.name,
    year: r.year,
    desc: r.description,
    plan: r.plan ?? "",
    build: r.build ?? "",
    stack: r.stack,
    url: r.url ?? "",
    host: r.host ?? "vercel",
  }));
}
