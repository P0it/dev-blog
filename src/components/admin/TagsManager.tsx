"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { renameTag, deleteTag } from "@/app/admin/tags/actions";

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

export function TagsManager({ tags }: { tags: { tag: string; count: number }[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState("");
  const [renaming, setRenaming] = useState<string | null>(null);
  const [to, setTo] = useState("");

  const shown = useMemo(() => {
    const n = q.trim().toLowerCase();
    return n ? tags.filter((t) => t.tag.toLowerCase().includes(n)) : tags;
  }, [tags, q]);

  const fail = (e: unknown) => alert(`에러: ${(e as Error).message}`);

  const doRename = () => {
    if (!renaming) return;
    startTransition(async () => {
      try {
        await renameTag({ from: renaming, to });
        setRenaming(null);
        setTo("");
        router.refresh();
      } catch (e) {
        fail(e);
      }
    });
  };

  const doDelete = (tag: string, count: number) => {
    if (!confirm(`"${tag}" 태그를 글 ${count}개에서 모두 제거할까요?`)) return;
    startTransition(async () => {
      try {
        await deleteTag(tag);
        router.refresh();
      } catch (e) {
        fail(e);
      }
    });
  };

  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ display: "flex", marginBottom: 16 }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="태그 검색"
          style={{ ...inputBox, width: 220 }}
        />
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {shown.length === 0 && (
          <div className="meta" style={{ padding: 24 }}>
            태그가 없습니다.
          </div>
        )}
        {shown.map((t, i) => (
          <div
            key={t.tag}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 18px",
              borderTop: i ? "1px solid var(--line-subtle)" : "none",
            }}
          >
            <div style={{ flex: 1, fontSize: 14, color: "var(--fg-strong)", fontWeight: 500 }}>
              {t.tag}
            </div>
            <Chip variant="default">글 {t.count}</Chip>
            <div style={{ display: "flex", gap: 4 }}>
              <Button
                variant="ghost"
                size="sm"
                disabled={pending}
                onClick={() => {
                  setRenaming(t.tag);
                  setTo(t.tag);
                }}
                title="이름 변경"
              >
                <Pencil size={14} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={pending}
                onClick={() => doDelete(t.tag, t.count)}
                title="삭제"
              >
                <Trash2 size={14} />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {renaming && (
        <div className="modal-scrim" onClick={() => setRenaming(null)}>
          <div
            className="modal"
            style={{ padding: 24 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 4px", fontSize: 18 }}>태그 이름 변경</h3>
            <div className="meta" style={{ marginBottom: 16 }}>
              &quot;{renaming}&quot; 를 포함한 모든 글에 반영됩니다. 같은 이름이 있으면 병합됩니다.
            </div>
            <input
              value={to}
              onChange={(e) => setTo(e.target.value)}
              autoFocus
              style={{ ...inputBox, marginBottom: 20 }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <Button variant="outline" size="sm" onClick={() => setRenaming(null)}>
                취소
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={pending || !to.trim() || to.trim() === renaming}
                onClick={doRename}
              >
                {pending ? "변경 중..." : "변경"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
