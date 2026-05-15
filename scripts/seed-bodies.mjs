// 기존 글 몇 개에 body_md를 채워넣어 마크다운 렌더링 데모.
// 실행: npm run seed:bodies

import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  { auth: { persistSession: false } },
);

const bodies = {
  "claude-code-subprocess": `
> 로컬 어드민에서 직접 CLI를 띄우면 launchd, websocket, 큐 전부 사라진다.

## 한 줄 결론

AI 호출을 워커로 빼는 대신, **요청한 그 프로세스가 Claude CLI를 직접 spawn** 한다. 1인 도구에서는 이게 거의 항상 더 단순하다.

## 왜 워커를 만들고 싶어지는가

"AI 호출은 30초 걸리니까 큐로 빼야지." 자연스러운 첫 직관이다. 하지만 이 직관은 보통 두 가정에 의존한다 —

1. 호출이 자주 일어난다
2. 호출자가 죽으면 안 된다

1인 도구는 둘 다 보통 거짓이다.

## 구조

\`\`\`
[Browser] → [Next.js Route Handler] → spawn("claude", [...]) → stdout
\`\`\`

큐 없음. 데몬 없음. 호출 끝나면 프로세스도 같이 사라진다.

## 코드

\`\`\`typescript
import { spawn } from "node:child_process";

export async function POST(req: Request) {
  const { urls, tone } = await req.json();
  const content = await extractContent(urls);

  // Claude Code as a subprocess — no API key needed
  const claude = spawn("claude", ["-p", SYSTEM_PROMPT + content]);
  const draft = await collectStdout(claude);

  return Response.json({ draft });
}
\`\`\`

### 스트리밍 처리

\`claude\` 프로세스의 stdout을 그대로 \`Response\`로 흘리면 브라우저에서 토큰 단위로 표시할 수 있다. ReadableStream 한 번만 만들면 끝.

## 주의할 점

- Mac이 꺼지면 어드민도 죽는다 — 1인 도구라면 OK.
- 긴 호출은 Next.js 핸들러 타임아웃에 걸린다. 60초 안에 끝낼 수 있게 프롬프트를 잘게 자르거나, Background API로 옮긴다.
- CLI 인증 토큰은 \`~/.claude\` 안에 들어 있다 — 컨테이너로 옮길 때 함께 마운트.
`.trim(),

  "mcp-ecosystem": `
> 도구 발견, 권한, 그리고 작은 프로토콜이 어디까지 갈 수 있는지.

## MCP가 푸는 문제

LLM에 도구를 붙이는 일은 매번 다시 발명되어 왔다. function calling 스펙, OpenAPI 변환, 각 IDE마다 다른 플러그인 인터페이스. **MCP는 "도구를 노출하는 표준 한 가지"** 를 정한다.

## 지금 보이는 변화

1. **터미널 도구가 MCP 서버로 노출된다** — git, fs, sqlite 같은 것들이 thin wrapper로.
2. **권한 모델이 도구 단위가 된다** — "이 도구는 어디까지 허용?" 이 UI에 들어옴.
3. **에이전트가 도구 목록을 검색한다** — 사람이 import하는 게 아니라.

## 작은 프로토콜의 힘

MCP 스펙은 일부러 작다. JSON-RPC + stdio/sse 두 전송. 이게 의외로 충분하다.
`.trim(),

  "news-briefing-system": `
> Claude Max + macOS launchd 만으로 만든 1인용 뉴스레터 시스템.

## 동작 요약

매일 06:00 KST에 launchd가 노트북에서 Node 스크립트를 깨운다. 스크립트는 8개 섹션(시사·경제·테크·...)별로 Claude를 호출해서 요약을 받고, KakaoTalk 알림톡 API로 한 메시지를 보낸다.

## 왜 launchd인가

cron 대신 launchd를 쓴 이유는 **노트북이 잠들어 있어도 깨우는** \`StartCalendarInterval\` 옵션 때문. 항상 켜져 있는 서버가 필요 없다.

## 비용

- Claude Max: 정액제 (이미 쓰는 중)
- KakaoTalk 알림톡: 메시지당 약 ₩9
- 서버: $0

월 약 ₩300.
`.trim(),
};

async function run() {
  for (const [slug, md] of Object.entries(bodies)) {
    const { error } = await sb
      .from("posts")
      .update({ body_md: md })
      .eq("slug", slug);
    if (error) throw error;
    console.log(`→ updated body for ${slug}`);
  }
  console.log("✅ done");
}

run().catch((e) => { console.error("❌", e); process.exit(1); });
