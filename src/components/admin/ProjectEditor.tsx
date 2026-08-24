"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { AdminTopbar } from "@/components/layout/AdminTopbar";
import { Button } from "@/components/ui/Button";
import { TagInput } from "@/components/admin/TagInput";
import { MarkdownPreview } from "@/components/post/MarkdownPreview";
import {
  saveProjectDraft,
  publishProject,
  type ProjectInput,
} from "@/app/admin/projects/actions";
import type { ProjectHost } from "@/lib/types";

// 규약이 정한 섹션 뼈대. 새 프로젝트는 이걸 깔고 시작해야 제목을 손으로 안 외운다.
const BODY_TEMPLATE = `## 제품 소개

## 화면

### 

**파일** 

## 데이터와 API

### 

**용도** 
**방식** 

## 구조

\`\`\`mermaid
flowchart LR
  A[입력] --> B[처리] --> C[출력]
\`\`\`

### 단계

## 구상

- [ ] 

## 기획

**문제** 
**사용자** 
**넣지 않은 것** 

## 유저 플로우

### 

**갈라짐**  → 

## 개발 과정

### 1. 

**붙인 것** 

## 시행착오

### 케이스 제목

**증상** — 

**시도** — 

**결론** — 

## 남은 것

- 
`;

const HOSTS: ProjectHost[] = ["vercel", "cloudflare", "local", "none"];
const STATUSES = ["운영중", "실험중", "중단"];

const field: React.CSSProperties = {
  padding: "8px 10px",
  background: "var(--bg-base)",
  border: "1px solid var(--line-normal)",
  borderRadius: 8,
  fontSize: 13,
  color: "var(--fg-strong)",
  width: "100%",
  outline: "none",
  fontFamily: "inherit",
};

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="t-overline" style={{ marginBottom: 4 }}>
      {children}
    </div>
  );
}

export type ProjectEditorInitial = {
  originalSlug: string | null;
  slug: string;
  name: string;
  year: string;
  tagline: string;
  logoUrl: string;
  logoBg: string;
  status: string;
  url: string;
  host: ProjectHost;
  stack: string[];
  bodyMd: string;
  visibility: "draft" | "published";
};

