import { ArrowUpRight } from "lucide-react";
import type { Project } from "@/lib/types";

const HOST_LABEL: Record<Project["host"], string> = {
  vercel: "Vercel",
  cloudflare: "Cloudflare Pages",
  local: "로컬 실행",
  none: "비공개",
};

export function ProjectHero({ project: p }: { project: Project }) {
  return (
    <header className="lab-hero">
      <div className="lab-hero-media">
        {p.heroMedia ? (
          <video
            src={p.heroMedia}
            poster={p.heroPoster ?? undefined}
            autoPlay
            muted
            loop
            playsInline
          />
        ) : p.heroPoster ? (
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
              {p.stack.length > 0 && <span className="lab-label">{p.stack.join(" · ")}</span>}
              <span className="lab-label">{HOST_LABEL[p.host]}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
