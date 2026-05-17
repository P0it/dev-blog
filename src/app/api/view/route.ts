import { supabaseServer } from "@/lib/supabase/server";

export async function POST(req: Request) {
  let body: { path?: string; slug?: string };
  try {
    body = await req.json();
  } catch {
    return new Response("bad json", { status: 400 });
  }
  const path = (body.path ?? "").slice(0, 512);
  if (!path || !path.startsWith("/")) {
    return new Response("bad path", { status: 400 });
  }
  const slug = body.slug ? body.slug.slice(0, 256) : null;

  const sb = supabaseServer();
  const { error } = await sb.from("page_views").insert({ path, slug });
  if (error) return new Response("db error", { status: 500 });

  return new Response(null, { status: 204 });
}
