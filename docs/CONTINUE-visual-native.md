# 작업 인계 — 시각자료 PNG → 네이티브 렌더 전환

> 다음 세션에서 이 파일을 읽고 이어서 진행한다. **현재 코드는 중간 상태라
> `npx tsc --noEmit`가 실패한다**(registry.tsx에 옛 필드 잔존). 아직 커밋 안 함.

## 무엇을 / 왜

시각자료 카탈로그를 **PNG 베이킹 → 네이티브 React 렌더**로 전환 중이다.
- 기존: LLM이 ` ```visual ` JSON 작성 → 워커가 Playwright로 PNG 굽기 → Supabase 업로드 → `<figure>` 이미지 삽입.
- 문제(사용자 피드백): 텍스트 카드를 이미지로 구우니 "AI스럽고", 크기가 어색하고, 굳이 이미지일 이유가 없음. 블로그가 React라 컴포넌트를 본문에 그대로 렌더 가능.
- 전환 후: LLM/워커는 ` ```visual `(JSON)·` ```illustration `(raw SVG) 블록을 body_md에 그대로 둔다. 블로그 `markdownRender.tsx`가 그 블록을 컴포넌트/인라인 SVG로 렌더(` ```mermaid ` → `<Mermaid>`와 동일 메커니즘). PNG·Playwright·Supabase 업로드·`/internal/visual` 라우트 전부 불필요. 라이트/다크는 CSS 토큰으로 자동.

## 이번 세션에서 완료된 것 (수정하지 말 것)

- `src/app/globals.css` — `.vis-*` 네이티브 카탈로그 스타일 추가 + 옛 `.visual-figure`(PNG) 스타일 제거 완료.
- `src/components/visuals/types.ts` — stepSchema에서 `highlight`, stepCardSchema에서 `direction` 제거 완료(`theme`는 이전에 제거됨).
- `src/components/visuals/Frame.tsx · StepCard.tsx · StatCard.tsx · CalloutCard.tsx · Illustration.tsx` — 클래스 기반·반응형으로 재작성 완료. CSS 변수 `--vis-fill`/`--vis-strong`를 컴포넌트가 inline으로 주입, globals.css `.vis-*`가 사용.

## 남은 작업 (순서대로)

### 1. `src/components/visuals/registry.tsx` 수정
- `SAMPLE_SPECS`에 옛 필드 `direction: "horizontal"`(step 샘플)·`highlight: true`(step 마지막) 잔존 → **TS 에러 원인. 제거.**
- `CatalogVisual` 컴포넌트 추가 — markdownRender가 쓸 래퍼:
  ```tsx
  export function CatalogVisual({ json }: { json: string }) {
    let data: unknown;
    try { data = JSON.parse(json); }
    catch { return <div className="vis vis-error">시각자료 JSON 파싱 실패</div>; }
    const r = visualSchema.safeParse(data);
    if (!r.success) return <div className="vis vis-error">시각자료 검증 실패: {r.error.issues[0]?.message}</div>;
    return <VisualRenderer spec={r.data} />;
  }
  ```
- `isVisualPattern`/`VISUAL_PATTERNS`는 라우트 제거 후 미사용 → 남겨도 무방, 정리해도 됨.

### 2. `src/components/post/markdownRender.tsx` — 네이티브 블록 렌더
- `rehypeExtractMermaid`를 확장: `code`의 className이 `language-visual`이면 `<div data-visual-source="{text}">`, `language-illustration`이면 `<div data-illustration-source="{text}">`로 치환(mermaid와 동일 패턴).
- `DivOrMermaid`(div 오버라이드)를 확장: `data-visual-source` 있으면 `<CatalogVisual json={...}/>`, `data-illustration-source` 있으면 `<Illustration svg={sanitizeSvg(...)}/>`.
- `sanitizeSvg` 추가 — `<script>…</script>` 및 `on*=` 속성 제거.
- import: `CatalogVisual`(@/components/visuals/registry), `Illustration`(@/components/visuals/Illustration).
- 주의: `markdownRender.tsx`·`MarkdownPreview.tsx`·`MarkdownView.tsx`·`PostEditor.tsx`는 사용자의 기존 WIP(마크다운 렌더 리팩터)다 — 편집해도 되고, 커밋 시 함께 들어간다(사용자가 "같이 커밋"이라고 했음).

