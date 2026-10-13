"use client";

import { Button } from "@/components/ui/Button";

// 블록 AI 결과 비교. 글의 <style> 이 이미 문서에 있으므로 .post-page 안에 그리면 실제 모양으로 보인다.
// 스크립트 훅이 빠졌으면 경고하지만 수락은 막지 않는다(훅 추출이 정규식이라 놓치거나 과하게 잡을 수 있다).
export function BlockAiCompare({
  before,
  after,
  missing,
  onAccept,
  onReject,
}: {
  before: string;
  after: string;
  missing: string[];
  onAccept: () => void;
  onReject: () => void;
}) {
  const pane = (title: string, html: string) => (
    <div style={{ minWidth: 0 }}>
      <div className="meta" style={{ fontSize: 12, marginBottom: 6 }}>{title}</div>
      <div className="post-page" style={{ maxHeight: "60vh", overflow: "auto", border: "1px solid var(--line-subtle)", borderRadius: 8 }}
        dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
  return (
    <div className="modal-scrim" onClick={onReject}>
      <div className="modal" data-pve-ai-compare style={{ padding: 24, width: "min(1200px, 94vw)", maxWidth: "94vw" }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ margin: "0 0 12px", fontSize: 18 }}>AI 제안 비교</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {pane("지금", before)}
          {pane("AI 제안", after)}
        </div>
        {missing.length > 0 && (
          <div role="alert" style={{ color: "var(--danger, #d33)", fontSize: 13, marginTop: 12 }}>
            ⚠ 스크립트가 쓰는 표시가 빠졌습니다: {missing.join(", ")} — 수락하면 인터랙션이 멈출 수 있습니다. 실행 미리보기로 확인하세요.
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
          <Button variant="outline" size="sm" onClick={onReject}>버리기</Button>
          <Button variant="primary" size="sm" onClick={onAccept}>이 블록에 적용</Button>
        </div>
      </div>
    </div>
  );
}
