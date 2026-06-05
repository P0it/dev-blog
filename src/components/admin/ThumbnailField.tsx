"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ImagePlus, ImageUp, Sparkles } from "lucide-react";
import { uploadImage } from "@/app/admin/editor/actions";
import { Thumb } from "@/components/diagram/Thumb";
import { Button } from "@/components/ui/Button";
import { THUMB_KINDS, THUMB_LABELS } from "@/lib/thumb";
import type { ThumbKind } from "@/lib/types";

const pill: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  border: "1px solid var(--line-subtle)",
  borderRadius: 8,
  fontSize: 13,
  fontFamily: "inherit",
  whiteSpace: "nowrap",
};

type ThumbValue = {
  coverImage: string | null;
  coverBrightness: number | null;
  thumbKind: ThumbKind | null;
};

// 어드민 에디터 — 카드 썸네일 슬롯.
// 한 줄 pill 을 누르면 모달이 열려: 이미지를 업로드하거나, 자동 생성 패턴을
// 미리보기로 직접 고른다. 모달 안의 선택은 임시 상태(draft)이고,
// "확인"을 눌러야 반영, "닫기"는 선택을 버린다. 이미지가 있으면 패턴보다 우선.
export function ThumbnailField({
  coverImage,
  coverBrightness,
  thumbKind,
  onChange,
}: {
  coverImage: string | null;
  coverBrightness: number | null;
  thumbKind: ThumbKind | null;
  onChange: (next: ThumbValue) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  // 모달 내부 임시 선택 — 열 때 현재 값으로 초기화, "확인" 시에만 commit.
  const [draftCover, setDraftCover] = useState<string | null>(coverImage);
  const [draftBrightness, setDraftBrightness] = useState<number | null>(coverBrightness);
  const [draftKind, setDraftKind] = useState<ThumbKind | null>(thumbKind);

  const openModal = () => {
    setDraftCover(coverImage);
    setDraftBrightness(coverBrightness);
    setDraftKind(thumbKind);
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onPaste = (e: ClipboardEvent) => {
      const item = Array.from(e.clipboardData?.items ?? []).find((i) =>
        i.type.startsWith("image/"),
      );
      if (!item) return;
      e.preventDefault();
      upload(item.getAsFile() ?? undefined);
    };
    window.addEventListener("keydown", h);
    window.addEventListener("paste", onPaste);
    return () => {
      window.removeEventListener("keydown", h);
      window.removeEventListener("paste", onPaste);
    };
  }, [open]);

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
      const { url, brightness } = await uploadImage(fd);
      setDraftCover(url);
      setDraftBrightness(brightness);
    } catch (e) {
      alert(`썸네일 업로드 실패: ${(e as Error).message}`);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const confirm = () => {
    // 패턴으로 전환했거나 이미지를 제거했다면 brightness 는 무의미 → null.
    const nextBrightness = draftCover ? draftBrightness : null;
    onChange({ coverImage: draftCover, coverBrightness: nextBrightness, thumbKind: draftKind });
    setOpen(false);
  };

  const stateLabel = coverImage
    ? "이미지"
    : thumbKind
      ? THUMB_LABELS[thumbKind]
      : "자동";

  // null = "자동" 타일. 그 뒤로 12개 패턴.
  const tiles: (ThumbKind | null)[] = [null, ...THUMB_KINDS];

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => upload(e.target.files?.[0])}
      />

      <button
        type="button"
        onClick={openModal}
        style={{
          ...pill,
          gap: 6,
          padding: "6px 10px",
          background: "transparent",
          color: "var(--fg-strong)",
          cursor: "pointer",
        }}
      >
        <ImagePlus size={14} style={{ color: "var(--fg-alternative)" }} />
        썸네일
        <span style={{ color: "var(--fg-alternative)", fontSize: 12 }}>
          · {stateLabel}
        </span>
      </button>

      {open && (
        <div className="modal-scrim" onClick={() => setOpen(false)}>
          <div
            className="modal"
            style={{ width: 660, padding: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: "18px 20px 14px" }}>
              <h3 style={{ margin: 0, fontSize: 16 }}>카드 썸네일</h3>
              <div className="meta" style={{ marginTop: 4 }}>
                이미지를 올리거나(클립보드 붙여넣기 ⌘V 가능), 자동 생성 패턴을 직접 고르세요.
              </div>
            </div>

            {/* 이미지 영역 — 있으면 미리보기 + 변경/제거, 없으면 업로드 버튼 */}
            <div style={{ padding: "0 20px" }}>
              {draftCover ? (
                <div
                  style={{
                    display: "flex",
                    gap: 14,
                    alignItems: "center",
                    padding: 12,
                    border: "1px solid var(--line-subtle)",
                    borderRadius: 12,
                  }}
                >
                  <div
                    style={{
                      position: "relative",
                      width: 116,
                      aspectRatio: "5 / 3",
                      borderRadius: 8,
                      overflow: "hidden",
                      flexShrink: 0,
                      border: "1px solid var(--line-subtle)",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={draftCover}
                      alt=""
                      style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--fg-strong)",
                      }}
                    >
                      업로드 이미지 사용 중
                    </div>
                    <div className="meta" style={{ marginTop: 3, fontSize: 12 }}>
                      이미지가 아래 패턴보다 우선 적용됩니다.
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <Button variant="outline" size="sm" onClick={pick} disabled={busy}>
                      {busy ? "업로드 중…" : "변경"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setDraftCover(null); setDraftBrightness(null); }}
                    >
                      제거
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={pick}
                  disabled={busy}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    width: "100%",
                    padding: 16,
                    border: "1px dashed var(--line-normal)",
                    borderRadius: 12,
                    background: "var(--bg-subtle)",
                    color: "var(--fg-neutral)",
                    font: "inherit",
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  <ImageUp size={16} style={{ color: "var(--fg-alternative)" }} />
                  {busy ? "업로드 중…" : "이미지 업로드"}
                </button>
              )}
            </div>

            {/* 패턴 그리드 — 미리보기를 보고 직접 선택 */}
            <div style={{ padding: "18px 20px 4px" }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--fg-neutral)",
                  marginBottom: 10,
                }}
              >
                패턴 {draftCover && "— 고르면 이미지 대신 적용됩니다"}
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: 12,
                  maxHeight: 430,
                  overflowY: "auto",
                }}
              >
                {tiles.map((k) => {
                  const selected = !draftCover && draftKind === k;
                  const label = k ? THUMB_LABELS[k] : "자동";
                  return (
                    <button
                      key={k ?? "__auto__"}
                      type="button"
                      onClick={() => {
                        setDraftCover(null);
                        setDraftBrightness(null);
                        setDraftKind(k);
                      }}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                        padding: 0,
                        border: "none",
                        background: "none",
                        font: "inherit",
                        cursor: "pointer",
                      }}
                    >
                      <div
                        style={{
                          position: "relative",
                          aspectRatio: "5 / 3",
                          borderRadius: 10,
                          overflow: "hidden",
                          border: `2px solid ${
                            selected ? "var(--fg-primary)" : "var(--line-subtle)"
                          }`,
                        }}
                      >
                        {k ? (
                          <Thumb kind={k} fill />
                        ) : (
                          <div
                            style={{
                              position: "absolute",
                              inset: 0,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              background:
                                "linear-gradient(135deg, var(--bg-muted), var(--bg-emphasized))",
                            }}
                          >
                            <Sparkles
                              size={22}
                              style={{ color: "var(--fg-alternative)" }}
                            />
                          </div>
                        )}
                        {selected && (
                          <div
                            style={{
                              position: "absolute",
                              top: 6,
                              right: 6,
                              width: 20,
                              height: 20,
                              borderRadius: 999,
                              background: "var(--bg-primary)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              boxShadow: "0 1px 4px rgba(0,0,0,0.35)",
                            }}
                          >
                            <Check size={13} color="var(--neutral-900)" strokeWidth={3} />
                          </div>
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: 12,
                          textAlign: "center",
                          color: selected
                            ? "var(--fg-strong)"
                            : "var(--fg-neutral)",
                          fontWeight: selected ? 600 : 400,
                        }}
                      >
                        {label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 8,
                padding: "12px 16px",
                marginTop: 6,
                borderTop: "1px solid var(--line-subtle)",
              }}
            >
              <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
                닫기
              </Button>
              <Button variant="primary" size="sm" onClick={confirm} disabled={busy}>
                확인
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
