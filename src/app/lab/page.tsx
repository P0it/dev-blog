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
          <div
            className="lab-panel lab-corner"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 16px",
              borderRadius: 0,
              marginBottom: 28,
            }}
          >
            <div className="lab-label" style={{ fontSize: 11 }}>Lab · 실험실</div>
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
