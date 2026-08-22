import { PublicNav } from "@/components/layout/PublicNav";
import { Footer } from "@/components/layout/Footer";
import { ProjectCard } from "@/components/project/ProjectCard";
import { getProjects } from "@/lib/queries";

export const revalidate = 60;

export default async function LabPage() {
  const projects = await getProjects();
  const running = projects.filter((p) => p.status === "운영중").length;

  return (
    <>
      <PublicNav active="lab" />
      <div className="lab-page" style={{ minHeight: "70vh", paddingTop: 56, paddingBottom: 88 }}>
        <div className="container-wide">
          <div className="lab-panel lab-corner lab-bar">
            <div>
              <h1>실험실</h1>
              <div className="sub">만들어서 돌려보고 있는 것들</div>
            </div>
            <div className="lab-label">
              <span className="lab-led" />
              {running} running · {projects.length} total
            </div>
          </div>

          <div className="lab-grid">
            {projects.map((p) => (
              <ProjectCard key={p.slug} p={p} />
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
