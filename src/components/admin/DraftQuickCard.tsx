"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { AiDraftModal } from "@/components/admin/AiModals";
import { requestDraftFromUrl } from "@/app/admin/posts/actions";

// 대시보드 "URL로 초안" 카드 — 다른 빠른액션 카드와 시각 동일하지만
// 링크 대신 그 자리에서 AiDraftModal을 연다.
export function DraftQuickCard() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const onSubmit = (v: { url: string; note: string }) => {
    startTransition(async () => {
      try {
        await requestDraftFromUrl(v);
        setOpen(false);
        router.push("/admin/posts");
      } catch (e) {
        alert(`에러: ${(e as Error).message}`);
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="card"
        style={{
          padding: 18,
          cursor: "pointer",
          display: "block",
          textAlign: "left",
          width: "100%",
          color: "inherit",
          background: "var(--bg-elevated)",
          font: "inherit",
        }}
      >
        <Sparkles size={18} style={{ color: "var(--fg-strong)" }} />
        <div style={{ fontWeight: 600, fontSize: 14, marginTop: 8 }}>URL로 초안</div>
        <div className="meta" style={{ marginTop: 2 }}>AI 초안 요청</div>
      </button>
      {open && (
        <AiDraftModal
          busy={pending}
          onClose={() => setOpen(false)}
          onSubmit={onSubmit}
        />
      )}
    </>
  );
}
