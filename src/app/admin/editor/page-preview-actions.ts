"use server";

import { isAdmin } from "@/lib/auth";
import { highlightPageCode } from "@/lib/page-code";

// 어드민 "실행 미리보기"도 실제 글 화면(PageBodyServer)과 같게 — 코드 블록을 서버에서 칠해 돌려준다.
export async function renderPagePreview(html: string): Promise<string> {
  if (!(await isAdmin())) throw new Error("unauthorized");
  return highlightPageCode(html);
}
