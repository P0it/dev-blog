import Link from "next/link";
import { PublicNav } from "@/components/layout/PublicNav";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <>
      <PublicNav active="" />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "calc(100vh - 64px)",
          padding: 40,
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 480 }}>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 13,
              color: "var(--fg-alternative)",
              marginBottom: 16,
            }}
          >
            404 — not found
          </div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 48,
              lineHeight: 1.1,
              letterSpacing: "-0.025em",
              margin: "0 0 16px",
            }}
          >
            이 글은 아직 쓰지 않았어요.
          </h1>
          <p
            style={{
              fontSize: 16,
              color: "var(--fg-neutral)",
              lineHeight: 1.6,
              margin: "0 0 28px",
            }}
          >
            링크가 바뀌었거나, 발행되지 않은 글일 수 있습니다.
            <br />
            홈에서 최근 글들을 둘러보세요.
          </p>
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            <Link href="/">
              <Button variant="primary">홈으로</Button>
            </Link>
            <Button variant="outline">검색</Button>
          </div>
        </div>
      </div>
    </>
  );
}
