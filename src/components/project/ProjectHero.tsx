import { ArrowUpRight } from "lucide-react";
import type { Project } from "@/lib/types";

const HOST_LABEL: Record<Project["host"], string> = {
  vercel: "Vercel",
  cloudflare: "Cloudflare Pages",
  local: "로컬 실행",
  none: "비공개",
};

export function ProjectHero({ project: p }: { project: Project }) {
  // 스택에 배포처가 이미 들어 있으면 메타 줄에서 한 번만 보이게 한다.
  const hostLabel = HOST_LABEL[p.host];
  const showHost = !p.stack.some((s) => s.toLowerCase() === hostLabel.toLowerCase().split(" ")[0]);
  // 스택이 길면 앞 네 개만. 나머지는 상세 본문에서 드러난다.
  const stack = p.stack.slice(0, 4);

  return (
    <header className="lab-hero">
      <div className="lab-hero-media">
        {/* 히어로는 정지 화면이다. 움직이는 배경은 제목을 읽는 데 방해가 된다. */}
        {p.heroPoster ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.heroPoster} alt="" />
        ) : (
          <div className="lab-hero-fallback" style={{ background: p.logoBg }}>
            <span aria-hidden>{p.logoEmoji}</span>
          </div>
        )}
        <div className="lab-hero-scan" />
        <div className="lab-hero-veil" />

        {p.url && (
          <a className="lab-hero-go" href={p.url} target="_blank" rel="noreferrer">
            바로가기
            <ArrowUpRight size={13} />
          </a>
        )}

        <div className="lab-hero-hud">
          <div className="container-wide">
            <h1 className="lab-hero-name">{p.name}</h1>
            {p.tagline && <p className="lab-hero-tagline">{p.tagline}</p>}
            <div className="lab-hero-meta">
              {p.status && (
                <span className="lab-label">
                  <span className="lab-led" />
                  {p.status}
                </span>
              )}
              <span className="lab-label">{p.year}</span>
              {stack.length > 0 && <span className="lab-label">{stack.join(" · ")}</span>}
              {showHost && <span className="lab-label">{hostLabel}</span>}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
