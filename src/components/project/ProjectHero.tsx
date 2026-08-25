import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { ProjectMark } from "@/components/project/ProjectMark";
import type { Project } from "@/lib/types";

export function ProjectHero({ project: p }: { project: Project }) {
  // 표지에는 이름과 한 줄 소개(프런트매터 `tagline`)만 둔다. 설명 문단을 여기 깔면
  // 같은 이야기를 기획에서 또 하게 된다 — 그건 기획의 `**소개**` 문답이 맡는다.
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
            {/* 본문 섹션은 목차 레일만큼 안쪽에서 시작한다. 표지 글도 같은
                기준선에 세워야 페이지가 한 줄로 읽힌다. */}
            <div className="lab-hero-inset">
            <Link href="/lab" className="lab-hero-back">
              <ArrowLeft size={15} />
              실험실
            </Link>
            <h1 className="lab-hero-name">{p.name}</h1>
            {p.tagline && <p className="lab-hero-tagline">{p.tagline}</p>}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