### 3. PNG 파이프라인 제거
- `src/app/internal/` 디렉터리 통째 삭제(라우트 + 인덱스).
- `scripts/lib/` 디렉터리 통째 삭제(`visual-extract.mjs`·`visual-render.mjs`·`visual-upload.mjs`·`post-process-visuals.mjs` 뿐).
- `package.json` — devDependencies에서 `"playwright"` 제거.
- `next.config.ts` — `headers()`의 `/internal` 블록 제거(`reactStrictMode`만 남김).

### 4. `scripts/ai-worker.mjs` — 후처리 제거
- 제거: `import { postProcessVisuals }`·`import { closeBrowser }`, `processJob` 안의 ```visual 후처리 블록, `closeBrowser()` 호출(main 끝·SIGINT·fatal catch), `VISUAL_BASE_URL`·`INTERNAL_VISUAL_TOKEN` 상수 및 시작 로그 줄.
- 워커는 이제 body_md에 ` ```visual `/` ```illustration ` 블록을 그대로 두고 끝.

### 5. `POSTING.md` — "2-2. 시각자료 카탈로그" 갱신
- 메커니즘 설명을 "라이트·다크 PNG로 굽고 `<figure>`로 치환" → "본문에 컴포넌트로 그대로 렌더된다(라이트/다크 자동)"로.
- step-card 명세에서 `highlight`·`direction` 행 제거, 워크드 예시의 `highlight` 제거.
- `<figure>`·PNG·theme 언급 정리. 패턴·스키마 자체는 유지.

### 6. `ai-native-company` 글 재생성
- `scripts/_gen-post.mjs` 수정: `postProcessVisuals` 호출 제거 — body_md에 ` ```visual `/` ```illustration ` 블록을 **그대로 둔 채** posts에 insert. stepFactory 스펙에서 `highlight: true` 제거. `VISUAL_BASE_URL`·토큰 불필요.
- 실행: `node --env-file=.env.local scripts/_gen-post.mjs`

### 7. 정리·검증
- 옛 테스트 글 삭제: `sb.from("posts").delete().eq("slug","visual-catalog-demo")`.
- 임시 스크립트 `scripts/_make-test-post.mjs` 삭제.
- `npx tsc --noEmit` 통과 확인.
- dev 서버로 `ai-native-company` 글 확인(draft라 `/posts/[slug]`는 404 — 에디터 미리보기 또는 잠깐 publish). 시각자료가 네이티브로·반응형으로·라이트/다크 정상 렌더되는지.
- 커밋(CLAUDE.md: co-author/AI attribution 금지) + `git push`.

## 컨텍스트·주의

- CLAUDE.md: 커밋에 `Co-Authored-By`·AI attribution 금지.
- git remote는 `github-p0it` SSH alias, `git push` 그대로 동작. 브랜치 `main`.
- 이미 결정된 사항(재논의 불필요): 네이티브 렌더 확정 / step-card는 highlight 없이 전 카드 동일 / callout은 단일 박스(좌측 강조선+틴트) / 강연 영상 글엔 발표자 소개 문단(`00dbba0`로 커밋 완료) / 말투는 따뜻한 -습니다체.
- `INTERNAL_VISUAL_TOKEN`(.env.local·Vercel)은 이 전환 후 미사용 — 사용자가 나중에 지워도 됨.
- Supabase `post-images/`에 옛 렌더 PNG가 남아 있음 — 무해, 무시.
- 머신 RAM이 빠듯함 — dev 서버 외 무거운 것 동시 실행 주의(Playwright는 제거되니 부담 감소).
- 최근 커밋: `00dbba0`(발표자 소개 규약) → 그 위에 미커밋 작업이 쌓여 있음.
