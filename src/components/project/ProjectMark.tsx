import type { Project } from "@/lib/types";

// 카드·히어로의 로고 자리.
// 로고 이미지가 있으면 그걸 쓰고, 없으면 이름 첫 글자를 큼직하게 놓는다.
// 이모지는 쓰지 않는다 — 프로젝트마다 톤이 제각각으로 튀고 OS 마다 다르게 그려진다.
export function projectInitial(name: string): string {
  const c = name.trim()[0] ?? "?";
  return c.toUpperCase();
}

// 래스터 로고(png·jpg·webp)는 이미 완성된 앱 아이콘이다 — 제 배경과 안전 여백을
// 안에 품고 있어서, 판 안에 또 여백을 두고 줄여 넣으면 정작 마크가 손톱만 해진다.
// 반대로 SVG 로고는 마크만 그려 두고 배경(`logo_bg`)을 판에 맡기므로 여백이 필요하다.
// 그래서 확장자로 갈라, 아이콘은 판을 가득 채우고 SVG 는 지금처럼 안쪽에 앉힌다.
function isAppIcon(url: string): boolean {
  return !/\.svg(\?|#|$)/i.test(url);
}

export function ProjectMark({ p, variant }: { p: Project; variant: "card" | "hero" }) {
  if (p.logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={p.logoUrl} alt="" className={isAppIcon(p.logoUrl) ? "is-icon" : undefined} />;
  }
  return (
    <span className={variant === "card" ? "lab-card-mono" : undefined}>
      {projectInitial(p.name)}
    </span>
  );
}
