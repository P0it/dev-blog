import { ChevronDown, ImagePlus } from "lucide-react";
import { Chip } from "@/components/ui/Chip";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: "var(--fg-neutral)", fontWeight: 600, marginBottom: 6 }}>
        {label}
      </div>
      {children}
    </div>
  );
}

const inputBox: React.CSSProperties = {
  padding: "10px 12px",
  background: "var(--bg-base)",
  border: "1px solid var(--line-normal)",
  borderRadius: 10,
  fontSize: 13,
  color: "var(--fg-strong)",
};

export function EditorMetaPanel() {
  return (
    <div
      className="editor-meta"
      style={{
        padding: "24px 20px",
        overflow: "auto",
        borderRight: "1px solid var(--line-subtle)",
        borderLeft: "none",
      }}
    >
      <div className="t-overline" style={{ marginBottom: 14 }}>메타데이터</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <Field label="슬러그">
          <div style={{ ...inputBox, fontFamily: "var(--font-mono)" }}>claude-code-subprocess</div>
          <div style={{ fontSize: 11, color: "var(--fg-alternative)", marginTop: 4, lineHeight: 1.4 }}>
            URL 끝부분 · /posts/claude-code-subprocess
          </div>
        </Field>

        <Field label="요약">
          <div style={{ ...inputBox, lineHeight: 1.5, color: "var(--fg-normal)" }}>
            로컬 어드민에서 직접 CLI를 띄우면 launchd, websocket, 큐 전부 사라진다.
          </div>
        </Field>

        <Field label="카테고리">
          <div style={{ ...inputBox, display: "flex", justifyContent: "space-between" }}>
            <span>개발 / 에이전트</span>
            <ChevronDown size={14} style={{ color: "var(--fg-neutral)" }} />
          </div>
        </Field>

        <Field label="태그">
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
              padding: "10px 12px",
              background: "var(--bg-base)",
              border: "1px solid var(--line-normal)",
              borderRadius: 10,
            }}
          >
            <Chip variant="blue">claude-code</Chip>
            <Chip variant="blue">subprocess</Chip>
            <Chip variant="blue">에이전트</Chip>
            <span style={{ color: "var(--fg-alternative)", fontSize: 13 }}>+ 태그 추가</span>
          </div>
        </Field>

        <Field label="시리즈">
          <div style={{ ...inputBox, display: "flex", justifyContent: "space-between" }}>
            <span>에이전트 인프라 · 2/4</span>
            <ChevronDown size={14} style={{ color: "var(--fg-neutral)" }} />
          </div>
        </Field>

        <Field label="썸네일">
          <div
            style={{
              height: 88,
              borderRadius: 10,
              border: "1px dashed var(--line-strong)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--fg-alternative)",
              fontSize: 13,
            }}
          >
            <ImagePlus size={18} style={{ marginRight: 6 }} />
            이미지 끌어다 놓기
          </div>
        </Field>

        <Field label="발행">
          <div style={{ display: "flex", gap: 6 }}>
            <Chip className="border" >
              <span style={{ color: "var(--fg-strong)" }}>Draft</span>
            </Chip>
            <Chip variant="blue">Published</Chip>
            <Chip>
              <span>Scheduled</span>
            </Chip>
          </div>
        </Field>
      </div>
    </div>
  );
}