export function ProjectEditor({ initial }: { initial: ProjectEditorInitial }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [slug, setSlug] = useState(initial.slug);
  const [name, setName] = useState(initial.name);
  const [year, setYear] = useState(initial.year);
  const [tagline, setTagline] = useState(initial.tagline);
  const [logoUrl, setLogoUrl] = useState(initial.logoUrl);
  const [logoBg, setLogoBg] = useState(initial.logoBg);
  const [status, setStatus] = useState(initial.status);
  const [url, setUrl] = useState(initial.url);
  const [host, setHost] = useState<ProjectHost>(initial.host);
  const [stack, setStack] = useState<string[]>(initial.stack);
  const [stackDraft, setStackDraft] = useState("");
  const [bodyMd, setBodyMd] = useState(initial.bodyMd);

  const [busyMsg, setBusyMsg] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState<string | null>(null);

  const input: ProjectInput = useMemo(
    () => ({
      originalSlug: initial.originalSlug,
      slug,
      name,
      year,
      tagline,
      logoUrl,
      logoBg,
      status,
      url,
      host,
      // 아직 확정 안 한 입력값도 저장 시 누락되지 않게 포함
      stack: stackDraft.trim() ? [...stack, stackDraft.trim()] : stack,
      bodyMd,
    }),
    [
      initial.originalSlug, slug, name, year, tagline, logoUrl,
      logoBg, status, url, host, stack, stackDraft, bodyMd,
    ],
  );

  // 미저장 변경 추적 — 목록으로 빠질 때 확인을 받는다.
  const snapshot = useRef(JSON.stringify(input));
  const [dirty, setDirty] = useState(false);
  useEffect(() => {
    setDirty(JSON.stringify(input) !== snapshot.current);
  }, [input]);
  const markClean = useCallback(() => {
    snapshot.current = JSON.stringify(input);
    setDirty(false);
  }, [input]);

  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  useEffect(() => {
    if (!savedFlash) return;
    const t = setTimeout(() => setSavedFlash(null), 2000);
    return () => clearTimeout(t);
  }, [savedFlash]);

  const confirmLeaveIfDirty = (e: React.MouseEvent) => {
    if (!dirty) return;
    if (!window.confirm("저장하지 않은 변경이 있습니다. 그래도 나가시겠어요?")) {
      e.preventDefault();
    }
  };

  const guardInput = (): boolean => {
    if (!name.trim()) {
      alert("이름을 입력하세요.");
      return false;
    }
    if (!/^[a-z0-9-]+$/.test(slug.trim().toLowerCase())) {
      alert("슬러그는 소문자·숫자·하이픈만 쓸 수 있습니다.");
      return false;
    }
    return true;
  };

  const onSave = () => {
    if (!guardInput()) return;
    setBusyMsg("저장 중…");
    startTransition(async () => {
      try {
        const res = await saveProjectDraft(input);
        markClean();
        setSavedFlash("✓ 저장됨");
        if (res.slug !== initial.originalSlug) {
          router.replace(`/admin/projects/editor?slug=${encodeURIComponent(res.slug)}`);
        }
      } catch (e) {
        alert(`저장 실패: ${(e as Error).message}`);
      } finally {
        setBusyMsg(null);
      }
    });
  };

  const isUpdate = initial.visibility === "published";
  const onPublish = () => {
    if (!guardInput()) return;
    setBusyMsg(isUpdate ? "업데이트 중…" : "발행 중…");
    startTransition(async () => {
      try {
        await publishProject(input);
        markClean();
        router.push("/admin/projects");
      } catch (e) {
        alert(`${isUpdate ? "업데이트" : "발행"} 실패: ${(e as Error).message}`);
        setBusyMsg(null);
      }
    });
  };

  return (
    <>
      <AdminTopbar>
        <Link href="/admin/projects" onClick={confirmLeaveIfDirty}>
          <Button variant="ghost" size="sm">← 목록</Button>
        </Link>
        {/* 오른쪽 창은 일반 마크다운 프리뷰라 섹션 렌더러가 안 걸린다.
            어드민 미리보기 라우트는 draft 도 열어서 진짜 화면을 그대로 보여준다. */}
        {initial.originalSlug && (
          <a
            href={`/admin/projects/preview/${initial.originalSlug}`}
            target="_blank"
            rel="noreferrer"
          >
            <Button variant="ghost" size="sm">
              <ExternalLink size={14} />실제 화면
            </Button>
          </a>
        )}
        <span className="meta" style={{ minWidth: 96, textAlign: "right" }}>
          {busyMsg ?? savedFlash ?? ""}
        </span>
        <Button variant="ghost" size="sm" onClick={onSave} disabled={pending}>
          저장
        </Button>
        <Button variant="primary" size="sm" onClick={onPublish} disabled={pending}>
          {isUpdate ? "업데이트" : "발행"}
        </Button>
      </AdminTopbar>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          height: "calc(100vh - 56px)",
        }}
      >
        {/* 왼쪽 — 메타 + 본문 마크다운 */}
        <div
          style={{
            overflow: "auto",
            padding: "24px 28px 80px",
            borderRight: "1px solid var(--line-subtle)",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 120px",
              gap: 12,
              marginBottom: 12,
            }}
          >
            <div>
              <Label>이름</Label>
              <input value={name} onChange={(e) => setName(e.target.value)} style={field} />
            </div>
            <div>
              <Label>연도</Label>
              <input value={year} onChange={(e) => setYear(e.target.value)} style={field} />
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <Label>한 줄 소개</Label>
            <input
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="40자 이내"
              style={field}
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 80px 130px 1fr",
              gap: 12,
              marginBottom: 12,
              alignItems: "end",
            }}
          >
            <div>
              <Label>슬러그</Label>
              <input value={slug} onChange={(e) => setSlug(e.target.value)} style={field} />
            </div>
            <div>
              <Label>카드 미리보기</Label>
              <div
                style={{
                  height: 38,
                  borderRadius: 8,
                  background: /^#[0-9a-fA-F]{6}$/.test(logoBg) ? logoBg : "#1B1C1E",
                  display: "grid",
                  placeItems: "center",
                  overflow: "hidden",
                }}
              >
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoUrl} alt="" style={{ height: "70%", objectFit: "contain" }} />
                ) : (
                  <span
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: 18,
                      fontWeight: 800,
                      color: "rgba(255,255,255,0.96)",
                    }}
                  >
                    {(name.trim()[0] ?? "?").toUpperCase()}
                  </span>
                )}
              </div>
            </div>
            <div>
              <Label>배경색</Label>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <input
                  type="color"
                  value={/^#[0-9a-fA-F]{6}$/.test(logoBg) ? logoBg : "#1B1C1E"}
                  onChange={(e) => setLogoBg(e.target.value)}
                  style={{
                    width: 32,
                    height: 32,
                    padding: 0,
                    border: "1px solid var(--line-normal)",
                    borderRadius: 8,
                    background: "none",
                    flex: "0 0 auto",
                  }}
                />
                <input value={logoBg} onChange={(e) => setLogoBg(e.target.value)} style={field} />
              </div>
            </div>
            <div>
              <Label>상태</Label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} style={field}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <Label>로고 이미지 URL</Label>
            <input
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="비우면 이름 첫 글자가 카드에 들어갑니다"
              style={field}
            />
            <div style={{ fontSize: 12, color: "var(--fg-alternative)", marginTop: 4 }}>
              파일이 있으면 <code>npm run project -- media {slug || "&lt;slug&gt;"} ./logo.png</code> 로 올리고
              나온 주소를 붙여넣으세요.
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 130px",
              gap: 12,
              marginBottom: 12,
            }}
          >
            <div>
              <Label>배포 URL</Label>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://…"
                style={field}
              />
            </div>
            <div>
              <Label>배포처</Label>
              <select
                value={host}
                onChange={(e) => setHost(e.target.value as ProjectHost)}
                style={field}
              >
                {HOSTS.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <Label>스택</Label>
            <TagInput
              tags={stack}
              draft={stackDraft}
              onTagsChange={setStack}
              onDraftChange={setStackDraft}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <div className="t-overline">본문</div>
            {!bodyMd.trim() && (
              <button
                onClick={() => setBodyMd(BODY_TEMPLATE)}
                className="chip"
                style={{ cursor: "pointer", border: "none" }}
              >
                섹션 뼈대 넣기
              </button>
            )}
          </div>
          <textarea
            value={bodyMd}
            onChange={(e) => setBodyMd(e.target.value)}
            spellCheck={false}
            style={{
              ...field,
              minHeight: 520,
              lineHeight: 1.7,
              fontFamily: "var(--font-mono, monospace)",
              resize: "vertical",
            }}
          />
        </div>

        {/* 오른쪽 — 마크다운 라이브 프리뷰.
            섹션 렌더러가 적용된 진짜 화면은 상단 "실제 화면" 링크로 본다. */}
        <div
          style={{
            overflow: "auto",
            background: "var(--bg-base)",
            minWidth: 0,
            padding: "40px 40px 96px",
          }}
        >
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            <h1 className="prose post-title">{name || "(이름 없음)"}</h1>
            <p className="meta" style={{ margin: "0 0 24px" }}>
              마크다운 그대로 보는 창이다. 화면 갤러리·기획 표처럼 섹션 렌더러가
              걸리는 부분은 상단 &ldquo;실제 화면&rdquo;에서 확인한다.
            </p>
            <MarkdownPreview md={bodyMd} fallback="본문 미리보기" />
          </div>
        </div>
      </div>
    </>
  );
}
