import { codeToTokens } from "shiki";
import type { Tape } from "./types";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * 플레이어 코드에 색을 칠한다. 서버에서만 돈다 — Shiki 를 브라우저로 보내지 않는다.
 *
 * 블로그 글 코드 블록(src/lib/page-code.ts)과 같은 One Dark Pro 다. 줄 단위로 쪼개 두는 건
 * 플레이어가 지금 실행 중인 줄 하나만 켜야 해서다.
 */
export async function highlightTape(tape: Tape): Promise<Tape> {
  const { tokens } = await codeToTokens(tape.code.join("\n"), {
    lang: "python",
    theme: "one-dark-pro",
  });
  const html = tokens.map((line) =>
    line.map((t) => `<span style="color:${t.color}">${esc(t.content)}</span>`).join(""),
  );
  return { ...tape, html };
}
