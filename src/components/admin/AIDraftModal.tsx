"use client";

import { useRouter, usePathname } from "next/navigation";
import { Sparkles, Info } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";

export function AIDraftModal() {
  const router = useRouter();
  const pathname = usePathname();

  const close = () => router.replace(pathname);

  return (
    <div
      className="modal-scrim"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="modal" style={{ width: 580 }}>
        <div style={{ padding: "24px 28px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <span
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                background: "var(--bg-accent-soft)",
                color: "var(--purple-600)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Sparkles size={16} />
            </span>
            <h3 style={{ margin: 0, fontSize: 18 }}>URL로 초안 만들기</h3>
          </div>
          <p
            style={{
              color: "var(--fg-neutral)",
              fontSize: 14,
              margin: "0 0 20px",
              lineHeight: 1.55,
            }}
          >
            YouTube 또는 일반 웹 URL을 붙여 넣으세요. Claude가 추출하고 한국어 초안으로 정리합니다.
          </p>
        </div>
        <div style={{ padding: "0 28px 24px" }}>
          <div style={{ fontSize: 12, color: "var(--fg-neutral)", fontWeight: 600, marginBottom: 6 }}>
            참고 URL <span style={{ color: "var(--fg-alternative)" }}>(여러 개면 줄바꿈)</span>
          </div>
          <div
            style={{
              padding: "12px 14px",
              background: "var(--bg-subtle)",
              border: "1px solid var(--line-normal)",
              borderRadius: 12,
              fontSize: 13,
              fontFamily: "var(--font-mono)",
              lineHeight: 1.7,
              minHeight: 96,
            }}
          >
            <div>https://youtube.com/watch?v=dQw4w9</div>
            <div style={{ color: "var(--fg-primary)" }}>
              https://anthropic.com/news/claude-routines
            </div>
            <div style={{ color: "var(--fg-alternative)" }}>https://docs.claude.com/code/sdk</div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
              marginTop: 20,
            }}
          >
            <div>
              <div
                style={{ fontSize: 12, color: "var(--fg-neutral)", fontWeight: 600, marginBottom: 6 }}
              >
                톤
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <Chip variant="blue">분석적</Chip>
                <Chip>요약</Chip>
                <Chip>사이버레카</Chip>
              </div>
            </div>
            <div>
              <div
                style={{ fontSize: 12, color: "var(--fg-neutral)", fontWeight: 600, marginBottom: 6 }}
              >
                길이
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <Chip>짧게</Chip>
                <Chip variant="blue">보통</Chip>
                <Chip>길게</Chip>
              </div>
            </div>
          </div>

          <div
            style={{
              padding: "12px 14px",
              background: "var(--bg-subtle)",
              borderRadius: 10,
              marginTop: 20,
              display: "flex",
              gap: 10,
              alignItems: "flex-start",
            }}
          >
            <Info size={14} style={{ color: "var(--fg-neutral)", marginTop: 2 }} />
            <div style={{ fontSize: 13, color: "var(--fg-neutral)", lineHeight: 1.5 }}>
              초안을 그대로 발행하지 않고 본인의 분석을 더하는 게 작성 원칙입니다.{" "}
              <strong style={{ color: "var(--fg-strong)" }}>Claude Max</strong> · 비용 0.
            </div>
          </div>
        </div>
        <div
          style={{
            padding: "16px 28px",
            borderTop: "1px solid var(--line-subtle)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "var(--bg-subtle)",
          }}
        >
          <span className="meta">예상 30~60초</span>
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="ghost" size="sm" onClick={close}>
              취소
            </Button>
            <Button variant="primary" size="sm">
              <Sparkles size={14} />
              생성하기
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
