"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

/**
 * 실험실 상세가 공용으로 쓰는 확대 창.
 *
 * 화면 전체를 덮는 판은 body 로 빼서 그린다. 섹션 안에 두면 조상 요소의 transform
 * 하나에 position: fixed 가 그 요소 안으로 갇힌다.
 *
 * 펼침(카드 안에서 높이가 자라는 방식)을 쓰지 않는 이유: 그리드 한 줄의 높이는
 * 가장 큰 칸이 정한다. 카드 하나를 펼치면 옆 카드들이 같이 늘어나 빈 상자가 된다.
 */
export function LabModal({
  open,
  onClose,
  label,
  className,
  children,
}: {
  open: boolean;
  onClose: () => void;
  /** 스크린리더가 읽을 창 이름 */
  label: string;
  /** 안쪽 판에 덧입힐 클래스 */
  className?: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", esc);
    // 창이 떠 있는 동안 뒤 페이지가 같이 굴러가면 어디를 보고 있었는지 잃는다.
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", esc);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="lab-modal" onClick={onClose} role="presentation">
      <button type="button" className="lab-modal-close" onClick={onClose} aria-label="닫기">
        <X size={16} />
      </button>
      <div
        className={`lab-modal-inner${className ? ` ${className}` : ""}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={label}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
