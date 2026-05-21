"use client";

import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { uploadImage } from "@/app/admin/editor/actions";

const pillBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  padding: "4px 8px",
  border: "none",
  borderRadius: 6,
  background: "rgba(0,0,0,0.62)",
  color: "#fff",
  fontSize: 12,
  fontFamily: "inherit",
  cursor: "pointer",
  backdropFilter: "blur(4px)",
};

// 어드민 에디터 — 카드 썸네일 전용 슬롯. 클릭 또는 드래그로 이미지 업로드.
// 미지정(null)이면 카드는 thumb_kind 해시 패턴으로 자동 폴백한다.
export function ThumbnailField({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);

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

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    upload(Array.from(e.dataTransfer.files).find((f) => f.type.startsWith("image/")));
  };

  const box: React.CSSProperties = {
    width: 220,
    aspectRatio: "5 / 3",
    borderRadius: 10,
    overflow: "hidden",
  };

  return (
    <div style={{ marginTop: 16 }}>
      <div className="meta" style={{ marginBottom: 6 }}>
        썸네일{value ? "" : " — 미지정 시 자동 패턴"}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => upload(e.target.files?.[0])}
      />
      {value ? (
        <div
          style={{ ...box, position: "relative", border: "1px solid var(--line-subtle)" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="썸네일 미리보기"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
          <div style={{ position: "absolute", top: 6, right: 6, display: "flex", gap: 6 }}>
            <button type="button" onClick={pick} disabled={busy} style={pillBtn}>
              {busy ? "업로드 중…" : "변경"}
            </button>
            <button
              type="button"
              onClick={() => onChange(null)}
              aria-label="썸네일 제거"
              style={{ ...pillBtn, padding: "4px 6px" }}
            >
              <X size={13} />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={pick}
          disabled={busy}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          style={{
            ...box,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            border: `1px dashed ${dragOver ? "var(--fg-strong)" : "var(--line-strong)"}`,
            background: dragOver ? "var(--bg-muted)" : "var(--bg-subtle)",
            color: "var(--fg-neutral)",
            fontSize: 12.5,
            fontFamily: "inherit",
            cursor: "pointer",
          }}
        >
          <ImagePlus size={20} style={{ color: "var(--fg-alternative)" }} />
          {busy ? "업로드 중…" : "썸네일 업로드 · 드래그"}
        </button>
      )}
    </div>
  );
}
