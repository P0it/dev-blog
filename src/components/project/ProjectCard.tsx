import Link from "next/link";
import { ProjectMark } from "@/components/project/ProjectMark";
import { firstScreenSrc } from "@/lib/project-sections";
import type { Project } from "@/lib/types";

// 목록 카드 — 폰 화면을 세로로 세우고, 그 아래 로고와 이름만 둔다.
// 자세한 건 상세에서 보면 되므로 카드에는 설명을 얹지 않는다.
export function ProjectCard({ p }: { p: Project }) {
  // `## 화면` 의 첫 장이 대표 화면이다. 없으면 배포 사이트 캡처, 그것도 없으면 로고 타일.
  const shot = firstScreenSrc(p.body) ?? p.heroPoster;

  return (
    <article className="lab-card lab-reveal">
      <Link href={`/lab/${p.slug}`} className="lab-card-hit">
        <div className={`lab-card-shot${shot ? "" : " empty"}`}>
          {shot ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shot} alt="" loading="lazy" />
          ) : (
            // 대표 화면이 아직 없는 프로젝트. 판 전체를 로고색으로 칠하면 목록에서
            // 그 카드만 튀므로, 조용한 판 가운데에 로고 배지 하나만 놓는다.
            <span className="lab-card-empty" style={{ background: p.logoBg }}>
              <ProjectMark p={p} variant="card" />
            </span>
          )}
        </div>

        <div className="lab-card-meta">
          <span className="lab-card-logo" style={{ background: p.logoBg }}>
            <ProjectMark p={p} variant="card" />
          </span>
          <div className="lab-card-text">
            <h3 className="lab-card-name">{p.name}</h3>
            {p.tagline && <p className="lab-card-tagline">{p.tagline}</p>}
          </div>
        </div>
      </Link>
    </article>
  );
}
