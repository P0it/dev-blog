import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ProjectMark } from "@/components/project/ProjectMark";
import type { Project } from "@/lib/types";

// 카드 전체를 Link 로 감싸면 안쪽에 바로가기 링크를 넣을 수 없다(앵커 중첩).
// 그래서 상세로 가는 링크와 배포처로 가는 링크를 형제로 두고,
// 상세 링크만 ::after 로 카드 전체를 덮어 클릭 영역을 넓힌다.
export function ProjectCard({ p }: { p: Project }) {
  return (
    <article className="lab-panel lab-card lab-reveal">
      <Link href={`/lab/${p.slug}`} className="lab-card-hit">
        <div className="lab-card-tile" style={{ background: p.logoBg }}>
          <ProjectMark p={p} variant="card" />
          {p.status && <span className="lab-card-status">{p.status}</span>}
        </div>
        <div className="lab-card-body">
          <h3 className="lab-card-name">{p.name}</h3>
          {p.tagline && <p className="lab-card-tagline">{p.tagline}</p>}
        </div>
      </Link>

      {p.url && (
        <a className="lab-card-go" href={p.url} target="_blank" rel="noreferrer">
          <span>바로가기</span>
          <ArrowUpRight size={16} />
        </a>
      )}
    </article>
  );
}
