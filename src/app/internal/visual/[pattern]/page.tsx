import type { Metadata } from "next";
import { visualSchema } from "@/components/visuals/types";
import { VisualRenderer, isVisualPattern } from "@/components/visuals/registry";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function decodeData(raw: string | undefined): unknown {
  if (!raw) return null;
  try {
    return JSON.parse(Buffer.from(raw, "base64url").toString("utf-8"));
  } catch {
    return null;
  }
}

function VisualError({ message }: { message: string }) {
  return (
    <div
      data-visual-error
      style={{
        margin: 40,
        padding: "16px 20px",
        borderRadius: 12,
        border: "1px solid var(--diag-red-stroke)",
        background: "var(--diag-red-fill)",
        color: "var(--fg-strong)",
        fontFamily: "var(--font-mono)",
        fontSize: 14,
        maxWidth: 620,
      }}
    >
      시각자료 렌더 오류: {message}
    </div>
  );
}

/**
 * 워커가 Playwright 로 여는 시각자료 렌더 전용 라우트.
 * `[data-visual-root]` 엘리먼트만 스크린샷한다. 검증 실패 시 그 엘리먼트를
 * 렌더하지 않으므로 워커가 timeout 으로 실패를 감지한다.
 */
export default async function VisualRenderPage({
  params,
  searchParams,
}: {
  params: Promise<{ pattern: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { pattern } = await params;
  const sp = await searchParams;

  // 프로덕션에서는 토큰 일치 시에만 렌더
  if (process.env.NODE_ENV === "production") {
    const expected = process.env.INTERNAL_VISUAL_TOKEN;
    const provided = typeof sp.t === "string" ? sp.t : "";
    if (!expected || provided !== expected) {
      return <VisualError message="접근 토큰이 올바르지 않습니다." />;
    }
  }

  if (!isVisualPattern(pattern)) {
    return <VisualError message={`알 수 없는 패턴: ${pattern}`} />;
  }

  const decoded = decodeData(typeof sp.data === "string" ? sp.data : undefined);
  if (decoded === null) {
    return <VisualError message="data 파라미터를 디코드할 수 없습니다." />;
  }

  const parsed = visualSchema.safeParse(decoded);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return (
      <VisualError
        message={`스키마 검증 실패 — ${issue?.path.join(".")}: ${issue?.message}`}
      />
    );
  }
  if (parsed.data.pattern !== pattern) {
    return (
      <VisualError message="URL 패턴과 data.pattern 이 일치하지 않습니다." />
    );
  }

  return (
    <div
      data-visual-root
      style={{ display: "inline-block", padding: 48, background: "transparent" }}
    >
      <VisualRenderer spec={parsed.data} />
    </div>
  );
}
