import { getRecentPosts } from "@/lib/queries";

export const revalidate = 60;

const PAGE_MAX = 12;

// 홈에서 스크롤로 이어 받는 최근 글. 홈 자체와 같은 60초 재검증을 쓴다.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const offset = Math.max(0, Math.min(500, Number(searchParams.get("offset")) || 0));
  const limit = Math.max(1, Math.min(PAGE_MAX, Number(searchParams.get("limit")) || 6));

  try {
    const { posts, hasMore } = await getRecentPosts(limit, offset);
    // 카드가 안 쓰는 본문은 빼고 넘긴다. 그냥 넘기면 응답이 글 전문 묶음이 된다.
    const cards = posts.map(({ bodyMd: _bodyMd, bodyMdEn: _bodyMdEn, ...rest }) => rest);
    return Response.json(
      { posts: cards, hasMore },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
    );
  } catch {
    return new Response("db error", { status: 500 });
  }
}
