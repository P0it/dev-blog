"use client";

import { useRef, useState } from "react";
import { ImagePlus, ImageUp, X } from "lucide-react";
import { uploadImage } from "@/app/admin/editor/actions";

const pill: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  border: "1px solid var(--line-subtle)",
  borderRadius: 8,
  fontSize: 13,
  fontFamily: "inherit",
  whiteSpace: "nowrap",
};

// 어드민 에디터 — 카드 썸네일 슬롯. 미리보기 없이 버튼만.
// 클릭하면 이미지를 업로드/교체, × 로 제거. 미지정(null)이면 thumb_kind 패턴 폴백.
export function ThumbnailField({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const pick = () => inputRef.current?.click();

  const upload = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("이미지 파일만 가능합니다.");
      return;
    }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { url } = await uploadImage(fd);
      onChange(url);
    } catch (e) {
      alert(`썸네일 업로드 실패: ${(e as Error).message}`);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const fileInput = (
    <input
      ref={inputRef}
      type="file"
      accept="image/*"
      hidden
      onChange={(e) => upload(e.target.files?.[0])}
    />
  );

  if (!value) {
    return (
      <button
        type="button"
        onClick={pick}
        disabled={busy}
        style={{
          ...pill,
          gap: 6,
          padding: "6px 10px",
          background: "transparent",
          color: "var(--fg-neutral)",
          cursor: "pointer",
        }}
      >
        {fileInput}
        <ImagePlus size={14} style={{ color: "var(--fg-alternative)" }} />
        {busy ? "업로드 중…" : "썸네일"}
      </button>
    );
  }

  // 지정됨 — 변경(클릭) + 제거(×) 두 영역을 한 pill 안에.
  return (
    <span style={{ ...pill, color: "var(--fg-strong)" }}>
      {fileInput}
      <button
        type="button"
        onClick={pick}
        disabled={busy}
        title="썸네일 변경"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 6px 6px 10px",
          background: "none",
          border: "none",
          font: "inherit",
          color: "inherit",
          cursor: "pointer",
        }}
      >
        <ImageUp size={14} style={{ color: "var(--fg-primary)" }} />
        {busy ? "업로드 중…" : "썸네일"}
      </button>
      <button
        type="button"
        onClick={() => onChange(null)}
        disabled={busy}
        aria-label="썸네일 제거"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 18,
          height: 18,
          marginRight: 4,
          border: "none",
          borderRadius: 999,
          background: "transparent",
          color: "var(--fg-alternative)",
          cursor: "pointer",
        }}
      >
        <X size={13} strokeWidth={2.5} />
      </button>
    </span>
  );
}
