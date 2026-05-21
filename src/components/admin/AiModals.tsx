"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";

const inputBox: React.CSSProperties = {
  padding: "10px 12px",
  background: "var(--bg-base)",
  border: "1px solid var(--line-normal)",
  borderRadius: 10,
  fontSize: 13,
  color: "var(--fg-strong)",
  width: "100%",
  outline: "none",
  fontFamily: "inherit",
};

// 부모는 {open && <...Modal/>} 로 마운트/언마운트 → 매번 새 상태.
function useEsc(onClose: () => void) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
}

const confirmDiscard = () =>
  confirm("입력한 내용이 저장되지 않고 사라집니다. 닫을까요?");

export function AiDraftModal({
  busy,
  title = "URL로 초안 생성",
  desc = "YouTube·GitHub·Anthropic 등 링크를 넣으면 로컬 AI 워커가 포스팅 초안을 만듭니다.",
  submitLabel = "초안 요청",
  onClose,
  onSubmit,
}: {
  busy: boolean;
  title?: string;
  desc?: string;
  submitLabel?: string;
  onClose: () => void;
  onSubmit: (v: { url: string; note: string }) => void;
}) {
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");

  const tryClose = () => {
    if ((url.trim() || note.trim()) && !confirmDiscard()) return;
    onClose();
  };
  useEsc(tryClose);

  return (
    <div className="modal-scrim" onClick={tryClose}>
      <div className="modal" style={{ padding: 24 }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ margin: "0 0 4px", fontSize: 18 }}>{title}</h3>
        <div className="meta" style={{ marginBottom: 16 }}>
          {desc}
        </div>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://..."
          autoFocus
          style={{ ...inputBox, marginBottom: 10 }}
        />
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="요청 메모(선택) — 강조할 점, 톤 등"
          rows={3}
          style={{ ...inputBox, resize: "vertical", marginBottom: 16 }}
        />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Button variant="outline" size="sm" onClick={tryClose}>
            취소
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={busy || !url.trim()}
            onClick={() => onSubmit({ url: url.trim(), note: note.trim() })}
          >
            {busy ? "요청 중..." : submitLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function AiReviseModal({
  busy,
  targetLabel,
  onClose,
  onSubmit,
}: {
  busy: boolean;
  targetLabel: string;
  onClose: () => void;
  onSubmit: (feedback: string) => void;
}) {
  const [feedback, setFeedback] = useState("");

  const tryClose = () => {
    if (feedback.trim() && !confirmDiscard()) return;
    onClose();
  };
  useEsc(tryClose);

  return (
    <div className="modal-scrim" onClick={tryClose}>
      <div className="modal" style={{ padding: 24 }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ margin: "0 0 4px", fontSize: 18 }}>AI 개선 요청</h3>
        <div className="meta" style={{ marginBottom: 16 }}>
          {targetLabel} — 피드백을 적으면 워커가 그대로 반영해 다시 작성합니다.
        </div>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="예) 도입 인용구를 더 짧게, 마지막 헤드라인은 시사점 중심으로"
          rows={5}
          autoFocus
          style={{ ...inputBox, resize: "vertical", marginBottom: 16 }}
        />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Button variant="outline" size="sm" onClick={tryClose}>
            취소
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={busy || !feedback.trim()}
            onClick={() => onSubmit(feedback.trim())}
          >
            {busy ? "요청 중..." : "개선 요청"}
          </Button>
        </div>
      </div>
    </div>
  );
}
