import type { Project } from "@/lib/types";

// 카드·히어로의 로고 자리.
// 로고 이미지가 있으면 그걸 쓰고, 없으면 이름 첫 글자를 큼직하게 놓는다.
// 이모지는 쓰지 않는다 — 프로젝트마다 톤이 제각각으로 튀고 OS 마다 다르게 그려진다.
export function projectInitial(name: string): string {
  const c = name.trim()[0] ?? "?";
  return c.toUpperCase();
}

export function ProjectMark({ p, variant }: { p: Project; variant: "card" | "hero" }) {
  if (p.logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={p.logoUrl} alt="" />;
  }
  return (
    <span className={variant === "card" ? "lab-card-mono" : undefined}>
      {projectInitial(p.name)}
    </span>
  );
}
