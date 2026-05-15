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
      <div className="container-wide" style={{ paddingTop: 64, paddingBottom: 80 }}>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: 16,
            marginBottom: 40,
          }}
        >
          <div className="hero-eyebrow">실험실</div>
          <span className="meta">
            {projects.length}편 · 배포 {projects.length}
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 24 }}>
          {projects.map((p) => (
            <ProjectCard key={p.name} p={p} />
          ))}
        </div>

        <div
          style={{
            marginTop: 48,
            paddingTop: 24,
            borderTop: "1px solid var(--line-subtle)",
            fontSize: 13,
            color: "var(--fg-neutral)",
            lineHeight: 1.65,
            maxWidth: 560,
          }}
        >
          카드를 누르면 그 프로젝트의 개발기, 로직 구성, 운영 노트가 블로그 글처럼 한 페이지로 펼쳐집니다. 코드는 그 안에서 GitHub로 따로 연결돼요.
        </div>
      </div>
      <Footer />
    </>
  );
}
