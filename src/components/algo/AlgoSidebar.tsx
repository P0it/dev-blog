"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, ChevronDown, X } from "lucide-react";
import { registry, CATEGORY_ORDER, type AlgoEntry } from "@/content/algo/registry";
import { filterEntries } from "@/lib/algo/search";

/**
 * 좌측 고정 사이드바. **순서가 곧 학습 순서다.**
 *
 * 좁은 화면에서는 상단 토글 뒤로 들어간다 — 출퇴근길에는 본문이 먼저다.
 * 접힘·검색어는 sessionStorage 에 둔다. 못 쓰는 환경이어도 그냥 동작한다.
 */
export function AlgoSidebar() {
  const active = usePathname()?.split("/")[2];
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [closed, setClosed] = useState<Set<string>>(new Set());
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("algo-closed");
      if (saved) setClosed(new Set(JSON.parse(saved)));
    } catch {
      // 사생활 모드 등에서 막힌다. 접힘 기억이 없어도 그만이다
    }
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey) return;
      const el = document.activeElement;
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) return;
      e.preventDefault();
      setOpen(true);
      input.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const toggle = (cat: string) => {
    setClosed((prev) => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      try {
        sessionStorage.setItem("algo-closed", JSON.stringify([...next]));
      } catch {
        // 저장 못 해도 이번 화면에서는 접힌다
      }
      return next;
    });
  };

  const groups = useMemo(() => {
    const hits = filterEntries(registry, q);
    return CATEGORY_ORDER.map((cat) => ({
      cat,
      rows: hits.filter((e) => e.category === cat),
    })).filter((g) => g.rows.length > 0);
  }, [q]);

  const searching = q.trim().length > 0;

  return (
    <>
      <button
        type="button"
        className="algo-sb-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {open ? <X size={16} /> : <Search size={16} />}
        {open ? "닫기" : "알고리즘 목록"}
      </button>

      <nav className="algo-sb" data-open={open} aria-label="알고리즘 목록">
        <div className="algo-sb-search">
          <Search size={14} aria-hidden />
          <input
            ref={input}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="이분탐색 · ㅇㅂㅌㅅ · bisect"
            aria-label="알고리즘 검색"
          />
          <kbd>/</kbd>
        </div>

        {groups.length === 0 && <p className="algo-sb-none">찾는 알고리즘이 없습니다</p>}

        {groups.map(({ cat, rows }) => {
          const folded = !searching && closed.has(cat);
          return (
            <section key={cat} className="algo-sb-group" data-folded={folded}>
              <button type="button" className="algo-sb-cat" onClick={() => toggle(cat)}>
                <ChevronDown size={13} className="algo-sb-chev" aria-hidden />
                <span>{cat}</span>
                <em>{rows.length}</em>
              </button>
              {!folded && (
                <ul>
                  {rows.map((e) => (
                    <li key={e.slug}>
                      <Row entry={e} active={e.slug === active} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}

        <p className="algo-sb-foot">
          {registry.filter((e) => e.status === "ready").length} / {registry.length} 편
        </p>
      </nav>
    </>
  );
}

function Row({ entry, active }: { entry: AlgoEntry; active: boolean }) {
  if (entry.status !== "ready") {
    return (
      <span className="algo-sb-item" data-planned aria-disabled>
        {entry.title}
      </span>
    );
  }
  return (
    <Link
      href={`/algo/${entry.slug}`}
      className="algo-sb-item"
      data-active={active}
      aria-current={active ? "page" : undefined}
    >
      {entry.title}
    </Link>
  );
}
