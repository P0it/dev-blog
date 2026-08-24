import Link from "next/link";
import { ProjectMark } from "@/components/project/ProjectMark";
import { firstScreenSrc } from "@/lib/project-sections";
import type { Project } from "@/lib/types";

// 목록 카드 — 실험실 작업대에 올려 둔 표본 한 점.
// 판 하나가 번호줄·폰 화면·이름줄을 다 담는다. 셋이 따로 놀면 어느 이름이
// 어느 화면 것인지 눈이 매번 다시 짝을 맞춰야 한다.
export function ProjectCard({ p, index }: { p: Project; index: number }) {
  // `## 화면` 의 첫 장이 대표 화면이다. 없으면 배포 사이트 캡처, 그것도 없으면 로고 타일.
  const shot = firstScreenSrc(p.body) ?? p.heroPoster;

  return (
    <article className="lab-card lab-reveal">
      <Link href={`/lab/${p.slug}`} className="lab-card-hit">
        <div className="lab-card-slab lab-corner">
          {/* 계측기 어휘의 머리줄. 번호는 모노, 오른쪽 램프는 hover 에 켜진다. */}
          <div className="lab-card-head">
            <span className="lab-card-idx">{String(index + 1).padStart(2, "0")}</span>
            <span className="lab-card-lamp" />
          </div>

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
        </div>
      </Link>
    </article>
  );
}
