"use client";

import { X } from "lucide-react";
import type { KeyboardEvent } from "react";

/**
 * 쉼표 또는 Enter로 태그를 badge로 확정하는 입력 컴포넌트.
 * 확정된 태그는 `tags` 배열, 입력 중인 텍스트는 `draft` 문자열로 분리해 관리한다.
 */
export function TagInput({
  tags,
  draft,
  onTagsChange,
  onDraftChange,
}: {
  tags: string[];
  draft: string;
  onTagsChange: (tags: string[]) => void;
  onDraftChange: (draft: string) => void;
}) {
  // 쉼표가 섞인 문자열을 분해해 중복 없이 태그로 확정한다.
  const commit = (raw: string) => {
    const parts = raw
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (parts.length) {
      const next = [...tags];
      for (const p of parts) if (!next.includes(p)) next.push(p);
      onTagsChange(next);
    }
    onDraftChange("");
  };

  const removeAt = (i: number) => {
    onTagsChange(tags.filter((_, idx) => idx !== i));
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commit(draft);
    } else if (e.key === "Backspace" && draft === "" && tags.length) {
      e.preventDefault();
      removeAt(tags.length - 1);
    }
  };

  return (
    <div className="tag-input">
      {tags.map((tag, i) => (
        <span key={`${tag}-${i}`} className="tag-badge">
          {tag}
          <button
            type="button"
            onClick={() => removeAt(i)}
            aria-label={`${tag} 태그 삭제`}
          >
            <X size={13} strokeWidth={2.5} />
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => {
          // 쉼표가 입력되면(타이핑·붙여넣기) 즉시 badge로 확정
          const v = e.target.value;
          if (v.includes(",")) commit(v);
          else onDraftChange(v);
        }}
        onKeyDown={onKeyDown}
        onBlur={() => commit(draft)}
        placeholder={
          tags.length ? "태그 추가" : "태그를 입력하세요 (쉼표 또는 Enter로 구분)"
        }
      />
    </div>
  );
}
