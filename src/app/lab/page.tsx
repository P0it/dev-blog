import { FlaskConical } from "lucide-react";
import { PublicNav } from "@/components/layout/PublicNav";
import { Footer } from "@/components/layout/Footer";
import { ProjectCard } from "@/components/project/ProjectCard";
import { getProjects } from "@/lib/queries";

export const revalidate = 60;

export default async function LabPage() {
  const projects = await getProjects();

  return (
    <>
      <PublicNav active="lab" />
      <div className="lab-page" style={{ minHeight: "70vh", paddingTop: 28, paddingBottom: 72 }}>
        <div className="container-wide">
          {/* 상세의 섹션 머리줄과 같은 어휘. 격자만 깔린 판 위에 카드가 갑자기
              떠 있으면 무슨 판인지 모르는 채로 읽기 시작한다. */}
          <div className="lab-section-head lab-index-head">
            <span className="icon"><FlaskConical size={17} /></span>
            <h2>실험실</h2>
            <hr />
            <span className="lab-label">{String(projects.length).padStart(2, "0")}</span>
          </div>

          <div className="lab-grid">
            {projects.map((p, i) => (
              <ProjectCard key={p.slug} p={p} index={i} />
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
