import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Calendar, Cloud, Layers } from "lucide-react";
import { ProjectMark } from "@/components/project/ProjectMark";
import type { Project } from "@/lib/types";

const HOST_LABEL: Record<Project["host"], string> = {
  vercel: "Vercel",
  cloudflare: "Cloudflare Pages",
  local: "로컬 실행",
  none: "비공개",
};

export function ProjectHero({
  project: p,
  lead,
}: {
  project: Project;
  /* `## 제품 소개` 는 섹션이 아니라 히어로의 리드다. 이 물건이 뭔지는 여기서 끝내고,
     본문은 왜 만들게 됐는지(`## 기획`)부터 시작한다. */
  lead?: React.ReactNode;
}) {
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
            <ProjectMark p={p} variant="hero" />
          </div>
        )}
        <div className="lab-hero-veil" />

        {p.url && (
          <a className="lab-hero-go" href={p.url} target="_blank" rel="noreferrer">
            바로가기
            <ArrowUpRight size={16} />
          </a>
        )}

        <div className="lab-hero-hud">
          <div className="container-wide">
            <Link href="/lab" className="lab-hero-back">
              <ArrowLeft size={15} />
              실험실
            </Link>
            <h1 className="lab-hero-name">{p.name}</h1>
            {p.tagline && <p className="lab-hero-tagline">{p.tagline}</p>}
            <div className="lab-hero-meta">
              {p.status && (
                <span className="lab-hero-chip">
                  <span className="lab-led" style={{ margin: 0 }} />
                  {p.status}
                </span>
              )}
              <span className="lab-hero-chip">
                <Calendar size={14} />
                {p.year}
              </span>
              {stack.length > 0 && (
                <span className="lab-hero-chip">
                  <Layers size={14} />
                  {stack.join(" · ")}
                </span>
              )}
              {showHost && (
                <span className="lab-hero-chip">
                  <Cloud size={14} />
                  {hostLabel}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {lead && (
        <div className="lab-hero-lead">
          <div className="container-wide">{lead}</div>
        </div>
      )}
    </header>
  );
}
