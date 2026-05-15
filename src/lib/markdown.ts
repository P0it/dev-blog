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
