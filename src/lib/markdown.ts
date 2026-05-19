import GithubSlugger from "github-slugger";

export type TocItem = { id: string; label: string; sub?: boolean };

// h2/h3 헤딩만 뽑아서 TOC 생성. 코드블록 내부는 무시.
export function extractToc(md: string | null | undefined): TocItem[] {
  if (!md) return [];
  const slugger = new GithubSlugger();
  const items: TocItem[] = [];
  let inFence = false;

  for (const raw of md.split("\n")) {
    const line = raw.trimEnd();
    if (/^```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    const h2 = line.match(/^##\s+(.+?)\s*$/);
    if (h2) {
      const label = h2[1].replace(/[*_`]/g, "");
      items.push({ id: slugger.slug(label), label });
      continue;
    }
    const h3 = line.match(/^###\s+(.+?)\s*$/);
    if (h3) {
      const label = h3[1].replace(/[*_`]/g, "");
      items.push({ id: slugger.slug(label), label, sub: true });
    }
  }
  return items;
}

// 본문 분량으로 읽는 시간 추정. 코드블록·이미지·마크다운 기호는 제외하고
// 순수 글자수 기준 — 한국어 기술 글 ~ 450자/분(코드는 훑어 읽는다고 가정).
// 어드민 에디터가 발행 시 reading_min 컬럼에 채워 넣는다(수동 입력 폐지).
export function deriveReadingMin(md: string | null | undefined): string {
  if (!md) return "";
  const text = md
    .replace(/```[\s\S]*?```/g, "")          // 펜스 코드블록
    .replace(/`[^`\n]*`/g, "")               // 인라인 코드
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")    // 이미지
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // 링크는 텍스트만 남김
    .replace(/[#>*_~\-]/g, "")               // 마크다운 기호
    .replace(/\s+/g, "");                    // 공백 제거 → 글자수
  const chars = text.length;
  if (chars === 0) return "";
  return `${Math.max(1, Math.round(chars / 450))}분`;
}
